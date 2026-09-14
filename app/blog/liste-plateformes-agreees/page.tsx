import { ArticleLong, type Section, type Source } from "@/components/blog/ArticleLong";
import { metadonneesArticle } from "@/lib/blog/meta";

const SLUG = "liste-plateformes-agreees";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les chiffres de cet article ont été relevés le 14/09/2026 dans les classeurs
 * XLSX de la DGFiP, pas dans les PDF ni chez un comparateur. Le relevé et la
 * manière de le refaire sont dans docs/superpdp/immatriculation.md.
 *
 * ⚠️ Ce sont des chiffres qui bougent : la liste a gagné 90 opérateurs en huit
 * mois. Les revérifier à chaque mise à jour de l'article, et avancer
 * `misAJourLe` — c'est tout l'argument de la page.
 */
const RELEVE = "14 septembre 2026";
const IMMATRICULES = 149;
const EN_ATTENTE = 16;

const SECTIONS: Section[] = [
  {
    type: "texte",
    paragraphes: [
      "Cherchez « liste des plateformes agréées » et vous trouverez une dizaine de pages qui annoncent un nombre. Aucune ne donne le même. Ce n’est pas que l’une ment : c’est qu’elles comptent des choses différentes, parce que la liste officielle n’est pas <strong>une</strong> liste. Elle est en deux fichiers, et la différence entre les deux est exactement celle qui vous intéresse.",
      `Au ${RELEVE}, ces deux fichiers réunissent <strong>${IMMATRICULES} opérateurs immatriculés</strong> et <strong>${EN_ATTENTE} en attente de l’être</strong>. Voici où ils sont, ce qu’ils contiennent, et les trois pièges qui font écrire n’importe quoi à leur sujet.`,
    ],
  },
  {
    type: "comparaison",
    titre: "Les deux fichiers, avec leurs intitulés exacts",
    intro:
      "Ce sont les titres imprimés sur la page de la DGFiP. Les reprendre mot pour mot est le seul moyen de savoir de quoi on parle.",
    colonnes: [
      {
        titre: "Fichier 1",
        sousTitre: "« Opérateurs satisfaisant à l’ensemble des conditions, incluant les tests d’interopérabilité »",
        ton: "positif",
        texte: `${IMMATRICULES} opérateurs. Dossier complet, tests d’interopérabilité réussis, numéro d’immatriculation délivré. C’est la seule liste qui compte quand un éditeur vous dit qu’il est agréé.`,
      },
      {
        titre: "Fichier 2",
        sousTitre: "« Opérateurs ayant déposé un dossier complet et conforme et en attente de leur immatriculation définitive conditionnée à la réussite des tests d’interopérabilité »",
        ton: "neutre",
        texte: `${EN_ATTENTE} opérateurs. Le dossier est accepté, les tests restent à passer. Ce n’est ni un refus ni une immatriculation : c’est une étape, et elle peut durer.`,
      },
    ],
  },
  {
    type: "encadre",
    ton: "alerte",
    titre: "Piège nº 1 — le nom du fichier dit le contraire de son contenu",
    texte:
      "Le fichier des opérateurs <strong>immatriculés</strong> s’appelle <code>liste_pa_attente_rapport_audit</code>. L’« attente » dont parle ce nom est celle du rapport d’audit que chaque plateforme doit remettre <em>après</em> son immatriculation — pas celle de l’immatriculation. Celui des dossiers en attente s’appelle <code>liste_pa_attente_test_interop</code>. Télécharger les deux et se fier au nom de fichier conduit donc à inverser exactement les deux listes. C’est, à notre avis, l’origine d’une partie des chiffres contradictoires qui circulent.",
  },
  {
    type: "tableau",
    titre: "Ce que la liste publie réellement",
    intro:
      "Sept colonnes pour le fichier des immatriculés, six pour l’autre — qui n’a pas de date, puisqu’il n’y a pas encore de numéro.",
    colonnes: ["Colonne", "Contenu", "Présente dans"],
    lignes: [
      ["Nom commercial", "Le nom sous lequel l’opérateur se vend, pas sa raison sociale", "les deux fichiers"],
      ["Adresse", "Voie, code postal, commune (et pays pour les opérateurs étrangers)", "les deux fichiers"],
      ["Site internet", "L’URL officielle — utile pour lever une homonymie", "les deux fichiers"],
      ["Courriel de contact", "L’adresse déclarée à l’administration", "les deux fichiers"],
      ["Date de délivrance du numéro d’immatriculation", "Le jour où l’immatriculation a été accordée", "le fichier 1 seulement"],
    ],
    note: "Il n’y a ni SIREN, ni numéro d’immatriculation en clair, ni tarif, ni périmètre fonctionnel. Une page qui vous donne le « numéro d’immatriculation » d’une plateforme ne l’a pas lu dans la liste officielle.",
  },
  {
    type: "encadre",
    ton: "info",
    titre: "Piège nº 2 — un opérateur n’est pas une entreprise",
    texte:
      "Plusieurs groupes figurent sous deux entrées distinctes, parce que ce sont deux offres distinctes. Compter les lignes donne un nombre d’opérateurs immatriculés, pas un nombre de sociétés. Les deux sont des chiffres justes ; ils ne répondent pas à la même question, et personne ne précise jamais laquelle il a posée.",
  },
  {
    type: "texte",
    titre: "Une liste qui bouge vite, et ce que ça implique",
    paragraphes: [
      "Les immatriculations vont du 11 décembre 2025 à la fin août 2026. Sur les 149 opérateurs, <strong>59 ont été immatriculés en 2025 et 90 en 2026</strong> : la liste a plus que doublé en huit mois, et elle continue.",
      "La conséquence pratique est simple : <strong>tout article qui cite un nombre sans le dater est faux dès la semaine suivante</strong>, y compris celui-ci. C’est pourquoi la date de relevé est écrite en haut de cette page, et pourquoi la source est en bas. Si la date vous semble vieille, prenez trois minutes pour aller voir : le fichier fait 30 ko.",
    ],
  },
  {
    type: "liste",
    titre: "Vérifier un éditeur en deux minutes",
    intro:
      "La question n’est presque jamais « combien y en a-t-il ». Elle est « celui que j’ai en face de moi dit-il vrai ».",
    numerotee: true,
    items: [
      {
        titre: "Ouvrez le fichier des immatriculés, pas une page de comparateur",
        texte:
          "La liste est publique, gratuite et téléchargeable en trois formats. Un comparateur ajoute une date de mise à jour, parfois un classement, et une erreur de recopie.",
      },
      {
        titre: "Cherchez le nom commercial, pas le nom de l’éditeur",
        texte:
          "La colonne publiée est le nom commercial. Une plateforme vendue sous une marque et éditée par une société d’un autre nom figure sous la marque.",
      },
      {
        titre: "Recoupez avec le site internet publié",
        texte:
          "C’est la colonne qui lève les homonymies, et celle que les listes de seconde main omettent le plus souvent.",
      },
      {
        titre: "Vérifiez dans lequel des deux fichiers il apparaît",
        texte:
          "C’est le seul point qui change quelque chose. « Agréé » et « en cours d’agrément » se ressemblent dans une plaquette commerciale ; ils ne se ressemblent pas dans la liste.",
      },
      {
        titre: "Si l’éditeur n’y figure pas, demandez-lui par quelle plateforme il passe",
        texte:
          "Ne pas être immatriculé n’est pas un défaut : la plupart des logiciels de facturation sont des solutions compatibles adossées à une plateforme agréée. Ce qui serait un défaut, c’est de ne pas savoir laquelle, ou de laisser croire le contraire.",
      },
    ],
  },
  {
    type: "texte",
    titre: "Le malentendu qui fait dire n’importe quoi",
    paragraphes: [
      "« Être sur la liste » est devenu un argument de vente, et beaucoup de logiciels laissent planer le doute. Pourtant, <strong>être immatriculé et être conforme sont deux choses différentes</strong> : la plateforme agréée transporte les factures et déclare à l’administration ; votre logiciel de facturation, lui, doit produire des factures au bon format et savoir parler à une plateforme. Les deux rôles se complètent, ils ne se remplacent pas.",
      "Un éditeur qui n’est pas sur la liste et qui vous dit lequel il utilise vous en apprend plus qu’un éditeur qui se contente d’afficher un logo. La question utile n’est pas « êtes-vous agréé ? » mais « par qui passent mes factures, et où puis-je le vérifier ? ».",
    ],
  },
  {
    type: "encadre",
    ton: "succes",
    titre: "Pour Deviso, la réponse est écrite",
    texte:
      "Deviso est une solution compatible adossée à Super PDP, qui est la plateforme agréée. Super PDP figure dans le fichier des opérateurs immatriculés, avec une date de délivrance au 22 décembre 2025. Nous ne vous demandons pas de nous croire : la page <a href=\"/conformite\">Conformité</a> donne le lien vers la liste officielle, et vous pouvez y chercher le nom vous-même.",
  },
];

