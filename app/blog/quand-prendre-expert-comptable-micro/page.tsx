import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "quand-prendre-expert-comptable-micro";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "En micro, ce n&rsquo;est pas obligatoire",
    paragraphes: [
      "Disons-le d&rsquo;emblée : un micro-entrepreneur <strong>n&rsquo;a aucune obligation</strong> de prendre un expert-comptable. Le régime est précisément conçu pour être tenu seul, avec un livre des recettes et des déclarations en ligne.",
      "La vraie question n&rsquo;est donc pas « dois-je », mais « à partir de quand est-ce rentable ». Un expert-comptable a un coût ; il faut qu&rsquo;il vous fasse gagner plus, en impôt économisé, en temps, ou en erreurs évitées, qu&rsquo;il ne vous coûte.",
    ],
  },
  {
    type: "liste",
    titre: "Les moments où ça devient utile",
    items: [
      {
        titre: "Vous approchez du régime réel",
        texte:
          "Dès que le réel se profile (charges lourdes, dépassement de plafond), la comptabilité devient trop technique pour être tenue seul.",
      },
      {
        titre: "Vous passez à la TVA",
        texte:
          "Collecter, déduire et déclarer la TVA ajoute une couche où une erreur se paie. Un cadrage en amont évite les faux pas.",
      },
      {
        titre: "Vous embauchez",
        texte:
          "Fiches de paie, cotisations, obligations sociales : c&rsquo;est un métier à part, rarement improvisable.",
      },
      {
        titre: "Vous avez un doute fiscal ou un contrôle",
        texte:
          "Choix de régime, option fiscale, courrier de l&rsquo;administration : l&rsquo;avis d&rsquo;un professionnel sécurise la décision.",
      },
      {
        titre: "Vous vendez ou transformez votre activité",
        texte:
          "Passage en société, cession de clientèle : des opérations où l&rsquo;accompagnement se rentabilise vite.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Ce que vous pouvez garder pour vous",
    texte:
      "Tant que vous restez au micro, en franchise de TVA, sans salarié, l&rsquo;essentiel est à votre portée : tenir le livre des recettes, émettre des factures conformes, déclarer votre CA à l&rsquo;URSSAF. Un bon <strong>outil de facturation</strong> couvre déjà la majeure partie de ces gestes. L&rsquo;expert-comptable prend le relais sur le conseil et les opérations complexes, pas sur la saisie du quotidien.",
  },
  {
    type: "tableau",
    titre: "Faire seul, ou se faire aider",
    colonnes: ["Situation", "Faisable seul", "Expert-comptable conseillé"],
    lignes: [
      ["Facturation et livre des recettes au micro", "Oui", ""],
      ["Déclaration de CA à l&rsquo;URSSAF", "Oui", ""],
      ["Choix du versement libératoire", "Souvent", "En cas de doute"],
      ["Passage à la TVA", "", "Oui"],
      ["Bascule au régime réel", "", "Oui"],
      ["Embauche, cession, passage en société", "", "Oui"],
    ],
  },
  {
    type: "texte",
    titre: "Combien ça coûte, en ordre de grandeur",
    paragraphes: [
      "Pour un micro-entrepreneur, l&rsquo;accompagnement va du <strong>point ponctuel</strong> (une consultation pour trancher une question) à un <strong>suivi annuel léger</strong>. Les honoraires dépendent du cabinet et de l&rsquo;activité, mais l&rsquo;ordre de grandeur reste sans commune mesure avec le suivi complet d&rsquo;une société au réel.",
      "Le calcul à faire est simple : si une heure de conseil vous évite une erreur de régime qui vous aurait coûté plusieurs centaines d&rsquo;euros par an, elle est déjà rentabilisée. Beaucoup de cabinets proposent un premier rendez-vous de cadrage à cet effet.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Le bon réflexe",
    texte:
      "Même sans contrat de suivi, un <strong>point annuel</strong> avec un expert-comptable, au moment de votre déclaration de revenus, suffit souvent à sécuriser vos choix : régime, versement libératoire, seuils de TVA. C&rsquo;est peu coûteux et cela évite les mauvaises surprises.",
  },
];

const FAQ = [
  {
    q: "Un micro-entrepreneur est-il obligé d'avoir un expert-comptable ?",
    a: "Non. Le régime micro est conçu pour être tenu seul, avec un livre des recettes et des déclarations en ligne. L'expert-comptable est un choix, pas une obligation.",
  },
  {
    q: "À partir de quand un expert-comptable devient-il utile en micro ?",
    a: "Quand vous approchez du régime réel, passez à la TVA, embauchez, avez un doute fiscal ou un contrôle, ou transformez votre activité. Ce sont les situations où l'erreur coûte plus cher que le conseil.",
  },
  {
    q: "Que puis-je faire moi-même en micro-entreprise ?",
    a: "Tant que vous restez au micro, en franchise de TVA et sans salarié : tenir le livre des recettes, émettre des factures conformes et déclarer votre CA à l'URSSAF. Un bon outil de facturation couvre déjà l'essentiel.",
  },
  {
    q: "Combien coûte un expert-comptable pour un micro-entrepreneur ?",
    a: "Cela va du point ponctuel au suivi annuel léger, pour un coût sans commune mesure avec le suivi complet d'une société au réel. Le bon calcul est de comparer les honoraires aux erreurs ou impôts qu'ils évitent.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Ordre des experts-comptables, Le rôle de l'expert-comptable",
    url: "https://www.experts-comptables.fr/",
    precision: "missions de conseil et d'accompagnement",
  },
  {
    libelle: "Service-public.gouv.fr, Obligations comptables du micro-entrepreneur",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/R54994",
    precision: "comptabilité allégée du régime micro",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="En micro, l&rsquo;expert-comptable n&rsquo;est pas obligatoire. La bonne question n&rsquo;est pas « dois-je » mais « à partir de quand est-ce rentable ». Voici les moments qui le justifient, et ceux où vous pouvez rester seul."
      enBref={[
        "Aucune <strong>obligation</strong> d&rsquo;expert-comptable en micro-entreprise.",
        "Il devient utile au passage à la <strong>TVA</strong>, au <strong>régime réel</strong>, à l&rsquo;embauche ou lors d&rsquo;un contrôle.",
        "Facturation, livre des recettes et déclaration de CA restent <strong>faisables seul</strong>.",
        "Le coût va du point ponctuel au suivi léger, à comparer aux erreurs évitées.",
        "Bon réflexe : un <strong>point annuel</strong> de cadrage, même sans contrat de suivi.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "L&rsquo;outil pour le quotidien, l&rsquo;expert pour le conseil",
        texte:
          "Deviso gère la facturation, le livre des recettes et les exports comptables. Le jour où vous consultez un expert-comptable, vos chiffres sont déjà propres et transmissibles en un clic.",
      }}
    />
  );
}
