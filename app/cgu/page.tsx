import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  robots: { index: false },
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <nav className="border-b border-ds-border px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">D</span>
          </div>
          <span className="font-semibold text-white">Deviso</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-semibold text-white mb-2">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-gray-500 text-sm mb-10">Dernière mise à jour : juillet 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Objet</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation
            de la plateforme <strong>Deviso</strong> (getdeviso.fr), éditée par SafeTone Studio. En créant un compte,
            l&apos;utilisateur accepte sans réserve les présentes CGU.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Description du service</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso est un logiciel en ligne (SaaS) permettant aux freelances et auto-entrepreneurs français de créer,
            envoyer et gérer des devis et factures électroniques, avec assistance par intelligence artificielle.
            Le service comprend notamment la génération de devis par IA, la signature électronique, la facturation
            au format Factur-X, et le suivi des paiements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. Accès au service</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;accès au service nécessite la création d&apos;un compte avec une adresse email valide et un mot de passe.
            L&apos;utilisateur est responsable de la confidentialité de ses identifiants. Deviso se réserve le droit
            de suspendre tout compte en cas de violation des présentes CGU.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Plans tarifaires</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso propose deux formules :<br /><br />
            Deviso ne propose pas de plan gratuit permanent. Tout abonnement inclut un <strong>essai gratuit de 14 jours</strong> sans carte bancaire requise.<br /><br />
            <strong>Plan Solo</strong> : 18 €/mois HT (ou 172,80 €/an, soit 14,40 €/mois). Inclut : factures Factur-X, logo personnalisé, signature électronique, relances auto, exports comptables.<br /><br />
            <strong>Plan Pro</strong> : 34 €/mois HT (ou 326,40 €/an, soit 27,20 €/mois). Inclut tout Solo + multi-utilisateurs (3 utilisateurs inclus — le titulaire du compte et 2 membres —, +5 €/mois/utilisateur supplémentaire), catalogue partagé, domaine d&apos;envoi personnalisé, accès Chorus Pro B2G.<br /><br />
            Les tarifs annuels représentent une remise de 20 % par rapport au tarif mensuel.
            Le paiement s&apos;effectue par carte bancaire via la plateforme sécurisée Stripe, à l&apos;issue de la période d&apos;essai.
            L&apos;abonnement est résiliable à tout moment depuis le compte utilisateur, avec effet à la fin de la période en cours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Obligations de l&apos;utilisateur</h2>
          <p className="text-gray-400 leading-relaxed">
            L&apos;utilisateur s&apos;engage à :<br /><br />
            – Fournir des informations exactes lors de la création de son compte ;<br />
            – Utiliser le service uniquement dans le cadre d&apos;une activité professionnelle légale ;<br />
            – Ne pas tenter de contourner les limites de son plan ;<br />
            – Ne pas utiliser le service à des fins frauduleuses ou illicites.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Données et confidentialité</h2>
          <p className="text-gray-400 leading-relaxed">
            Les données saisies par l&apos;utilisateur (informations clients, montants, descriptions de prestations)
            lui appartiennent. Deviso n&apos;utilise pas ces données à des fins commerciales. Pour plus de détails,
            consultez notre{" "}
            <Link href="/confidentialite" className="text-indigo-600 hover:underline">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Responsabilité</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso est un outil d&apos;aide à la rédaction. L&apos;utilisateur reste seul responsable de la conformité
            légale et fiscale de ses documents (mentions obligatoires, taux de TVA, etc.). Deviso ne saurait être
            tenu responsable des erreurs ou omissions dans les documents générés, ni des conséquences fiscales
            ou commerciales qui en résulteraient.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Disponibilité du service</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso s&apos;efforce d&apos;assurer une disponibilité maximale du service, mais ne peut garantir une disponibilité
            ininterrompue. Des interruptions ponctuelles pour maintenance ou incidents techniques sont possibles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Modification des CGU</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
            informés par email des modifications substantielles. La poursuite de l&apos;utilisation du service
            après notification vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">10. Droit applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de règlement amiable,
            les tribunaux du ressort du siège social de SafeTone Studio seront compétents.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            Pour toute question relative aux présentes CGU :{" "}
            <a href="mailto:safetonestudio@proton.me" className="text-indigo-600 hover:underline">
              safetonestudio@proton.me
                       </a>
          </p>
        </section>
      </main>
    </div>
  );
}