const FAQ = [
  {
    q: "Combien y a-t-il de plateformes agréées en France ?",
    a: `Au ${RELEVE}, ${IMMATRICULES} opérateurs sont immatriculés et ${EN_ATTENTE} ont un dossier accepté en attente des tests d’interopérabilité. Ces nombres changent vite : 59 immatriculations en 2025, 90 sur les huit premiers mois de 2026. Tout chiffre cité sans sa date de relevé est à vérifier.`,
  },
  {
    q: "Où trouver la liste officielle des plateformes agréées ?",
    a: "Sur impots.gouv.fr, page « Je consulte la liste des plateformes agréées ». Elle propose deux fichiers, chacun en ODS, XLSX et PDF : celui des opérateurs immatriculés, et celui des opérateurs en attente de leur immatriculation définitive.",
  },
  {
    q: "Quelle différence entre une plateforme immatriculée et une plateforme sous réserve ?",
    a: "La DGFiP n’emploie pas les mots « sous réserve ». Elle distingue les opérateurs satisfaisant à l’ensemble des conditions, tests d’interopérabilité inclus, et ceux dont le dossier est complet et conforme mais qui n’ont pas encore passé ces tests. Seuls les premiers ont un numéro d’immatriculation.",
  },
  {
    q: "Mon logiciel de facturation doit-il être sur cette liste ?",
    a: "Non. Un logiciel de facturation peut être une solution compatible : il produit les factures et les transmet à une plateforme agréée, qui les achemine et déclare à l’administration. Ce qu’il doit pouvoir vous dire, c’est par quelle plateforme il passe.",
  },
  {
    q: "Pourquoi les comparateurs ne donnent-ils pas tous le même nombre ?",
    a: "Trois raisons : ils ne relèvent pas à la même date, ils ne comptent pas toujours le même fichier, et les noms de fichiers de la DGFiP prêtent à confusion — celui des immatriculés contient le mot « attente », qui désigne le rapport d’audit postérieur et non l’immatriculation.",
  },
  {
    q: "La liste indique-t-elle le numéro d’immatriculation d’une plateforme ?",
    a: "Non. Le fichier des immatriculés publie la date de délivrance du numéro, pas le numéro lui-même, et aucun des deux fichiers ne publie de SIREN. Une page qui affiche un numéro d’immatriculation ne l’a pas pris dans la liste officielle.",
  },
];

