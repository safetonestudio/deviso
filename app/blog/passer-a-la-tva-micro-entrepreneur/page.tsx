import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "passer-a-la-tva-micro-entrepreneur";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "La franchise en base, et le jour où elle s&rsquo;arrête",
    paragraphes: [
      "Tant que votre chiffre d&rsquo;affaires reste sous les seuils de <strong>franchise en base de TVA</strong>, vous ne facturez pas la TVA : vos factures portent la mention « TVA non applicable, article 293 B du CGI ». C&rsquo;est l&rsquo;un des grands conforts du régime micro.",
      "Mais la franchise n&rsquo;est pas liée à votre plafond de micro-entreprise. Elle a ses propres seuils, <strong>beaucoup plus bas</strong>, et le jour où vous les franchissez, vous devez facturer la TVA, la déclarer et la reverser. Mieux vaut voir ce mur arriver que le découvrir sur une facture déjà partie.",
    ],
  },
  {
    type: "tableau",
    titre: "Les seuils de franchise 2026",
    intro:
      "Deux niveaux à connaître : le seuil de base, et le seuil majoré qui déclenche la TVA immédiatement.",
    colonnes: ["", "Vente de biens", "Prestations de services"],
    lignes: [
      ["Seuil de base", "<strong>85 000 €</strong>", "<strong>37 500 €</strong>"],
      ["Seuil majoré", "93 500 €", "41 250 €"],
    ],
    note:
      "Le projet d&rsquo;un seuil unique de 25 000 € a été <strong>abandonné</strong> par la loi du 3 novembre 2025. Ce sont bien ces seuils-là qui s&rsquo;appliquent.",
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le seuil majoré ne pardonne pas",
    texte:
      "Si vous dépassez le seuil de base mais restez sous le seuil majoré, vous basculez à la TVA au <strong>1er janvier suivant</strong>. Mais si vous franchissez le <strong>seuil majoré</strong> en cours d&rsquo;année, vous devenez redevable de la TVA <strong>dès le 1er jour du mois de dépassement</strong>. Les factures de ce mois doivent alors porter la TVA, même celles déjà émises sans.",
  },
  {
    type: "texte",
    titre: "Ce qui change concrètement",
    paragraphes: [
      "Trois choses changent le jour où vous passez à la TVA. D&rsquo;abord, vos factures affichent le <strong>taux et le montant de TVA</strong>, et votre <strong>numéro de TVA intracommunautaire</strong> (que vous demandez à votre service des impôts des entreprises). Ensuite, vous <strong>collectez</strong> la TVA pour l&rsquo;État et la reversez. Enfin, et c&rsquo;est la contrepartie, vous pouvez <strong>déduire</strong> la TVA sur vos propres achats professionnels.",
      "Pour vos clients professionnels, la TVA est neutre : ils la récupèrent. Pour vos clients particuliers, en revanche, vos prix TTC augmentent si vous répercutez la taxe : c&rsquo;est un point à anticiper dans votre tarification.",
    ],
  },
  {
    type: "liste",
    titre: "Les démarches pour passer à la TVA",
    numerotee: true,
    items: [
      {
        titre: "Demander votre numéro de TVA intracommunautaire",
        texte:
          "Auprès de votre service des impôts des entreprises (SIE), via votre espace professionnel sur impots.gouv.fr.",
      },
      {
        titre: "Choisir votre régime de déclaration",
        texte:
          "Réel simplifié ou réel normal (voir ci-dessous). Ce choix fixe la fréquence de vos déclarations.",
      },
      {
        titre: "Mettre à jour vos factures",
        texte:
          "Retirer la mention 293 B, ajouter le taux, le montant de TVA et votre numéro intracommunautaire.",
      },
      {
        titre: "Déclarer et payer selon votre régime",
        texte:
          "En ligne depuis votre espace professionnel, aux échéances de votre régime.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Réel simplifié ou réel normal",
    paragraphes: [
      "Au <strong>réel simplifié</strong>, vous faites une seule déclaration annuelle (la CA12) et payez deux acomptes dans l&rsquo;année, en juillet et en décembre. C&rsquo;est le régime le plus léger, adapté à la plupart des micro-entrepreneurs qui viennent de franchir le seuil.",
      "Au <strong>réel normal</strong>, vous déclarez la TVA chaque mois (la CA3), ou chaque trimestre si votre TVA annuelle est faible. C&rsquo;est plus lourd, mais parfois imposé selon l&rsquo;activité ou choisi pour récupérer la TVA plus vite quand on investit.",
    ],
  },
];

const FAQ = [
  {
    q: "Quels sont les seuils de franchise de TVA en 2026 ?",
    a: "85 000 € (seuil de base) et 93 500 € (seuil majoré) pour la vente de biens ; 37 500 € et 41 250 € pour les prestations de services. Le projet de seuil unique de 25 000 € a été abandonné par la loi du 3 novembre 2025.",
  },
  {
    q: "À partir de quand dois-je facturer la TVA si je dépasse un seuil ?",
    a: "Si vous dépassez seulement le seuil de base, vous passez à la TVA au 1er janvier suivant. Si vous franchissez le seuil majoré en cours d'année, vous devenez redevable dès le 1er jour du mois de dépassement.",
  },
  {
    q: "Comment obtenir un numéro de TVA intracommunautaire ?",
    a: "En le demandant à votre service des impôts des entreprises, depuis votre espace professionnel sur impots.gouv.fr. Il devient obligatoire sur vos factures dès que vous facturez la TVA.",
  },
  {
    q: "Quelle est la différence entre la CA12 et la CA3 ?",
    a: "La CA12 est la déclaration annuelle du régime réel simplifié, avec deux acomptes en juillet et décembre. La CA3 est la déclaration mensuelle (ou trimestrielle) du régime réel normal.",
  },
  {
    q: "Puis-je déduire la TVA sur mes achats une fois assujetti ?",
    a: "Oui. C'est la contrepartie de la collecte : dès que vous facturez la TVA, vous pouvez déduire celle que vous payez sur vos achats professionnels.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Franchise en base de TVA",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F21746",
    precision: "seuils de franchise et conditions de sortie",
  },
  {
    libelle: "Impots.gouv.fr, Régimes d'imposition et déclarations de TVA",
    url: "https://www.impots.gouv.fr/professionnel/les-regimes-dimposition",
    precision: "réel simplifié (CA12) et réel normal (CA3)",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="La franchise de TVA s&rsquo;arrête bien avant votre plafond de micro-entreprise. Voici les seuils 2026, ce qui déclenche la bascule, et les démarches pour passer à la TVA sans mauvaise surprise."
      enBref={[
        "Seuils de franchise 2026 : <strong>85 000 / 93 500 €</strong> (biens), <strong>37 500 / 41 250 €</strong> (services).",
        "Le seuil unique de 25 000 € a été <strong>abandonné</strong> (loi du 3 novembre 2025).",
        "Dépasser le <strong>seuil majoré</strong> rend redevable dès le 1er jour du mois ; le seuil de base, au 1er janvier suivant.",
        "Passer à la TVA : numéro intracommunautaire, TVA sur les factures, collecte, et <strong>déduction</strong> sur vos achats.",
        "Déclaration au <strong>réel simplifié</strong> (CA12, 2 acomptes) ou au <strong>réel normal</strong> (CA3 mensuelle).",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Vos factures prêtes pour la TVA, le jour venu",
        texte:
          "Deviso suit votre chiffre d&rsquo;affaires par rapport aux seuils et bascule vos factures en TVA quand vous passez le cap, mentions et numéro intracommunautaire compris.",
      }}
    />
  );
}
