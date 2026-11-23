import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "trajectoire-conformite-facturation-electronique-cabinet";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Ce que l'administration a dit pour le démarrage",
    paragraphes: [
      "En juillet 2026, la DGFiP a publié un <strong>guide pratique de démarrage</strong> de la facturation électronique. Il tient en trois principes : le calendrier légal est maintenu, l'activité économique ne doit pas s'interrompre, et les entreprises qui rencontrent des difficultés réelles seront distinguées de celles qui restent inactives.",
      "Le guide le dit sans ambiguïté : cette approche ne constitue <strong>ni un report ni une suspension</strong> de l'obligation. Elle déplace en revanche la question que le cabinet doit se poser pour chaque client. Il ne s'agit plus seulement de savoir si le client est conforme, mais s'il peut <strong>prouver</strong> qu'il est engagé dans une trajectoire sérieuse de mise en conformité.",
      "Pour un cabinet, c'est un sujet concret : l'expert-comptable est cité à plusieurs reprises dans ce guide comme l'un des interlocuteurs par lesquels l'entreprise peut entrer dans le dispositif, et comme l'un de ceux avec qui elle doit traiter ses difficultés.",
    ],
  },
  {
    type: "tableau",
    titre: "Où en sont vos clients, selon leur taille",
    intro:
      "La taille s'apprécie par unité légale (SIREN), selon les critères de la loi de modernisation de l'économie. Le calendrier ne pose pas la même question à tout le portefeuille.",
    colonnes: ["Situation du client", "Obligation en vigueur", "Ce qu'il faut pouvoir montrer"],
    lignes: [
      [
        "Toute entreprise assujettie",
        "Réception par une plateforme agréée depuis le 1er septembre 2026",
        "Le choix ou la contractualisation d'une plateforme de réception",
      ],
      [
        "Grande entreprise ou ETI",
        "Émission électronique et e-reporting depuis le 1er septembre 2026",
        "Les flux déjà émis, ceux qui restent à stabiliser, les incidents et leur suivi",
      ],
      [
        "PME, TPE, micro-entreprise",
        "Émission et e-reporting au 1er septembre 2027 au plus tard",
        "La réception en place, et une préparation de l'échéance de 2027 qui avance",
      ],
    ],
    note: "Une PME peut entrer volontairement dans l'émission avant 2027. Le guide précise qu'un client ne peut pas lui imposer, au titre de l'obligation légale, une émission électronique avant son échéance.",
  },
  {
    type: "liste",
    titre: "Les preuves que cite le guide",
    intro:
      "La question 27 du guide énumère les éléments utiles pour démontrer une trajectoire sérieuse. Ce sont des pièces que le cabinet est souvent le mieux placé pour réunir avec son client.",
    items: [
      {
        titre: "Le choix de la plateforme",
        texte:
          "Le choix ou la contractualisation d'une plateforme agréée, avec sa date.",
      },
      {
        titre: "Les échanges avec les prestataires",
        texte:
          "Les échanges avec l'éditeur, l'expert-comptable, la banque, la plateforme ou le prestataire technique.",
      },
      {
        titre: "Le calendrier de déploiement",
        texte:
          "Le calendrier de raccordement, de paramétrage ou de déploiement, et les tests réalisés ou programmés.",
      },
      {
        titre: "La cartographie des flux",
        texte:
          "Les flux déjà traités par voie électronique, et ceux qui restent à stabiliser.",
      },
      {
        titre: "Les traces d'incident",
        texte:
          "Les tickets support, messages d'erreur et notifications d'incident, avec les dates de signalement et de résolution.",
      },
      {
        titre: "Les mesures transitoires et la régularisation",
        texte:
          "Les modalités retenues pour assurer la continuité de l'activité, et les actions prévues pour régulariser les factures ou les données qui n'ont pas suivi le circuit attendu.",
      },
      {
        titre: "Les consignes internes",
        texte:
          "Les consignes données aux équipes chargées de la facturation, de la comptabilité ou du paiement.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Une déclaration d'intention ne suffit pas",
    texte:
      "Le guide est explicite : l'entreprise doit pouvoir produire des éléments <strong>concrets, datés et cohérents</strong>. Un courriel de principe envoyé en août ne prouve rien. Un dossier qui montre une plateforme choisie, un paramétrage daté, des incidents signalés et suivis, en revanche, permet de distinguer une difficulté de démarrage d'une absence de préparation.",
  },
  {
    type: "texte",
    titre: "Quand le problème vient d'un tiers",
    paragraphes: [
      "C'est la situation la plus fréquente au démarrage : la plateforme, l'éditeur ou le logiciel ne suit pas. Selon le guide, l'entreprise n'a pas vocation à être sanctionnée du seul fait d'une défaillance imputable à un tiers, <strong>dès lors qu'elle peut démontrer</strong> qu'elle a pris les dispositions relevant de sa responsabilité.",
      "Concrètement, il faut pouvoir établir qu'une solution permettant d'entrer dans le dispositif a été retenue, que la difficulté a été signalée au prestataire, que sa résolution a été suivie, et que des mesures transitoires ont été mises en place. Le guide ajoute une limite : la défaillance d'un tiers ne doit pas servir à <strong>différer durablement</strong> l'entrée dans le dispositif.",
      "Pour le cabinet, c'est un argument pour conserver une trace écrite des échanges avec le client sur ces sujets. La relance envoyée au client, sa réponse, la date du raccordement : ces pièces font partie de sa trajectoire.",
    ],
  },
  {
    type: "comparaison",
    titre: "Deux dossiers face à une demande de l'administration",
    intro:
      "L'administration pourra prendre contact avec les entreprises en situation de non-conformité. L'entreprise devra alors répondre de manière complète et documentée.",
    colonnes: [
      {
        titre: "Dossier non documenté",
        sousTitre: "Difficile à défendre",
        ton: "negatif",
        texte:
          "Aucune date de choix de plateforme, des incidents réglés par téléphone, des factures renvoyées par courriel sans trace de la tentative électronique. Rien ne distingue la difficulté réelle de l'inertie.",
      },
      {
        titre: "Dossier documenté",
        sousTitre: "La trajectoire se lit",
        ton: "positif",
        texte:
          "Plateforme contractualisée et datée, flux identifiés, rejets et incidents tracés avec leur suivi, régularisations rattachées à la facture d'origine. La situation s'explique en quelques pièces.",
      },
    ],
  },
  {
    type: "liste",
    titre: "Trois points de vigilance à rappeler aux clients",
    numerotee: true,
    items: [
      {
        titre: "Ne pas créer de doublon",
        texte:
          "Une facture tentée par voie électronique puis transmise par un canal habituel reste une seule opération. Le guide insiste : pas de double paiement, de double comptabilisation ni de double déclaration.",
      },
      {
        titre: "Régulariser, pas recréer",
        texte:
          "Régulariser consiste, selon les cas, à transmettre électroniquement la même facture, à corriger une facture rejetée ou à transmettre les données attendues. Cela ne doit pas conduire à créer artificiellement une nouvelle opération.",
      },
      {
        titre: "Ne pas bloquer les paiements",
        texte:
          "Une difficulté de réception ou d'intégration ne justifie ni de refuser le traitement d'une facture reçue, ni de retarder artificiellement son paiement.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Les sanctions restent prévues par les textes",
    texte:
      "Le guide le rappelle : le défaut d'émission électronique est sanctionné par une amende par facture (article 1737 du CGI), le défaut de transmission des données relève de l'article 1788 D, et le défaut de recours à une plateforme agréée en réception donne lieu à une <strong>mise en demeure de se conformer dans un délai de trois mois</strong> avant toute amende. L'approche de démarrage ne couvre pas l'inertie, l'évitement ou le refus durable d'entrer dans le dispositif.",
  },
  {
    type: "texte",
    titre: "Ce que Deviso garde comme trace",
    paragraphes: [
      "Pour les clients qui facturent avec Deviso, une partie de ces preuves existe sans effort : les factures émises passent par la plateforme agréée comprise dans l'abonnement, et leur statut, rejets compris, reste attaché à chaque facture. Côté cabinet, le cockpit fait remonter les anomalies du portefeuille, dont les factures rejetées, et vous pouvez signaler une anomalie précise au client, qui la voit dans son tableau de bord.",
      "Cela ne remplace pas le dossier de trajectoire, qui reste celui du client. Mais une partie des pièces les plus difficiles à reconstituer après coup, les dates et les statuts, est déjà conservée.",
    ],
  },
];

const FAQ = [
  {
    q: "La DGFiP a-t-elle reporté la facturation électronique ?",
    a: "Non. Le guide pratique de démarrage de juillet 2026 maintient le calendrier légal et précise que son approche ne constitue ni un report ni une suspension de l'obligation. Elle tient compte des difficultés réelles, documentées et suivies d'actions de correction.",
  },
  {
    q: "Qu'est-ce qu'une trajectoire sérieuse de mise en conformité ?",
    a: "C'est la situation d'une entreprise qui a identifié ses obligations, engagé les travaux nécessaires et organisé le traitement de ses difficultés. Elle doit pouvoir le montrer par des éléments concrets et datés : choix de plateforme, calendrier de raccordement, tests, incidents suivis, mesures transitoires.",
  },
  {
    q: "Mon client est-il sanctionné si sa plateforme est défaillante ?",
    a: "Selon le guide, l'entreprise n'a pas vocation à être sanctionnée du seul fait d'une défaillance imputable à un tiers, dès lors qu'elle démontre avoir pris les dispositions relevant de sa responsabilité : solution retenue, difficulté signalée, résolution suivie, mesures transitoires.",
  },
  {
    q: "Que risque une entreprise qui n'a toujours pas de plateforme de réception ?",
    a: "Le défaut de recours à une plateforme agréée en réception donne lieu à une mise en demeure de se conformer dans un délai de trois mois, avant toute application de l'amende prévue par l'article 1737 du CGI en cas de persistance du manquement.",
  },
  {
    q: "Faut-il signaler chaque incident à l'administration ?",
    a: "Non. Le guide précise qu'il n'est pas attendu des entreprises qu'elles signalent chaque incident ponctuel ou rejet isolé. Ces situations se traitent avec la plateforme, l'éditeur, l'expert-comptable ou le client concerné, en conservant les éléments utiles.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "impots.gouv.fr, Facturation électronique : guide pratique de démarrage au 1er septembre 2026",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf",
    precision: "DGFiP, juillet 2026 : trajectoire de conformité, preuves, incidents de tiers, sanctions (questions 25 à 29)",
  },
  {
    libelle: "impots.gouv.fr, Foire aux questions, Je découvre la facturation électronique",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf",
    precision: "version du 01/09/2026 : calendrier de réception et d'émission selon la taille",
  },
  {
    libelle: "impots.gouv.fr, Foire aux questions, J'approfondis la facturation électronique",
    url: "https://www.impots.gouv.fr/foire-aux-questions-japprofondis-la-facturation-electronique",
    precision: "question 1.1 : appréciation de la taille de l'entreprise",
  },
  {
    libelle: "Légifrance, Code général des impôts, articles 289-0 à 289 bis (factures)",
    url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006191855",
    precision: "article 289 bis : recours obligatoire à une plateforme agréée",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Depuis septembre 2026, la DGFiP ne sanctionne pas aveuglément les difficultés de démarrage, à condition qu'elles soient réelles, documentées et suivies. Pour le cabinet, la question devient : chaque client peut-il prouver sa trajectoire de conformité ?"
      enBref={[
        "Le guide de démarrage de la DGFiP maintient le calendrier : <strong>ni report, ni suspension</strong>.",
        "Les difficultés sont appréciées si elles sont <strong>réelles, documentées et suivies</strong> d'actions de correction.",
        "Le guide liste les preuves utiles : plateforme choisie, calendrier, tests, incidents, mesures transitoires.",
        "Une défaillance d'un tiers n'est pas sanctionnée en soi, si l'entreprise a fait ce qui dépendait d'elle.",
        "Le cabinet est bien placé pour aider chaque client à constituer ce <strong>dossier de trajectoire</strong>.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Suivre la conformité de vos clients",
        texte:
          "Le cockpit cabinet de Deviso montre, dossier par dossier, l'état de conformité et les anomalies à traiter, dont les factures rejetées. Il est gratuit pour le cabinet, et nous cherchons des cabinets pilotes pour le construire avec eux.",
      }}
    />
  );
}
