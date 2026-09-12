import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "facturation-electronique-petit-chiffre-affaires";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "La question que personne ne pose à voix haute",
    paragraphes: [
      "Sur les forums de micro-entrepreneurs, la même inquiétude revient, formulée presque toujours de la même façon : <em>je fais 800 € de chiffre d&rsquo;affaires dans l&rsquo;année, on me parle d&rsquo;un abonnement à 15 ou 20 € par mois, est-ce que je ne devrais pas simplement arrêter ?</em>",
      "C&rsquo;est une question légitime, et la réponse est non — mais pas parce qu&rsquo;il faudrait « faire un effort ». Parce que le calcul sur lequel repose l&rsquo;inquiétude est faux : une grande partie des très petites activités n&rsquo;a, en réalité, <strong>aucun abonnement à payer</strong>, et certaines ne sont même pas concernées par l&rsquo;obligation d&rsquo;émettre.",
      "Le problème est que la réforme est presque toujours présentée en bloc. Découpée correctement, elle se réduit à deux ou trois questions simples.",
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Il n&rsquo;y a pas une obligation, il y en a trois",
    texte:
      "<strong>Recevoir</strong> des factures électroniques : obligatoire pour toutes les entreprises depuis le 1<sup>er</sup> septembre 2026, sans exception de taille. <strong>Émettre</strong> des factures électroniques : depuis le 1<sup>er</sup> septembre 2026 pour les grandes entreprises et les ETI, à partir du <strong>1<sup>er</sup> septembre 2027</strong> pour les TPE, PME et micro-entreprises. <strong>E-reporting</strong> : transmettre les données des opérations qui ne passent pas par la facture électronique (ventes aux particuliers, clients étrangers), au même calendrier que l&rsquo;émission. Mélanger ces trois dates est la source de la moitié de l&rsquo;angoisse.",
  },
  {
    type: "texte",
    titre: "Première question : qui sont vos clients ?",
    paragraphes: [
      "C&rsquo;est la question décisive, et elle passe avant toute considération de prix.",
      "L&rsquo;obligation de facture électronique ne concerne que les opérations <strong>entre entreprises établies en France</strong>. Si vous ne facturez que des <strong>particuliers</strong> — cours, coaching, artisanat vendu sur un marché ou en ligne à des consommateurs —, vous n&rsquo;aurez jamais à émettre de facture électronique pour ces ventes. Vous continuerez à remettre un document ordinaire à vos clients.",
      "Ce qui vous concernera à partir de septembre 2027, dans ce cas, c&rsquo;est l&rsquo;<strong>e-reporting</strong> : la transmission des données de ces transactions — pas la facture elle-même, pas son format, pas son canal. Une contrainte réelle, mais d&rsquo;une nature différente, et que la plupart des outils de facturation traiteront sans que vous ayez à y penser.",
      "Si en revanche vous facturez ne serait-ce qu&rsquo;un seul client professionnel français, vous entrez dans l&rsquo;obligation d&rsquo;émission — pour ces factures-là — à partir du 1<sup>er</sup> septembre 2027.",
    ],
  },
  {
    type: "comparaison",
    titre: "Trois profils de très petite activité",
    intro: "La réforme ne dit pas la même chose aux trois.",
    colonnes: [
      {
        titre: "Uniquement des particuliers",
        sousTitre: "cours, artisanat, services aux ménages",
        ton: "positif",
        texte:
          "Aucune facture électronique à émettre, jamais. Une obligation de <strong>réception</strong> à satisfaire dès aujourd&rsquo;hui, et un <strong>e-reporting</strong> à partir de septembre 2027. Le besoin réel est un canal de réception, pas un outil d&rsquo;émission.",
      },
      {
        titre: "Quelques clients pros par an",
        sousTitre: "le cas le plus fréquent",
        ton: "neutre",
        texte:
          "Réception dès maintenant, émission électronique vers ces clients à partir de septembre 2027. Quelques factures par an : les offres gratuites ou à quelques euros suffisent largement. Le volume, pas le statut, détermine le coût.",
      },
      {
        titre: "Activité dormante, zéro facture",
        sousTitre: "micro-entreprise en sommeil",
        ton: "neutre",
        texte:
          "Rien à émettre, donc rien à transmettre. Mais l&rsquo;obligation de <strong>réception</strong> reste : une entreprise immatriculée est censée pouvoir recevoir une facture électronique, même si elle n&rsquo;en attend aucune. Et les déclarations de chiffre d&rsquo;affaires, même à zéro, restent dues.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Deuxième question : combien ça coûte réellement ?",
    paragraphes: [
      "Il faut d&rsquo;abord écarter une fausse piste, parce qu&rsquo;elle circule encore beaucoup : <strong>le portail public de facturation ne fournira pas de service gratuit d&rsquo;émission et de réception</strong>. Ce rôle a été abandonné en octobre 2024 ; le portail public conserve des fonctions d&rsquo;annuaire et de concentration des données, mais ce n&rsquo;est plus lui qui transportera vos factures. Les articles plus anciens qui promettaient « une solution gratuite de l&rsquo;État » sont périmés — et ils sont nombreux.",
      "Le transport passe donc par une <strong>plateforme agréée</strong>. Mais « plateforme agréée » ne veut pas dire « abonnement mensuel ». Le marché s&rsquo;est structuré autour de trois niveaux, et les très petites activités relèvent des deux premiers.",
    ],
  },
  {
    type: "liste",
    titre: "Les trois niveaux de coût, honnêtement",
    numerotee: true,
    items: [
      {
        titre: "Réception seule : gratuit chez plusieurs acteurs",
        texte:
          "Plusieurs plateformes ouvrent la réception sans frais, parce qu&rsquo;elle leur sert de point d&rsquo;entrée commercial. C&rsquo;est exactement ce dont a besoin une activité qui ne facture que des particuliers : une adresse où les factures de vos fournisseurs arrivent, et de quoi les lire.",
      },
      {
        titre: "Très petits volumes : gratuit ou quelques euros",
        texte:
          "Des offres existent avec un quota de factures gratuites par mois, ou une facturation à l&rsquo;unité. Pour dix ou vingt factures dans l&rsquo;année, le coût annuel se compte en euros, pas en dizaines d&rsquo;euros par mois. L&rsquo;abonnement mensuel n&rsquo;est pas la seule forme de tarification du marché.",
      },
      {
        titre: "Abonnement complet : pour qui en a l&rsquo;usage",
        texte:
          "Les 15 à 30 € par mois correspondent à un outil de gestion complet — devis, relances, suivi des encaissements, pilotage des seuils. C&rsquo;est cher pour 800 € de CA annuel, et ça n&rsquo;a rien d&rsquo;obligatoire. Ne payez pour un outil de gestion que si vous voulez un outil de gestion.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le vrai risque n&rsquo;est pas le coût, c&rsquo;est de ne rien faire",
    texte:
      "La loi de finances pour 2026 a porté les sanctions à <strong>50 € par facture</strong> non émise au format requis et <strong>500 € par transmission</strong> manquante d&rsquo;e-reporting, plafonnées à 15 000 € par an. Un défaut de réception est sanctionné de <strong>500 €</strong>, puis de 1 000 € en cas de réitération dans les trois mois. Sur une très petite activité, le premier manquement coûte donc presque toujours plus cher que l&rsquo;année entière d&rsquo;une offre adaptée. Le calcul qui conduit à « arrêter pour éviter les frais » se retourne dès le premier oubli.",
  },
  {
    type: "texte",
    titre: "Ce qu&rsquo;il faut faire, maintenant, et dans quel ordre",
    paragraphes: [
      "La réception est déjà obligatoire : c&rsquo;est donc par là qu&rsquo;on commence, et c&rsquo;est la partie la moins coûteuse. L&rsquo;émission a encore près d&rsquo;un an devant elle.",
    ],
  },
  {
    type: "liste",
    titre: "Votre liste, dans l&rsquo;ordre",
    numerotee: true,
    items: [
      {
        titre: "Vérifiez que vos données d&rsquo;entreprise sont à jour",
        texte:
          "SIREN, adresse, activité. C&rsquo;est l&rsquo;annuaire de la réforme qui permettra à vos fournisseurs et à vos clients de vous adresser une facture. Une donnée fausse dans l&rsquo;annuaire est un blocage silencieux.",
      },
      {
        titre: "Choisissez un canal de réception",
        texte:
          "Une plateforme agréée, en privilégiant les offres dont la réception est gratuite. C&rsquo;est l&rsquo;étape obligatoire aujourd&rsquo;hui, et elle ne vous engage pas sur l&rsquo;émission.",
      },
      {
        titre: "Répondez à la question « clients pros ou particuliers ? »",
        texte:
          "Si la réponse est « aucun client professionnel français », vous n&rsquo;avez pas d&rsquo;émission électronique à préparer — seulement l&rsquo;e-reporting de septembre 2027.",
      },
      {
        titre: "Si vous avez des clients pros : comparez sur le volume",
        texte:
          "Comptez vos factures de l&rsquo;année passée et écartez d&rsquo;emblée les offres dont la tarification ne correspond pas à ce volume. Dix factures par an ne justifient pas un abonnement pensé pour dix par semaine.",
      },
      {
        titre: "Mettez vos mentions obligatoires à niveau avant l&rsquo;échéance",
        texte:
          "Quatre données deviennent obligatoires sur les factures : le <strong>SIREN</strong> du client, l&rsquo;<strong>adresse de livraison</strong> quand elle diffère de l&rsquo;adresse de facturation, la <strong>nature de l&rsquo;opération</strong> (biens, services ou les deux) et l&rsquo;<strong>option de paiement de la TVA sur les débits</strong> lorsqu&rsquo;elle est exercée. Les ajouter dès maintenant coûte moins que de les ajouter sous contrainte.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Et la tolérance annoncée ?",
    paragraphes: [
      "Le guide de démarrage publié par la DGFiP en juillet 2026 évoque une tolérance pour les difficultés techniques documentées. Il faut lire cette formulation pour ce qu&rsquo;elle est : l&rsquo;administration précise expressément qu&rsquo;il ne s&rsquo;agit <strong>ni d&rsquo;un report, ni d&rsquo;une suspension</strong> de la réforme.",
      "Autrement dit, une tolérance s&rsquo;adresse à qui a entrepris la démarche et a rencontré un obstacle — pas à qui n&rsquo;a rien commencé. Le raisonnement « ça va encore être repoussé » a déjà coûté cher à beaucoup d&rsquo;entreprises sur les échéances précédentes de cette réforme.",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Ce qu&rsquo;il faut retenir si vous hésitez à continuer votre activité",
    texte:
      "Une très petite activité n&rsquo;a pas à payer un abonnement mensuel pour être en règle. Elle a besoin d&rsquo;un <strong>canal de réception</strong>, souvent gratuit, et — seulement si elle facture des professionnels français — d&rsquo;un moyen d&rsquo;émettre au format requis d&rsquo;ici septembre 2027, pour un coût proportionné à son volume. Arrêter une activité rentable à cause d&rsquo;un abonnement qu&rsquo;on n&rsquo;est pas obligé de prendre serait la seule vraie mauvaise décision.",
  },
];

const FAQ = [
  {
    q: "Je fais moins de 1 000 € de chiffre d'affaires par an : suis-je concerné par la facturation électronique ?",
    a: "Oui, mais pas par tout. L'obligation de recevoir des factures électroniques s'applique à toutes les entreprises depuis le 1er septembre 2026, sans seuil de chiffre d'affaires. L'obligation d'émettre ne concerne que les factures adressées à des entreprises établies en France, à partir du 1er septembre 2027. Si vous ne facturez que des particuliers, vous n'aurez jamais de facture électronique à émettre.",
  },
  {
    q: "Existe-t-il une solution gratuite de l'État ?",
    a: "Non, plus depuis octobre 2024 : le portail public de facturation n'assurera pas de service gratuit d'émission et de réception. Il conserve un rôle d'annuaire et de concentration des données. Les articles qui promettent encore une solution gratuite de l'État n'ont pas été mis à jour.",
  },
  {
    q: "Puis-je être en règle sans payer d'abonnement mensuel ?",
    a: "Dans beaucoup de cas, oui. Plusieurs plateformes agréées proposent la réception gratuitement, et des offres à l'unité ou avec un quota gratuit existent pour de très petits volumes d'émission. L'abonnement à 15 ou 30 € par mois correspond à un outil de gestion complet, pas au minimum légal.",
  },
  {
    q: "Suis-je concerné si je n'ai émis aucune facture cette année ?",
    a: "Vous n'avez rien à émettre ni à transmettre, mais l'obligation de pouvoir recevoir une facture électronique s'applique à toute entreprise immatriculée, activité dormante comprise. Vos déclarations de chiffre d'affaires restent également dues, même à zéro.",
  },
  {
    q: "Quelles sont les sanctions en cas de manquement ?",
    a: "Depuis la loi de finances pour 2026 : 50 € par facture non émise au format requis, 500 € par transmission d'e-reporting manquante, avec un plafond de 15 000 € par an. Le défaut de réception est sanctionné de 500 €, puis 1 000 € en cas de réitération dans les trois mois.",
  },
  {
    q: "La réforme peut-elle encore être reportée ?",
    a: "Le guide de démarrage de la DGFiP de juillet 2026 prévoit une tolérance pour les difficultés techniques documentées, en précisant expressément qu'il ne s'agit ni d'un report ni d'une suspension. La tolérance vise ceux qui ont engagé la démarche, pas ceux qui n'ont rien commencé.",
  },
  {
    q: "Faut-il arrêter une toute petite activité à cause de la réforme ?",
    a: "Le coût réel de la mise en conformité d'une très petite activité est souvent nul pour la réception et faible pour l'émission, à condition de comparer les offres sur le volume réel et non sur l'abonnement. Une seule sanction coûte généralement plus cher qu'une année d'outil adapté.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "DGFiP — facturation électronique, calendrier et obligations",
    url: "https://www.impots.gouv.fr/facturation-electronique",
    precision: "réception au 1er septembre 2026, émission des TPE/PME au 1er septembre 2027",
  },
  {
    libelle: "KPMG Avocats — le schéma initialement prévu est modifié",
    url: "https://kpmg.com/av/fr/avocats/eclairages/2024/10/facturation-electronique-le-schema-initialement-prevu-est-modifie.html",
    precision: "abandon du service gratuit d'émission et de réception du portail public",
  },
  {
    libelle: "Légifrance — loi n° 2026-103 du 19 février 2026 de finances pour 2026",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052100000",
    precision: "article 123 : montants des sanctions",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="« Je fais 800 € par an, on me parle de 20 € par mois, est-ce que je ne devrais pas arrêter ? » La question revient sans cesse, et elle repose sur un calcul faux. Beaucoup de très petites activités n&rsquo;ont aucun abonnement à payer — et certaines ne sont pas concernées par l&rsquo;émission."
      enBref={[
        "<strong>Recevoir</strong> : obligatoire pour tous depuis le 1<sup>er</sup> septembre 2026. <strong>Émettre</strong> : septembre 2027 pour les TPE et micro-entreprises.",
        "Si vous ne facturez <strong>que des particuliers</strong>, vous n&rsquo;aurez jamais de facture électronique à émettre — seulement de l&rsquo;e-reporting.",
        "Le portail public de l&rsquo;État <strong>ne fournit pas</strong> de service gratuit d&rsquo;émission et de réception : ce rôle a été abandonné en 2024.",
        "La <strong>réception est gratuite</strong> chez plusieurs plateformes agréées, et de petits volumes d&rsquo;émission se facturent à l&rsquo;unité.",
        "Un seul manquement (50 € par facture, 500 € par défaut de réception) coûte plus cher qu&rsquo;une année d&rsquo;outil adapté.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Un tarif qui suit votre volume, pas l&rsquo;inverse",
        texte:
          "Deviso est pensé pour les activités qui émettent quelques factures par mois : la conformité d&rsquo;abord, sans payer pour un outil de gestion dont vous n&rsquo;avez pas l&rsquo;usage.",
      }}
    />
  );
}
