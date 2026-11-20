/**
 * Catalogue du banc d'essai comptable (scripts/e2e/scenarios.ts).
 *
 * Un scénario = un dossier (régime de TVA, statut), les pièces qu'il reçoit ou
 * émet, et ce que la comptabilité DOIT en dire. Le banc injecte les pièces dans
 * un compte de démonstration jetable, télécharge les vrais exports (FEC du
 * client, FEC et Quadra du cabinet) et compare.
 *
 * Ajouter un cas = ajouter un objet ici, rien d'autre. Les factures reçues
 * passent par le générateur au format de la plateforme et sont validées
 * contre son schéma officiel avant d'être injectées.
 *
 * Montants attendus : un nombre en euros, ou `{ devise, date, montant }` pour
 * un montant en devise, converti au cours BCE réel du jour par le banc.
 */
import type { FactureRecue } from "./facture-recue";

export type Montant = number | { devise: string; date: string; montant: number; taux?: number };
export type Sens = { debit?: Montant; credit?: Montant };

export type AchatEtranger = {
  numero: string; date: string; fournisseur: string; pays: string; tva?: string;
  categorie: "biens" | "services"; devise?: string; ht: number; taux_tva?: number; montant_tva?: number;
};

export type Vente = {
  date: string; client: string; siren?: string; ht: number; taux: number;
  categorie?: "services" | "goods"; payeeLe?: string;
};

export type Scenario = {
  nom: string;
  pourquoi: string;
  dossier: { tva_regime: string | null; statut_juridique?: "micro" | "ei_reel" | "societe" | null };
  annee: string;
  recues?: FactureRecue[];
  etrangers?: AchatEtranger[];
  ventes?: Vente[];
  attendu: {
    /** Par pièce (numéro de facture), par compte : somme des débits / crédits. */
    pieces?: Record<string, Record<string, Sens>>;
    /** Sur tout le fichier, par compte. */
    comptes?: Record<string, Sens>;
    /** Pièces qui ne doivent PAS apparaître. */
    absentes?: string[];
    /** Nombre de soldes signalés « à vérifier » au cabinet. */
    aVerifier?: number;
  };
};

const F = { nom: "Imprimerie Dupré", siren: "853322915" };
const M = { nom: "Menuiserie Arnaud", siren: "512345675" };

