import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>
        <p className="text-gray-500 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Responsable du traitement</h2>
          <p className="text-gray-400 leading-relaxed">
            Le responsable du traitement des données personnelles est :<br /><br />
            <strong>SafeTone Studio</strong>, Auto-entrepreneur<br />
            Email : <a href="mailto:safetonestudio@proton.me" className="text-indigo-600 hover:underline">safetonestudio@proton.me</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Données collectées</h2>
          <p className="text-gray-400 leading-relaxed">
            Dans le cadre de l&apos;utilisation de Deviso, nous collectons les données suivantes :<br /><br />
            <strong>Données de compte</strong> : nom, adresse email, mot de passe (chiffré).<br /><br />
            <strong>Données de profil</strong> : SIREN, adresse professionnelle, logo, coordonnées bancaires pour les virements Stripe.<br /><br />
            <strong>Données métier</strong> : devis, factures, informations clients (noms, emails, adresses), montants,
            prestations décrites, données de time tracking.<br /><br />
            <strong>Données techniques</strong> : adresse IP, données de navigation, métriques d&apos;utilisation anonymisées via Vercel Analytics.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. Finalités du traitement</h2>
          <p className="text-gray-400 leading-relaxed">
            Vos données sont utilisées pour :<br /><br />
            – Fournir et améliorer le service Deviso ;<br />
            – Gérer votre compte et votre abonnement ;<br />
            – Envoyer des emails transactionnels (confirmation de compte, factures, relances) ;<br />
            – Assurer la sécurité et prévenir les fraudes ;<br />
            – Respecter nos obligations légales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Base légale</h2>
          <p className="text-gray-400 leading-relaxed">
            Le traitement de vos données est fondé sur :<br /><br />
            – L&apos;<strong>exécution du contrat</strong> (fourniture du service) ;<br />
            – Le <strong>respect d&apos;obligations légales</strong> (facturation, comptabilité) ;<br />
            – Notre <strong>intérêt légitime</strong> (amélioration du service, sécurité).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Sous-traitants</h2>
          <p className="text-gray-400 leading-relaxed">
            Nous faisons appel aux sous-traitants suivants, qui traitent vos données en notre nom :<br /><br />
            <strong>Supabase</strong> (base de données et authentification), supabase.com<br />
            <strong>Vercel</strong> (hébergement et analytics), vercel.com<br />
            <strong>Stripe</strong> (paiements), stripe.com<br />
            <strong>Resend</strong> (emails transactionnels), resend.com<br />
            <strong>OpenAI</strong> (génération IA des devis), openai.com<br /><br />
            Ces sous-traitants sont soumis à des garanties contractuelles conformes au RGPD.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Durée de conservation</h2>
          <p className="text-gray-400 leading-relaxed">
            Vos données sont conservées pendant la durée de votre compte, puis supprimées dans un délai de
            30 jours après la clôture du compte, sauf obligation légale de conservation plus longue
            (10 ans pour les documents comptables conformément au Code de commerce).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Vos droits</h2>
          <p className="text-gray-400 leading-relaxed">
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :<br /><br />
            – <strong>Droit d&apos;accès</strong> : obtenir une copie de vos données ;<br />
            – <strong>Droit de rectification</strong> : corriger des données inexactes ;<br />
            – <strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données ;<br />
            – <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré ;<br />
            – <strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements ;<br />
            – <strong>Droit à la limitation</strong> : restreindre temporairement le traitement.<br /><br />
            Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:safetonestudio@proton.me" className="text-indigo-600 hover:underline">
              safetonestudio@proton.me
            </a>.
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              CNIL
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
          <p className="text-gray-400 leading-relaxed">
            Deviso utilise uniquement des cookies strictement nécessaires au fonctionnement du service
            (gestion de session). Nous n&apos;utilisons pas de cookies publicitaires ou de tracking tiers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Sécurité</h2>
          <p className="text-gray-400 leading-relaxed">
            Vos données sont stockées de manière sécurisée et chiffrée. Les accès sont contrôlés
            par des politiques de sécurité strictes (Row Level Security Supabase). Les communications
            sont chiffrées via HTTPS.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-ds-border text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </div>
  );
}
