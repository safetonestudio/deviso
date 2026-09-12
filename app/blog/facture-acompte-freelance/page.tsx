import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "facture-acompte-freelance";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Pourquoi un document séparé, et pas juste un virement",
    paragraphes: [
      "Un acompte est un paiement partiel reçu avant la livraison. Dès qu&rsquo;il est encaissé, il correspond à une somme perçue dans le cadre de votre activité : il doit donc être appuyé par un document, entrer dans votre comptabilité, et être déclaré. Le devis signé ne suffit pas — un devis n&rsquo;est pas une pièce comptable, c&rsquo;est un engagement.",
      "La facture d&rsquo;acompte est ce document. Elle a la même valeur et les mêmes contraintes qu&rsquo;une facture ordinaire : un numéro dans votre séquence, une date, les mentions obligatoires. Ce n&rsquo;est pas un brouillon, ni un reçu.",
      "Et c&rsquo;est la raison pour laquelle on ne peut pas « régulariser plus tard » : une fois l&rsquo;argent encaissé, le document doit exister à cette date-là.",
    ],
  },
  {
    type: "liste",
    titre: "Ce qu&rsquo;une facture d&rsquo;acompte doit contenir",
    intro:
      "Les mentions sont celles de toute facture, plus deux qui lui sont propres. Le reste — identité, numéro SIREN, date, coordonnées du client — ne change pas.",
    items: [
      {
        titre: "La mention « facture d&rsquo;acompte »",
        texte:
          "Écrite noir sur blanc. C&rsquo;est ce qui permet à votre client, à son comptable et au vôtre de ne pas la compter deux fois avec la facture finale.",
      },
      {
        titre: "Un numéro dans votre séquence unique",
        texte:
          "Pas une numérotation parallèle. Une facture d&rsquo;acompte consomme un numéro de la même série continue que vos autres factures — sinon vous créez un trou, ce qui est précisément ce que la réglementation interdit.",
      },
      {
        titre: "Le montant de l&rsquo;acompte, et le montant total de la commande",
        texte:
          "Les deux. Le client doit pouvoir lire ce qu&rsquo;il paie aujourd&rsquo;hui et ce qui restera dû.",
      },
      {
        titre: "La référence au devis",
        texte:
          "Numéro et date du devis accepté. C&rsquo;est ce lien qui justifie l&rsquo;acompte : sans commande, pas d&rsquo;acompte.",
      },
      {
        titre: "La désignation de la prestation",
        texte:
          "Même si elle n&rsquo;est pas encore réalisée. « Acompte de 30 % sur refonte du site — devis n° 2026-014 » est suffisant et précis.",
      },
      {
        titre: "Le régime de TVA applicable",
        texte:
          "Si vous êtes en franchise en base, la mention « TVA non applicable, art. 293 B du CGI ». Si vous êtes assujetti, la TVA est due sur l&rsquo;acompte dès son encaissement pour une prestation de services — voir plus bas, c&rsquo;est le point qui surprend.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "La TVA sur un acompte de prestation de services est due à l&rsquo;encaissement",
    texte:
      "Pour une prestation de services, la TVA devient exigible au moment où vous <strong>encaissez</strong> — pas à la livraison. Un acompte encaissé en décembre porte donc une TVA à déclarer sur décembre, même si la prestation n&rsquo;est exécutée qu&rsquo;en mars. C&rsquo;est l&rsquo;erreur la plus courante chez les prestataires qui viennent de sortir de la franchise en base. Pour une livraison de biens, la règle est différente : la TVA suit la livraison, pas l&rsquo;acompte.",
  },
  {
    type: "texte",
    titre: "La facture de solde : le seul endroit où l&rsquo;acompte se déduit",
    paragraphes: [
      "À la fin de la mission, vous émettez une facture de solde. Elle reprend le total de la prestation, puis <strong>déduit l&rsquo;acompte déjà facturé</strong>, en citant le numéro et la date de la facture d&rsquo;acompte. Le net à payer correspond au reste.",
      "C&rsquo;est cette déduction explicite qui évite la double facturation. Sans elle, vous avez deux documents qui réclament la même somme, et c&rsquo;est exactement ce qu&rsquo;un contrôle — ou un client méticuleux — relèvera.",
    ],
  },
  {
    type: "tableau",
    titre: "Un exemple chiffré, de bout en bout",
    intro:
      "Mission à 3 000 € HT, acompte de 30 % à la signature, en franchise en base de TVA.",
    colonnes: ["Document", "Ce qu&rsquo;il porte", "Montant"],
    lignes: [
      ["Devis n° 2026-014", "Refonte du site, 3 000 € HT, acompte de 30 % à la commande", "3 000 €"],
      ["Facture d&rsquo;acompte n° 2026-015", "« Acompte 30 % sur devis n° 2026-014 du 3 mars 2026 »", "900 €"],
      [
        "Facture de solde n° 2026-031",
        "Total 3 000 €, puis « Acompte déjà facturé — facture n° 2026-015 du 5 mars 2026 : −900 € »",
        "2 100 €",
      ],
    ],
    note:
      "Les numéros se suivent dans une seule série. L&rsquo;acompte consomme le 015, le solde prend le numéro courant au moment de son émission — il n&rsquo;est pas réservé à l&rsquo;avance.",
  },
  {
    type: "texte",
    titre: "Ce qu&rsquo;il faut déclarer, et quand",
    paragraphes: [
      "En micro-entreprise, vous déclarez votre chiffre d&rsquo;affaires <strong>encaissé</strong>, pas facturé. L&rsquo;acompte entre donc dans la déclaration de la période où il a été reçu sur votre compte, et le solde dans celle de son propre encaissement.",
      "Conséquence pratique : un acompte versé en décembre et un solde payé en février se déclarent sur deux périodes, voire deux années civiles différentes. Ça peut jouer sur le franchissement d&rsquo;un seuil — c&rsquo;est d&rsquo;ailleurs un levier légitime quand on est proche d&rsquo;une limite, à condition que les dates soient réelles et non arrangées après coup.",
      "Et si le solde n&rsquo;est jamais payé, vous ne déclarez que l&rsquo;acompte. Vous ne déclarez jamais un chiffre d&rsquo;affaires que vous n&rsquo;avez pas touché.",
    ],
  },
  {
    type: "liste",
    titre: "Les quatre erreurs qui coûtent cher",
    items: [
      {
        titre: "Appeler ça un « reçu » ou une « demande d&rsquo;acompte »",
        texte:
          "Un reçu n&rsquo;est pas une facture. Si la somme est encaissée, il faut une facture, avec un numéro et les mentions obligatoires. Le mot compte.",
      },
      {
        titre: "Numéroter les acomptes à part",
        texte:
          "Une série « A-001, A-002 » en parallèle des factures crée deux séquences. Or la continuité s&rsquo;apprécie sur l&rsquo;ensemble. Une seule série, toujours.",
      },
      {
        titre: "Oublier de déduire l&rsquo;acompte sur le solde",
        texte:
          "Vous réclamez alors 3 900 € pour une mission à 3 000 €. Le client le verra, et la correction passera par un avoir — plus de travail pour tout le monde.",
      },
      {
        titre: "Demander un acompte sans l&rsquo;avoir prévu au devis",
        texte:
          "Juridiquement, l&rsquo;acompte doit avoir été accepté. S&rsquo;il n&rsquo;est pas au devis, le client peut refuser, et vous êtes mal placé pour insister. La clause d&rsquo;acompte s&rsquo;écrit avant, pas après.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Acompte, arrhes, dépôt de garantie : ce ne sont pas des synonymes",
    texte:
      "L&rsquo;<strong>acompte</strong> engage les deux parties : le contrat est formé, et celui qui renonce peut devoir des dommages. Les <strong>arrhes</strong> permettent au client de se dédire en les abandonnant, et à vous de vous dédire en les restituant au double. Le <strong>dépôt de garantie</strong> est une somme conservée puis rendue, qui ne paie rien. Ces trois mots n&rsquo;ont pas les mêmes effets : écrivez celui que vous voulez vraiment. Dans 95 % des missions freelance, c&rsquo;est un acompte.",
  },
];

const FAQ = [
  {
    q: "Une facture d'acompte est-elle obligatoire ?",
    a: "Dès que vous encaissez une somme, elle doit être appuyée par une facture. Le devis signé ne suffit pas : ce n'est pas une pièce comptable. En pratique, si un acompte entre sur votre compte et qu'aucune facture ne lui correspond, il vous manque une pièce — et c'est le genre de manque qui se voit immédiatement en cas de contrôle ou quand un comptable reprend vos comptes.",
  },
  {
    q: "Faut-il un numéro de facture différent pour un acompte ?",
    a: "Un numéro différent, oui, mais dans la même série. L'acompte consomme un numéro de votre séquence unique et continue, comme n'importe quelle autre facture. Ce qu'il ne faut surtout pas faire, c'est ouvrir une numérotation parallèle du type « A-001 » : la continuité s'apprécie sur l'ensemble de vos factures, et deux séries créent mécaniquement des trous dans chacune.",
  },
  {
    q: "Comment déduire l'acompte sur la facture finale ?",
    a: "Sur la facture de solde, vous portez le total de la prestation, puis une ligne négative qui déduit l'acompte en citant le numéro et la date de la facture d'acompte. Par exemple : « Acompte déjà facturé — facture n° 2026-015 du 5 mars 2026 : −900 € ». Le net à payer est le reste. Cette mention explicite est ce qui évite de réclamer deux fois la même somme.",
  },
  {
    q: "Dois-je payer la TVA sur un acompte ?",
    a: "Si vous êtes en franchise en base, non : vous portez la mention de l'article 293 B du CGI et aucune TVA n'est due. Si vous êtes assujetti et que vous vendez une prestation de services, oui — et dès l'encaissement, pas à la livraison. Un acompte reçu en décembre génère donc une TVA à déclarer sur décembre, même si la prestation n'est exécutée qu'au printemps. Pour une livraison de biens, la règle diffère : la TVA suit la livraison.",
  },
  {
    q: "Quel pourcentage d'acompte demander ?",
    a: "Il n'y a pas de règle légale pour une prestation de services : c'est contractuel. Dans la pratique, 30 % à la commande est la norme sur les missions courtes, et on monte à 40 ou 50 % quand la mission est longue, quand elle engage des frais que vous avancez, ou quand le client est nouveau. Le point qui compte davantage que le pourcentage : que la clause figure au devis, pour que l'acompte soit accepté et non quémandé.",
  },
  {
    q: "L'acompte se déclare-t-il à l'URSSAF dès son encaissement ?",
    a: "Oui. En micro-entreprise, on déclare le chiffre d'affaires encaissé, donc l'acompte entre dans la déclaration de la période où il est arrivé sur votre compte. Le solde entrera dans celle de son propre encaissement. Un acompte de décembre et un solde de février se déclarent ainsi sur deux périodes différentes, parfois sur deux années civiles.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Article 289 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044982574",
    precision: "obligation de facturation, y compris pour les acomptes",
  },
  {
    libelle: "Article 242 nonies A du CGI, annexe II",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006294613",
    precision: "mentions obligatoires et numérotation continue",
  },
  {
    libelle: "Article 269 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044990371",
    precision: "exigibilité de la TVA à l'encaissement pour les prestations de services",
  },
  {
    libelle: "Article 293 B du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051230147",
    precision: "franchise en base de TVA et mention à porter",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Votre devis est signé, le client vous verse 30 % pour démarrer, et personne ne vous a jamais dit quel document émettre. C&rsquo;est une facture — une vraie, avec un numéro dans votre série — et deux ou trois détails décident de sa validité."
      enBref={[
        "Un acompte encaissé exige une <strong>facture d&rsquo;acompte</strong> : le devis signé n&rsquo;est pas une pièce comptable.",
        "Elle prend un numéro dans votre <strong>série unique et continue</strong>, jamais dans une série parallèle.",
        "La facture de solde doit <strong>déduire explicitement</strong> l&rsquo;acompte, en citant son numéro et sa date.",
        "En prestation de services assujettie, la <strong>TVA sur l&rsquo;acompte est due à l&rsquo;encaissement</strong>, pas à la livraison.",
        "En micro-entreprise, l&rsquo;acompte se déclare sur la période où il a été <strong>encaissé</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Deviso enchaîne devis, acompte et solde sans que vous y pensiez",
        texte:
          "Le devis signé génère la facture d&rsquo;acompte, et la facture de solde déduit l&rsquo;acompte automatiquement, avec sa référence. La numérotation reste continue, par construction.",
      }}
    />
  );
}
