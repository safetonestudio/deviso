import { PageSite, CADRE_LECTURE, SECTION, H1 } from "@/components/site/PageSite";
import type { Metadata } from "next";
import Link from "next/link";
import { BETA, BETA_OUVERTE } from "@/lib/beta";
import { prix as grille, PRIX_SIEGE, PRIX_SIEGE_ANNUEL } from "@/lib/grille-tarifaire";

// Les montants des CGU viennent de la source unique des prix : ils ne
// peuvent pas diverger de la vitrine ni de Stripe.
const SOLO = grille("solo");
const PRO = grille("pro");

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions générales d'utilisation de Deviso : accès au service, abonnements, responsabilités et résiliation.",
  alternates: { canonical: "https://getdeviso.fr/cgu" },
};

export default function CguPage() {
  return (
    <PageSite>

      <main className={`${CADRE_LECTURE} ${SECTION} pb-24`}>
        <h1 className={`${H1} mb-3`}>
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-gray-500 text-sm mb-14">Dernière mise à jour : 24 novembre 2026</p>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">1. Objet</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation
            de la plateforme <strong>Deviso</strong> (getdeviso.fr), éditée par SafeTone Studio. En créant un compte,
            l&apos;utilisateur accepte sans réserve les présentes CGU.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">2. Description du service</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso est un logiciel en ligne (SaaS) permettant aux freelances et auto-entrepreneurs français de créer,
            envoyer et gérer des devis et factures électroniques, avec assistance par intelligence artificielle.
            Le service comprend notamment la génération de devis par IA, la signature électronique, la facturation
            au format Factur-X, et le suivi des paiements.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">3. Accès au service</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;accès au service nécessite la création d&apos;un compte avec une adresse email valide et un mot de passe.
            L&apos;utilisateur est responsable de la confidentialité de ses identifiants. Deviso se réserve le droit
            de suspendre tout compte en cas de violation des présentes CGU.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">4. Plans tarifaires</h2>
          {/* Bêta (lib/beta.ts) : conditions de la bêta à la place de la grille ;
              la grille revient telle quelle quand la bêta se ferme. */}
          {BETA_OUVERTE ? (
          <p className="text-gray-400 leading-relaxed">
            Deviso est actuellement en <strong>phase bêta</strong>. L&apos;accès est ouvert sur invitation, après acceptation d&apos;une candidature.<br /><br />
            Chaque bêta-testeur dispose gratuitement, pendant <strong>{BETA.dureeMois} mois à compter de la création de son compte</strong>, de l&apos;ensemble des fonctions de Deviso, pour {BETA.utilisateursMax} utilisateurs au plus (le titulaire du compte et {BETA.utilisateursMax - 1} membres). Aucune carte bancaire n&apos;est demandée et rien n&apos;est prélevé à l&apos;issue de cette période sans souscription expresse.<br /><br />
            À l&apos;issue de sa bêta, le bêta-testeur peut souscrire un abonnement payant ; il bénéficie alors d&apos;une <strong>remise de {BETA.remise} % pendant les 12 premiers mois</strong> de cet abonnement. Les tarifs en vigueur lui sont communiqués avant toute souscription. À défaut de souscription, ses devis, factures et clients restent consultables, les fonctions de l&apos;abonnement (dont la création de factures) sont suspendues, et la réception des factures électroniques est maintenue pendant {BETA.joursReceptionApres} jours avant la fermeture de son adresse de réception.<br /><br />
            Le paiement s&apos;effectue par carte bancaire via la plateforme sécurisée Stripe.
            L&apos;abonnement est résiliable à tout moment depuis le compte utilisateur, avec effet à la fin de la période en cours.
          </p>
          ) : (
          <p className="text-gray-400 leading-relaxed">
            Deviso propose deux formules :<br /><br />
            Deviso ne propose pas de plan gratuit permanent. Tout abonnement inclut un <strong>essai gratuit de 14 jours</strong> sans carte bancaire requise.<br /><br />
            <strong>Plan Solo</strong> : {SOLO.mensuel} €/mois HT (ou {SOLO.annuel} €/an, soit {SOLO.annuelParMois} €/mois). Inclut toutes les fonctions de Deviso pour un utilisateur : devis IA, factures Factur-X multi-taux, raccordement à une plateforme agréée et e-reporting, ventes et achats internationaux, factures en anglais, signature électronique, relances automatiques programmables, catalogue de prestations, CRM et analytics, sous-domaine de partage, couleur d&apos;accent, Chorus Pro B2G, exports comptables (FEC et CSV) et livre des recettes.<br /><br />
            <strong>Plan Pro</strong> : {PRO.mensuel} €/mois HT (ou {PRO.annuel} €/an, soit {PRO.annuelParMois} €/mois). Inclut tout le plan Solo, plus la gestion d&apos;équipe multi-utilisateurs : 3 utilisateurs inclus (le titulaire du compte et 2 membres), +{PRIX_SIEGE} €/mois par utilisateur supplémentaire ({PRIX_SIEGE_ANNUEL} €/an pour un abonnement annuel), avec rôles et validation des devis.<br /><br />
            Les tarifs annuels représentent une remise de 20 % par rapport au tarif mensuel.
            Le paiement s&apos;effectue par carte bancaire via la plateforme sécurisée Stripe, à l&apos;issue de la période d&apos;essai.
            L&apos;abonnement est résiliable à tout moment depuis le compte utilisateur, avec effet à la fin de la période en cours.
          </p>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">5. Obligations de l&apos;utilisateur</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;utilisateur s&apos;engage à :<br /><br />
            – Fournir des informations exactes lors de la création de son compte ;<br />
            – Utiliser le service uniquement dans le cadre d&apos;une activité professionnelle légale ;<br />
            – Ne pas tenter de contourner les limites de son plan ;<br />
            – Ne pas utiliser le service à des fins frauduleuses ou illicites.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">6. Données et confidentialité</h2>
          <p className="text-gray-400 leading-relaxed">
            Les données saisies par l&apos;utilisateur (informations clients, montants, descriptions de prestations)
            lui appartiennent. Deviso n&apos;utilise pas ces données à des fins commerciales. Pour plus de détails,
            consultez notre{" "}
            <Link href="/confidentialite" className="text-indigo-400 hover:underline">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">7. Responsabilité</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso est un outil d&apos;aide à la rédaction. L&apos;utilisateur reste seul responsable de la conformité
            légale et fiscale de ses documents (mentions obligatoires, taux de TVA, etc.). Deviso ne saurait être
            tenu responsable des erreurs ou omissions dans les documents générés, ni des conséquences fiscales
            ou commerciales qui en résulteraient.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">8. Disponibilité du service</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso s&apos;efforce d&apos;assurer une disponibilité maximale du service, mais ne peut garantir une disponibilité
            ininterrompue. Des interruptions ponctuelles pour maintenance ou incidents techniques sont possibles.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">9. Modification des CGU</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
            informés par email des modifications substantielles. La poursuite de l&apos;utilisation du service
            après notification vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">10. Droit applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de règlement amiable,
            les tribunaux du ressort du siège social de SafeTone Studio seront compétents.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">11. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            Pour toute question relative aux présentes CGU :{" "}
            <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:underline">
              support@getdeviso.fr
                       </a>
          </p>
        </section>
      </main>
    </PageSite>
  );
}
