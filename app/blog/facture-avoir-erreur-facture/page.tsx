import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "facture-avoir-erreur-facture";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Pourquoi une facture émise est définitive",
    paragraphes: [
      "Une facture n&rsquo;est pas un document de travail. Dès qu&rsquo;elle est émise et transmise, elle devient une pièce comptable qui existe aussi dans les comptes de votre client, dans sa déclaration de TVA s&rsquo;il est assujetti, et — depuis la réforme — dans les données transmises à l&rsquo;administration.",
      "La modifier après coup, ce serait désynchroniser tout ça. Et la supprimer créerait un trou dans votre numérotation, ce que la réglementation interdit explicitement : la séquence doit être continue, sans rupture, précisément pour qu&rsquo;on ne puisse pas faire disparaître une vente.",
      "D&rsquo;où la règle, qui n&rsquo;a pas d&rsquo;exception : <strong>on ne corrige pas une facture, on en émet une autre qui l&rsquo;annule</strong>. Ce document s&rsquo;appelle un avoir.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le réflexe à désapprendre",
    texte:
      "Rouvrir le PDF, changer le chiffre, renvoyer le fichier avec le même numéro. Tant que tout se passait par courriel, ça passait souvent inaperçu. Depuis la facturation électronique, la facture d&rsquo;origine a un identifiant, un statut et une trace chez l&rsquo;administration : un second document portant le même numéro n&rsquo;est plus une correction, c&rsquo;est une incohérence.",
  },
  {
    type: "comparaison",
    titre: "Trois situations, trois réponses",
    intro:
      "Avant de choisir, identifiez laquelle des trois vous concerne. Elles n&rsquo;appellent pas le même document.",
    colonnes: [
      {
        titre: "Erreur repérée avant l&rsquo;envoi",
        ton: "positif",
        sousTitre: "Rien à faire",
        texte:
          "La facture n&rsquo;est pas partie, rien n&rsquo;est enregistré chez personne. Vous corrigez et vous envoyez. Un brouillon n&rsquo;est pas une facture : tant que le document n&rsquo;a pas quitté votre outil, il n&rsquo;existe pas.",
      },
      {
        titre: "Erreur sur le montant ou le contenu",
        ton: "neutre",
        sousTitre: "Avoir, puis nouvelle facture",
        texte:
          "Vous émettez un avoir qui annule tout ou partie de la facture, puis une facture rectificative correcte. Les trois documents coexistent dans vos comptes, et c&rsquo;est voulu : la trace reste.",
      },
      {
        titre: "La facture a été refusée ou rejetée",
        ton: "negatif",
        sousTitre: "Avoir interne, non transmis",
        texte:
          "Cas particulier de la facturation électronique : l&rsquo;avoir qui annule une facture refusée ou rejetée ne doit pas repartir dans le circuit réglementaire. L&rsquo;administration a déjà reçu le statut d&rsquo;échec.",
      },
    ],
  },
  {
    type: "liste",
    titre: "Ce que doit contenir un avoir",
    intro:
      "Un avoir est une facture. Il obéit donc aux mêmes mentions obligatoires, plus trois qui lui sont propres.",
    items: [
      {
        titre: "La mention « avoir » ou « facture d&rsquo;avoir »",
        texte: "Explicite, en tête du document. Un avoir qui ne dit pas qu&rsquo;il en est un sera compté comme une vente.",
      },
      {
        titre: "Un numéro de votre série continue",
        texte:
          "Même série que vos factures. Un avoir consomme un numéro — c&rsquo;est d&rsquo;ailleurs la raison pour laquelle annuler une facture ne « libère » jamais son numéro.",
      },
      {
        titre: "La référence à la facture annulée",
        texte:
          "Numéro et date. C&rsquo;est ce lien qui fait de l&rsquo;avoir une annulation, et non une remise sortie de nulle part.",
      },
      {
        titre: "Des montants négatifs, ou présentés comme tels",
        texte:
          "Un avoir diminue votre chiffre d&rsquo;affaires. La présentation peut varier, mais l&rsquo;effet comptable doit être sans ambiguïté : c&rsquo;est une soustraction.",
      },
      {
        titre: "Le motif",
        texte:
          "« Erreur de taux de TVA », « prestation non réalisée », « geste commercial ». Ce n&rsquo;est pas une formalité : c&rsquo;est ce qui explique, trois ans plus tard, pourquoi cette vente a disparu.",
      },
      {
        titre: "Le même régime de TVA que la facture annulée",
        texte:
          "Si la facture portait 20 % de TVA, l&rsquo;avoir porte 20 % de TVA en négatif — c&rsquo;est ce qui permet de récupérer la TVA déjà déclarée. Si elle était en franchise, l&rsquo;avoir l&rsquo;est aussi.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Avoir total ou avoir partiel",
    paragraphes: [
      "Un <strong>avoir total</strong> annule la facture entière. C&rsquo;est le cas quand l&rsquo;erreur porte sur l&rsquo;identité du client, sur le taux de TVA, sur la nature de la prestation — tout ce qui rend le document faux dans son principe.",
      "Un <strong>avoir partiel</strong> ne retire qu&rsquo;une partie : une ligne facturée en trop, une remise accordée après coup, un rabais pour retard de livraison. La facture d&rsquo;origine reste valable pour le reste, et vous n&rsquo;avez pas de facture rectificative à émettre.",
      "Le choix n&rsquo;est pas esthétique. Un avoir partiel évite de refaire tout le circuit pour une ligne, mais il suppose que le reste du document soit juste. En cas de doute — par exemple si le client a changé d&rsquo;entité — préférez l&rsquo;avoir total : il est plus lourd, il est plus propre.",
    ],
  },
  {
    type: "tableau",
    titre: "L&rsquo;enchaînement, avec les numéros",
    intro:
      "Facture de 1 200 € HT émise avec un taux de TVA erroné. Voici ce que vos comptes doivent montrer à la fin.",
    colonnes: ["Document", "Contenu", "Effet sur le CA"],
    lignes: [
      ["Facture n° 2026-042", "1 200 € HT, TVA 10 % (erreur : le taux correct est 20 %)", "+1 200 €"],
      [
        "Avoir n° 2026-043",
        "« Annulation de la facture n° 2026-042 du 14 mars 2026 — motif : taux de TVA erroné », TVA 10 % en négatif",
        "−1 200 €",
      ],
      ["Facture n° 2026-044", "1 200 € HT, TVA 20 %, mention « remplace la facture n° 2026-042 »", "+1 200 €"],
    ],
    note:
      "Trois documents, trois numéros consécutifs, un chiffre d&rsquo;affaires net de 1 200 €. Aucun numéro n&rsquo;a disparu, et l&rsquo;historique se relit.",
  },
  {
    type: "texte",
    titre: "Ce que la facturation électronique change",
    paragraphes: [
      "Tant que les factures circulaient en PDF, une correction rapide passait souvent. Ce n&rsquo;est plus le cas, et pour une raison simple : une facture déposée via une plateforme agréée a un identifiant et un cycle de vie suivi. L&rsquo;administration sait qu&rsquo;elle existe.",
      "Deux conséquences pratiques. D&rsquo;abord, <strong>le délai de correction se resserre</strong> : plus la facture avance dans son cycle, plus l&rsquo;annulation devient visible. Ensuite, et c&rsquo;est le point que presque personne n&rsquo;explique, <strong>tous les avoirs ne se transmettent pas</strong>.",
      "Un avoir qui annule une facture ayant abouti — remise accordée, retour, geste commercial — part normalement dans le circuit : l&rsquo;administration n&rsquo;a aucun autre moyen de l&rsquo;apprendre. En revanche, un avoir qui annule une facture <strong>refusée</strong> par le client ou <strong>rejetée</strong> par une plateforme reste interne : le statut d&rsquo;échec a déjà informé l&rsquo;administration, et transmettre l&rsquo;avoir créerait un doublon de données.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Une distinction que votre logiciel devrait faire à votre place",
    texte:
      "Savoir si un avoir se transmet dépend du statut de la facture qu&rsquo;il annule. Personne ne devrait avoir à s&rsquo;en souvenir au moment de l&rsquo;émettre. C&rsquo;est exactement le type de règle qu&rsquo;un outil doit porter — et qu&rsquo;il faut vérifier avant de choisir le sien.",
  },
  {
    type: "liste",
    titre: "Les erreurs qu&rsquo;on voit le plus souvent",
    items: [
      {
        titre: "Supprimer la facture et en refaire une avec le même numéro",
        texte:
          "Le plus fréquent, et le plus problématique. Vous perdez la trace, et vous vous retrouvez avec deux documents différents ayant porté le même numéro — ce qui est exactement ce qu&rsquo;un contrôle cherche.",
      },
      {
        titre: "Émettre un avoir sans référence à la facture annulée",
        texte:
          "Sans ce lien, l&rsquo;avoir ressemble à une remise inexpliquée. Il faut le numéro et la date, pas une formule vague du type « annulation facture précédente ».",
      },
      {
        titre: "Oublier de reprendre le taux de TVA d&rsquo;origine",
        texte:
          "Un avoir qui ne reprend pas le taux initial ne permet pas de récupérer la TVA déjà déclarée. C&rsquo;est une perte sèche, et elle se voit à la déclaration suivante.",
      },
      {
        titre: "Réutiliser un numéro « libéré » par une annulation",
        texte:
          "Un numéro consommé l&rsquo;est définitivement, même si la facture a été annulée. Le numéro de l&rsquo;avoir est un nouveau numéro, et la facture rectificative prend le suivant.",
      },
      {
        titre: "Annuler une facture impayée pour « faire le ménage »",
        texte:
          "Une facture impayée reste due : l&rsquo;annuler, c&rsquo;est renoncer à la créance. Si le client ne paie pas, le chemin est la relance puis le recouvrement, pas l&rsquo;avoir.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Peut-on supprimer une facture déjà envoyée ?",
    a: "Non. Une facture émise est une pièce comptable qui existe aussi chez votre client, et sa suppression créerait un trou dans votre numérotation — ce que la réglementation interdit, la séquence devant être continue. La seule façon de l'annuler est d'émettre un avoir qui la référence, puis, si nécessaire, une facture rectificative.",
  },
  {
    q: "Quelle est la différence entre un avoir et une facture rectificative ?",
    a: "L'avoir annule, la facture rectificative remplace. Dans le cas général vous avez besoin des deux : l'avoir efface comptablement la facture fausse, la facture rectificative porte les bonnes informations. Si l'erreur ne portait que sur une ligne ou un montant à la baisse, un avoir partiel peut suffire seul — la facture d'origine reste valable pour le reste.",
  },
  {
    q: "L'avoir doit-il porter un numéro de facture ?",
    a: "Oui, et dans la même série continue que vos factures. Un avoir consomme un numéro. C'est la raison pour laquelle annuler une facture ne libère jamais son numéro : la facture a consommé le sien, l'avoir consomme le suivant, et la facture rectificative celui d'après.",
  },
  {
    q: "Un avoir annule-t-il la TVA déjà déclarée ?",
    a: "Oui, à condition qu'il reprenne le taux de TVA de la facture d'origine, en négatif. C'est ce mécanisme qui vous permet de récupérer la TVA que vous avez déclarée à tort. Un avoir qui oublie de mentionner le taux initial ne le permet pas, et la TVA reste à votre charge. En franchise en base, la question ne se pose pas : l'avoir reprend simplement la mention de l'article 293 B.",
  },
  {
    q: "Faut-il transmettre l'avoir via la plateforme agréée ?",
    a: "Cela dépend du statut de la facture annulée. Un avoir qui annule une facture ayant abouti se transmet normalement : l'administration n'a aucun autre moyen d'en être informée. Mais un avoir qui annule une facture refusée par le client ou rejetée par une plateforme reste interne à votre comptabilité — le statut d'échec a déjà informé l'administration, et transmettre l'avoir créerait un doublon de données.",
  },
  {
    q: "Combien de temps ai-je pour corriger une facture ?",
    a: "Il n'y a pas de délai légal pour émettre un avoir : une erreur se corrige quand on la découvre. En pratique, deux contraintes pèsent. La TVA déjà déclarée se régularise sur la déclaration suivante, donc plus vous tardez, plus la régularisation est lourde. Et depuis la facturation électronique, une facture avance dans son cycle de vie : plus elle est engagée, plus l'annulation est visible et demande d'explications.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Article 242 nonies A du CGI, annexe II",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006294613",
    precision: "mentions obligatoires et numérotation continue sans rupture",
  },
  {
    libelle: "Article 289 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044982574",
    precision: "obligation de facturation et de rectification",
  },
  {
    libelle: "Article 272 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044990287",
    precision: "récupération de la TVA facturée à tort, sur facture rectificative",
  },
  {
    libelle: "impots.gouv.fr — Facturation électronique et plateformes agréées",
    url: "https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees",
    precision: "cycle de vie des factures et flux de données réglementaires",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Mauvais montant, mauvais taux de TVA, mauvais client. Le réflexe est de rouvrir le document et de corriger — et c&rsquo;est précisément ce qu&rsquo;il ne faut pas faire. Voici le bon geste, et ce que la facturation électronique y change."
      enBref={[
        "Une facture émise ne se modifie pas et ne se supprime pas : on émet un <strong>avoir</strong> qui l&rsquo;annule.",
        "L&rsquo;avoir prend un numéro de votre série continue, et <strong>référence la facture annulée</strong> par son numéro et sa date.",
        "Il doit reprendre le <strong>taux de TVA d&rsquo;origine</strong>, en négatif — sinon la TVA déclarée n&rsquo;est pas récupérable.",
        "Un numéro consommé ne se libère jamais, même après annulation.",
        "Cas particulier : l&rsquo;avoir qui annule une facture <strong>refusée ou rejetée</strong> ne se transmet pas dans le circuit réglementaire.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Un avoir correct, sans se demander ce qu&rsquo;il doit contenir",
        texte:
          "Deviso reprend la référence, le motif et le taux de TVA de la facture annulée, garde la numérotation continue, et sait quand l&rsquo;avoir doit rester interne.",
      }}
    />
  );
}
