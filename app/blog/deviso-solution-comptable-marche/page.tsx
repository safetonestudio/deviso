import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "deviso-solution-comptable-marche";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Un marché encombré, et pourtant des trous",
    paragraphes: [
      "Les outils de facturation pour indépendants ne manquent pas : une bonne dizaine de solutions se partagent le marché français, beaucoup avec une offre gratuite. Côté cabinets, la bataille se joue entre des plateformes bien financées, dont certaines ont levé des montants considérables pour équiper les experts-comptables et leurs clients.",
      "Dans ce paysage, on pourrait croire le micro-entrepreneur parfaitement servi. En pratique, deux trous persistent : les outils grand public digèrent mal les subtilités du régime micro, et les plateformes pensées pour les cabinets sont souvent trop lourdes, et trop chères, pour un portefeuille de petits dossiers micro.",
    ],
  },
  {
    type: "liste",
    titre: "Les points de douleur que les outils laissent",
    items: [
      {
        titre: "La réforme mal digérée",
        texte:
          "Beaucoup promettent la facturation électronique, mais peu expliquent clairement au micro-entrepreneur ce qu&rsquo;il doit faire, et quand. La confusion règne sur les seuils, les dates et les plateformes.",
      },
      {
        titre: "Le livre des recettes au facturé",
        texte:
          "Des outils tiennent les recettes à la date de facture, pas à l&rsquo;encaissement. Pour le micro, c&rsquo;est faux, et ça décale la déclaration de CA.",
      },
      {
        titre: "Des outils pensés pour la société",
        texte:
          "Nombre de solutions sont d&rsquo;abord conçues pour des sociétés au réel, avec des fonctions que le micro n&rsquo;utilise pas et une complexité qu&rsquo;il ne veut pas.",
      },
      {
        titre: "Un canal comptable hors de prix pour les petits dossiers",
        texte:
          "Les plateformes cabinet sont puissantes, mais leur modèle vise surtout les sociétés. Suivre dix micro-entrepreneurs y revient cher pour ce que ça rapporte.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Où Deviso se place",
    paragraphes: [
      "Deviso ne cherche pas à être une plateforme comptable universelle. Notre choix est l&rsquo;inverse : faire une seule chose bien, le <strong>micro-entrepreneur</strong>, et la connecter à un <strong>canal expert-comptable</strong> pensé pour les petits dossiers.",
      "Côté indépendant : une facturation conforme, un livre des recettes tenu à l&rsquo;encaissement, la distinction biens / services, les exports comptables, et la conformité à la réforme intégrée. Côté cabinet : un cockpit qui donne la vue d&rsquo;ensemble d&rsquo;un portefeuille de micro-clients, sans la lourdeur d&rsquo;une suite conçue pour la société.",
    ],
  },
  {
    type: "tableau",
    titre: "La douleur, et notre réponse",
    colonnes: ["Point de douleur", "Ce que Deviso propose"],
    lignes: [
      ["Réforme floue pour le micro", "Un suivi de conformité clair, seuils et raccordement expliqués"],
      ["Recettes au facturé", "Un livre des recettes tenu à l&rsquo;encaissement, par construction"],
      ["Outil trop riche, pensé société", "Une interface centrée sur les seuls gestes du micro"],
      ["Canal cabinet trop lourd", "Un cockpit léger pour suivre un portefeuille de petits dossiers"],
      ["Exports hétérogènes", "Des exports standardisés, prêts pour l&rsquo;expert-comptable"],
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Ce que Deviso ne prétend pas être",
    texte:
      "Soyons honnêtes sur le périmètre : Deviso n&rsquo;est pas une solution de comptabilité d&rsquo;engagement pour sociétés au réel, et ne remplace pas un expert-comptable pour un bilan ou une liasse fiscale. Nous couvrons le quotidien du <strong>régime micro</strong> et son interface avec le cabinet. Au-delà, nous renvoyons vers le conseil, c&rsquo;est notre rôle, pas l&rsquo;inverse.",
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Notre pari",
    texte:
      "La réforme de la facturation électronique va pousser des millions de micro-entrepreneurs à s&rsquo;équiper, et leurs experts-comptables à les équiper. Notre pari est qu&rsquo;un outil <strong>simple, juste pour le micro, et relié au cabinet</strong> a une place entre les outils grand public et les grosses plateformes. Nous le construisons en phase pilote, avec des indépendants et des cabinets, pour qu&rsquo;il colle au terrain plutôt qu&rsquo;à une feuille de route.",
  },
];

const FAQ = [
  {
    q: "En quoi Deviso se distingue des autres logiciels de facturation ?",
    a: "Deviso se concentre sur le régime micro-entreprise et son interface avec l'expert-comptable, au lieu de viser toutes les tailles d'entreprise. Livre des recettes à l'encaissement, distinction biens / services, conformité réforme et cockpit cabinet léger en sont les axes.",
  },
  {
    q: "Deviso remplace-t-il un expert-comptable ?",
    a: "Non. Deviso couvre le quotidien du régime micro (facturation, livre des recettes, exports) et son lien avec le cabinet. Il ne produit pas de bilan ni de liasse fiscale et ne remplace pas le conseil d'un expert-comptable.",
  },
  {
    q: "Pourquoi un outil de plus alors que le marché est déjà encombré ?",
    a: "Parce que deux trous persistent : les outils grand public digèrent mal les subtilités du micro (recettes au facturé, réforme floue), et les plateformes pour cabinets sont trop lourdes et chères pour un portefeuille de petits dossiers micro.",
  },
  {
    q: "Quels points de douleur Deviso règle-t-il concrètement ?",
    a: "La réforme rendue claire pour le micro, un livre des recettes tenu à l'encaissement, une interface limitée aux gestes du micro, des exports standardisés et un cockpit cabinet léger pour suivre plusieurs dossiers.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Tool-advisor, Comparatif des logiciels de facturation 2026",
    url: "https://tool-advisor.fr/logiciel-facturation",
    precision: "panorama des solutions du marché français",
  },
  {
    libelle: "Siècle Digital, Pennylane lève 175 millions d'euros (janvier 2026)",
    url: "https://siecledigital.fr/2026/01/20/pennylane-soffre-175-millions-deuros-pour-changer-dechelle/",
    precision: "dynamique du marché des plateformes pour experts-comptables",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le marché des outils de facturation déborde, et pourtant le micro-entrepreneur reste mal servi, coincé entre des outils grand public imprécis et des plateformes cabinet trop lourdes. Voici où Deviso se place, et ce qu&rsquo;il ne prétend pas être."
      enBref={[
        "Marché <strong>encombré</strong> côté indépendants, dominé par des acteurs très financés côté cabinets.",
        "Trous persistants : réforme floue, livre des recettes <strong>au facturé</strong>, outils pensés pour la société.",
        "Deviso fait <strong>une chose bien</strong> : le micro, relié à un canal expert-comptable léger.",
        "Recettes à l&rsquo;<strong>encaissement</strong>, conformité réforme, exports standardisés, cockpit cabinet.",
        "Honnête sur le périmètre : <strong>pas</strong> une compta société, <strong>pas</strong> un remplaçant de l&rsquo;expert-comptable.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Participer à la phase pilote",
        texte:
          "Nous construisons Deviso avec des indépendants et des cabinets. Pour tester l&rsquo;outil ou nous faire des retours, la page experts-comptables explique comment nous rejoindre.",
      }}
    />
  );
}
