import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "delais-paiement-penalites-retard";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Ce que dit la loi entre professionnels",
    paragraphes: [
      "Quand vous facturez une autre entreprise, le délai de paiement n&rsquo;est pas libre. Sans clause particulière, votre client doit vous régler <strong>dans les 30 jours</strong> qui suivent la réception de la marchandise ou la fin de la prestation.",
      "Vous pouvez convenir d&rsquo;un délai plus long, à condition de l&rsquo;écrire dans vos conditions générales ou dans le contrat. Mais il ne peut jamais dépasser <strong>60 jours à compter de la date de la facture</strong>, ou, si le contrat le prévoit expressément, <strong>45 jours fin de mois</strong>.",
      "Ces règles valent quel que soit votre statut&nbsp;: micro-entreprise, entreprise individuelle au réel, SARL ou SAS. Elles visent à protéger les petites structures, qui sont les premières à financer malgré elles la trésorerie de leurs clients.",
    ],
  },
  {
    type: "tableau",
    titre: "Les délais en un coup d&rsquo;oeil",
    colonnes: ["Situation", "Délai maximal"],
    lignes: [
      ["Aucun délai prévu", "30 jours après la livraison ou la prestation"],
      ["Délai convenu (cas général)", "60 jours après la date de la facture"],
      ["Délai convenu en fin de mois", "45 jours fin de mois, si le contrat le prévoit"],
    ],
    note:
      "Le calcul des 45 jours fin de mois admet deux lectures (fin du mois puis 45 jours, ou 45 jours puis fin du mois). Écrivez celle que vous appliquez dans vos conditions, pour éviter toute discussion.",
  },
  {
    type: "texte",
    titre: "Les pénalités de retard sont dues automatiquement",
    paragraphes: [
      "Dès le lendemain de l&rsquo;échéance, des <strong>pénalités de retard</strong> courent de plein droit, sans que vous ayez à envoyer de relance ni de mise en demeure. Leur taux est celui que vous fixez dans vos conditions, sans pouvoir être inférieur à trois fois le taux d&rsquo;intérêt légal. À défaut de taux écrit, c&rsquo;est le taux de la Banque centrale européenne majoré de 10 points qui s&rsquo;applique.",
      "S&rsquo;y ajoute une <strong>indemnité forfaitaire de 40 € pour frais de recouvrement</strong>, due pour chaque facture payée en retard, et non par jour de retard. Si vos frais réels de recouvrement sont plus élevés, vous pouvez demander une indemnisation complémentaire en les justifiant.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Trois mentions à faire figurer sur chaque facture",
    texte:
      "La <strong>date d&rsquo;échéance</strong>, le <strong>taux des pénalités de retard</strong> et la mention de l&rsquo;<strong>indemnité forfaitaire de 40 €</strong>. Leur absence vous expose à une amende, et vous prive d&rsquo;un argument précieux le jour où il faut relancer.",
  },
  {
    type: "texte",
    titre: "Ce que risque un client qui paie en retard",
    paragraphes: [
      "Le respect des délais de paiement est contrôlé par l&rsquo;administration (DGCCRF). Une entreprise qui paie systématiquement en retard s&rsquo;expose à une <strong>amende administrative pouvant atteindre 2 millions d&rsquo;euros</strong> pour une société, et 75 000 € pour une personne physique. Le plafond est doublé en cas de récidive dans les deux ans.",
      "Dans la pratique, ces sanctions visent surtout les mauvais payeurs récurrents, souvent de grands donneurs d&rsquo;ordre. Elles ne règlent pas votre facture, mais elles rappellent que vous êtes dans votre droit en réclamant votre dû.",
    ],
  },
  {
    type: "liste",
    titre: "Comment récupérer votre argent, dans l&rsquo;ordre",
    items: [
      {
        titre: "Relancer tôt et poliment",
        texte:
          "Une relance quelques jours après l&rsquo;échéance règle la majorité des retards, qui sont souvent des oublis. Rappelez le montant, l&rsquo;échéance et le moyen de paiement.",
      },
      {
        titre: "Envoyer une mise en demeure",
        texte:
          "Par lettre recommandée, en rappelant le montant dû, les pénalités et l&rsquo;indemnité de 40 €, avec un dernier délai. C&rsquo;est la pièce que vous demandera toute procédure ensuite.",
      },
      {
        titre: "Saisir le Médiateur des entreprises",
        texte:
          "Un service public gratuit et confidentiel, qui aide à renouer le dialogue avec un client sans aller au tribunal.",
      },
      {
        titre: "Passer par la justice",
        texte:
          "Pour une petite somme (5 000 € au plus), la procédure simplifiée de recouvrement passe par un commissaire de justice. Au-delà, ou en cas de refus, l&rsquo;injonction de payer devant le tribunal de commerce reste rapide et peu coûteuse.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "La facture électronique ne change pas les délais",
    texte:
      "Depuis septembre 2026, les factures entre entreprises passent progressivement par des plateformes agréées. Le cadre juridique des délais et des pénalités reste le même, mais le suivi devient plus simple&nbsp;: la date de réception de la facture et son statut sont tracés, ce qui limite les « je ne l&rsquo;ai jamais reçue ».",
  },
];

const FAQ = [
  {
    q: "Quel est le délai de paiement maximal entre entreprises ?",
    a: "60 jours à compter de la date de la facture, ou 45 jours fin de mois si le contrat le prévoit. Sans clause particulière, le délai est de 30 jours après la livraison ou la prestation.",
  },
  {
    q: "Les pénalités de retard sont-elles dues sans relance ?",
    a: "Oui. Entre professionnels, elles courent de plein droit dès le lendemain de l'échéance, sans mise en demeure préalable.",
  },
  {
    q: "L'indemnité de 40 € s'applique-t-elle par facture ?",
    a: "Oui, elle est due pour chaque facture payée en retard, et non par jour de retard. Vous pouvez demander davantage si vos frais de recouvrement réels sont supérieurs et justifiés.",
  },
  {
    q: "Quelles mentions doivent figurer sur la facture ?",
    a: "La date d'échéance, le taux des pénalités de retard et l'indemnité forfaitaire de 40 € pour frais de recouvrement.",
  },
  {
    q: "Ces règles s'appliquent-elles aux particuliers ?",
    a: "Non. Elles concernent les relations entre professionnels. Avec un particulier, les conditions de paiement relèvent du droit de la consommation et de ce que prévoit votre devis.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Bpifrance Création, Les principaux délais de paiement",
    url: "https://bpifrance-creation.fr/encyclopedie/gerer-lentreprise/gestion-financiere-comptable/principaux-delais-paiement",
    precision: "30 jours, 60 jours, 45 jours fin de mois",
  },
  {
    libelle: "DGCCRF, Contrôle des délais de paiement interprofessionnels",
    url: "https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/foire-aux-questions-relative-aux-lignes-directrices-en-matiere-de-controle-des-delais-de-paiement-interprofessionnels",
    precision: "contrôles et amendes administratives",
  },
  {
    libelle: "DREETS Hauts-de-France, Lutte contre les retards de paiement",
    url: "https://hauts-de-france.dreets.gouv.fr/sites/hauts-de-france.dreets.gouv.fr/IMG/pdf/lutte_contre_les_retards_de_paiement.pdf",
    precision: "pénalités, indemnité de 40 €, mentions obligatoires",
  },
  {
    libelle: "Ministère de l'Économie, Médiateur des entreprises",
    url: "https://www.economie.gouv.fr/mediateur-des-entreprises",
    precision: "médiation gratuite et confidentielle",
  },
  {
    libelle: "Banque de France, Observatoire des délais de paiement, rapport 2025",
    url: "https://www.banque-france.fr/system/files/2026-07/ODP2025_WEB.pdf",
    precision: "état des retards de paiement en France",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Un client qui paie en retard, c&rsquo;est la trésorerie de votre entreprise qui finance la sienne. Entre professionnels, la loi encadre pourtant strictement les délais et prévoit des pénalités automatiques. Encore faut-il les connaître, et les écrire sur vos factures."
      enBref={[
        "Sans clause, le client paie sous <strong>30 jours</strong>&nbsp;; avec clause, jamais plus de <strong>60 jours</strong> ou <strong>45 jours fin de mois</strong>.",
        "Les <strong>pénalités de retard</strong> courent dès le lendemain de l&rsquo;échéance, sans relance.",
        "Chaque facture payée en retard ouvre droit à <strong>40 €</strong> d&rsquo;indemnité forfaitaire.",
        "Échéance, taux des pénalités et indemnité de 40 € doivent figurer <strong>sur chaque facture</strong>.",
        "Relance, mise en demeure, médiation gratuite, puis justice&nbsp;: dans cet ordre.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Des factures qui se font payer",
        texte:
          "Deviso inscrit l&rsquo;échéance, les pénalités et l&rsquo;indemnité de 40 € sur chaque facture, et relance vos clients à votre place quand l&rsquo;échéance est passée.",
      }}
    />
  );
}
