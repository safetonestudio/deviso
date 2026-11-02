import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "declarer-chiffre-affaires-urssaf";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Déclarer, même quand vous n&rsquo;avez rien encaissé",
    paragraphes: [
      "En micro-entreprise, vos cotisations sociales sont calculées sur le chiffre d&rsquo;affaires que vous <strong>déclarez à l&rsquo;URSSAF</strong>, chaque mois ou chaque trimestre. Pas de recettes ? Vous déclarez quand même, en indiquant un montant de <strong>zéro</strong>. Oublier une déclaration, même vide, déclenche une pénalité.",
      "Comme le livre des recettes, la déclaration porte sur ce que vous avez <strong>encaissé</strong> sur la période, pas sur ce que vous avez facturé. Les deux doivent coïncider au centime près.",
    ],
  },
  {
    type: "tableau",
    titre: "Ce que vous payez sur ce que vous déclarez (2026)",
    intro:
      "Le taux dépend de votre catégorie d&rsquo;activité. Il s&rsquo;applique directement au chiffre d&rsquo;affaires déclaré, sans abattement.",
    colonnes: ["Activité", "Cotisations", "+ Formation (CFP)"],
    lignes: [
      ["Vente de marchandises", "12,3 %", "+ 0,1 %"],
      ["Prestations de services commerciales (BIC)", "21,2 %", "+ 0,1 %"],
      ["Prestations artisanales (BIC)", "21,2 %", "+ 0,3 %"],
      ["Prestations et libéral, régime général (BNC)", "<strong>25,6 %</strong>", "+ 0,2 %"],
      ["Professions libérales Cipav (BNC)", "23,2 %", "+ 0,2 %"],
    ],
    note:
      "Le taux du régime général (BNC) a augmenté par étapes pour atteindre 25,6 % en 2026. Les commerçants et artisans ajoutent en outre une taxe pour frais de chambre consulaire.",
  },
  {
    type: "texte",
    titre: "Mensuel ou trimestriel : à vous de choisir",
    paragraphes: [
      "Par défaut, la déclaration est <strong>mensuelle</strong>. Vous pouvez opter pour le <strong>trimestriel</strong>, qui réduit le nombre de démarches mais concentre le paiement sur quatre échéances plus lourdes. Le choix se fait à la création, puis se modifie une fois par an.",
      "La première déclaration est décalée : vous disposez d&rsquo;un délai de carence après la création avant la première échéance. Au-delà, le rythme est régulier, et c&rsquo;est le respect des dates qui compte.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "L&rsquo;ACRE, si vous débutez",
    texte:
      "L&rsquo;ACRE réduit vos cotisations en début d&rsquo;activité. Depuis le 1er juillet 2026, l&rsquo;exonération est de <strong>25 %</strong> des cotisations (contre 50 % auparavant), sur la première année et sous conditions. Vos taux sont donc temporairement abaissés d&rsquo;un quart : pensez à vérifier qu&rsquo;elle est bien appliquée sur vos premières déclarations.",
  },
  {
    type: "liste",
    titre: "Les erreurs qui coûtent cher",
    items: [
      {
        titre: "Déclarer le facturé au lieu de l&rsquo;encaissé",
        texte:
          "Votre déclaration doit refléter ce que vous avez réellement reçu sur la période, comme votre livre des recettes.",
      },
      {
        titre: "Oublier une déclaration, même à zéro",
        texte:
          "L&rsquo;absence de déclaration entraîne une pénalité par déclaration manquante, et un risque de taxation d&rsquo;office.",
      },
      {
        titre: "Ne pas vérifier l&rsquo;ACRE",
        texte:
          "Si l&rsquo;exonération n&rsquo;est pas appliquée alors que vous y avez droit, vous payez plein tarif sans vous en rendre compte.",
      },
      {
        titre: "Confondre cotisations et impôt",
        texte:
          "La déclaration URSSAF concerne vos cotisations sociales. L&rsquo;impôt sur le revenu suit un autre circuit, sauf si vous avez opté pour le versement libératoire.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Dois-je déclarer mon chiffre d'affaires même si je n'ai rien encaissé ?",
    a: "Oui. Vous déclarez un montant de zéro. L'absence de déclaration, même vide, déclenche une pénalité par déclaration manquante.",
  },
  {
    q: "Quels sont les taux de cotisations URSSAF en 2026 ?",
    a: "12,3 % pour la vente de marchandises, 21,2 % pour les prestations de services BIC, 25,6 % pour les prestations et activités libérales du régime général, et 23,2 % pour les professions libérales affiliées à la Cipav, auxquels s'ajoute une petite contribution à la formation.",
  },
  {
    q: "La déclaration est-elle mensuelle ou trimestrielle ?",
    a: "Mensuelle par défaut. Vous pouvez opter pour le trimestriel, qui réduit le nombre de démarches mais regroupe le paiement sur quatre échéances. Le choix se modifie une fois par an.",
  },
  {
    q: "Qu'est-ce que l'ACRE et combien réduit-elle mes cotisations en 2026 ?",
    a: "L'ACRE est une exonération partielle de cotisations en début d'activité. Depuis le 1er juillet 2026, elle est de 25 % des cotisations sur la première année, sous conditions, contre 50 % auparavant.",
  },
  {
    q: "Déclare-t-on le chiffre d'affaires encaissé ou facturé ?",
    a: "Encaissé. La déclaration porte sur les sommes réellement reçues sur la période, exactement comme le livre des recettes, et les deux doivent coïncider.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Urssaf, Déclarer et payer mes cotisations (auto-entrepreneur)",
    url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil/gerer-mon-auto-entreprise/declarer-mon-chiffre-daffaires.html",
    precision: "périodicité, déclaration à zéro et taux de cotisations",
  },
  {
    libelle: "Service-public.gouv.fr, Cotisations du micro-entrepreneur et ACRE",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23267",
    precision: "assiette, taux et exonération de début d&rsquo;activité",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Chaque mois ou chaque trimestre, vous déclarez à l&rsquo;URSSAF ce que vous avez encaissé, et vous payez vos cotisations dessus. Les taux 2026, la bonne périodicité, l&rsquo;ACRE, et les oublis qui coûtent cher."
      enBref={[
        "On déclare l&rsquo;<strong>encaissé</strong>, pas le facturé, et on déclare <strong>même à zéro</strong>.",
        "Taux 2026 : <strong>12,3 %</strong> (vente), <strong>21,2 %</strong> (services BIC), <strong>25,6 %</strong> (libéral), 23,2 % (Cipav).",
        "Déclaration <strong>mensuelle</strong> par défaut, ou trimestrielle sur option.",
        "L&rsquo;<strong>ACRE</strong> réduit les cotisations de 25 % la première année depuis le 1er juillet 2026.",
        "Une déclaration oubliée, même vide, entraîne une <strong>pénalité</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Votre CA à déclarer, déjà calculé",
        texte:
          "Deviso totalise votre chiffre d&rsquo;affaires encaissé par période et par catégorie : au moment de déclarer à l&rsquo;URSSAF, vous n&rsquo;avez plus qu&rsquo;à recopier les montants.",
      }}
    />
  );
}
