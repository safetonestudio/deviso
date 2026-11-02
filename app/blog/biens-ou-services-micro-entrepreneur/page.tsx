import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "biens-ou-services-micro-entrepreneur";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Une case à cocher qui décide de ce que vous payez",
    paragraphes: [
      "En micro-entreprise, chaque recette est soit une <strong>vente de biens</strong>, soit une <strong>prestation de services</strong>. Ce n&rsquo;est pas une subtilité administrative : c&rsquo;est elle qui fixe votre taux de cotisations, votre abattement fiscal, votre plafond de chiffre d&rsquo;affaires et le seuil au-delà duquel vous facturez la TVA.",
      "Deux micro-entrepreneurs qui encaissent le même montant ne paient pas la même chose selon la catégorie de leur activité. Mal se classer, c&rsquo;est payer trop, ou pas assez et devoir régulariser.",
    ],
  },
  {
    type: "tableau",
    titre: "Les trois familles, et ce qui change pour chacune",
    intro:
      "Les chiffres ci-dessous sont ceux de 2026. Les taux de cotisations sont les taux URSSAF de droit commun, hors ACRE.",
    colonnes: ["", "Vente de biens", "Services BIC", "Services BNC / libéral"],
    lignes: [
      ["Exemples", "Achat-revente, hébergement", "Artisan, prestation commerciale", "Conseil, formation, création"],
      ["Cotisations sociales", "<strong>12,3 %</strong>", "<strong>21,2 %</strong>", "<strong>25,6 %</strong> (23,2 % Cipav)"],
      ["Abattement fiscal", "71 %", "50 %", "34 %"],
      ["Plafond de CA (2026)", "203 100 €", "77 700 €*", "77 700 €*"],
      ["Seuil de franchise TVA", "85 000 €", "37 500 €", "37 500 €"],
    ],
    note:
      "* Le plafond du régime micro pour les prestations est de 77 700 € hors revalorisation ; le plafond de 83 600 € s&rsquo;applique au régime micro-social. Retenez l&rsquo;ordre de grandeur : la vente de biens plafonne beaucoup plus haut que les services, et le seuil de TVA est, lui, bien plus bas que le plafond du régime.",
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Le grand écart : abattement élevé mais plafond de TVA bas",
    texte:
      "Pour un prestataire, l&rsquo;abattement de 50 % ou 34 % sert à calculer l&rsquo;impôt : vous êtes imposé sur une fraction seulement de vos recettes. Mais attention, c&rsquo;est le <strong>seuil de franchise TVA</strong> de 37 500 € que vous atteindrez bien avant votre plafond de régime. Beaucoup découvrent la TVA à ce moment-là, sans l&rsquo;avoir anticipée.",
  },
  {
    type: "liste",
    titre: "Quelques cas qui prêtent à confusion",
    items: [
      {
        titre: "L&rsquo;artisan qui fournit les matériaux",
        texte:
          "La pose est une prestation (21,2 %), les matériaux revendus sont de la vente (12,3 %). Si les deux sont distincts sur la facture, ils relèvent chacun de leur catégorie.",
      },
      {
        titre: "Le coach qui vend aussi des ebooks",
        texte:
          "Le coaching est une prestation libérale (BNC), la vente d&rsquo;un fichier téléchargeable est en général une prestation de service, pas une vente de bien. Dans le doute, c&rsquo;est la nature de l&rsquo;activité principale qui tranche.",
      },
      {
        titre: "Le photographe qui vend des tirages",
        texte:
          "La prise de vue est une prestation ; la vente de tirages physiques peut relever de la vente de biens. L&rsquo;activité mixte impose de tenir le détail des deux.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "L&rsquo;activité mixte se ventile, elle ne se moyenne pas",
    texte:
      "Si vous faites à la fois de la vente et de la prestation, vous ne choisissez pas un taux moyen : vous déclarez chaque part dans sa catégorie, avec son propre taux et son propre abattement. Votre livre des recettes doit donc <strong>distinguer les deux</strong>, recette par recette. C&rsquo;est exactement ce que la colonne biens / services de votre livre des recettes sert à tracer.",
  },
  {
    type: "texte",
    titre: "Comment savoir de quel côté vous êtes",
    paragraphes: [
      "La règle de base : vous <strong>livrez un objet</strong>, c&rsquo;est de la vente de biens ; vous <strong>fournissez un travail</strong>, c&rsquo;est une prestation. Parmi les prestations, celles qui relèvent d&rsquo;une activité commerciale ou artisanale sont des BIC ; les activités intellectuelles, de conseil ou de création sont des BNC.",
      "En cas de doute sur votre situation précise, la réponse figure sur votre avis de situation au répertoire SIRENE et dans le code APE de votre activité. Un expert-comptable lève l&rsquo;ambiguïté en quelques minutes, et c&rsquo;est un bon réflexe avant un premier gros contrat.",
    ],
  },
];

const FAQ = [
  {
    q: "Quelle est la différence entre vente de biens et prestation de services en micro-entreprise ?",
    a: "La vente de biens consiste à livrer un objet ; la prestation consiste à fournir un travail. Cette distinction fixe votre taux de cotisations, votre abattement fiscal, votre plafond de chiffre d'affaires et votre seuil de franchise de TVA.",
  },
  {
    q: "Quels sont les taux de cotisations sociales en 2026 ?",
    a: "En 2026 : 12,3 % pour la vente de marchandises, 21,2 % pour les prestations de services BIC, 25,6 % pour les prestations et activités libérales relevant du régime général, et 23,2 % pour les professions libérales affiliées à la Cipav.",
  },
  {
    q: "Puis-je avoir à la fois de la vente et de la prestation ?",
    a: "Oui, c'est une activité mixte. Vous ne prenez pas un taux moyen : vous déclarez chaque part dans sa catégorie, avec son propre taux et son propre abattement. Votre livre des recettes doit distinguer les deux.",
  },
  {
    q: "La vente de fichiers numériques est-elle une vente de biens ?",
    a: "En général non : la vente d'un fichier téléchargeable est traitée comme une prestation de service, pas comme une vente de bien physique. La nature de l'activité principale aide à trancher.",
  },
  {
    q: "Pourquoi mon seuil de TVA est-il plus bas que mon plafond de micro-entreprise ?",
    a: "Ce sont deux choses différentes. Le plafond du régime micro est élevé (jusqu'à 203 100 € pour la vente), mais le seuil de franchise de TVA est bien plus bas (85 000 € pour les biens, 37 500 € pour les services). Vous franchirez le seuil de TVA en premier.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Urssaf, Le régime du micro-entrepreneur, taux de cotisations",
    url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/questions-sur-mes-cotisations.html",
    precision: "taux de cotisations sociales par catégorie d'activité",
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
      chapeau="Vente de biens ou prestation de services ? Cette seule question fixe vos cotisations, votre abattement, votre plafond et votre seuil de TVA. Voici comment vous situer, et pourquoi l&rsquo;activité mixte se ventile."
      enBref={[
        "La catégorie d&rsquo;activité décide de <strong>tout</strong> : taux de cotisations, abattement fiscal, plafond de CA et seuil de TVA.",
        "Cotisations 2026 : <strong>12,3 %</strong> (vente), <strong>21,2 %</strong> (services BIC), <strong>25,6 %</strong> (libéral), 23,2 % (Cipav).",
        "Abattements : 71 % pour la vente, 50 % pour les services BIC, 34 % pour le BNC.",
        "Le <strong>seuil de TVA</strong> (37 500 € en services) est bien plus bas que le plafond du régime : vous l&rsquo;atteindrez d&rsquo;abord.",
        "Activité mixte : on ne moyenne pas, on <strong>ventile</strong> chaque recette dans sa catégorie.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Biens et services, séparés automatiquement",
        texte:
          "Deviso marque chaque facture en vente ou en prestation et tient la répartition dans votre livre des recettes, prête pour vos déclarations et pour votre comptable.",
      }}
    />
  );
}
