import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "cfe-cotisation-fonciere-entreprises";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "La CFE, c&rsquo;est quoi&nbsp;?",
    paragraphes: [
      "La <strong>cotisation foncière des entreprises</strong> (CFE) est un impôt local, perçu par la commune où vous exercez. Elle concerne toute personne qui exerce une activité professionnelle non salariée de façon habituelle au 1<sup>er</sup> janvier de l&rsquo;année&nbsp;: sociétés, entreprises individuelles au réel, et micro-entrepreneurs compris.",
      "Elle est calculée sur la <strong>valeur locative des locaux</strong> que vous utilisez pour votre activité. Et c&rsquo;est là que beaucoup d&rsquo;entreprises sont surprises&nbsp;: même sans local, en travaillant chez soi ou depuis une adresse de domiciliation, une <strong>cotisation minimum</strong> reste due.",
    ],
  },
  {
    type: "tableau",
    titre: "Les premières années",
    colonnes: ["Année", "Ce qui s&rsquo;applique"],
    lignes: [
      ["Année de création", "<strong>Pas de CFE</strong>, de plein droit"],
      ["Année suivante", "Base réduite de <strong>moitié</strong>"],
      ["Années suivantes", "CFE complète"],
    ],
    note:
      "Le chiffre d&rsquo;affaires retenu pour la cotisation minimum est celui de l&rsquo;avant-dernière année (N-2), ou celui de la première année pour une entreprise toute récente.",
  },
  {
    type: "texte",
    titre: "Sans local : la cotisation minimum",
    paragraphes: [
      "Quand la valeur locative de vos locaux est faible ou nulle, le fisc applique une <strong>base minimum</strong>. Chaque commune la fixe dans une fourchette prévue par la loi, qui dépend de votre chiffre d&rsquo;affaires&nbsp;: plus il est élevé, plus le plafond de la fourchette monte. La cotisation à payer est ensuite cette base multipliée par le taux voté par la commune.",
      "Conséquence pratique&nbsp;: deux entreprises au même chiffre d&rsquo;affaires, l&rsquo;une dans une petite commune, l&rsquo;autre dans une grande ville, peuvent payer des montants très différents. Les fourchettes changent chaque année&nbsp;; la fiche officielle de service-public.fr donne les montants en vigueur.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Moins de 5 000 € de chiffre d&rsquo;affaires : pas de cotisation minimum",
    texte:
      "Si votre chiffre d&rsquo;affaires ou vos recettes ne dépassent pas <strong>5 000 €</strong> sur l&rsquo;année de référence, vous n&rsquo;êtes pas soumis à la cotisation minimum. Une activité qui démarre doucement ne paie donc rien à ce titre.",
  },
  {
    type: "liste",
    titre: "D&rsquo;autres cas d&rsquo;exonération",
    items: [
      {
        titre: "Certaines activités",
        texte:
          "La loi exonère certaines professions, par exemple des activités artistiques ou d&rsquo;enseignement. La liste complète et ses conditions figurent sur service-public.fr.",
      },
      {
        titre: "Les décisions locales",
        texte:
          "Les communes peuvent voter des exonérations temporaires, notamment pour une création d&rsquo;établissement, ou dans certaines zones. Il faut parfois en faire la demande.",
      },
      {
        titre: "Le plafonnement",
        texte:
          "Pour les entreprises dont la CFE pèse lourd par rapport à leur valeur ajoutée, un dégrèvement est possible sur demande.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "L&rsquo;avis n&rsquo;arrive pas par la poste",
    texte:
      "L&rsquo;avis de CFE n&rsquo;est disponible <strong>que dans votre espace professionnel</strong> sur impots.gouv.fr, généralement début novembre (le 2 novembre en 2026). Le paiement est attendu au plus tard le <strong>15 décembre</strong>, uniquement par moyen dématérialisé (paiement en ligne ou prélèvement). Sans espace professionnel, vous ne verrez pas l&rsquo;avis, mais l&rsquo;échéance court quand même, et un retard entraîne une majoration.",
  },
  {
    type: "liste",
    titre: "Ce qu&rsquo;il faut faire maintenant",
    items: [
      {
        titre: "Créer ou ouvrir votre espace professionnel",
        texte:
          "Sur impots.gouv.fr. C&rsquo;est là que se trouve votre avis de CFE, et que vous pouvez payer.",
      },
      {
        titre: "Vérifier l&rsquo;avis",
        texte:
          "Base retenue, exonération de création, base minimum appliquée ou non&nbsp;: une erreur se conteste auprès de votre service des impôts des entreprises.",
      },
      {
        titre: "Payer au plus tard le 15 décembre",
        texte:
          "Ou, pour une CFE de 3 000 € ou moins, opter pour le prélèvement mensuel, qui lisse la dépense : l&rsquo;option est possible jusqu&rsquo;au 30 juin pour l&rsquo;année en cours, jusqu&rsquo;au 30 novembre pour le prélèvement à l&rsquo;échéance (Service-Public, au 27 novembre 2026).",
      },
      {
        titre: "L&rsquo;intégrer à votre trésorerie",
        texte:
          "La CFE tombe en fin d&rsquo;année, au moment où d&rsquo;autres échéances s&rsquo;accumulent. La prévoir dès le printemps évite la mauvaise surprise.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Un micro-entrepreneur doit-il payer la CFE ?",
    a: "Oui, sauf exonération. Il n'en paie pas l'année de création, sa base est réduite de moitié l'année suivante, et il n'est pas soumis à la cotisation minimum si son chiffre d'affaires ne dépasse pas 5 000 €.",
  },
  {
    q: "Je travaille chez moi, dois-je payer la CFE ?",
    a: "Oui en principe : sans local professionnel, une cotisation minimum s'applique, fixée par votre commune selon votre chiffre d'affaires.",
  },
  {
    q: "Quand faut-il payer la CFE ?",
    a: "Au plus tard le 15 décembre, par paiement en ligne ou prélèvement. L'avis est consultable uniquement dans l'espace professionnel sur impots.gouv.fr.",
  },
  {
    q: "Combien coûte la CFE ?",
    a: "Cela dépend de la valeur locative de vos locaux, ou à défaut de la base minimum votée par votre commune et de son taux. Les fourchettes de la base minimum dépendent du chiffre d'affaires et sont publiées chaque année sur service-public.fr.",
  },
  {
    q: "Paie-t-on la CFE l'année de création ?",
    a: "Non. L'entreprise n'est pas redevable de la CFE l'année de sa création, et sa base est réduite de moitié l'année suivante.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Cotisation foncière des entreprises (CFE)",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23547",
    precision: "redevables, calcul, base minimum, paiement",
  },
  {
    libelle: "Service-public.gouv.fr, Un micro-entrepreneur doit-il payer la CFE",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23999",
    precision: "cas du micro-entrepreneur, seuil de 5 000 €",
  },
  {
    libelle: "Bercy Infos Entreprises, la CFE",
    url: "https://www.economie.gouv.fr/node/36981",
    precision: "exonérations et base minimum",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Chaque fin d&rsquo;année, de nombreuses entreprises, sociétés comme indépendants, découvrent la CFE, souvent après l&rsquo;échéance&nbsp;: l&rsquo;avis n&rsquo;arrive pas par la poste. Qui la paie, combien, quelles exonérations, et ce qu&rsquo;il faut faire avant le 15 décembre."
      enBref={[
        "La CFE concerne <strong>toutes les entreprises</strong>, micro-entrepreneurs compris, même sans local.",
        "<strong>Pas de CFE l&rsquo;année de création</strong>, puis une base réduite de moitié l&rsquo;année suivante.",
        "Sous <strong>5 000 €</strong> de chiffre d&rsquo;affaires, pas de cotisation minimum.",
        "L&rsquo;avis est <strong>uniquement en ligne</strong>, dans l&rsquo;espace professionnel sur impots.gouv.fr.",
        "Paiement au plus tard le <strong>15 décembre</strong>, en ligne ou par prélèvement.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Vos échéances, sans surprise",
        texte:
          "Deviso suit votre chiffre d&rsquo;affaires encaissé, votre TVA et vos échéances de déclaration selon votre statut. De quoi piloter votre trésorerie jusqu&rsquo;à la fin de l&rsquo;année, CFE comprise si vous la prévoyez.",
      }}
    />
  );
}
