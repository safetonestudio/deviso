import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "deviso-solution-comptable-marche";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Un marché encombré, et pourtant des trous",
    paragraphes: [
      "Les outils de facturation pour indépendants ne manquent pas : de nombreuses solutions se partagent le marché français, comme le recense par exemple un comparatif spécialisé. Côté cabinets, des plateformes bien financées, dont l&rsquo;une a levé 175 millions d&rsquo;euros en janvier 2026 selon Siècle Digital, cherchent à équiper les experts-comptables et leurs clients.",
      "Dans ce paysage, on pourrait croire les petites entreprises parfaitement servies. Notre lecture, en tant qu&rsquo;éditeur : deux besoins restent à nos yeux mal couverts. D&rsquo;une part, certains outils grand public prennent mal en compte les subtilités propres à chaque statut, du régime micro à la société. D&rsquo;autre part, des plateformes pensées pour les cabinets peuvent se révéler lourdes, ou onéreuses, pour un portefeuille de petits dossiers.",
    ],
  },
  {
    type: "liste",
    titre: "Les points de douleur que nous observons",
    items: [
      {
        titre: "La réforme mal digérée",
        texte:
          "La facturation électronique est annoncée partout, mais il n&rsquo;est pas toujours simple, pour un dirigeant, micro-entrepreneur ou société, de savoir ce qu&rsquo;il doit faire, et quand. Les seuils, les dates et les plateformes prêtent à confusion.",
      },
      {
        titre: "Le livre des recettes au facturé",
        texte:
          "Certains outils peuvent tenir les recettes à la date de facture plutôt qu&rsquo;à l&rsquo;encaissement. Pour le micro, c&rsquo;est le chiffre d&rsquo;affaires encaissé qui se déclare : un suivi au facturé décale la déclaration.",
      },
      {
        titre: "Des outils qui ne s&rsquo;adaptent pas au statut",
        texte:
          "Certaines solutions sont conçues pour un seul profil : soit des sociétés au réel, avec une complexité inutile au micro, soit des micro-entrepreneurs, sans ce qu&rsquo;il faut dès que l&rsquo;entreprise grandit. Changer de statut peut alors obliger à changer d&rsquo;outil.",
      },
      {
        titre: "Un canal comptable hors de prix pour les petits dossiers",
        texte:
          "Les plateformes cabinet sont puissantes, mais certaines sont pensées d&rsquo;abord pour des dossiers plus conséquents. Pour un cabinet qui suit beaucoup de petites entreprises, micro-entrepreneurs compris, l&rsquo;équation économique peut être moins évidente.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Où Deviso se place",
    paragraphes: [
      "Deviso ne cherche pas à être une plateforme comptable universelle. Notre choix est de faire bien la facturation et le suivi de <strong>l&rsquo;entreprise</strong>, de l&rsquo;indépendant à la société, et de la connecter à un <strong>canal expert-comptable</strong> pensé pour les petits dossiers.",
      "Côté entreprise : des devis et des factures conformes, des factures fournisseurs reçues, un suivi adapté au statut (micro, entreprise individuelle au réel ou société), la TVA à plusieurs taux, des exports comptables FEC et Quadra, et la conformité à la réforme intégrée. Pour un micro-entrepreneur, le livre des recettes reste tenu à l&rsquo;encaissement, avec la distinction biens / services. Côté cabinet : un accès en lecture seule, gratuit, et un cockpit qui donne la vue d&rsquo;ensemble d&rsquo;un portefeuille de petits dossiers, avec une approche plus légère qu&rsquo;une suite conçue pour de grands portefeuilles.",
    ],
  },
  {
    type: "tableau",
    titre: "La douleur, et notre réponse",
    colonnes: ["Point de douleur", "Ce que Deviso propose"],
    lignes: [
      ["Réforme floue pour les petites entreprises", "Un suivi de conformité clair, seuils et raccordement expliqués"],
      ["Recettes au facturé", "Un livre des recettes tenu à l&rsquo;encaissement, par construction"],
      ["Outil qui ignore votre statut", "Une interface qui s&rsquo;adapte : micro, entreprise individuelle au réel ou société"],
      ["Canal cabinet trop lourd", "Un accès expert-comptable gratuit et un cockpit léger pour suivre un portefeuille de petits dossiers"],
      ["Exports hétérogènes", "Des exports standardisés, prêts pour l&rsquo;expert-comptable"],
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Ce que Deviso ne prétend pas être",
    texte:
      "Soyons honnêtes sur le périmètre : Deviso n&rsquo;est pas une solution de comptabilité complète, et ne remplace pas un expert-comptable pour un bilan ou une liasse fiscale. Nous couvrons le quotidien de la <strong>facturation, des achats et du suivi</strong> de l&rsquo;entreprise, et son interface avec le cabinet. Au-delà, nous renvoyons vers le conseil, c&rsquo;est notre rôle, pas l&rsquo;inverse.",
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Notre pari",
    texte:
      "La réforme de la facturation électronique va pousser de nombreuses entreprises, micro-entrepreneurs et sociétés, à s&rsquo;équiper, et leurs experts-comptables à les équiper. Notre pari est qu&rsquo;un outil <strong>simple, juste pour chaque statut, et relié au cabinet</strong> a une place entre les outils grand public et les grosses plateformes. Nous le construisons en phase pilote, avec des indépendants et des cabinets, pour qu&rsquo;il colle au terrain plutôt qu&rsquo;à une feuille de route.",
  },
];

const FAQ = [
  {
    q: "En quoi Deviso se distingue des autres logiciels de facturation ?",
    a: "Deviso s'adapte au statut de l'entreprise (micro, entreprise individuelle au réel, société) et à son interface avec l'expert-comptable. Facturation conforme, livre des recettes à l'encaissement pour le micro, exports FEC et Quadra, conformité réforme et accès cabinet gratuit en lecture seule en sont les axes.",
  },
  {
    q: "Deviso remplace-t-il un expert-comptable ?",
    a: "Non. Deviso couvre le quotidien de l'entreprise (devis, factures, achats, exports) et son lien avec le cabinet. Il ne produit pas de bilan ni de liasse fiscale et ne remplace pas le conseil d'un expert-comptable.",
  },
  {
    q: "Pourquoi un outil de plus alors que le marché est déjà encombré ?",
    a: "Parce que, selon nous, deux besoins restent mal couverts : certains outils grand public prennent mal en compte les subtilités propres à chaque statut (recettes au facturé pour le micro, réforme floue), et des plateformes pour cabinets peuvent être lourdes ou onéreuses pour un portefeuille de petits dossiers.",
  },
  {
    q: "Quels points de douleur Deviso règle-t-il concrètement ?",
    a: "La réforme rendue claire, un suivi adapté au statut, un livre des recettes tenu à l'encaissement pour le micro, des exports standardisés et un cockpit cabinet léger pour suivre plusieurs dossiers.",
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
      chapeau="Le marché des outils de facturation déborde, et pourtant les petites entreprises restent mal servies, coincées entre des outils grand public imprécis et des plateformes cabinet trop lourdes. Voici où Deviso se place, et ce qu&rsquo;il ne prétend pas être."
      enBref={[
        "Marché <strong>encombré</strong> côté petites entreprises, avec des acteurs très financés côté cabinets.",
        "Besoins mal couverts, selon nous : réforme floue, livre des recettes <strong>au facturé</strong>, outils qui ignorent le statut.",
        "Deviso fait <strong>une chose bien</strong> : l&rsquo;entreprise, du micro à la société, reliée à un canal expert-comptable léger.",
        "Recettes à l&rsquo;<strong>encaissement</strong> pour le micro, conformité réforme, exports standardisés, cockpit cabinet.",
        "Honnête sur le périmètre : <strong>pas</strong> une comptabilité complète, <strong>pas</strong> un remplaçant de l&rsquo;expert-comptable.",
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
