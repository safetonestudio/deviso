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
      "Voici les rendez-vous d&rsquo;une année type. Les dates précises varient d&rsquo;une année sur l&rsquo;autre : retenez le <strong>rythme</strong>, et vérifiez chaque échéance sur votre espace en ligne.",
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
      ["Cotisation foncière (CFE)", "15 décembre", "Tous, sauf année de création et CA N-2 jusqu&rsquo;à 5 000 €"],
      ["Déclaration de TVA (CA12 ou CA3)", "Selon le régime", "Assujettis à la TVA"],
      ["Option / renonciation au versement libératoire", "Avant le 30 septembre", "Selon les choix"],
      ["Changement de périodicité de déclaration", "Avant le 31 octobre", "Selon les choix"],
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
          "Opter pour le versement libératoire ou y renoncer se joue avant le 30 septembre pour l&rsquo;année suivante. Changer de périodicité de déclaration, avant le 31 octobre.",
      },
      {
        titre: "La CFE de mi-décembre",
        texte:
          "Pas d&rsquo;avis papier : c&rsquo;est à vous d&rsquo;aller le chercher dans votre espace professionnel.",
      },
      {
        titre: "Vos échéances de TVA",
        texte:
          "Si vous êtes assujetti, la CA12 annuelle avec acomptes, ou la CA3 mensuelle, selon votre régime. Le régime simplifié étant supprimé au 1<sup>er</sup> janvier 2027, ce sera ensuite la CA3 pour tous, trimestrielle tant que le chiffre d&rsquo;affaires ne dépasse pas 1 000 000 €.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Ce qui tombe même sans activité",
    texte:
      "Deux choses ne dépendent pas de votre chiffre d&rsquo;affaires. La <strong>déclaration de CA</strong> est due même à zéro. Et la <strong>CFE</strong>, après l&rsquo;exonération de l&rsquo;année de création, est due chaque année, même sans activité, sauf si votre chiffre d&rsquo;affaires de l&rsquo;avant-dernière année (N-2) n&rsquo;a pas dépassé <strong>5 000 €</strong> : vous en êtes alors exonéré. Ne comptez pas sur l&rsquo;absence d&rsquo;activité pour que la déclaration disparaisse.",
  },
];

const FAQ = [
  {
    q: "Quelles sont les principales échéances d'un micro-entrepreneur dans l'année ?",
    a: "La déclaration de chiffre d'affaires à l'URSSAF (mensuelle ou trimestrielle), la déclaration de revenus au printemps, la cotisation foncière des entreprises (CFE) à la mi-décembre, et les déclarations de TVA si vous êtes assujetti.",
  },
  {
    q: "Quand payer la CFE en micro-entreprise ?",
    a: "Au plus tard le 15 décembre. L'avis n'est pas envoyé par courrier : il faut le consulter dans votre espace professionnel. L'année de création est exonérée, et la base est réduite de moitié l'année suivante. Vous êtes aussi exonéré si votre chiffre d'affaires de l'année N-2 n'a pas dépassé 5 000 €.",
  },
  {
    q: "Jusqu'à quand changer d'option fiscale ou sociale ?",
    a: "Avant le 30 septembre pour une application au 1er janvier suivant pour l'option ou la renonciation au versement libératoire. Pour changer de périodicité de déclaration, la demande est à faire avant le 31 octobre de l'année précédente.",
  },
  {
    q: "Dois-je déclarer même si je n'ai pas eu d'activité ?",
    a: "Oui pour la déclaration de CA, à faire même à zéro. La CFE reste également due chaque année après l'année de création, même en l'absence d'activité, sauf si votre chiffre d'affaires de l'année N-2 n'a pas dépassé 5 000 €.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Micro-entrepreneur : quand déclarer son chiffre d'affaires ?",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23257",
    precision: "périodicité, dates de déclaration de CA et changement de périodicité avant le 31 octobre",
  },
  {
    libelle: "Impots.gouv.fr, Le régime simplifié d'imposition à la TVA est supprimé à compter du 1er janvier 2027",
    url: "https://www.impots.gouv.fr/actualite/le-regime-simplifie-dimposition-la-tva-est-supprime-compter-du-1er-janvier-2027",
    precision: "passage à la CA3 trimestrielle ou mensuelle à compter de 2027",
  },
  {
    libelle: "Service-public.gouv.fr, Cotisation foncière des entreprises (CFE)",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23547",
    precision: "exonération l'année de création, exonération si CA N-2 jusqu'à 5 000 €, paiement au 15 décembre",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le calendrier du micro tient sur une main : déclaration de CA, déclaration de revenus, CFE, et la TVA pour les assujettis. Le tour des rendez-vous de l&rsquo;année, et de ceux qui tombent même sans activité."
      enBref={[
        "Déclaration de CA à l&rsquo;URSSAF <strong>chaque mois ou trimestre</strong>, due même à zéro.",
        "Déclaration de revenus au <strong>printemps</strong>, date selon le département.",
        "<strong>CFE au 15 décembre</strong>, sans avis papier, exonérée l&rsquo;année de création.",
        "Versement libératoire à choisir avant le <strong>30 septembre</strong>, périodicité avant le <strong>31 octobre</strong>.",
        "La CFE reste due chaque année après la création, <strong>même sans activité</strong>, sauf CA N-2 jusqu&rsquo;à 5 000 €.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Votre CA prêt à chaque échéance",
        texte:
          "Deviso totalise votre chiffre d&rsquo;affaires encaissé en continu : quand une déclaration arrive, le montant est déjà là, par période et par catégorie. Si votre entreprise passe un jour au régime réel ou en société, vous changez son statut dans Deviso, qui adapte alors le tableau de bord, la TVA et les exports FEC et Quadra.",
      }}
    />
  );
}