export const SCENARIOS: Scenario[] = [
  {
    nom: "achat-simple-assujetti",
    pourquoi: "Le cas de base : une facture reçue à 20 %, dossier assujetti.",
    dossier: { tva_regime: "normal", statut_juridique: "ei_reel" },
    annee: "2023",
    recues: [{ numero: "FA-100", date: "2023-03-01", fournisseur: F, lignes: [{ libelle: "Impression", ht: 1000, taux: 20 }] }],
    attendu: { pieces: { "FA-100": { "604000": { debit: 1000 }, "445660": { debit: 200 }, "401000": { credit: 1200 } } } },
  },
  {
    nom: "achat-multi-taux",
    pourquoi: "Une facture à deux taux : la ventilation de la plateforme doit être lue taux par taux.",
    dossier: { tva_regime: "normal", statut_juridique: "societe" },
    annee: "2023",
    recues: [{ numero: "FA-101", date: "2023-04-01", fournisseur: F, lignes: [{ libelle: "Prestation", ht: 100, taux: 20 }, { libelle: "Livres", ht: 200, taux: 5.5 }] }],
    attendu: { pieces: { "FA-101": { "604000": { debit: 300 }, "445660": { debit: 31 }, "401000": { credit: 331 } } } },
  },
  {
    nom: "acompte-puis-solde-assujetti-a-cheval",
    pourquoi: "Acompte reçu en décembre, solde en février : l'avance se solde l'année suivante, la TVA n'est déduite qu'une fois.",
    dossier: { tva_regime: "normal", statut_juridique: "micro" },
    annee: "2023",
    recues: [
      { numero: "MA-AC1", date: "2022-12-15", fournisseur: M, type: 386, statut: "fr:212", lignes: [{ libelle: "Acompte", ht: 1000, taux: 20 }] },
      { numero: "MA-S1", date: "2023-02-10", fournisseur: M, lignes: [{ libelle: "Agencement", ht: 3000, taux: 20 }], dejaVerse: 1200, precedentes: [{ numero: "MA-AC1", type: 386 }] },
    ],
    attendu: {
      pieces: { "MA-S1": { "604000": { debit: 3000 }, "445660": { debit: 400 }, "409100": { credit: 1000 }, "401000": { credit: 2400 } } },
      absentes: ["MA-AC1"],
    },
  },
  {
    nom: "acompte-puis-solde-franchise",
    pourquoi: "Même couple en franchise : avance TTC, aucune TVA déduite.",
    dossier: { tva_regime: "franchise", statut_juridique: "micro" },
    annee: "2023",
    recues: [
      { numero: "MA-AC2", date: "2023-01-10", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte", ht: 1000, taux: 20 }] },
      { numero: "MA-S2", date: "2023-03-10", fournisseur: M, lignes: [{ libelle: "Agencement", ht: 3000, taux: 20 }], dejaVerse: 1200, precedentes: [{ numero: "MA-AC2", type: 386 }] },
    ],
    attendu: {
      pieces: {
        "MA-AC2": { "409100": { debit: 1200 }, "401000": { credit: 1200 } },
        "MA-S2": { "604000": { debit: 3600 }, "409100": { credit: 1200 }, "401000": { credit: 2400 } },
      },
      comptes: { "445660": { debit: 0, credit: 0 } },
    },
  },
  {
    nom: "acompte-sans-reference",
    pourquoi: "Le solde ne cite pas l'acompte : un seul acompte du montant versé chez ce fournisseur, on le retrouve.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "MA-AC3", date: "2023-05-01", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte", ht: 500, taux: 20 }] },
      { numero: "MA-S3", date: "2023-06-01", fournisseur: M, lignes: [{ libelle: "Solde", ht: 2000, taux: 20 }], dejaVerse: 600 },
    ],
    attendu: { pieces: { "MA-S3": { "409100": { credit: 500 }, "445660": { debit: 300 }, "401000": { credit: 1800 } } }, comptes: { "409100": { debit: 500, credit: 500 } } },
  },
  {
    nom: "acompte-ambigu",
    pourquoi: "Deux acomptes du même montant et un solde muet : on ne devine pas, on signale.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "MA-AC4", date: "2023-07-01", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte 1", ht: 500, taux: 20 }] },
      { numero: "MA-AC5", date: "2023-07-02", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte 2", ht: 500, taux: 20 }] },
      { numero: "MA-S4", date: "2023-08-01", fournisseur: M, lignes: [{ libelle: "Solde", ht: 3000, taux: 20 }], dejaVerse: 600 },
    ],
    attendu: { pieces: { "MA-S4": { "604000": { debit: 3000 }, "445660": { debit: 600 }, "401000": { credit: 3600 } } }, aVerifier: 1 },
  },
  {
    nom: "avoir-recu-261",
    pourquoi: "Un avoir d'un autre type que 381 : il s'enregistre en sens inverse.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [{ numero: "AV-261", date: "2023-09-01", fournisseur: F, type: 261, lignes: [{ libelle: "Avoir", ht: 500, taux: 20 }] }],
    attendu: { pieces: { "AV-261": { "604000": { credit: 500 }, "445660": { credit: 100 }, "401000": { debit: 600 } } } },
  },
  {
    nom: "factures-refusee-et-rejetee",
    pourquoi: "Une facture refusée (fr:210) ou rejetée (fr:213) n'existe pas comptablement.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "REF-210", date: "2023-03-05", fournisseur: F, statut: "fr:210", lignes: [{ libelle: "X", ht: 100, taux: 20 }] },
      { numero: "REJ-213", date: "2023-03-06", fournisseur: F, statut: "fr:213", lignes: [{ libelle: "Y", ht: 100, taux: 20 }] },
    ],
    attendu: { absentes: ["REF-210", "REJ-213"] },
  },
  {
    nom: "etranger-ue-autoliquidation",
    pourquoi: "Service d'un fournisseur allemand, saisi avec TVA 0 comme le formulaire le demande : autoliquidation calculée.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DE-1", date: "2023-05-10", fournisseur: "Kreativ GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 1000 }],
    attendu: { pieces: { "DE-1": { "604000": { debit: 1000 }, "445662": { debit: 200 }, "445200": { credit: 200 }, "401000": { credit: 1000 } } } },
  },
  {
    nom: "etranger-franchise-autoliquidation",
    pourquoi: "En franchise, la TVA autoliquidée est due mais pas déductible : elle va en charge.",
    dossier: { tva_regime: null },
    annee: "2023",
    etrangers: [{ numero: "IE-1", date: "2023-05-11", fournisseur: "Cloud Ltd", pays: "IE", tva: "IE6388047V", categorie: "services", ht: 500 }],
    attendu: { pieces: { "IE-1": { "604000": { debit: 600 }, "445200": { credit: 100 }, "401000": { credit: 500 } } }, comptes: { "445662": { debit: 0 } } },
  },
  {
    nom: "etranger-tva-facturee",
    pourquoi: "Un fournisseur étranger facture sa propre TVA : non déductible en France, en charge.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DE-2", date: "2023-06-10", fournisseur: "Hotel Berlin", pays: "DE", tva: "DE123456789", categorie: "services", ht: 1000, taux_tva: 19, montant_tva: 190 }],
    attendu: { pieces: { "DE-2": { "604000": { debit: 1190 }, "401000": { credit: 1190 } } }, comptes: { "445200": { credit: 0 }, "445662": { debit: 0 } } },
  },
  {
    nom: "importation-en-dollars",
    pourquoi: "Biens achetés aux États-Unis en dollars : converti au cours BCE du jour, aucune TVA sur la facture (douane).",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "US-1", date: "2023-10-02", fournisseur: "Gear Inc", pays: "US", categorie: "biens", devise: "USD", ht: 1240 }],
    attendu: {
      pieces: { "US-1": { "607000": { debit: { devise: "USD", date: "2023-10-02", montant: 1240 } }, "401000": { credit: { devise: "USD", date: "2023-10-02", montant: 1240 } } } },
      comptes: { "445200": { credit: 0 } },
    },
  },
  {
    nom: "vente-payee-et-achat",
    pourquoi: "Ventes et achats dans le même fichier : prestation payée (TVA sur encaissements) et une facture reçue.",
    dossier: { tva_regime: "normal", statut_juridique: "ei_reel" },
    annee: "2023",
    ventes: [{ date: "2023-03-01", client: "Client Témoin", siren: "552100554", ht: 1000, taux: 20, payeeLe: "2023-03-20" }],
    recues: [{ numero: "FA-102", date: "2023-03-02", fournisseur: F, lignes: [{ libelle: "Impression", ht: 100, taux: 20 }] }],
    attendu: {
      comptes: {
        "706000": { credit: 1000 }, "445740": { debit: 200, credit: 200 }, "445710": { credit: 200 },
        "411000": { debit: 1200, credit: 1200 }, "512000": { debit: 1200 },
        "604000": { debit: 100 }, "445660": { debit: 20 }, "401000": { credit: 120 },
      },
    },
  },
];
