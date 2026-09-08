import { Resend } from "resend";
import { lazyClient } from "@/lib/lazy-client";

/**
 * Client d'envoi — clé « Sending access », volontairement restreinte.
 *
 * Il n'y a plus de client d'administration : la fonctionnalité « domaine d'envoi
 * personnalisé » a été retirée. Elle imposait à l'utilisateur d'éditer sa zone
 * DNS, plafonnait le nombre de clients au plan Resend, et faisait porter au
 * compte Deviso la réputation d'envoi de domaines tiers. Le nom commercial dans
 * le champ « De » et le Reply-To vers l'émetteur couvrent le besoin réel.
 *
 * Construction paresseuse (voir lib/lazy-client.ts) : le SDK Resend lève une
 * exception dans son constructeur si la clé est absente, ce qui faisait
 * échouer le build entier plutôt que la seule route qui envoie l'email.
 */
export const resend = lazyClient(() => new Resend(process.env.RESEND_API_KEY));

/**
 * Envoyer un courriel — sauf depuis un compte de démonstration.
 *
 * Pourquoi passer par ici plutôt que d'appeler `resend.emails.send` en direct.
 * Aucune route d'envoi ne vérifiait le mode démonstration. Or la démonstration
 * s'ouvre en un clic depuis la page d'accueil, sans compte et sans adresse
 * vérifiée : un visiteur ouvrait une facture du jeu de données fictif,
 * remplaçait l'adresse du client par celle de sa cible, et faisait partir un
 * message depuis `noreply@getdeviso.fr` — avec pièce jointe PDF, au nom d'une
 * entreprise inventée. Dix par heure et par IP. Ce ne sont pas seulement des
 * messages indésirables : ce sont des plaintes qui abîment la réputation
 * d'expédition du domaine, donc la délivrabilité des factures de tous les
 * clients qui paient.
 *
 * On ne REFUSE pas l'appel, on court-circuite le seul geste irréversible :
 * l'envoi lui-même. Toute la route s'exécute — contrôles d'accès, génération du
 * PDF Factur-X, gabarit, transitions de statut — et la réponse est celle d'un
 * envoi réussi. Deux raisons :
 *
 *   - un refus placé en tête de route court-circuiterait aussi les réponses
 *     404 et 400 que la démonstration doit continuer à produire, et que la
 *     suite de tests éprouve ;
 *   - la suite de tests tourne précisément sur des comptes de démonstration.
 *     Un refus sec y aurait supprimé toute couverture des chemins d'envoi,
 *     c'est-à-dire échangé un trou de sécurité contre un trou de tests.
 *
 * Le message n'est pas envoyé, il est journalisé. C'est ce qu'on veut d'un
 * environnement de démonstration : tout se comporte comme en vrai, rien n'en
 * sort.
 */
export async function envoyerCourriel(
  userId: string,
  message: Parameters<typeof resend.emails.send>[0]
): Promise<{ error: { message: string } | null; simule?: boolean }> {
  const { estCompteDemo } = await import("@/lib/garde-demo");
  if (await estCompteDemo(userId)) {
    const destinataire = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    console.info(`[demo] courriel NON envoyé à ${destinataire} — « ${message.subject} »`);
    return { error: null, simule: true };
  }
  const { error } = await resend.emails.send(message);
  return { error: error ? { message: error.message } : null };
}
