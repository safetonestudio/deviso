import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "obligations-comptables-micro-entrepreneur";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Une comptabilité allégée, pas inexistante",
    paragraphes: [
      "Le régime micro dispense du bilan, du compte de résultat et de la liasse fiscale. C&rsquo;est son grand avantage. Mais « allégé » ne veut pas dire « rien » : il reste une poignée d&rsquo;obligations, simples, qu&rsquo;il faut tenir toute l&rsquo;année et pouvoir présenter en cas de contrôle.",
      "Le <strong>livre des recettes</strong> en est le coeur, et nous lui consacrons un article dédié. Voici tout le reste : le compte bancaire, les factures, le registre des achats, et la conservation.",
    ],
  },
  {
    type: "liste",
    titre: "Les obligations à tenir",
    items: [
      {
        titre: "Le livre des recettes",
        texte:
          "Obligatoire pour tous : toutes les sommes encaissées, par ordre chronologique, avec montant, origine et mode de règlement.",
      },
      {
        titre: "Le registre des achats",
        texte:
          "Pour les activités de vente et d&rsquo;hébergement (et les libéraux en franchise de TVA) : le récapitulatif annuel des achats, avec mode de paiement et références des pièces.",
      },
      {
        titre: "Des factures conformes",
        texte:
          "Mentions obligatoires, numérotation continue et sans trou, pour chaque vente ou prestation.",
      },
      {
        titre: "La conservation des pièces",
        texte:
          "Factures, registres et justificatifs, conservés 10 ans.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Le compte bancaire dédié : la règle des 10 000 €",
    texte:
      "Vous devez ouvrir un <strong>compte bancaire dédié</strong> à votre activité dès que votre chiffre d&rsquo;affaires dépasse <strong>10 000 €</strong> deux années civiles de suite. Ce n&rsquo;est pas forcément un « compte pro » coûteux : un simple compte courant séparé suffit. En dessous de ce seuil, ce n&rsquo;est pas obligatoire, mais séparer le perso du professionnel reste une bonne hygiène.",
  },
  {
    type: "texte",
    titre: "Les factures : le point le plus surveillé",
    paragraphes: [
      "Chaque vente ou prestation donne lieu à une facture portant des <strong>mentions obligatoires</strong> (identité, SIRET, date, détail, mention de TVA ou de franchise) et un <strong>numéro unique</strong> issu d&rsquo;une séquence continue, sans rupture ni doublon. La numérotation est l&rsquo;un des premiers points vérifiés : un trou dans la série fait présumer une facture manquante.",
      "À cela s&rsquo;ajoute, depuis septembre 2026, la <strong>facturation électronique</strong> : les micro-entrepreneurs assujettis à la TVA doivent pouvoir recevoir des factures électroniques, et devront en émettre à partir de septembre 2027.",
    ],
  },
  {
    type: "tableau",
    titre: "Ce que vous devez faire, et ce dont vous êtes dispensé",
    colonnes: ["Vous devez", "Vous êtes dispensé"],
    lignes: [
      ["Tenir le livre des recettes", "Produire un bilan"],
      ["Émettre des factures conformes et numérotées", "Produire un compte de résultat"],
      ["Tenir un registre des achats (si vente / hébergement)", "Déposer une liasse fiscale"],
      ["Conserver vos pièces 10 ans", "Collecter la TVA tant que vous êtes en franchise"],
      ["Ouvrir un compte dédié au-delà de 10 000 € sur 2 ans", "Faire appel à un commissaire aux comptes"],
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "La conservation, c&rsquo;est 10 ans",
    texte:
      "Livres, registres, factures et justificatifs se conservent <strong>10 ans</strong> à compter de la clôture de l&rsquo;exercice. Les écritures ne doivent pas pouvoir être modifiées après coup. Un stockage numérique est accepté, à condition qu&rsquo;il garantisse l&rsquo;intégrité et la lisibilité des documents sur toute la durée.",
  },
];

const FAQ = [
  {
    q: "Quelles sont les obligations comptables d'un micro-entrepreneur ?",
    a: "Tenir un livre des recettes, émettre des factures conformes et numérotées, tenir un registre des achats pour les activités de vente, conserver les pièces 10 ans, et ouvrir un compte bancaire dédié au-delà d'un certain chiffre d'affaires.",
  },
  {
    q: "Un micro-entrepreneur doit-il un compte bancaire professionnel ?",
    a: "Un compte dédié est obligatoire dès que le chiffre d'affaires dépasse 10 000 € deux années civiles de suite. Ce n'est pas nécessairement un compte professionnel : un compte courant séparé suffit.",
  },
  {
    q: "Le micro-entrepreneur doit-il faire un bilan ?",
    a: "Non. Le régime micro dispense de bilan, de compte de résultat et de liasse fiscale. C'est l'un de ses principaux avantages.",
  },
  {
    q: "Combien de temps conserver les documents comptables ?",
    a: "10 ans à compter de la clôture de l'exercice : livres, registres, factures et justificatifs.",
  },
  {
    q: "La facturation électronique concerne-t-elle les micro-entrepreneurs ?",
    a: "Oui. Depuis septembre 2026, les micro-entrepreneurs assujettis à la TVA doivent pouvoir recevoir des factures électroniques, et devront en émettre à partir de septembre 2027.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Service-public.gouv.fr, Obligations comptables du micro-entrepreneur",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/R54994",
    precision: "livre des recettes, registre des achats, conservation",
  },
  {
    libelle: "Service-public.gouv.fr, Compte bancaire du micro-entrepreneur",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23268",
    precision: "obligation de compte dédié au-delà de 10 000 € sur deux ans",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le micro dispense de bilan et de liasse fiscale, mais pas de tout. Le tour complet de ce qu&rsquo;il faut tenir au-delà du livre des recettes : compte bancaire, factures, registre des achats, conservation."
      enBref={[
        "Le micro est dispensé de <strong>bilan, compte de résultat et liasse fiscale</strong>.",
        "Restent : livre des recettes, factures conformes, registre des achats (si vente), conservation.",
        "Compte bancaire <strong>dédié</strong> obligatoire au-delà de <strong>10 000 €</strong> de CA deux ans de suite.",
        "Factures : mentions obligatoires et <strong>numérotation continue</strong>, point très surveillé.",
        "Tout se conserve <strong>10 ans</strong>, avec des écritures non modifiables.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Toutes vos obligations tenues au même endroit",
        texte:
          "Deviso produit vos factures conformes et numérotées, tient votre livre des recettes et vos exports comptables, et archive vos pièces : l&rsquo;essentiel de vos obligations micro, sans tableur.",
      }}
    />
  );
}
