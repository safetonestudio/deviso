import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "choisir-statut-micro-ei-eurl-sasu";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Quatre options, deux grandes familles",
    paragraphes: [
      "Pour exercer seul, vous avez le choix entre deux familles. L&rsquo;<strong>entreprise individuelle</strong>, où vous et votre entreprise ne faites qu&rsquo;un sur le plan juridique, qu&rsquo;elle soit au régime micro ou au régime réel. Et la <strong>société unipersonnelle</strong>, une personne morale distincte de vous, sous forme d&rsquo;EURL ou de SASU.",
      "Il n&rsquo;existe pas de bon statut dans l&rsquo;absolu. Le bon choix dépend de trois questions&nbsp;: le niveau de vos charges, la façon dont vous voulez vous rémunérer, et la protection sociale que vous attendez.",
    ],
  },
  {
    type: "tableau",
    titre: "Les quatre statuts côte à côte",
    colonnes: ["Statut", "Pour qui", "Impôt", "Protection sociale du dirigeant"],
    lignes: [
      ["Micro-entreprise", "Démarrer simplement, peu de charges", "Impôt sur le revenu, abattement forfaitaire", "Indépendant, cotisations sur le chiffre d&rsquo;affaires"],
      ["Entreprise individuelle au réel", "Charges importantes, activité qui grandit", "Impôt sur le revenu, option possible pour l&rsquo;IS", "Indépendant, cotisations sur le bénéfice"],
      ["EURL", "Séparer l&rsquo;entreprise de soi, associé unique", "IR par défaut, option IS", "Indépendant si gérant associé unique"],
      ["SASU", "Se verser un salaire, souplesse des statuts", "IS par défaut", "Assimilé salarié, régime général"],
    ],
    note:
      "Ni le gérant d&rsquo;EURL ni le président de SASU ne cotisent à l&rsquo;assurance chômage au titre de leur mandat.",
  },
  {
    type: "comparaison",
    titre: "Micro-entreprise : la simplicité, avec des limites",
    colonnes: [
      {
        titre: "Ce qu&rsquo;elle apporte",
        ton: "positif",
        texte:
          "Création en ligne et gratuite, comptabilité réduite au livre des recettes, cotisations calculées sur ce que vous encaissez&nbsp;: rien à payer si vous ne vendez rien. La franchise de TVA est possible sous les seuils.",
      },
      {
        titre: "Ses limites",
        ton: "negatif",
        texte:
          "Des plafonds de chiffre d&rsquo;affaires (203 100 € pour la vente, 83 600 € pour les services en 2026), et aucune déduction de vos charges réelles&nbsp;: un abattement forfaitaire les remplace.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Entreprise individuelle au réel : le même cadre, l&rsquo;impôt sur le vrai bénéfice",
    paragraphes: [
      "Juridiquement, rien ne change par rapport à la micro-entreprise&nbsp;: vous restez en entreprise individuelle. Ce qui change, c&rsquo;est le régime fiscal. Vous déduisez vos charges réelles et vous êtes imposé sur votre bénéfice effectif, au prix d&rsquo;une vraie comptabilité.",
      "Depuis mai 2022, votre <strong>patrimoine personnel est protégé par défaut</strong>&nbsp;: les créanciers professionnels ne peuvent saisir que les biens utiles à l&rsquo;activité. L&rsquo;entreprise individuelle peut aussi opter pour l&rsquo;impôt sur les sociétés, ce qui la rapproche d&rsquo;une EURL sans en créer une.",
    ],
  },
  {
    type: "comparaison",
    titre: "EURL ou SASU : deux sociétés, deux philosophies",
    colonnes: [
      {
        titre: "EURL",
        sousTitre: "Gérant indépendant",
        ton: "neutre",
        texte:
          "Cotisations sociales moins élevées pour une même rémunération, mais une protection plus réduite. À l&rsquo;IS, la part des dividendes qui dépasse 10 % du capital et des apports est soumise aux cotisations sociales.",
      },
      {
        titre: "SASU",
        sousTitre: "Président assimilé salarié",
        ton: "neutre",
        texte:
          "Protection proche de celle d&rsquo;un salarié, mais des cotisations plus lourdes sur le salaire. Sans rémunération, pas de cotisations&nbsp;; les dividendes ne supportent que les prélèvements sociaux et l&rsquo;impôt.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Les sociétés et l&rsquo;impôt sur les sociétés",
    texte:
      "Une petite société soumise à l&rsquo;IS paie <strong>15 % sur les 42 500 premiers euros de bénéfice</strong>, puis 25 % au-delà, si elle remplit les conditions du taux réduit (chiffre d&rsquo;affaires, capital entièrement libéré et détenu pour au moins 75 % par des personnes physiques). Le bénéfice laissé dans la société pour investir n&rsquo;est donc imposé qu&rsquo;à ce taux.",
  },
  {
    type: "liste",
    titre: "Comment trancher, concrètement",
    items: [
      {
        titre: "Vous démarrez, avec peu de charges",
        texte:
          "La micro-entreprise reste le plus simple pour tester une activité. Vous pourrez évoluer plus tard sans tout recommencer.",
      },
      {
        titre: "Vos charges dépassent l&rsquo;abattement forfaitaire",
        texte:
          "Le régime réel, en entreprise individuelle ou en société, vous fera payer l&rsquo;impôt sur votre vrai bénéfice.",
      },
      {
        titre: "Vous voulez une rémunération régulière et une protection de salarié",
        texte:
          "La SASU s&rsquo;y prête le mieux, au prix de cotisations plus élevées.",
      },
      {
        titre: "Vous voulez réinvestir une partie des bénéfices",
        texte:
          "Une structure à l&rsquo;IS (société, ou entreprise individuelle avec option) permet de laisser des bénéfices dans l&rsquo;entreprise à un taux d&rsquo;imposition réduit.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Faites valider votre choix",
    texte:
      "Les écarts de cotisations et d&rsquo;impôt dépendent de votre situation personnelle (autres revenus, foyer fiscal, projets). Avant de créer une société, une simulation avec un expert-comptable ou un réseau d&rsquo;accompagnement à la création vaut largement le temps qu&rsquo;elle demande.",
  },
];

const FAQ = [
  {
    q: "Quel statut choisir pour démarrer seul ?",
    a: "La micro-entreprise est la plus simple pour démarrer avec peu de charges. Si vos charges sont importantes ou si vous voulez un statut de salarié, l'entreprise individuelle au réel, l'EURL ou la SASU peuvent être plus adaptées.",
  },
  {
    q: "Quelle différence entre EURL et SASU ?",
    a: "En EURL, le gérant associé unique relève du régime des indépendants, avec des cotisations moins élevées. En SASU, le président est assimilé salarié : meilleure protection, mais cotisations plus lourdes sur la rémunération.",
  },
  {
    q: "Mon patrimoine personnel est-il protégé en entreprise individuelle ?",
    a: "Oui, depuis mai 2022 : les créanciers professionnels ne peuvent saisir que les biens utiles à l'activité, sauf exceptions.",
  },
  {
    q: "Quel est le taux de l'impôt sur les sociétés pour une petite société ?",
    a: "15 % sur les 42 500 premiers euros de bénéfice, puis 25 % au-delà, si la société remplit les conditions du taux réduit.",
  },
  {
    q: "Peut-on changer de statut plus tard ?",
    a: "Oui. On peut passer du régime micro au réel, opter pour l'IS, ou transférer son activité dans une société. Chaque passage a ses formalités et ses conséquences fiscales, à préparer avec un professionnel.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Choisir la forme juridique de votre entreprise",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23844",
    precision: "entreprise individuelle, EURL, SASU",
  },
  {
    libelle: "Impots.gouv.fr, Taux réduit d'impôt sur les sociétés",
    url: "https://www.impots.gouv.fr/actualite/taux-reduit-dimpot-sur-les-societes-le-critere-du-chiffre-daffaires-revu-pour-les",
    precision: "15 % jusqu'à 42 500 € de bénéfice, conditions",
  },
  {
    libelle: "Service-public.gouv.fr, Impôt sur les sociétés : taux, déclaration, paiement",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23575",
    precision: "conditions du taux réduit : chiffre d'affaires, capital détenu à 75 % par des personnes physiques",
  },
  {
    libelle: "Bpifrance Création, Choisir son statut juridique",
    url: "https://bpifrance-creation.fr/sites/default/files/PPT_webinaire%20statut%20juridique%20(PDF).pdf",
    precision: "régime social du dirigeant selon le statut",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Micro-entreprise, entreprise individuelle au réel, EURL ou SASU&nbsp;: quatre façons d&rsquo;exercer seul, avec des impôts, des cotisations et une protection sociale très différents. Si vous vous associez, les mêmes critères valent pour une SARL ou une SAS. Le bon choix dépend moins de la mode que de vos charges, de votre façon de vous rémunérer et de vos projets."
      enBref={[
        "<strong>Micro</strong>&nbsp;: le plus simple, mais plafonné et sans déduction des charges réelles.",
        "<strong>EI au réel</strong>&nbsp;: impôt sur le vrai bénéfice, patrimoine personnel protégé depuis 2022.",
        "<strong>EURL</strong>&nbsp;: société, gérant indépendant, cotisations plus légères.",
        "<strong>SASU</strong>&nbsp;: président assimilé salarié, meilleure protection, cotisations plus lourdes.",
        "Une société à l&rsquo;IS paie <strong>15 % jusqu&rsquo;à 42 500 €</strong> de bénéfice, puis 25 %.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Le statut change, la facturation suit",
        texte:
          "Micro, réel ou société, en franchise de TVA ou assujetti&nbsp;: Deviso adapte vos factures, votre TVA et vos échéances à votre statut. Le jour où vous en changez, vos documents suivent.",
      }}
    />
  );
}
