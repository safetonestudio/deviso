import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "calendrier-fiscal-social-micro";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Une année rythmée par quelques rendez-vous",
    paragraphes: [
      "La force du régime micro, c&rsquo;est que son calendrier tient sur une main. Quelques échéances reviennent, toujours les mêmes, et le reste du temps vous travaillez. Encore faut-il les connaître pour ne pas les découvrir en retard, avec la pénalité au bout.",
      "Voici les rendez-vous d&rsquo;une année type. Les dates précises varient d&rsquo;une année sur l&rsquo;autre : retenez le <strong>rythme</strong>, et vérifiez chaque échéance sur votre espace en ligne.",
    ],
  },
  {
    type: "tableau",
    titre: "Les rendez-vous récurrents",
    intro:
      "Selon votre situation, certains ne vous concernent pas (la TVA tant que vous êtes en franchise, par exemple).",
    colonnes: ["Échéance", "Quand", "Qui est concerné"],
    lignes: [
      ["Déclaration de CA à l&rsquo;URSSAF", "Chaque mois ou trimestre", "Tous"],
      ["Déclaration de revenus", "Au printemps", "Tous"],
      ["Cotisation foncière (CFE)", "Mi-décembre", "Tous, sauf 1re année"],
      ["Déclaration de TVA (CA12 ou CA3)", "Selon le régime", "Assujettis à la TVA"],
      ["Option / renonciation (régime, versement libératoire)", "Avant le 30 septembre", "Selon les choix"],
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Les deux dates qui changent chaque année",
    texte:
      "La <strong>déclaration de revenus</strong> s&rsquo;ouvre au printemps, avec une date limite qui dépend de votre département. La <strong>CFE</strong> est à régler à la mi-décembre, l&rsquo;avis étant à consulter en ligne (il n&rsquo;est pas envoyé par courrier). Ces deux-là, notez-les dès qu&rsquo;elles sont publiées.",
  },
  {
    type: "liste",
    titre: "Les échéances à ne pas rater",
    items: [
      {
        titre: "Votre déclaration de CA",
        texte:
          "Mensuelle ou trimestrielle, elle conditionne vos cotisations. Un oubli, même à zéro, déclenche une pénalité.",
      },
      {
        titre: "Le 30 septembre pour vos options",
        texte:
          "Changer de périodicité, opter pour ou renoncer au versement libératoire : tout cela se joue avant le 30 septembre pour l&rsquo;année suivante.",
      },
      {
        titre: "La CFE de mi-décembre",
        texte:
          "Pas d&rsquo;avis papier : c&rsquo;est à vous d&rsquo;aller le chercher dans votre espace professionnel.",
      },
      {
        titre: "Vos échéances de TVA",
        texte:
          "Si vous êtes assujetti, la CA12 annuelle avec acomptes, ou la CA3 mensuelle, selon votre régime.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Ce qui tombe même sans activité",
    texte:
      "Deux choses ne dépendent pas de votre chiffre d&rsquo;affaires. La <strong>déclaration de CA</strong> est due même à zéro. Et la <strong>CFE</strong>, après l&rsquo;exonération de première année, reste due chaque année tant que l&rsquo;entreprise existe, même en sommeil, sauf cotisation minimale ajustée aux faibles revenus. Ne comptez pas sur l&rsquo;absence d&rsquo;activité pour qu&rsquo;elles disparaissent.",
  },
];

const FAQ = [
  {
    q: "Quelles sont les principales échéances d'un micro-entrepreneur dans l'année ?",
    a: "La déclaration de chiffre d'affaires à l'URSSAF (mensuelle ou trimestrielle), la déclaration de revenus au printemps, la cotisation foncière des entreprises (CFE) à la mi-décembre, et les déclarations de TVA si vous êtes assujetti.",
  },
  {
    q: "Quand payer la CFE en micro-entreprise ?",
    a: "À la mi-décembre. L'avis n'est pas envoyé par courrier : il faut le consulter dans votre espace professionnel. La première année civile de création est exonérée.",
  },
  {
    q: "Jusqu'à quand changer d'option fiscale ou sociale ?",
    a: "Avant le 30 septembre pour une application au 1er janvier suivant : c'est le cas du changement de périodicité de déclaration et de l'option ou de la renonciation au versement libératoire.",
  },
  {
    q: "Dois-je déclarer même si je n'ai pas eu d'activité ?",
    a: "Oui pour la déclaration de CA, à faire même à zéro. La CFE reste également due chaque année après la première, même en l'absence d'activité, sauf aménagement pour les très faibles revenus.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Urssaf, Les échéances du micro-entrepreneur",
    url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil/gerer-mon-auto-entreprise/declarer-mon-chiffre-daffaires.html",
    precision: "périodicité et dates de déclaration de CA",
  },
  {
    libelle: "Service-public.gouv.fr, Cotisation foncière des entreprises (CFE)",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23547",
    precision: "exonération de première année et paiement en décembre",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le calendrier du micro tient sur une main : déclaration de CA, déclaration de revenus, CFE, et la TVA pour les assujettis. Le tour des rendez-vous de l&rsquo;année, et de ceux qui tombent même sans activité."
      enBref={[
        "Déclaration de CA à l&rsquo;URSSAF <strong>chaque mois ou trimestre</strong>, due même à zéro.",
        "Déclaration de revenus au <strong>printemps</strong>, date selon le département.",
        "<strong>CFE à la mi-décembre</strong>, sans avis papier, exonérée la 1re année.",
        "Options (régime, versement libératoire) à changer avant le <strong>30 septembre</strong>.",
        "La CFE reste due chaque année après la première, <strong>même en sommeil</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Votre CA prêt à chaque échéance",
        texte:
          "Deviso totalise votre chiffre d&rsquo;affaires encaissé en continu : quand une déclaration arrive, le montant est déjà là, par période et par catégorie.",
      }}
    />
  );
}
