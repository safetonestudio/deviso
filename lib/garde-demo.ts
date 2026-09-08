import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Aucun compte de démonstration ne déclenche d'effet dans le monde réel.
 *
 * Pourquoi ce fichier existe. La règle était déjà écrite, et elle était juste —
 * dans `lib/stripe-guard.ts` : « tout fichier qui écrit dans Stripe passe par
 * ici », avec un script qui refuse tout nouveau point d'écriture qui
 * l'oublierait. Elle n'avait simplement jamais été étendue aux DEUX AUTRES
 * intégrations qui agissent chez des tiers, et l'audit du 08/09/2026 a montré
 * ce que cela coûtait :
 *
 *   - **Courriel.** Aucune des routes d'envoi ne vérifiait le mode
 *     démonstration. Un visiteur ouvrait la démo depuis la page d'accueil —
 *     sans compte, sans adresse vérifiée, en un clic — ouvrait une facture du
 *     jeu de données fictif, remplaçait l'adresse du client par celle de son
 *     choix, et faisait partir un message depuis `noreply@getdeviso.fr`, avec
 *     pièce jointe, au nom d'une entreprise inventée. Dix par heure et par IP.
 *     Ce n'est pas seulement un abus possible : ce sont les plaintes pour
 *     courrier indésirable qui atterrissent sur la réputation d'expédition du
 *     domaine, donc sur la délivrabilité des factures de tous les clients qui
 *     paient.
 *
 *   - **Chorus Pro.** La route de dépôt n'a aucun contrôle, et PISTE y est en
 *     production. Le jeu de démonstration contient précisément ce qu'il faut :
 *     une facture B2G de 3 120 € adressée à la « Mairie de Saint-Cloud », SIREN
 *     d'une commune réelle. Un visiteur pouvait donc déposer une facture
 *     entièrement fictive à une collectivité, sous le compte AIFE de Deviso.
 *
 *   - **Plateforme Agréée.** Le raccordement OAuth n'était pas gardé non plus.
 *
 * Le point commun de ces trois cas : l'effet sort de la base de données et
 * n'est plus rattrapable par la purge des comptes de démonstration au bout de
 * deux heures. C'est le seul critère qui compte ici — pas la gravité supposée,
 * pas la difficulté d'exploitation.
 */
export async function estCompteDemo(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("is_demo")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_demo);
}

/** Abonnements et paiements. */
export const MESSAGE_DEMO =
  "Les abonnements ne sont pas disponibles en mode démonstration. Créez un compte pour souscrire.";

/** Tout envoi de courriel vers l'extérieur. */
export const MESSAGE_DEMO_ENVOI =
  "L'envoi d'e-mails est désactivé en mode démonstration : les messages partiraient réellement, " +
  "depuis notre domaine, à l'adresse indiquée. Créez un compte pour envoyer vos documents.";

/** Dépôt chez un tiers : Chorus Pro, Plateforme Agréée. */
export const MESSAGE_DEMO_TIERS =
  "Cette action dépose un document chez un organisme tiers, en production. " +
  "Elle est désactivée en mode démonstration — créez un compte pour l'utiliser.";
