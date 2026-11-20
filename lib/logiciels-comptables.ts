/**
 * Logiciels de production des cabinets et fichier qu'on leur livre (20/11/2026).
 *
 * Source : docs/reference/formats-import-logiciels.md (recherche du 20/11/2026,
 * chaque point étiqueté éditeur / tiers / non trouvé). Règle tenue ici : on ne
 * livre que deux formats dont la spécification complète est publique.
 * - FEC (article A47 A-1) : importé par la plupart des logiciels.
 * - Quadra ASCII : fiche Cegid KB0014530, table de l'enregistrement M complète.
 * Cegid TRA (Cegid Expert, MyUnisoft) n'est PAS produit : la spécification lue
 * ne permet pas d'établir les enregistrements obligatoires d'un fichier
 * d'écritures, et rien ici ne permet d'essayer un import. Ces logiciels
 * reçoivent le FEC, avec la mention « à vérifier » quand l'import d'un FEC
 * n'est pas documenté.
 */
export type FormatExport = "fec" | "quadra";

export const FORMATS: Record<FormatExport, { libelle: string }> = {
  fec: { libelle: "FEC (fichier des écritures comptables, article A47 A-1)" },
  quadra: { libelle: "Quadra ASCII (format d'import de Cegid Quadra)" },
};

/** Ce qui fonde la consigne : la doc de l'éditeur, une source tierce, ou rien de publié. */
export type Fiabilite = "editeur" | "tiers" | "a_verifier";

export const LIBELLE_FIABILITE: Record<Fiabilite, string> = {
  editeur: "Import documenté par l'éditeur",
  tiers: "Import décrit par des sources tierces concordantes",
  a_verifier: "Import non documenté publiquement : à vérifier sur un dossier test",
};

export type Logiciel = { id: string; nom: string; format: FormatExport; fiabilite: Fiabilite; consigne: string };

export const LOGICIELS: Logiciel[] = [
  {
    id: "acd", nom: "ACD", format: "fec", fiabilite: "tiers",
    consigne: "Outils > Importation > Importation FEC, en cochant la reprise des pièces jointes. ACD ne repère pas les doublons : n'importez pas deux fois la même période.",
  },
  {
    id: "cegid_expert", nom: "Cegid Expert", format: "fec", fiabilite: "a_verifier",
    consigne: "Cegid ne publie pas d'import FEC pour Cegid Expert. Essayez le FEC sur un dossier test avant de l'utiliser.",
  },
  {
    id: "cegid_loop", nom: "Cegid Loop", format: "fec", fiabilite: "editeur",
    consigne: "Cegid Loop importe les FEC (documenté par Cegid). Le menu d'import à l'écran n'est pas publié.",
  },
  {
    id: "quadra", nom: "Cegid Quadra (Quadratus)", format: "quadra", fiabilite: "editeur",
    consigne: "Outils > Suivi des dossiers > Import ASCII (Compta). Créez d'abord vos journaux de ventes et de banque (Paramétrage des journaux), sinon les écritures arrivent en OD. Gardez les PDF à côté du fichier, sans les renommer.",
  },
  {
    id: "ebp", nom: "EBP Compta", format: "fec", fiabilite: "editeur",
    consigne: "Commande « Importer un FEC » : l'assistant demande une sauvegarde avant l'import.",
  },
  {
    id: "fulll", nom: "Fulll", format: "fec", fiabilite: "a_verifier",
    consigne: "Fulll ne publie pas son format d'import. Essayez le FEC sur un dossier test avant de l'utiliser.",
  },
  {
    id: "inqom", nom: "Inqom", format: "fec", fiabilite: "editeur",
    consigne: "Import > Import FEC. Les journaux absents sont créés automatiquement.",
  },
  {
    id: "isacompta", nom: "Isacompta (Agiris)", format: "fec", fiabilite: "editeur",
    consigne: "Isacompta importe les fichiers FEC (fiche produit Agiris). Le menu exact n'est pas publié.",
  },
  {
    id: "myunisoft", nom: "MyUnisoft", format: "fec", fiabilite: "editeur",
    consigne: "Tenue > Imports. MyUnisoft refuse un fichier déjà importé.",
  },
  {
    id: "pennylane", nom: "Pennylane", format: "fec", fiabilite: "editeur",
    consigne: "Attention : à l'import d'un FEC, Pennylane remplace toutes les écritures existantes sur la période et les journaux importés.",
  },
  {
    id: "sage_coala", nom: "Sage Coala", format: "fec", fiabilite: "a_verifier",
    consigne: "Sage ne publie pas d'import FEC pour Coala. Essayez le FEC sur un dossier test avant de l'utiliser.",
  },
  {
    id: "sage_ge", nom: "Sage Génération Experts", format: "fec", fiabilite: "tiers",
    consigne: "Dans l'import, choisissez « FORMAT FEC » ; si le fichier est refusé, essayez « SAGE EXPERT IMPORT ».",
  },
  {
    id: "sage_50", nom: "Sage 50 (ex-Ciel)", format: "fec", fiabilite: "a_verifier",
    consigne: "Commande « Importer des écritures ou FEC ». Rejette les écritures datées avant le début de l'exercice ouvert.",
  },
  {
    id: "tiime", nom: "Tiime Expert", format: "fec", fiabilite: "editeur",
    consigne: "Production comptable > Comptabilité > Journaux, menu « ... » > Importer. Un exercice couvrant la période doit être ouvert.",
  },
];

export function logicielParId(id: string | null | undefined): Logiciel | null {
  return LOGICIELS.find((l) => l.id === id) ?? null;
}

export function logicielConnu(id: unknown): id is string {
  return typeof id === "string" && LOGICIELS.some((l) => l.id === id);
}

/** Format livré pour un logiciel ; FEC si rien n'est choisi. */
export function formatDuLogiciel(id: string | null | undefined): FormatExport {
  return logicielParId(id)?.format ?? "fec";
}
