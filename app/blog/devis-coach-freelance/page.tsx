import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/BlogPost";

export const metadata: Metadata = {
  title: "Devis coach freelance : TVA, conditions abandon programme, exemple | Deviso",
  description:
    "Comment rédiger un devis de coaching freelance : TVA franchise ou exonération, conditions d'abandon et de remboursement, séances vs programmes. Exemple et erreurs à éviter.",
  alternates: { canonical: "https://getdeviso.fr/blog/devis-coach-freelance" },
  openGraph: {
    title: "Devis coach freelance : TVA, conditions abandon programme, exemple",
    description: "TVA franchise ou exonération, conditions abandon, séances vs programmes, tout ce qu'un devis de coach freelance doit contenir.",
    url: "https://getdeviso.fr/blog/devis-coach-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
  twitter: {
    title: "Devis coach freelance : TVA, conditions abandon programme, exemple",
    description: "TVA franchise ou exonération, conditions abandon, séances vs programmes, guide complet pour votre devis coaching.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Devis coach freelance : TVA, conditions d'abandon de programme et erreurs à éviter",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/devis-coach-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Un coach freelance doit-il facturer avec ou sans TVA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si vous êtes auto-entrepreneur ou en franchise de TVA (moins de 37 500€ de CA annuel pour les prestations de service), vous facturez sans TVA et mentionnez 'TVA non applicable, art. 293 B du CGI'. Le coaching 'de vie' (life coaching, coaching professionnel individuel) n'est pas exonéré de TVA en France, contrairement à la formation professionnelle continue qui peut l'être sous conditions.",
        },
      },
      {
        "@type": "Question",
        name: "Comment gérer l'abandon de programme dans un devis de coaching ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prévoyez une clause claire dans le devis : séances déjà réalisées facturées au prorata, acompte non remboursable, préavis minimum de résiliation. Par exemple : 'En cas d'arrêt du programme par le client, les séances réalisées restent dues. L'acompte versé à la signature n'est pas remboursable.'",
        },
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPost
        h1="Devis coach freelance : TVA, conditions d'abandon de programme et erreurs à éviter"
        datePublished="2026-06-29"
        readingTime={6}
        profession="coach freelance"
        professionPlural="coachs freelances"
        landingHref="/freelance-coach"
        landingLabel="logiciel de devis pour coachs freelances"
        intro="Le coaching est une prestation à valeur élevée, souvent intangible, sur laquelle les litiges sont fréquents : client qui abandonne après 2 séances et refuse de payer le reste, TVA mal gérée, absence de conditions claires. Voici comment rédiger un devis de coaching freelance qui vous protège et rassure votre client dès la signature."
        mandatoryTitle="Les mentions obligatoires d'un devis de coaching freelance"
        mandatoryIntro="Un devis de coaching doit contenir les mentions légales classiques mais aussi des clauses spécifiques à la nature de la prestation :"
        mandatoryItems={[
          {
            title: "Vos coordonnées et statut juridique",
            desc: "Nom ou raison sociale, SIRET, adresse. Indiquez votre statut : auto-entrepreneur, EURL, SASU. Si vous êtes certifié (ICF, EMCC, RNCP...), mentionnez vos certifications, elles justifient vos tarifs et rassurent les clients professionnels.",
          },
          {
            title: "Régime de TVA et mention obligatoire",
            desc: "Si vous êtes en franchise de TVA (auto-entrepreneur sous le seuil), indiquez 'TVA non applicable, art. 293 B du CGI'. Si vous êtes assujetti, ajoutez votre numéro de TVA intracommunautaire. Attention : le life coaching et le coaching professionnel individuel ne bénéficient pas d'exonération de TVA en France (contrairement à la formation).",
          },
          {
            title: "Description précise du programme ou des séances",
            desc: "Nombre de séances, durée de chaque séance, format (présentiel / visioconférence / téléphone), fréquence, durée totale du programme. Si vous offrez du suivi inter-séances (email, WhatsApp), précisez les modalités et le délai de réponse.",
          },
          {
            title: "Objectifs du programme et livrables",
            desc: "Sans transformer le devis en contrat de résultat, décrivez les objectifs du programme : 'Accompagnement à la définition du projet professionnel et à la prise de décision' ou 'Programme de développement du leadership pour manager opérationnel'. Précisez les livrables éventuels : bilan de compétences, plan d'action, accès à des ressources.",
          },
          {
            title: "Conditions d'annulation et de report de séances",
            desc: "Délai de prévenance pour annuler une séance (48h minimum recommandé). En dessous de ce délai, la séance est due. Nombre de reports autorisés sur la durée du programme. Ces clauses évitent les séances annulées en dernière minute qui désorganisent votre agenda.",
          },
          {
            title: "Conditions d'abandon de programme",
            desc: "C'est la clause la plus importante. Exemple : 'En cas d'arrêt anticipé du programme par le client, les séances réalisées sont facturées au tarif unitaire [X €/séance]. L'acompte versé à la signature n'est pas remboursable. Un préavis de 15 jours est requis.' Sans cette clause, vous n'aurez aucun recours légal.",
          },
          {
            title: "Modalités de paiement et échéancier",
            desc: "30 à 50% d'acompte à la signature pour les programmes longs. Solde en une ou plusieurs fois selon la durée. Pour les programmes de plus de 3 mois, proposez un paiement mensuel (plus facile à accepter pour le client). Mentionnez les pénalités de retard pour les facturations entre professionnels.",
          },
        ]}
        exampleClient="Mme Lefebvre, Cadre, Paris (reconversion vers l'entrepreneuriat, programme 3 mois)"
        exampleLines={[
          { desc: "Bilan initial et définition des objectifs du programme (2h)", qty: "1 séance", price: "280 €" },
          { desc: "Séances de coaching individuel (1h, visioconférence)", qty: "10 séances", price: "2 000 €" },
          { desc: "Accès bibliothèque de ressources et outils (3 mois)", qty: "1 forfait", price: "150 €" },
          { desc: "Suivi email inter-séances (réponse sous 48h ouvrées)", qty: "1 forfait", price: "200 €" },
          { desc: "Bilan de fin de programme et plan d'action (2h)", qty: "1 séance", price: "280 €" },
        ]}
        exampleTotal="2 910 € HT"
        exampleNote="TVA non applicable, art. 293 B du CGI. Acompte 40% à la signature (1 164 €), solde en fin de programme. En cas d'arrêt anticipé : séances réalisées facturées au tarif unitaire (200 €/séance). Acompte non remboursable. Annulation possible sous 48h ouvrées avant chaque séance."
        mistakes={[
          {
            title: "Pas de clause d'abandon de programme",
            desc: "C'est l'erreur la plus coûteuse. Sans clause claire, un client qui arrête après 3 séances sur 12 peut contester le paiement du reste. La jurisprudence en matière de coaching est floue, vos conditions contractuelles sont votre seule protection. Rédigez-les avec soin et faites-les signer.",
          },
          {
            title: "Confondre coaching et formation (TVA)",
            desc: "La formation professionnelle continue peut être exonérée de TVA (si vous avez un numéro de formateur déclaré ou une certification Qualiopi). Le coaching de vie et le coaching professionnel individuel ne le sont généralement pas. Se tromper et ne pas facturer la TVA quand elle est due expose à un redressement.",
          },
          {
            title: "Devis qui promet des résultats",
            desc: "\"Je vous aide à doubler votre CA\" ou \"Garantie de résultat\" sur un devis sont dangereux juridiquement. Une obligation de résultat vous engage, et en coaching, les résultats dépendent en grande partie de l'implication du client. Rédigez des objectifs de moyens : 'Ce programme vous accompagne dans votre démarche de...', pas 'Ce programme vous permettra de...'",
          },
          {
            title: "Ne pas préciser le format des séances",
            desc: "Visioconférence ? En présentiel ? Téléphone uniquement ? Si ce n'est pas précisé, votre client peut exiger que vous vous déplaciez sans surcoût, ou refuser la visioconférence alors que vous avez organisé tout votre planning en ligne. Soyez précis sur le format dès le devis.",
          },
        ]}
        faq={[
          {
            q: "Un coach freelance doit-il facturer avec ou sans TVA ?",
            a: "Si vous êtes auto-entrepreneur ou en franchise de TVA (seuil 2026 : 37 500 € de CA annuel pour les prestations de service), vous facturez sans TVA et mentionnez 'TVA non applicable, art. 293 B du CGI'. Au-delà du seuil, vous devez facturer la TVA à 20%. Le coaching de vie et le coaching professionnel individuel ne sont pas exonérés de TVA en France. Seule la formation professionnelle continue peut l'être, sous conditions (numéro de prestataire de formation, enregistrement auprès du préfet de région).",
          },
          {
            q: "Comment gérer l'abandon de programme dans un devis de coaching ?",
            a: "Prévoyez une clause explicite dans le devis : séances déjà réalisées facturées au tarif unitaire, acompte non remboursable, préavis minimum de résiliation (15 jours recommandé). Exemple : 'En cas d'arrêt anticipé du programme à l'initiative du client, les séances réalisées restent dues au tarif de [X€/séance]. L'acompte versé à la signature (40%) n'est pas remboursable.' Cette clause doit être visible et signée.",
          },
          {
            q: "Faut-il facturer les séances à l'unité ou en programme ?",
            a: "Les deux modèles sont valables. La facturation à l'unité (ex: 200€/séance) offre plus de flexibilité mais moins de visibilité sur votre CA. Le programme forfaitaire (ex: 2 000€ pour 10 séances) engage plus le client et améliore votre trésorerie grâce à l'acompte. Pour les accompagnements longs, le programme avec paiement en plusieurs fois est souvent le plus adapté.",
          },
          {
            q: "Peut-on déduire le coaching de ses impôts en tant que client pro ?",
            a: "Un professionnel qui fait appel à un coach dans le cadre de son activité peut déduire cette dépense de ses charges. Votre facture doit mentionner clairement la nature de la prestation. Si votre client est salarié et que c'est son employeur qui paie, la prestation peut être prise en charge via le plan de développement des compétences.",
          },
        ]}
      />
    </>
  );
}