const SOURCES: Source[] = [
  {
    libelle: "DGFiP — Je consulte la liste des plateformes agréées",
    url: "https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees",
    precision: `Page publiée le 30 juillet 2024, dernière modification le 10 septembre 2026. Relevé effectué le ${RELEVE} sur les classeurs XLSX des deux fichiers.`,
  },
  {
    libelle: "Liste des opérateurs satisfaisant à l’ensemble des conditions (XLSX)",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/listes_plateformes_agreees/liste_pa_attente_rapport_audit.xlsx",
    precision: `${IMMATRICULES} opérateurs, dates de délivrance du 11 décembre 2025 au 28 août 2026.`,
  },
  {
    libelle: "Liste des opérateurs en attente de leur immatriculation définitive (XLSX)",
    url: "https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/listes_plateformes_agreees/liste_pa_attente_test_interop.xlsx",
    precision: `${EN_ATTENTE} opérateurs, sans colonne de date.`,
  },
];

export default function Page() {
  return (
    <ArticleLong
      slug={SLUG}
      chapeau={`La liste officielle des plateformes agréées est publique et gratuite. Elle tient en deux fichiers dont les noms disent à peu près le contraire de leur contenu — ce qui explique une bonne part des chiffres contradictoires qu’on lit partout. Voici ce qu’ils contiennent, relevé le ${RELEVE}.`}
      enBref={[
        `${IMMATRICULES} opérateurs immatriculés et ${EN_ATTENTE} en attente des tests d’interopérabilité, au ${RELEVE}.`,
        "La liste est en deux fichiers distincts, publiés par la DGFiP sur impots.gouv.fr.",
        "Le fichier des immatriculés porte le mot « attente » dans son nom : il désigne le rapport d’audit postérieur, pas l’immatriculation.",
        "Ni SIREN ni numéro d’immatriculation n’y figurent — seulement la date de délivrance.",
        "Votre logiciel de facturation n’a pas à y figurer : il doit pouvoir vous dire par quelle plateforme il passe.",
      ]}
      sections={SECTIONS}
      faq={FAQ}
      sources={SOURCES}
      cta={{
        titre: "Deviso vous dit par où passent vos factures",
        texte:
          "Devis, factures Factur-X et transmission via une plateforme agréée, sans que vous ayez à lire un fichier de la DGFiP. Essai de 14 jours, sans carte bancaire.",
      }}
    />
  );
}
