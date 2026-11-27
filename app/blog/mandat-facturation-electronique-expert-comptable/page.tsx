import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "mandat-facturation-electronique-expert-comptable";

export const metadata = metadonneesArticle(SLUG);

const SECTIONS: Section[] = [
  {
    type: "texte",
    titre: "Une décision du client, souvent préparée par le cabinet",
    paragraphes: [
      "La réforme a fait de la plateforme agréée un sujet que les clients posent d'abord à leur expert-comptable. Le cadre officiel, lui, est clair sur un point : selon la FAQ de l'administration, le choix de la plateforme est <strong>totalement libre</strong> et relève d'une <strong>décision de gestion du chef d'entreprise</strong>. Chaque entreprise signe un accord formel avec la ou les plateformes désignées pour la réception de ses factures dans l'annuaire.",
      "Le cabinet n'est pas pour autant spectateur. Le guide de démarrage de la DGFiP cite l'expert-comptable parmi les intermédiaires par lesquels une entreprise peut engager la démarche, au même titre que le logiciel de gestion, la banque ou un autre prestataire. Entre conseiller le choix et agir à la place du client, il y a toutefois une frontière, et c'est le mandat qui la trace.",
    ],
  },
  {
    type: "tableau",
    titre: "Ce que le cabinet peut faire, et sur quel fondement",
    colonnes: ["Ce que fait le cabinet", "Fondement", "Qui reste responsable"],
    lignes: [
      [
        "Conseiller le choix de la plateforme, diagnostiquer les flux",
        "La lettre de mission (mission de conseil)",
        "Le client décide : c'est une décision de gestion",
      ],
      [
        "Organiser le raccordement ou la désignation de la plateforme",
        "Un mandat donné par le client, à formaliser",
        "Le client, signataire de l'accord avec la plateforme",
      ],
      [
        "Émettre des factures au nom du client",
        "Un mandat de facturation (article 289, I-2 du CGI)",
        "Le client, qui garde l'entière responsabilité de sa facturation",
      ],
      [
        "Recevoir des factures fournisseurs pour le client",
        "Un accord avec le client, et un bloc « adressée à » sur la facture",
        "Le client, au nom duquel la facture est libellée",
      ],
    ],
  },
  {
    type: "texte",
    titre: "Le mandat de facturation, un régime ancien qui s'applique toujours",
    paragraphes: [
      "L'article 289 du CGI permet à un assujetti de faire émettre ses factures par un tiers, qui agit en son nom et pour son compte. La réforme ne supprime pas cette possibilité. La FAQ de l'administration précise qu'en émission, le prestataire agit sous couvert d'un mandat de facturation, et que la facture est <strong>par principe transmise par la plateforme de l'émetteur</strong>, c'est-à-dire celle du client. Les modalités varient selon le prestataire et la plateforme : il faut savoir si le mandataire utilise ou non sa propre plateforme agréée. À partir du 1er janvier 2027, les règles de TVA citées ici quittent le Code général des impôts pour le livre II du Code des impositions sur les biens et services (CIBS) : les numéros d'articles changeront.",
      "Le BOFiP détaille les conditions de ce mandat. Elles valent pour un cabinet comme pour tout autre tiers.",
    ],
  },
  {
    type: "liste",
    titre: "Ce qu'exige le BOFiP pour un mandat de facturation",
    items: [
      {
        titre: "Un mandat préalable",
        texte:
          "Il doit nécessairement être conclu avant que le tiers ne commence à émettre des factures. Aucune forme particulière n'est imposée, mais les parties doivent pouvoir en apporter la preuve : l'écrit est recommandé.",
      },
      {
        titre: "L'acceptation de chaque facture",
        texte:
          "Toute facture émise au nom du fournisseur doit être acceptée par lui, expressément ou tacitement, par exemple à l'expiration d'un délai de contestation prévu au mandat.",
      },
      {
        titre: "La responsabilité du client",
        texte:
          "Le fournisseur garde l'entière responsabilité de ses obligations de facturation et de leurs conséquences en matière de TVA. Il ne peut pas invoquer le retard ou la défaillance du mandataire.",
      },
      {
        titre: "Une mention recommandée",
        texte:
          "Le BOFiP recommande de porter sur la facture une mention du type « facture établie par A au nom et pour le compte de B ».",
      },
      {
        titre: "Les factures rectificatives",
        texte:
          "Le mandat peut se limiter aux factures initiales, ou couvrir aussi les factures rectificatives. Autant le préciser.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Le mandat présumé ne couvre pas tout",
    texte:
      "L'article 151 du décret du 30 mars 2012 présume, pour l'expert-comptable inscrit au tableau, un mandat pour certaines démarches auprès de l'administration fiscale, dont l'adhésion à une téléprocédure et le choix d'un partenaire de télétransmission. Le texte ne vise pas expressément la plateforme agréée de facturation électronique. Hors des cas de présomption, le mandat doit pouvoir être présenté à qui le demande. Par prudence, <strong>formalisez par écrit</strong> tout acte accompli pour le client auprès d'une plateforme.",
  },
  {
    type: "texte",
    titre: "La lettre de mission, l'endroit naturel pour le dire",
    paragraphes: [
      "Le même article 151 impose au professionnel de l'expertise comptable un <strong>contrat écrit</strong> avec son client, définissant sa mission et les droits et obligations de chacun. Ce contrat peut prendre la forme d'une lettre de mission, qui fait état, le cas échéant, du mandat confié et de sa durée.",
      "La réforme est donc l'occasion de relire vos lettres de mission. Une mission comptable classique ne dit rien du choix de plateforme, du raccordement, de l'émission ou du suivi des rejets. Si le cabinet assume une partie de ces tâches, la lettre de mission, ou un avenant, doit le dire, avec ce qui reste à la charge du client.",
    ],
  },
  {
    type: "liste",
    titre: "Les points à écrire dans la lettre de mission ou le mandat",
    numerotee: true,
    items: [
      {
        titre: "Le périmètre exact",
        texte:
          "Conseil seul, raccordement, émission, réception, e-reporting : nommer chaque tâche confiée, et celles qui ne le sont pas.",
      },
      {
        titre: "La plateforme concernée",
        texte:
          "Celle du client, ou celle utilisée par le cabinet. La FAQ rappelle que la facture émise sous mandat est par principe transmise par la plateforme de l'émetteur.",
      },
      {
        titre: "Les modalités d'acceptation",
        texte:
          "Pour l'émission, le délai laissé au client pour contester une facture émise en son nom, et ce qui vaut acceptation.",
      },
      {
        titre: "Le traitement des rejets et des refus",
        texte:
          "Qui est prévenu, qui corrige, dans quel délai. C'est le point le plus souvent oublié, et celui qui crée des factures orphelines.",
      },
      {
        titre: "Les pièces que le client s'engage à fournir",
        texte:
          "Les informations nécessaires à la facturation et à la tenue des comptes, dont le SIREN de ses propres clients, devenu une mention obligatoire.",
      },
      {
        titre: "La durée et la fin du mandat",
        texte:
          "Le décret permet de mentionner la durée du mandat. Prévoir aussi ce qui se passe en cas de changement de plateforme ou de fin de mission.",
      },
    ],
  },
  {
    type: "comparaison",
    titre: "Deux postures possibles pour le cabinet",
    colonnes: [
      {
        titre: "Le cabinet opère",
        sousTitre: "Il émet ou reçoit pour le client",
        ton: "neutre",
        texte:
          "Plus de valeur perçue, mais un mandat de facturation à tenir, chaque facture à faire accepter, et une responsabilité de fait sur les délais, les rejets et les corrections.",
      },
      {
        titre: "Le cabinet supervise",
        sousTitre: "Le client émet, le cabinet contrôle",
        ton: "neutre",
        texte:
          "Le client reste maître de sa facturation dans un outil conforme. Le cabinet a accès aux données, repère les anomalies et conseille. Moins de mandat à gérer, une frontière plus nette.",
      },
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Avec Deviso, le cabinet supervise sans mandat d'émission",
    texte:
      "Dans Deviso, c'est le client qui émet ses factures, transmises par la plateforme agréée comprise dans son abonnement. Il invite son expert-comptable, qui accède à ses dossiers <strong>en lecture seule</strong>, gratuitement, depuis un cockpit qui regroupe tout le portefeuille : anomalies, échéances de TVA, exports FEC et Quadra. Le cabinet n'émet rien au nom du client : la frontière est posée par l'outil lui-même.",
  },
];

const FAQ = [
  {
    q: "L'expert-comptable peut-il choisir la plateforme agréée de son client ?",
    a: "Il peut la conseiller et organiser la démarche, mais selon la FAQ de l'administration, le choix de la plateforme relève d'une décision de gestion du chef d'entreprise, qui signe un accord formel avec la plateforme désignée dans l'annuaire. Tout acte accompli pour le client doit reposer sur un mandat.",
  },
  {
    q: "Un cabinet peut-il émettre les factures de son client après la réforme ?",
    a: "Oui, sous mandat de facturation (article 289 du CGI). Le mandat doit être préalable, chaque facture doit être acceptée par le client, qui garde l'entière responsabilité de sa facturation. Selon la FAQ, la facture est par principe transmise par la plateforme de l'émetteur.",
  },
  {
    q: "Le mandat de facturation doit-il être écrit ?",
    a: "Le BOFiP n'impose aucune forme particulière, mais exige que les parties puissent prouver le mandat, et recommande donc un écrit. Un écrit est impératif lorsque le mandataire est établi hors de l'Union européenne, dans un pays avec lequel il n'existe aucun instrument juridique d'assistance mutuelle.",
  },
  {
    q: "Faut-il modifier la lettre de mission pour la facturation électronique ?",
    a: "Dès que le cabinet prend en charge une partie des tâches liées à la réforme (raccordement, émission, réception, suivi des rejets), il est prudent de le dire dans la lettre de mission ou dans un avenant. Le décret du 30 mars 2012 prévoit que la lettre de mission fait état du mandat confié et de sa durée.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "impots.gouv.fr, Foire aux questions, Je découvre la facturation électronique",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf",
    precision: "question 2.1 : choix libre de la plateforme, décision de gestion, accord formel et annuaire",
  },
  {
    libelle: "BOFiP, BOI-RES-TVA-000253",
    url: "https://bofip.impots.gouv.fr/doctrine/BOI-RES-TVA-000253",
    precision: "recodification de la TVA dans le CIBS à compter du 1er janvier 2027",
  },
  {
    libelle: "impots.gouv.fr, Foire aux questions, J'approfondis la facturation électronique",
    url: "https://www.impots.gouv.fr/foire-aux-questions-japprofondis-la-facturation-electronique",
    precision: "questions 2.1 et 2.2 : réception par un prestataire, émission sous mandat de facturation",
  },
  {
    libelle: "impots.gouv.fr, Facturation électronique : guide pratique de démarrage au 1er septembre 2026",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf",
    precision: "question 1 : l'expert-comptable parmi les intermédiaires possibles",
  },
  {
    libelle: "BOFiP, BOI-TVA-DECLA-30-20-10-30, Personnes tenues de délivrer des factures",
    url: "https://bofip.impots.gouv.fr/bofip/13244-PGP.html/identifiant=BOI-TVA-DECLA-30-20-10-30-20220629",
    precision: "conditions du mandat de facturation : antériorité, acceptation, responsabilité, mention",
  },
  {
    libelle: "Légifrance, Code général des impôts, articles 289-0 à 289 bis (factures)",
    url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006191855",
    precision: "article 289, I-2 : émission par un tiers ; article 289 bis : plateforme agréée",
  },
  {
    libelle: "Légifrance, décret n° 2012-432 du 30 mars 2012, article 151",
    url: "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000046882378",
    precision: "contrat écrit, lettre de mission, mandat présumé pour certaines démarches",
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau="Choisir la plateforme, raccorder, émettre, recevoir : vos clients vous demandent de les accompagner sur la facture électronique. Ce que le cabinet peut faire, sur quel fondement, et ce que la lettre de mission doit en dire."
      enBref={[
        "Le choix de la plateforme agréée est une <strong>décision de gestion du client</strong>, pas du cabinet.",
        "Le cabinet peut émettre pour son client sous <strong>mandat de facturation</strong> (article 289 du CGI).",
        "Ce mandat doit être préalable, chaque facture acceptée, et le client reste <strong>entièrement responsable</strong>.",
        "Le mandat présumé de l'expert-comptable ne vise pas expressément la plateforme de facturation : écrivez-le.",
        "La réforme est l'occasion de relire vos <strong>lettres de mission</strong> : périmètre, rejets, durée.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Superviser sans opérer",
        texte:
          "Avec Deviso, vos clients émettent eux-mêmes dans un outil conforme, et vous suivez leurs dossiers en lecture seule depuis un cockpit gratuit. Nous construisons cet outil avec des cabinets pilotes.",
        lien: { label: "Découvrir l'espace cabinet", href: "/experts-comptables" },
      }}
    />
  );
}
