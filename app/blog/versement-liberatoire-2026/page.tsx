import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "versement-liberatoire-2026";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Payer son impôt en même temps que ses cotisations",
    paragraphes: [
      "Le <strong>versement libératoire</strong> est une option : au lieu de régler votre impôt sur le revenu l&rsquo;année suivante via le barème progressif, vous le payez au fil de l&rsquo;eau, en même temps que vos cotisations URSSAF, sous forme d&rsquo;un petit pourcentage de votre chiffre d&rsquo;affaires.",
      "L&rsquo;intérêt est double : la trésorerie est lissée, et l&rsquo;impôt est <strong>soldé</strong> pour ces revenus, sans régularisation. L&rsquo;inconvénient est réel aussi, et c&rsquo;est tout l&rsquo;objet de cet article : ce n&rsquo;est pas intéressant pour tout le monde.",
    ],
  },
  {
    type: "tableau",
    titre: "Les taux 2026",
    intro:
      "Ils s&rsquo;ajoutent à vos cotisations sociales et s&rsquo;appliquent au chiffre d&rsquo;affaires hors taxes.",
    colonnes: ["Activité", "Taux"],
    lignes: [
      ["Vente de marchandises et hébergement", "<strong>1 %</strong>"],
      ["Prestations de services BIC", "<strong>1,7 %</strong>"],
      ["Prestations de services et professions libérales (BNC)", "<strong>2,2 %</strong>"],
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Une condition de revenu à ne pas rater",
    texte:
      "Le versement libératoire n&rsquo;est ouvert que si votre <strong>revenu fiscal de référence</strong> ne dépasse pas <strong>29 315 € par part</strong> de quotient familial. Pour une application en 2026, c&rsquo;est le RFR de 2024 (avis d&rsquo;impôt 2025) qui compte. Un couple avec deux enfants (3 parts) a ainsi un plafond de 87 945 €.",
  },
  {
    type: "comparaison",
    titre: "Avec ou sans : lequel pour vous",
    colonnes: [
      {
        titre: "Avec versement libératoire",
        sousTitre: "Intéressant si vous êtes imposable",
        ton: "positif",
        texte:
          "Impôt lissé sur l&rsquo;année, soldé pour ces revenus, sans régularisation. Avantageux dès que votre taux moyen d&rsquo;imposition dépasse le petit pourcentage prélevé.",
      },
      {
        titre: "Sans versement libératoire",
        sousTitre: "Mieux si vous n&rsquo;êtes pas (ou peu) imposable",
        ton: "neutre",
        texte:
          "Vous restez au barème progressif, avec l&rsquo;abattement du régime micro. Si vous n&rsquo;êtes pas imposable, vous ne payez rien : le versement libératoire vous ferait au contraire payer un impôt que vous ne deviez pas.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Le piège classique : payer un impôt qu&rsquo;on ne devait pas",
    paragraphes: [
      "Le versement libératoire se prélève <strong>dès le premier euro</strong> de chiffre d&rsquo;affaires. Si vos revenus sont faibles et que vous n&rsquo;êtes pas imposable au barème, vous auriez payé zéro d&rsquo;impôt : avec l&rsquo;option, vous versez 1 %, 1,7 % ou 2,2 % pour rien, et sans possibilité de les récupérer.",
      "La règle simple : le versement libératoire est intéressant quand votre <strong>taux moyen d&rsquo;imposition</strong> est supérieur au taux du versement. En dessous, il vous coûte de l&rsquo;argent. En cas de doute, un rapide calcul avec votre dernier avis d&rsquo;impôt, ou l&rsquo;avis d&rsquo;un expert-comptable, tranche la question.",
    ],
  },
  {
    type: "liste",
    titre: "Comment opter, et quand",
    items: [
      {
        titre: "À la création",
        texte:
          "La demande se fait au plus tard le dernier jour du 3e mois suivant la création.",
      },
      {
        titre: "En cours d&rsquo;activité",
        texte:
          "La demande doit parvenir à l&rsquo;URSSAF avant le 30 septembre pour une application au 1er janvier suivant.",
      },
      {
        titre: "Pour renoncer",
        texte:
          "Même logique : la renonciation avant le 30 septembre prend effet l&rsquo;année suivante.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Qu'est-ce que le versement libératoire de l'impôt ?",
    a: "C'est une option qui permet de payer son impôt sur le revenu au fil de l'eau, en même temps que ses cotisations URSSAF, sous forme d'un pourcentage du chiffre d'affaires, au lieu d'être imposé au barème progressif l'année suivante.",
  },
  {
    q: "Quels sont les taux du versement libératoire en 2026 ?",
    a: "1 % pour la vente de marchandises et l'hébergement, 1,7 % pour les prestations de services BIC, et 2,2 % pour les prestations de services et professions libérales relevant des BNC.",
  },
  {
    q: "Quelle est la condition de revenu pour y avoir droit ?",
    a: "Le revenu fiscal de référence ne doit pas dépasser 29 315 € par part de quotient familial. Pour une application en 2026, on retient le RFR de 2024, figurant sur l'avis d'impôt 2025.",
  },
  {
    q: "Le versement libératoire est-il toujours avantageux ?",
    a: "Non. Il se prélève dès le premier euro. Si vous n'êtes pas imposable, il vous fait payer un impôt que vous ne deviez pas, sans possibilité de le récupérer. Il n'est intéressant que si votre taux moyen d'imposition dépasse le taux du versement.",
  },
  {
    q: "Quand faut-il opter pour le versement libératoire ?",
    a: "À la création, au plus tard le dernier jour du 3e mois suivant celle-ci. En cours d'activité, la demande doit parvenir à l'URSSAF avant le 30 septembre pour une application au 1er janvier suivant.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Urssaf, Le versement libératoire de l'impôt sur le revenu",
    url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/questions-sur-mes-impots.html",
    precision: "taux, plafond de RFR et délais d'option 2026",
  },
  {
    libelle: "Service-public.gouv.fr, Impôt sur le revenu du micro-entrepreneur",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23267",
    precision: "versement libératoire et barème progressif",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Payer son impôt au fil de l&rsquo;eau, en même temps que ses cotisations : séduisant, mais pas pour tout le monde. Les taux 2026, la condition de revenu, et la question qui décide : êtes-vous imposable ?"
      enBref={[
        "Le versement libératoire solde votre impôt via un <strong>% du chiffre d&rsquo;affaires</strong>, prélevé avec vos cotisations.",
        "Taux 2026 : <strong>1 %</strong> (vente), <strong>1,7 %</strong> (services BIC), <strong>2,2 %</strong> (BNC).",
        "Réservé si votre RFR ne dépasse pas <strong>29 315 € par part</strong> (RFR 2024 pour 2026).",
        "Il se prélève dès le 1er euro : <strong>inutile, voire perdant</strong>, si vous n&rsquo;êtes pas imposable.",
        "On opte à la création, ou avant le <strong>30 septembre</strong> pour l&rsquo;année suivante.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Votre chiffre d&rsquo;affaires sous les yeux pour décider",
        texte:
          "Deviso suit votre CA encaissé par catégorie en temps réel : de quoi estimer l&rsquo;impact du versement libératoire avant d&rsquo;opter, et le réévaluer chaque année.",
      }}
    />
  );
}
