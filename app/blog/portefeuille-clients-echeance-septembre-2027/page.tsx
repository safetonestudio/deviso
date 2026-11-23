import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "portefeuille-clients-echeance-septembre-2027";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Septembre 2026 n'était que la première marche",
    paragraphes: [
      "Depuis le 1er septembre 2026, toutes les entreprises assujetties doivent pouvoir recevoir des factures électroniques, et seules les grandes entreprises et les ETI sont tenues de les émettre. Pour la plupart des cabinets, l'essentiel du portefeuille est ailleurs : les <strong>PME, TPE et micro-entreprises</strong>, qui devront émettre leurs factures au format électronique et transmettre leurs données de transaction au plus tard le <strong>1er septembre 2027</strong>.",
      "Neuf mois, c'est court pour un portefeuille de plusieurs dizaines ou centaines de dossiers. Tous ne demandent pas le même travail : un consultant qui ne facture que des entreprises françaises n'a pas les mêmes chantiers qu'un commerçant qui vend à des particuliers ou qu'une PME qui exporte. Le premier travail du cabinet est donc de <strong>trier</strong>.",
    ],
  },
  {
    type: "liste",
    titre: "Ce qui change pour vos clients au 1er septembre 2027",
    items: [
      {
        titre: "L'émission électronique",
        texte:
          "Les factures entre assujettis établis en France sont émises par l'intermédiaire d'une plateforme agréée, au fil de l'eau, dès la réalisation de l'opération, comme aujourd'hui.",
      },
      {
        titre: "Le e-reporting des transactions",
        texte:
          "Les opérations avec des particuliers, certaines associations ou des opérateurs étrangers font l'objet d'une transmission de données à l'administration, par une plateforme agréée.",
      },
      {
        titre: "Le e-reporting des paiements",
        texte:
          "Pour les prestations de services, les données d'encaissement sont transmises, sauf pour les opérations internationales autoliquidées ou lorsque l'entreprise a opté pour le paiement de la TVA sur les débits.",
      },
      {
        titre: "Des données plus nombreuses",
        texte:
          "Selon la FAQ de l'administration, le recueil des données structurées est progressif : 26 données obligatoires en 2026, puis 34 dès 2027.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Vérifier la taille avant de classer un dossier",
    texte:
      "La taille s'apprécie par unité légale (SIREN), <strong>au 1er janvier 2025</strong>, sur la base du dernier exercice clos avant cette date. Une micro-entreprise, au sens de la réforme, compte moins de 10 personnes et un chiffre d'affaires ou un total de bilan n'excédant pas 2 millions d'euros ; une PME moins de 250 personnes et un chiffre d'affaires n'excédant pas 50 millions d'euros ou un total de bilan n'excédant pas 43 millions d'euros. Un client classé ETI aurait dû émettre dès septembre 2026 : c'est le premier contrôle à faire.",
  },
  {
    type: "tableau",
    titre: "Trier le portefeuille par profil",
    intro:
      "Le chantier dépend moins de la taille du client que de la nature de ses opérations. Une grille simple suffit à prioriser.",
    colonnes: ["Profil de client", "Chantier principal", "Priorité"],
    lignes: [
      [
        "Ventes et prestations à des entreprises françaises uniquement",
        "Émission électronique, SIREN des clients dans le fichier",
        "Normale",
      ],
      [
        "Ventes à des particuliers (commerce, artisanat, services à la personne)",
        "E-reporting des transactions, en plus de l'émission",
        "Haute",
      ],
      [
        "Clients ou fournisseurs à l'étranger",
        "E-reporting des opérations internationales, facture par facture",
        "Haute",
      ],
      [
        "Prestataire de services sans option pour les débits",
        "E-reporting des paiements : encaissements à rapprocher",
        "Haute",
      ],
      [
        "Micro-entrepreneur en franchise en base de TVA",
        "Émission, et e-reporting à rythme bimestriel s'il a des clients particuliers",
        "Normale",
      ],
    ],
    note: "Un même client peut cumuler plusieurs profils. Celui qui vend à des particuliers et à l'étranger a deux chantiers de e-reporting distincts.",
  },
  {
    type: "texte",
    titre: "Le rythme du e-reporting dépend du régime de TVA",
    paragraphes: [
      "C'est le point qui surprend le plus les clients : le e-reporting n'est pas quotidien, mais sa fréquence suit le <strong>régime d'imposition à la TVA</strong>. Selon la FAQ de l'administration, une entreprise en franchise en base transmet ses données tous les deux mois, par bimestre civil. Une entreprise au réel normal mensuel transmet ses données de transaction trois fois par mois, et ses données de paiement une fois par mois.",
      "Pour le cabinet, cela signifie que le calendrier du e-reporting de chaque client se déduit de son régime de TVA, déjà connu. C'est une donnée de plus à suivre dossier par dossier, au même titre que les échéances de déclaration.",
    ],
  },
  {
    type: "liste",
    titre: "Les quatre mentions à faire ajouter aux modèles de facture",
    intro:
      "La FAQ de l'administration rappelle que le décret du 7 octobre 2022 a modifié l'article 242 nonies A de l'annexe II au CGI pour rendre obligatoires quatre nouvelles mentions.",
    numerotee: true,
    items: [
      {
        titre: "Le SIREN du client",
        texte:
          "C'est la mention qui demande le plus de travail : il faut le collecter pour chaque client professionnel du fichier, souvent tenu sans.",
      },
      {
        titre: "La catégorie de l'opération",
        texte:
          "Livraison de biens, prestation de services, ou les deux lorsque la facture porte sur des opérations indépendantes l'une de l'autre.",
      },
      {
        titre: "L'option pour le paiement de la TVA sur les débits",
        texte:
          "Le cas échéant. Elle a aussi un effet sur le e-reporting des paiements, qui n'est alors pas attendu.",
      },
      {
        titre: "L'adresse de livraison",
        texte: "Lorsqu'elle est différente de l'adresse de facturation.",
      },
    ],
  },
  {
    type: "comparaison",
    titre: "Anticiper l'émission, ou attendre l'échéance",
    intro:
      "Une PME peut entrer volontairement dans l'émission électronique avant septembre 2027. Le guide de démarrage de la DGFiP encadre ce choix.",
    colonnes: [
      {
        titre: "Entrer avant l'échéance",
        sousTitre: "Tester en conditions réelles",
        ton: "positif",
        texte:
          "Le client teste son outil, forme ses équipes, découvre les rejets avant qu'ils ne soient sanctionnables. Il peut commencer par certains clients ou certains volumes, et revenir temporairement à ses modalités habituelles en cas d'échec.",
      },
      {
        titre: "Attendre septembre 2027",
        sousTitre: "Rester dans le droit",
        ton: "neutre",
        texte:
          "C'est son droit : un client ne peut pas lui imposer une émission électronique au titre de l'obligation légale avant son échéance. Mais tout se joue alors en même temps, pour lui et pour le cabinet.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Anticiper l'émission ne déclenche pas le e-reporting",
    texte:
      "Selon la FAQ de l'administration, une entrée anticipée dans la facturation électronique <strong>n'a pas d'effet</strong> sur l'obligation de e-reporting. L'entreprise peut y entrer distinctement, au plus tard au 1er septembre 2027. Deux calendriers à suivre, donc, et à ne pas confondre dans la communication aux clients.",
  },
  {
    type: "liste",
    titre: "Un plan en quatre temps pour les neuf mois qui restent",
    numerotee: true,
    items: [
      {
        titre: "Classer",
        texte:
          "Vérifier la taille de chaque client, puis le classer selon la grille des profils. Repérer les dossiers à double chantier.",
      },
      {
        titre: "Vérifier la réception",
        texte:
          "Elle est obligatoire depuis septembre 2026. Un client sans plateforme de réception est en retard sur une obligation déjà en vigueur.",
      },
      {
        titre: "Équiper par vagues",
        texte:
          "Commencer par les profils prioritaires, avec un outil d'émission conforme, idéalement le même pour des dossiers comparables, pour standardiser les exports.",
      },
      {
        titre: "Nettoyer les données",
        texte:
          "SIREN des clients, catégorie des opérations, option pour les débits : ces données conditionnent la qualité des factures et du e-reporting.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Voir l'état du portefeuille sans ouvrir chaque dossier",
    paragraphes: [
      "C'est le rôle du cockpit cabinet de Deviso pour les clients qui facturent avec l'outil : un tableau de bord de tout le portefeuille, en lecture seule et gratuit pour le cabinet. Les anomalies y remontent triées par urgence, dont le <strong>SIREN client manquant</strong>, les trous de numérotation, les factures rejetées et les incohérences de TVA, et la TVA de chaque dossier assujetti est présentée selon sa périodicité.",
      "Côté client, Deviso adapte son tableau de bord au statut de l'entreprise (micro-entreprise, entreprise individuelle au réel ou société), gère la TVA multi-taux, et émet des factures Factur-X par la plateforme agréée comprise dans l'abonnement.",
    ],
  },
];

const FAQ = [
  {
    q: "Quand mes clients PME et micro doivent-ils émettre des factures électroniques ?",
    a: "Au plus tard le 1er septembre 2027, selon la FAQ de l'administration. Ils doivent en revanche pouvoir recevoir des factures électroniques depuis le 1er septembre 2026, quelle que soit leur taille.",
  },
  {
    q: "À quelle date apprécie-t-on la taille d'une entreprise pour la réforme ?",
    a: "Au 1er janvier 2025, sur la base du dernier exercice clos avant cette date, par unité légale (SIREN). Les critères sont ceux de la loi de modernisation de l'économie : effectif, puis chiffre d'affaires et total du bilan.",
  },
  {
    q: "À quel rythme mes clients transmettront-ils leurs données de e-reporting ?",
    a: "Selon leur régime de TVA. Une entreprise en franchise en base transmet par bimestre civil. Une entreprise au réel normal mensuel transmet ses données de transaction trois fois par mois et ses données de paiement une fois par mois.",
  },
  {
    q: "Un client peut-il exiger une facture électronique de mon client PME dès maintenant ?",
    a: "Pas au titre de l'obligation légale. Le guide de démarrage de la DGFiP précise qu'un client ne peut pas imposer une émission électronique à une entreprise dont l'échéance est fixée au 1er septembre 2027. Des accords commerciaux restent possibles.",
  },
  {
    q: "Entrer en avance dans l'émission électronique oblige-t-il à faire le e-reporting ?",
    a: "Non. Selon la FAQ de l'administration, l'anticipation de l'émission n'a pas d'effet sur l'obligation de e-reporting, à laquelle l'entreprise peut entrer distinctement, au plus tard au 1er septembre 2027.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "impots.gouv.fr, Foire aux questions, Je découvre la facturation électronique",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf",
    precision: "version du 01/09/2026 : calendrier, entrée anticipée, quatre nouvelles mentions, 26 puis 34 données, champ du e-reporting",
  },
  {
    libelle: "impots.gouv.fr, Foire aux questions, J'approfondis la facturation électronique",
    url: "https://www.impots.gouv.fr/foire-aux-questions-japprofondis-la-facturation-electronique",
    precision: "taille de l'entreprise (question 1.1), fréquence des données de transaction et de paiement (questions 3.3 et 4.1)",
  },
  {
    libelle: "impots.gouv.fr, Facturation électronique : guide pratique de démarrage au 1er septembre 2026",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf",
    precision: "émission volontaire avant 2027 et refus d'une émission imposée (questions 17 à 20)",
  },
  {
    libelle: "Service-public.gouv.fr, Facturation électronique entre entreprises",
    url: "https://entreprendre.service-public.gouv.fr/vosdroits/F23208",
    precision: "calendrier de réception et d'émission des factures électroniques",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Le 1er septembre 2027, les PME, TPE et micro-entreprises devront émettre leurs factures électroniques et transmettre leurs données. Pour un cabinet, c'est l'essentiel du portefeuille. Comment le trier et le préparer dans les neuf mois qui restent."
      enBref={[
        "PME, TPE et micro : <strong>émission et e-reporting au 1er septembre 2027</strong> au plus tard.",
        "La taille s'apprécie au <strong>1er janvier 2025</strong>, par SIREN, sur le dernier exercice clos.",
        "Le chantier dépend surtout du profil : ventes aux particuliers, international, services sans option débits.",
        "Le rythme du e-reporting suit le <strong>régime de TVA</strong> : bimestriel en franchise, plus fréquent au réel.",
        "Quatre nouvelles mentions, dont le <strong>SIREN du client</strong>, sont à intégrer aux modèles de facture.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Préparer 2027 avec un cockpit",
        texte:
          "Deviso donne au cabinet une vue d'ensemble de ses dossiers : conformité, anomalies, TVA par périodicité, exports FEC et Quadra. Gratuit pour le cabinet, et construit avec des cabinets pilotes.",
      }}
    />
  );
}
