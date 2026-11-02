import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "micro-ou-reel-quand-basculer";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Deux logiques opposées",
    paragraphes: [
      "Le régime <strong>micro</strong> applique un abattement forfaitaire sur vos recettes pour calculer votre bénéfice imposable : 71 %, 50 % ou 34 % selon l&rsquo;activité. Vous ne déduisez aucune charge réelle, mais en échange votre comptabilité se résume au livre des recettes.",
      "Le <strong>régime réel</strong> fait l&rsquo;inverse : vous déduisez vos charges pour de vrai (loyer, matériel, sous-traitance, véhicule), et vous êtes imposé sur le bénéfice qui reste. C&rsquo;est plus juste quand vos charges sont lourdes, mais cela suppose une véritable comptabilité.",
    ],
  },
  {
    type: "comparaison",
    titre: "Micro ou réel, en un coup d&rsquo;oeil",
    colonnes: [
      {
        titre: "Régime micro",
        sousTitre: "Simple, forfaitaire",
        ton: "positif",
        texte:
          "Abattement forfaitaire, livre des recettes, pas de bilan. Idéal quand vos charges sont faibles par rapport à vos recettes. Pas de TVA tant que vous êtes sous les seuils de franchise.",
      },
      {
        titre: "Régime réel",
        sousTitre: "Précis, exigeant",
        ton: "neutre",
        texte:
          "Charges réelles déduites, TVA récupérable, mais comptabilité complète (bilan, compte de résultat, liasse fiscale). Gagnant quand vos charges dépassent l&rsquo;abattement forfaitaire.",
      },
    ],
  },
  {
    type: "texte",
    titre: "La règle de bascule",
    paragraphes: [
      "Le raisonnement tient en une phrase : le réel devient intéressant quand vos <strong>charges réelles dépassent l&rsquo;abattement forfaitaire</strong> du micro. Tant que vos charges sont inférieures, le micro vous fait économiser de l&rsquo;impôt sans effort.",
      "Concrètement, un prestataire BNC bénéficie d&rsquo;un abattement de 34 % : si ses charges réelles représentent moins de 34 % de ses recettes, le micro est plus avantageux. Au-delà, le réel reprend l&rsquo;avantage.",
    ],
  },
  {
    type: "tableau",
    titre: "À partir de quel niveau de charges le réel l&rsquo;emporte",
    intro:
      "Exprimé en part de vos recettes. En dessous, le micro gagne ; au-dessus, le réel devient plus favorable sur l&rsquo;impôt.",
    colonnes: ["Activité", "Abattement micro", "Bascule si charges >"],
    lignes: [
      ["Vente de biens, hébergement", "71 %", "71 % des recettes"],
      ["Prestations de services BIC", "50 %", "50 % des recettes"],
      ["Prestations libérales (BNC)", "34 %", "34 % des recettes"],
    ],
    note:
      "Ce calcul ne porte que sur l&rsquo;impôt. Le réel apporte aussi la récupération de la TVA et la déduction des amortissements, qui peuvent faire pencher la balance plus tôt pour une activité qui investit.",
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le réel, c&rsquo;est une vraie comptabilité",
    texte:
      "Passer au réel, ce n&rsquo;est pas cocher une case : c&rsquo;est tenir une comptabilité d&rsquo;engagement, produire un bilan et une liasse fiscale, et le plus souvent travailler avec un <strong>expert-comptable</strong>. Le gain d&rsquo;impôt doit couvrir ce surcoût et ce temps. Pour beaucoup, le seuil réel de bascule n&rsquo;est pas l&rsquo;arithmétique, mais le moment où l&rsquo;activité est assez grosse pour le justifier.",
  },
  {
    type: "liste",
    titre: "Les signaux qu&rsquo;il faut y réfléchir",
    items: [
      {
        titre: "Vos charges explosent",
        texte:
          "Local, salarié, stock, sous-traitance : si vos dépenses dépassent votre abattement, le micro vous surimpose.",
      },
      {
        titre: "Vous investissez",
        texte:
          "Matériel coûteux, véhicule : au réel, vous amortissez et récupérez la TVA, ce que le micro ne permet pas.",
      },
      {
        titre: "Vous approchez des plafonds",
        texte:
          "Un dépassement durable des plafonds du régime micro bascule de toute façon au réel. Autant l&rsquo;anticiper.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Quelle est la différence entre le régime micro et le régime réel ?",
    a: "Le micro applique un abattement forfaitaire (71 %, 50 % ou 34 %) et se limite au livre des recettes. Le réel déduit les charges réelles et récupère la TVA, mais impose une comptabilité complète avec bilan et liasse fiscale.",
  },
  {
    q: "Quand faut-il passer au régime réel ?",
    a: "Quand vos charges réelles dépassent l'abattement forfaitaire du micro. Par exemple, pour un prestataire BNC (abattement 34 %), le réel devient avantageux dès que les charges dépassent 34 % des recettes.",
  },
  {
    q: "Le passage au réel est-il obligatoire à un moment ?",
    a: "Oui. Un dépassement durable des plafonds du régime micro entraîne le passage au régime réel. On peut aussi y opter volontairement.",
  },
  {
    q: "Ai-je besoin d'un expert-comptable au régime réel ?",
    a: "Ce n'est pas obligatoire, mais le réel suppose une comptabilité d'engagement, un bilan et une liasse fiscale. La plupart des entrepreneurs au réel travaillent avec un expert-comptable.",
  },
  {
    q: "Le réel permet-il de récupérer la TVA ?",
    a: "Oui, dès lors que vous êtes assujetti à la TVA, vous déduisez celle payée sur vos achats, ce que le régime micro en franchise ne permet pas.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Régimes d&rsquo;imposition des bénéfices",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32917",
    precision: "micro, réel simplifié et réel normal",
  },
  {
    libelle: "Service-public.gouv.fr, Régime fiscal de la micro-entreprise",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32353",
    precision: "abattements forfaitaires de 71 %, 50 % et 34 %",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le micro applique un abattement forfaitaire, le réel déduit vos charges pour de vrai. La bascule tient à une question simple : vos charges dépassent-elles votre abattement ? Et à une autre, moins visible : le jeu en vaut-il la chandelle ?"
      enBref={[
        "Micro : abattement forfaitaire (<strong>71 / 50 / 34 %</strong>), livre des recettes, pas de bilan.",
        "Réel : charges réelles déduites, TVA récupérable, mais <strong>comptabilité complète</strong>.",
        "Le réel l&rsquo;emporte quand vos <strong>charges dépassent l&rsquo;abattement</strong> de votre activité.",
        "Le réel apporte aussi <strong>amortissements et récupération de TVA</strong>, utiles si vous investissez.",
        "Au-delà de l&rsquo;impôt, le réel suppose un vrai suivi comptable, souvent avec un <strong>expert-comptable</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Tant que vous êtes au micro, gardez-le simple",
        texte:
          "Deviso couvre toute la facturation et le livre des recettes du régime micro. Et le jour où le réel s&rsquo;impose, vos données sont déjà propres à transmettre à votre expert-comptable.",
      }}
    />
  );
}
