import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "fraude-faux-rib-faux-fournisseur";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Comment se déroule l&rsquo;arnaque",
    paragraphes: [
      "Le scénario est presque toujours le même. Vous recevez un message qui semble venir d&rsquo;un fournisseur habituel, ou d&rsquo;un client que vous facturez&nbsp;: ses coordonnées bancaires ont changé, merci de régler la prochaine facture sur ce nouveau RIB. Le logo est le bon, la signature aussi, parfois même la facture jointe est authentique.",
      "Derrière, un escroc qui a usurpé l&rsquo;adresse du fournisseur, piraté sa messagerie, ou simplement intercepté un échange. Le virement part sur son compte, et l&rsquo;argent disparaît en quelques heures. Les petites entreprises, indépendants compris, sont des cibles de choix&nbsp;: elles ont rarement une procédure de validation des paiements.",
    ],
  },
  {
    type: "liste",
    titre: "Les signaux qui doivent alerter",
    items: [
      {
        titre: "Un changement de RIB annoncé par e-mail",
        texte:
          "C&rsquo;est le signal le plus fréquent. Un vrai changement de banque est rare, et votre fournisseur peut toujours le confirmer autrement.",
      },
      {
        titre: "Une urgence ou une confidentialité inhabituelle",
        texte:
          "« À régler aujourd&rsquo;hui », « ne pas en parler », « je suis en déplacement, pas joignable »&nbsp;: la pression sur le délai sert à vous empêcher de vérifier.",
      },
      {
        titre: "Une adresse légèrement différente",
        texte:
          "Une lettre en plus ou en moins dans le nom de domaine, un compte de messagerie gratuite à la place de l&rsquo;adresse professionnelle habituelle.",
      },
      {
        titre: "Un compte bancaire à l&rsquo;étranger",
        texte:
          "Un fournisseur français qui vous demande soudain de payer sur un compte dans un autre pays mérite une vérification systématique.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "La règle d&rsquo;or : le contre-appel",
    texte:
      "Aucun changement de coordonnées bancaires ne se valide sur la foi d&rsquo;un e-mail. Appelez votre interlocuteur habituel <strong>sur le numéro que vous connaissez déjà</strong>, jamais sur celui indiqué dans le message suspect, et faites-lui confirmer le nouveau RIB.",
  },
  {
    type: "liste",
    titre: "Mettre en place des réflexes simples",
    items: [
      {
        titre: "Une procédure écrite pour les changements de RIB",
        texte:
          "Contre-appel obligatoire, trace de la vérification, et si possible validation par une deuxième personne avant le premier paiement sur le nouveau compte.",
      },
      {
        titre: "Sécuriser votre propre messagerie",
        texte:
          "Activez la double authentification et utilisez des mots de passe uniques. Une messagerie piratée sert aussi à envoyer de faux RIB à vos propres clients, en votre nom.",
      },
      {
        titre: "Prévenir vos clients",
        texte:
          "Indiquez-leur que vous ne changerez jamais de coordonnées bancaires par simple e-mail. Ils sauront qu&rsquo;un tel message est suspect.",
      },
      {
        titre: "Former tous ceux qui paient",
        texte:
          "Associé, assistant, comptable&nbsp;: la personne qui passe les virements doit connaître ces signaux et avoir le droit de ralentir un paiement urgent.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Si vous avez déjà payé",
    paragraphes: [
      "Chaque heure compte. <strong>Appelez immédiatement votre banque</strong> pour demander le rappel des fonds&nbsp;: plus la demande est rapide, plus les chances de récupérer l&rsquo;argent sont réelles. Elle pourra vous demander une copie de votre plainte.",
      "<strong>Déposez plainte</strong> auprès de la police ou de la gendarmerie, et conservez toutes les pièces&nbsp;: la facture d&rsquo;origine, le premier RIB, le message annonçant le changement, le second RIB, l&rsquo;ordre de virement et vos échanges. Le site officiel cybermalveillance.gouv.fr propose une fiche réflexe et peut vous orienter vers un professionnel.",
      "Attention à un point souvent ignoré&nbsp;: avoir payé l&rsquo;escroc ne règle pas, en principe, votre dette envers le vrai fournisseur. D&rsquo;où l&rsquo;intérêt de vérifier avant, plutôt que de réparer après.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Ce que change la facture électronique",
    texte:
      "Avec la réforme, les factures entre entreprises transitent par des plateformes agréées, entre entreprises identifiées par leur SIREN. Une fausse facture glissée dans une boîte mail devient plus facile à repérer. Mais la fraude au changement de RIB par message reste possible&nbsp;: le contre-appel garde toute sa valeur.",
  },
];

const FAQ = [
  {
    q: "Qu'est-ce que la fraude au faux RIB ?",
    a: "Un escroc se fait passer pour un fournisseur, un client ou un partenaire et vous demande de payer sur de nouvelles coordonnées bancaires, qui sont les siennes.",
  },
  {
    q: "Comment vérifier un changement de RIB ?",
    a: "En appelant votre interlocuteur habituel sur un numéro que vous connaissez déjà, jamais sur celui du message reçu, et en faisant confirmer les nouvelles coordonnées avant tout paiement.",
  },
  {
    q: "Que faire si j'ai payé un faux RIB ?",
    a: "Contacter immédiatement votre banque pour demander le rappel des fonds, déposer plainte, et conserver toutes les pièces : facture, RIB, messages, ordre de virement.",
  },
  {
    q: "Ai-je encore une dette envers le vrai fournisseur ?",
    a: "En principe oui : payer un usurpateur ne règle pas la dette envers le créancier réel. C'est pourquoi la vérification préalable est essentielle.",
  },
  {
    q: "Ma propre entreprise peut-elle être usurpée ?",
    a: "Oui. Si votre messagerie est piratée, de faux RIB peuvent être envoyés à vos clients en votre nom. La double authentification et une information claire à vos clients limitent ce risque.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "Cybermalveillance.gouv.fr, Fiche réflexe faux ordres de virement",
    url: "https://www.cybermalveillance.gouv.fr/medias/2021/01/230602_FicheReflexe_FauxOrdresDeVirement.pdf",
    precision: "réflexes de prévention et marche à suivre",
  },
  {
    libelle: "France Num, Comment détecter et éviter une fraude aux faux fournisseurs",
    url: "https://www.francenum.gouv.fr/guides-et-conseils/protection-contre-les-risques/protection-des-donnees/comment-detecter-et-eviter",
    precision: "signaux d'alerte et prévention",
  },
  {
    libelle: "Ministère de l'Intérieur et collectivités, Fraude aux faux ordres de virement",
    url: "https://www.collectivites-locales.gouv.fr/files/files/Ressources/D%C3%A9pliants%20LePointsur/depl-fovi_web.pdf",
    precision: "contre-appel sur des coordonnées fiabilisées",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Un e-mail d&rsquo;un fournisseur habituel annonce un changement de coordonnées bancaires, la facture jointe est authentique, et pourtant l&rsquo;argent part chez un escroc. La fraude au faux RIB peut viser toute entreprise, et d&rsquo;abord les petites structures, qui n&rsquo;ont pas toujours de procédure de validation des paiements. Quelques réflexes suffisent à s&rsquo;en protéger."
      enBref={[
        "L&rsquo;arnaque type&nbsp;: un <strong>faux changement de RIB</strong> envoyé au nom d&rsquo;un fournisseur ou d&rsquo;un client.",
        "Signaux&nbsp;: changement de RIB par e-mail, <strong>urgence</strong>, adresse légèrement différente, compte à l&rsquo;étranger.",
        "Règle d&rsquo;or&nbsp;: le <strong>contre-appel</strong> sur un numéro que vous connaissez déjà.",
        "Déjà payé&nbsp;? <strong>Banque immédiatement</strong> pour le rappel des fonds, puis plainte.",
        "La facture électronique réduit les fausses factures, mais <strong>pas la fraude au changement de RIB</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Des coordonnées bancaires qui ne bougent pas",
        texte:
          "Avec Deviso, votre IBAN est enregistré une fois dans vos réglages et repris à l&rsquo;identique sur chaque facture. Vos clients savent où payer, et un message qui prétend le contraire n&rsquo;a aucune raison d&rsquo;être.",
      }}
    />
  );
}
