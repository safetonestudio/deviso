import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "refacturer-frais-client-freelance";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Le problème que personne ne vous explique",
    paragraphes: [
      "Vous prenez un train à 90 €, une nuit d&rsquo;hôtel à 110 €, et votre client a accepté de vous les rembourser. Vous ajoutez donc 200 € sur votre facture. Tout le monde est content.",
      "Sauf que ces 200 € viennent d&rsquo;entrer dans votre <strong>chiffre d&rsquo;affaires encaissé</strong>. Et en micro-entreprise, le chiffre d&rsquo;affaires encaissé est exactement ce sur quoi l&rsquo;URSSAF calcule vos cotisations. Vous ne gagnez pas un centime sur ce train, mais vous payez des cotisations dessus — autour de 21 % à 25 % selon votre activité. Sur 200 €, cela fait 45 à 51 € qui sortent de votre poche pour un déplacement que vous avez avancé.",
      "C&rsquo;est la partie que la plupart des pages sur la refacturation de frais passent sous silence : elles expliquent le mécanisme comptable, jamais la facture URSSAF au bout. Et l&rsquo;effet se cumule : les mêmes 200 € comptent aussi dans votre plafond de régime micro et dans votre seuil de TVA.",
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "La règle de base, avant toute subtilité",
    texte:
      "Tout ce que vous encaissez est du chiffre d&rsquo;affaires. Un frais refacturé n&rsquo;est pas une dépense neutralisée : c&rsquo;est une recette de plus. En micro-entreprise, vous ne déduisez <strong>aucune charge réelle</strong> — l&rsquo;abattement forfaitaire est censé les couvrir, qu&rsquo;elles aient existé ou non. Il n&rsquo;existe qu&rsquo;une seule porte de sortie, le <strong>débours</strong>, et elle est étroite.",
  },
  {
    type: "texte",
    titre: "Le débours : la seule somme qui ne vous appartient jamais",
    paragraphes: [
      "Le débours est une dépense que vous engagez <strong>au nom et pour le compte de votre client</strong>. Juridiquement, vous n&rsquo;achetez rien : vous avancez l&rsquo;argent de quelqu&rsquo;un d&rsquo;autre, comme un mandataire. L&rsquo;article 267, II-2° du Code général des impôts exclut ces sommes de la base d&rsquo;imposition, et la doctrine fiscale en tire la conséquence : ce n&rsquo;est pas votre recette, donc ce n&rsquo;est pas votre chiffre d&rsquo;affaires.",
      "La différence avec une refacturation ordinaire ne tient pas au type de dépense. Un billet de train peut être un débours ou non ; c&rsquo;est la façon dont il a été engagé qui tranche. Et l&rsquo;administration exige quatre conditions réunies, pas trois.",
    ],
  },
  {
    type: "liste",
    titre: "Les quatre conditions du débours",
    intro:
      "Elles sont énoncées au paragraphe 200 du BOI-TVA-BASE-10-10-30. Il manque une seule d&rsquo;entre elles et la somme redevient du chiffre d&rsquo;affaires ordinaire.",
    numerotee: true,
    items: [
      {
        titre: "Un mandat préalable et explicite",
        texte:
          "La dépense est engagée <strong>au nom du client, pas au vôtre</strong>, en vertu d&rsquo;un mandat donné <em>avant</em> l&rsquo;achat. Un accord oral après coup ne suffit pas : il faut une trace écrite antérieure à la dépense — une clause du devis, un mail d&rsquo;autorisation, une ligne du contrat.",
      },
      {
        titre: "Une reddition de compte précise",
        texte:
          "Vous rendez compte du détail : quelle dépense, pour quel montant, à quelle date. Un total forfaitaire « frais de déplacement : 200 € » ne constitue pas une reddition de compte.",
      },
      {
        titre: "Le montant exact, justifiable",
        texte:
          "Vous refacturez <strong>à l&rsquo;euro près</strong>, sans marge ni arrondi. Ajoutez 10 % « pour le temps passé » et ce n&rsquo;est plus un débours : c&rsquo;est une prestation. Les justificatifs originaux doivent pouvoir être produits à l&rsquo;administration.",
      },
      {
        titre: "Une inscription en compte de passage",
        texte:
          "La somme transite par un compte de tiers, pas par un compte de produit. En micro-entreprise, où la comptabilité se réduit à un livre des recettes, cela se traduit simplement : le débours n&rsquo;est <strong>pas inscrit dans le livre des recettes</strong>, mais suivi à part avec ses justificatifs.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "La conséquence pratique qui surprend",
    texte:
      "Si la dépense est un vrai débours, <strong>la facture du fournisseur doit être au nom du client</strong>, pas au vôtre. Un billet de train à votre nom, payé avec votre carte, est très difficile à défendre comme débours : vous avez acheté un service pour vous-même. C&rsquo;est pour cette raison que le débours fonctionne bien sur un achat de matériel ou une prestation commandée pour le client, et mal sur un déplacement personnel.",
  },
  {
    type: "comparaison",
    titre: "Débours ou frais refacturé : le même train, deux traitements",
    intro:
      "Vous vous rendez chez un client à Lyon. Billet 90 €, hôtel 110 €. Selon la façon dont cela a été organisé, le résultat n&rsquo;est pas le même.",
    colonnes: [
      {
        titre: "Frais refacturé",
        sousTitre: "le cas courant",
        ton: "negatif",
        texte:
          "Vous réservez à votre nom, vous payez, vous ajoutez 200 € sur votre facture. Ces 200 € entrent dans votre CA : cotisations dessus, comptés dans le plafond micro, comptés dans le seuil de TVA. Coût réel pour vous : environ 45 à 51 € de cotisations sur de l&rsquo;argent que vous ne gardez pas.",
      },
      {
        titre: "Débours",
        sousTitre: "le cas encadré",
        ton: "positif",
        texte:
          "Le client vous a mandaté par écrit pour réserver <em>en son nom</em>. Les factures sont à son nom. Vous lui remettez le détail et les justificatifs, vous réclamez 200 € exactement. Hors CA, hors cotisations, hors plafonds. Mais les quatre conditions doivent tenir si l&rsquo;URSSAF ou le fisc regarde.",
      },
      {
        titre: "La troisième voie",
        sousTitre: "souvent la meilleure",
        ton: "neutre",
        texte:
          "Le client réserve et paie lui-même le train et l&rsquo;hôtel. Rien ne transite par vous : ni avance de trésorerie, ni question de qualification, ni risque. C&rsquo;est la solution la plus simple, et celle que trop peu de freelances proposent.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Ce que ça change quand on est assujetti à la TVA",
    paragraphes: [
      "En franchise en base, la question est purement sociale : CA ou pas CA, cotisations ou pas cotisations. Dès que vous êtes assujetti à la TVA, une seconde mécanique s&rsquo;ajoute.",
      "Un frais refacturé ordinaire est un élément du prix de votre prestation : il suit <strong>votre</strong> taux de TVA, pas celui de la dépense d&rsquo;origine. Refacturer un billet de train (TVA 10 %) dans une prestation de conseil se fait à 20 %. C&rsquo;est une erreur classique, et elle se voit immédiatement en contrôle.",
      "Un débours, lui, est exclu de la base d&rsquo;imposition : il ressort sur la facture <strong>hors du calcul de la TVA</strong>, pour son montant exact, TVA d&rsquo;origine comprise. En contrepartie, vous ne récupérez pas cette TVA — elle appartient au client, qui la déduira s&rsquo;il le peut.",
    ],
  },
  {
    type: "tableau",
    titre: "Récapitulatif des trois situations",
    colonnes: ["", "Entre dans le CA ?", "Cotisations ?", "TVA appliquée"],
    lignes: [
      ["Frais refacturé", "<strong>Oui</strong>", "<strong>Oui</strong>", "Votre taux de prestation"],
      ["Débours (4 conditions réunies)", "Non", "Non", "Aucune, montant TTC d&rsquo;origine"],
      ["Frais payé directement par le client", "Non", "Non", "Hors de votre facture"],
    ],
    note:
      "En cas de doute sur la qualification, c&rsquo;est la première colonne qui s&rsquo;applique : l&rsquo;administration part du principe que ce que vous encaissez est à vous.",
  },
  {
    type: "liste",
    titre: "Ce qu&rsquo;il faut écrire sur la facture",
    intro:
      "La qualification se lit sur le document. Une facture mal présentée fait perdre un débours pourtant réel.",
    items: [
      {
        titre: "Pour un frais refacturé",
        texte:
          "Une ligne de prestation ordinaire : « Déplacement Lyon — 15 mars 2026 » pour 200 €, dans le total HT, avec votre TVA si vous y êtes assujetti. Rien de particulier à signaler.",
      },
      {
        titre: "Pour un débours",
        texte:
          "Un bloc distinct, <strong>après</strong> le total HT et le calcul de la TVA, intitulé « Débours — dépenses engagées au nom et pour le compte du client », avec une ligne par dépense, sa date et son montant exact. Mention utile : « Sommes exclues de la base d&rsquo;imposition — article 267, II-2° du CGI ». Les justificatifs sont joints.",
      },
      {
        titre: "Dans les deux cas",
        texte:
          "Le devis l&rsquo;annonce. Le plafond des frais, leur nature, qui réserve, qui paie : ces quatre points écrits au devis évitent la totalité des litiges sur les frais.",
      },
    ],
  },
  {
    type: "texte",
    titre: "La solution la moins risquée : les intégrer au prix",
    paragraphes: [
      "Le débours est propre mais exigeant. Le frais refacturé est simple mais coûteux. Il existe une troisième approche, et c&rsquo;est souvent celle des freelances expérimentés : <strong>ne pas refacturer du tout</strong>.",
      "Vous annoncez un prix qui contient vos déplacements. « Mission à Lyon, 2 jours sur site, frais compris : 1 400 € ». Vous portez le risque sur le coût réel du train, mais vous récupérez trois choses : un devis plus lisible pour le client, aucune discussion de justificatifs, et un prix dont vous contrôlez la marge.",
      "L&rsquo;argument commercial est d&rsquo;ailleurs meilleur. Un client compare plus facilement deux prix fermes que deux prix plus des frais variables à venir.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Si vous ne retenez qu&rsquo;une chose",
    texte:
      "Avant d&rsquo;avancer un frais, posez la question : <em>est-ce que quelqu&rsquo;un peut le payer directement à ma place ?</em> Si oui, faites-le payer par le client. Le débours n&rsquo;est utile que quand vous devez vraiment engager la dépense — et dans ce cas, le mandat écrit doit précéder l&rsquo;achat, pas le suivre.",
  },
];

const FAQ = [
  {
    q: "Les frais refacturés comptent-ils dans mon chiffre d'affaires en micro-entreprise ?",
    a: "Oui, sauf s'ils remplissent les quatre conditions du débours. Une refacturation ordinaire est une recette comme une autre : elle entre dans le chiffre d'affaires déclaré à l'URSSAF, supporte les cotisations, et compte dans le plafond du régime micro comme dans le seuil de franchise en base de TVA.",
  },
  {
    q: "Puis-je déduire mes frais professionnels en micro-entreprise ?",
    a: "Non. Le régime micro repose sur un abattement forfaitaire censé représenter vos charges. Aucune dépense réelle n'est déductible, qu'elle soit refacturée ou non. C'est précisément pour cela que la refacturation coûte des cotisations : la recette est imposée, la dépense n'est jamais déduite.",
  },
  {
    q: "Quelles sont les conditions exactes d'un débours ?",
    a: "Quatre conditions cumulatives, énoncées par la doctrine fiscale : un mandat préalable et explicite du client, une dépense engagée en son nom et non au vôtre, une reddition de compte précise avec le montant exact et ses justificatifs, et une inscription en compte de passage plutôt qu'en produit. Si une seule manque, la somme redevient du chiffre d'affaires.",
  },
  {
    q: "Puis-je prendre une marge sur un frais refacturé ?",
    a: "Sur un frais refacturé ordinaire, oui : c'est un élément de votre prix, vous le fixez. Sur un débours, non : le montant exact est l'une des quatre conditions, et toute marge fait perdre la qualification pour l'ensemble de la somme.",
  },
  {
    q: "Quel taux de TVA appliquer à un frais refacturé ?",
    a: "Le vôtre, celui de votre prestation — pas celui de la dépense d'origine. Un billet de train à 10 % refacturé dans une mission de conseil est soumis à 20 %. Le débours échappe à cette règle puisqu'il sort de la base d'imposition : il est réclamé pour son montant d'origine, TVA comprise, et vous ne déduisez pas cette TVA.",
  },
  {
    q: "Faut-il joindre les justificatifs à la facture ?",
    a: "Pour un débours, oui : la reddition de compte et la justification du montant exact en font partie. Pour un frais refacturé ordinaire, ce n'est pas une obligation fiscale, mais la plupart des clients l'exigent contractuellement — et cela évite les discussions au paiement.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "BOFiP — BOI-TVA-BASE-10-10-30, base d'imposition : sommes exclues",
    url: "https://bofip.impots.gouv.fr/bofip/488-PGP.html/identifiant=BOI-TVA-BASE-10-10-30-20220511",
    precision: "§ 200 à 230 : les quatre conditions du débours",
  },
  {
    libelle: "Légifrance — article 267 du Code général des impôts",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006304615",
    precision: "II-2° : exclusion des sommes remboursées aux intermédiaires",
  },
  {
    libelle: "URSSAF — déterminer son chiffre d'affaires en micro-entreprise",
    url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/determiner-mon-chiffre-daffaires.html",
    precision: "assiette des cotisations : sommes effectivement encaissées",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Un train à 90 €, un hôtel à 110 €, et votre client vous les rembourse : vous venez d&rsquo;ajouter 200 € à votre chiffre d&rsquo;affaires et de payer des cotisations sur de l&rsquo;argent que vous ne gardez pas. Il existe une sortie — le débours — mais elle a quatre conditions, et elles sont strictes."
      enBref={[
        "Un frais refacturé est une <strong>recette</strong> : il entre dans le CA, supporte les cotisations, compte dans les plafonds.",
        "Seul le <strong>débours</strong> échappe à cette règle : dépense engagée au nom du client, sur mandat préalable écrit, au montant exact, hors livre des recettes.",
        "Les quatre conditions sont <strong>cumulatives</strong>. Une marge, un mandat postérieur, une facture à votre nom : la qualification tombe.",
        "Un frais refacturé suit <strong>votre</strong> taux de TVA, pas celui de la dépense d&rsquo;origine.",
        "La voie la plus sûre reste souvent la plus simple : faire payer le frais directement par le client, ou l&rsquo;intégrer au prix.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Des frais séparés du chiffre d&rsquo;affaires, sans tableur",
        texte:
          "Deviso distingue les frais refacturés des débours sur vos devis et vos factures, et ne compte dans votre chiffre d&rsquo;affaires que ce qui doit y entrer.",
      }}
    />
  );
}
