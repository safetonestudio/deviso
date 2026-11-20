/**
 * Texte de la politique de confidentialité, source unique (20/11/2026) : la
 * page publique /confidentialite et la fenêtre de l'espace cabinet affichent
 * ce même composant, pour qu'il n'existe jamais deux versions du texte.
 */
export function PolitiqueConfidentialiteTexte() {
  return (
    <>
        <p className="text-gray-500 text-sm mb-14">Dernière mise à jour : novembre 2026</p>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">1. Responsable du traitement</h2>
        <p className="text-gray-400 leading-relaxed">
          Le responsable du traitement des données personnelles est :<br /><br />
          <strong>SafeTone Studio</strong>, Auto-entrepreneur<br />
          Email : <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:underline">support@getdeviso.fr</a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">2. Données collectées</h2>
        <p className="text-gray-400 leading-relaxed">
          Dans le cadre de l&apos;utilisation de Deviso, nous collectons les données suivantes :<br /><br />
          <strong>Données de compte</strong> : nom, adresse email, mot de passe (chiffré).<br /><br />
          <strong>Données de profil</strong> : SIREN, adresse professionnelle, logo, et les modalités de paiement que vous
          choisissez d&apos;afficher sur vos factures (IBAN, lien de paiement). Les données de carte bancaire de votre
          abonnement sont saisies chez Stripe et ne sont jamais conservées par Deviso.<br /><br />
          <strong>Données métier</strong> : devis, factures, informations clients (noms, emails, adresses), montants,
          prestations décrites, données de time tracking.<br /><br />
          <strong>Données techniques</strong> : adresse IP, données de navigation, métriques d&apos;utilisation anonymisées via Vercel Analytics,
          rapports d&apos;erreur techniques (Sentry).<br /><br />
          <strong>Échanges avec le support</strong> : messages envoyés par le chat d&apos;assistance ou par email.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">3. Accès de votre expert-comptable</h2>
        <p className="text-gray-400 leading-relaxed">
          Si vous invitez votre expert-comptable, il accède à votre espace <strong>en lecture seule</strong> : il consulte vos
          devis, factures, encaissements et déclarations, et peut les exporter (FEC, fichiers pour son logiciel comptable,
          PDF des factures). Il ne peut rien créer, modifier, envoyer ni supprimer.<br /><br />
          Chaque consultation de votre dossier et chaque export sont inscrits dans un journal des accès, consultable par
          le cabinet. Si le cabinet l&apos;a activé, il reçoit aussi un résumé périodique par email qui cite votre dossier et
          les points à traiter.<br /><br />
          Cet accès repose sur votre invitation : vous pouvez le retirer à tout moment depuis vos paramètres, et il prend
          fin immédiatement.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">4. Finalités du traitement</h2>
        <p className="text-gray-400 leading-relaxed">
          Vos données sont utilisées pour :<br /><br />
          – Fournir et améliorer le service Deviso ;<br />
          – Gérer votre compte et votre abonnement ;<br />
          – Donner accès à votre dossier à l&apos;expert-comptable que vous invitez ;<br />
          – Transmettre vos factures électroniques et vos données de paiement aux plateformes et à l&apos;administration, comme la loi l&apos;impose ;<br />
          – Envoyer des emails transactionnels (confirmation de compte, factures, relances) ;<br />
          – Assurer la sécurité et prévenir les fraudes ;<br />
          – Respecter nos obligations légales.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">5. Base légale</h2>
        <p className="text-gray-400 leading-relaxed">
          Le traitement de vos données est fondé sur :<br /><br />
          – L&apos;<strong>exécution du contrat</strong> (fourniture du service) ;<br />
          – Le <strong>respect d&apos;obligations légales</strong> (facturation, comptabilité) ;<br />
          – Notre <strong>intérêt légitime</strong> (amélioration du service, sécurité).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">6. Sous-traitants</h2>
        <p className="text-gray-400 leading-relaxed">
          Nous faisons appel aux sous-traitants suivants, qui traitent vos données en notre nom :<br /><br />
          <strong>Supabase</strong> (base de données et authentification), supabase.com<br />
          <strong>Vercel</strong> (hébergement et analytics), vercel.com<br />
          <strong>Stripe</strong> (paiements), stripe.com<br />
          <strong>Resend</strong> (emails transactionnels), resend.com<br />
          <strong>OpenAI</strong> (génération IA des devis), openai.com<br />
          <strong>Super PDP</strong> (plateforme agréée de facturation électronique), superpdp.tech<br />
          <strong>Sentry</strong> (suivi des erreurs techniques), sentry.io<br />
          <strong>Crisp</strong> (chat d&apos;assistance), crisp.chat<br />
          <strong>Google</strong> (messagerie du support), google.com<br />
          <strong>ImprovMX</strong> (redirection des emails adressés à getdeviso.fr), improvmx.com<br /><br />
          Ces sous-traitants sont soumis à des garanties contractuelles conformes au RGPD.<br /><br />
          <strong>Destinataires prévus par la loi.</strong> Les factures que vous émettez par la plateforme agréée, et les
          données de transaction et de paiement associées, sont transmises à l&apos;administration fiscale dans le cadre de
          la réforme de la facturation électronique. Les factures que vous déposez sur Chorus Pro sont transmises à
          votre client public par cette plateforme de l&apos;État.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">7. Localisation et transferts hors de l&apos;Union européenne</h2>
        <p className="text-gray-400 leading-relaxed">
          Votre base de données est hébergée en Suisse (Zurich), pays reconnu par la Commission européenne comme
          offrant un niveau de protection adéquat. Les serveurs de l&apos;application tournent en Allemagne (Francfort),
          et les rapports d&apos;erreur sont stockés en Allemagne.<br /><br />
          Certains sous-traitants sont établis aux États-Unis (notamment OpenAI, Stripe, Resend, Vercel, Sentry et Google)
          et peuvent y accéder à des données. Ces transferts sont encadrés par le cadre de protection des données
          UE-États-Unis (Data Privacy Framework) ou par les clauses contractuelles types adoptées par la Commission
          européenne.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">8. Durée de conservation</h2>
        <p className="text-gray-400 leading-relaxed">
          Vos données sont conservées pendant la durée de votre compte, puis supprimées dans un délai de
          30 jours après la clôture du compte, sauf obligation légale de conservation plus longue
          (10 ans pour les documents comptables conformément au Code de commerce).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">9. Vos droits</h2>
        <p className="text-gray-400 leading-relaxed">
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :<br /><br />
          – <strong>Droit d&apos;accès</strong> : obtenir une copie de vos données ;<br />
          – <strong>Droit de rectification</strong> : corriger des données inexactes ;<br />
          – <strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données ;<br />
          – <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré ;<br />
          – <strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements ;<br />
          – <strong>Droit à la limitation</strong> : restreindre temporairement le traitement.<br /><br />
          Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:underline">
            support@getdeviso.fr
          </a>.
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            CNIL
          </a>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">10. Cookies</h2>
        <p className="text-gray-400 leading-relaxed">
          Deviso utilise des cookies strictement nécessaires au fonctionnement du service (gestion de session) et
          enregistre vos préférences d&apos;affichage (thème clair ou sombre) dans votre navigateur. La mesure d&apos;audience
          (Vercel Analytics) ne dépose pas de cookie.<br /><br />
          Dans l&apos;espace connecté, le chat d&apos;assistance Crisp dépose ses propres cookies, qui servent à conserver
          votre conversation avec le support.<br /><br />
          Nous n&apos;utilisons pas de cookies publicitaires.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-ink mb-3">11. Sécurité</h2>
        <p className="text-gray-400 leading-relaxed">
          Vos données sont stockées de manière sécurisée et chiffrée. Les accès sont contrôlés
          par des politiques de sécurité strictes (Row Level Security Supabase). Les communications
          sont chiffrées via HTTPS.
        </p>
      </section>

    </>
  );
}
