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
  /** État de la transmission (défaut : en_attente). « transmis » pose aussi un identifiant chez la plateforme. */
  statut?: "en_attente" | "transmis" | "echec" | "action_requise";
  /** TVA que porte la facture (absente : achat saisi avant ce choix, déduite du montant). */
  tva_facturee?: "aucune" | "francaise" | "etrangere";
  /** Taux français de l'autoliquidation (défaut en base : 20). */
  taux_autoliquidation?: number;
  /** Saisi par la route POST /api/superpdp/achats, comme l'écran, au lieu d'être injecté en base. */
  parRoute?: boolean;
  /** Code HTTP attendu si la route doit refuser la saisie (l'achat n'existe alors pas). */
  refuse?: number;
  /** Avoir du fournisseur (montants positifs). */
  avoir?: boolean;
  /** Statut de transmission attendu après la saisie par la route (compte démo : jamais « transmis »). */
  statutApresSaisie?: "en_attente" | "hors_champ";
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
    /** Nombre de soldes signalés « à vérifier » au cabinet (acompte non retrouvé). */
    aVerifier?: number;
    /**
     * Toutes les alertes « à vérifier » du dossier : chacune doit apparaître
     * (morceau de texte), et il n'y en a pas d'autre. Vide par défaut : un
     * scénario qui n'en attend pas n'en tolère aucune.
     */
    alertes?: string[];
  };
  /**
   * Suppressions demandées par le titulaire, AVANT les exports : numéro de
   * l'achat à l'étranger et code HTTP attendu. Un achat supprimé disparaît du
   * FEC, un achat refusé y reste.
   */
  supprimer?: { numero: string; status: number }[];
  /**
   * Ventes écrites directement en base (émises, non payées), en nombre : pour
   * passer le seuil de 1 000 lignes d'une lecture PostgREST.
   */
  ventesEnMasse?: { nombre: number; date: string; ht: number; taux: number };
  /** Taux d'autoliquidation choisis sur des factures reçues AE, par la route de l'écran, et code HTTP attendu. */
  tauxAe?: { numero: string; taux: number | null; status: number }[];
  /** Plan de comptes que le cabinet tente d'enregistrer, et le code HTTP attendu (remis à défaut après). */
  planCabinet?: { plan: Record<string, string>; status: number };
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
    etrangers: [{ numero: "DE-2", date: "2023-06-10", fournisseur: "Hotel Berlin", pays: "DE", tva: "DE123456789", categorie: "services", ht: 1000, taux_tva: 19, montant_tva: 190, tva_facturee: "etrangere" }],
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
  // ── Point 6 : suppression et échec de transmission des achats à l'étranger ──
  {
    nom: "etranger-suppression-non-transmis",
    pourquoi: "Un achat saisi par erreur, jamais transmis : le titulaire le supprime, il disparaît de la comptabilité.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [
      { numero: "DE-ERR", date: "2023-02-01", fournisseur: "Doublon GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 300 },
      { numero: "DE-OK", date: "2023-02-02", fournisseur: "Kreativ GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 400 },
    ],
    supprimer: [{ numero: "DE-ERR", status: 200 }],
    attendu: { absentes: ["DE-ERR"], pieces: { "DE-OK": { "604000": { debit: 400 }, "401000": { credit: 400 } } } },
  },
  {
    nom: "etranger-transmis-jamais-supprime",
    pourquoi: "Un achat transmis à la plateforme : sa déclaration existe, la suppression est refusée et il reste en comptabilité.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DE-TX", date: "2023-02-03", fournisseur: "Kreativ GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 500, statut: "transmis" }],
    supprimer: [{ numero: "DE-TX", status: 409 }],
    attendu: { pieces: { "DE-TX": { "604000": { debit: 500 }, "445662": { debit: 100 }, "445200": { credit: 100 }, "401000": { credit: 500 } } } },
  },
  {
    nom: "etranger-echec-compte-et-signale",
    pourquoi: "Un achat dont la transmission a échoué : il a eu lieu, il reste en comptabilité, et le cabinet en est averti.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [
      { numero: "DE-KO", date: "2023-02-04", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 250, statut: "echec" },
      { numero: "US-AR", date: "2023-02-05", fournisseur: "Blocked Inc", pays: "US", tva: "98-7654321", categorie: "services", ht: 100, statut: "action_requise" },
    ],
    attendu: {
      pieces: { "DE-KO": { "604000": { debit: 250 }, "401000": { credit: 250 } }, "US-AR": { "604000": { debit: 100 }, "401000": { credit: 100 } } },
      alertes: ["DE-KO (Refus GmbH) : achat à l'étranger non déclaré", "US-AR (Blocked Inc) : achat à l'étranger non déclaré"],
    },
  },
  // ── Point 8 : défauts Quadra et lecture des ventes ──────────────────────
  {
    nom: "quadra-ligne-negative",
    pourquoi: "Solde dont la TVA est inférieure à celle de son acompte : lignes négatives, que Quadra doit écrire en sens inverse au lieu de les perdre.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "MA-AC6", date: "2023-04-01", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte", ht: 1000, taux: 20 }] },
      { numero: "MA-S6", date: "2023-04-20", fournisseur: M, lignes: [{ libelle: "Solde réduit", ht: 500, taux: 20 }], dejaVerse: 1200, precedentes: [{ numero: "MA-AC6", type: 386 }] },
    ],
    attendu: { pieces: { "MA-S6": { "604000": { debit: 500 }, "445660": { debit: -100 }, "409100": { credit: 1000 }, "401000": { credit: -600 } } } },
  },
  {
    nom: "quadra-journaux-deux-caracteres",
    pourquoi: "Deux journaux qui ne diffèrent qu'au 3e caractère fusionneraient dans Quadra : le réglage est refusé.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    planCabinet: { plan: { journalVentes: "VT1", journalAchats: "VT2" }, status: 400 },
    recues: [{ numero: "FA-103", date: "2023-03-03", fournisseur: F, lignes: [{ libelle: "Impression", ht: 100, taux: 20 }] }],
    attendu: { pieces: { "FA-103": { "604000": { debit: 100 }, "445660": { debit: 20 }, "401000": { credit: 120 } } } },
  },
  {
    nom: "ventes-au-dela-de-1000",
    pourquoi: "1 005 ventes sur l'année : au-delà de 1 000 lignes, une lecture non paginée en perdait sans rien dire.",
    dossier: { tva_regime: "normal", statut_juridique: "societe" },
    annee: "2023",
    ventesEnMasse: { nombre: 1005, date: "2023-06-15", ht: 10, taux: 20 },
    attendu: { comptes: { "706000": { credit: 10050 }, "445740": { credit: 2010 }, "411000": { debit: 12060 } } },
  },
  // ── Point 3 : TVA de la facture choisie à la saisie ─────────────────────
  {
    nom: "etranger-tva-francaise",
    pourquoi: "Fournisseur étranger immatriculé en France, qui facture la TVA française : déductible en 445660, pas d'autoliquidation.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DE-FR", date: "2023-07-01", fournisseur: "Messe GmbH", pays: "DE", tva: "FR40303265045", categorie: "services", ht: 1000, taux_tva: 20, montant_tva: 200, tva_facturee: "francaise", parRoute: true }],
    attendu: {
      pieces: { "DE-FR": { "604000": { debit: 1000 }, "445660": { debit: 200 }, "401000": { credit: 1200 } } }, comptes: { "445200": { credit: 0 }, "445662": { debit: 0 } },
      alertes: ["DE-FR (Messe GmbH) : TVA française facturée par un fournisseur étranger"],
    },
  },
  {
    nom: "etranger-tva-francaise-franchise",
    pourquoi: "La même facture en franchise : la TVA française n'est pas déductible, elle va en charge.",
    dossier: { tva_regime: "franchise", statut_juridique: "micro" },
    annee: "2023",
    etrangers: [{ numero: "DE-FR2", date: "2023-07-02", fournisseur: "Messe GmbH", pays: "DE", tva: "FR40303265045", categorie: "services", ht: 1000, taux_tva: 20, montant_tva: 200, tva_facturee: "francaise", parRoute: true }],
    attendu: {
      pieces: { "DE-FR2": { "604000": { debit: 1200 }, "401000": { credit: 1200 } } }, comptes: { "445660": { debit: 0 } },
      alertes: ["DE-FR2 (Messe GmbH) : TVA française facturée par un fournisseur étranger"],
    },
  },
  {
    nom: "etranger-tva-etrangere-saisie",
    pourquoi: "TVA allemande choisie explicitement à la saisie : en charge, rien à déduire ni à autoliquider.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DE-ET", date: "2023-07-03", fournisseur: "Hotel Berlin", pays: "DE", tva: "DE123456789", categorie: "services", ht: 500, taux_tva: 19, montant_tva: 95, tva_facturee: "etrangere", parRoute: true }],
    attendu: { pieces: { "DE-ET": { "604000": { debit: 595 }, "401000": { credit: 595 } } }, comptes: { "445660": { debit: 0 }, "445200": { credit: 0 } } },
  },
  {
    nom: "etranger-aucune-saisie",
    pourquoi: "Aucune TVA choisie à la saisie, services de l'UE : autoliquidation au taux normal par défaut.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "NL-AU", date: "2023-07-04", fournisseur: "Design BV", pays: "NL", tva: "NL859048676B01", categorie: "services", ht: 800, tva_facturee: "aucune", parRoute: true }],
    attendu: { pieces: { "NL-AU": { "604000": { debit: 800 }, "445662": { debit: 160 }, "445200": { credit: 160 }, "401000": { credit: 800 } } } },
  },
  {
    nom: "etranger-saisie-incoherente",
    pourquoi: "« Aucune TVA » avec un montant de TVA, ou « TVA française » sans TVA ou à un taux étranger : la saisie est refusée, rien n'est enregistré.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [
      { numero: "BAD-1", date: "2023-07-05", fournisseur: "X GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 100, taux_tva: 20, montant_tva: 20, tva_facturee: "aucune", parRoute: true, refuse: 400 },
      { numero: "BAD-2", date: "2023-07-05", fournisseur: "X GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 100, tva_facturee: "francaise", parRoute: true, refuse: 400 },
      { numero: "BAD-3", date: "2023-07-05", fournisseur: "X GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 100, taux_tva: 19, montant_tva: 19, tva_facturee: "francaise", parRoute: true, refuse: 400 },
      { numero: "BAD-4", date: "2023-07-05", fournisseur: "X GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 100, parRoute: true, refuse: 400 },
    ],
    attendu: { absentes: ["BAD-1", "BAD-2", "BAD-3", "BAD-4"] },
  },
  // ── Point 5 : taux français de l'autoliquidation, sous-traitance AE ─────
  {
    nom: "etranger-autoliquidation-taux-reduit",
    pourquoi: "Achat autoliquidé relevant du taux de 10 % : le taux saisi remplace le 20 % fixe.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "BE-10", date: "2023-08-01", fournisseur: "Renov SPRL", pays: "BE", tva: "BE0477472701", categorie: "services", ht: 1000, tva_facturee: "aucune", taux_autoliquidation: 10, parRoute: true }],
    attendu: { pieces: { "BE-10": { "604000": { debit: 1000 }, "445662": { debit: 100 }, "445200": { credit: 100 }, "401000": { credit: 1000 } } } },
  },
  {
    nom: "etranger-autoliquidation-taux-invalide",
    pourquoi: "Un taux d'autoliquidation qui n'existe pas en France (7 %) est refusé.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "BE-7", date: "2023-08-02", fournisseur: "Renov SPRL", pays: "BE", tva: "BE0477472701", categorie: "services", ht: 1000, tva_facturee: "aucune", taux_autoliquidation: 7, parRoute: true, refuse: 400 }],
    attendu: { absentes: ["BE-7"] },
  },
  {
    nom: "recue-sous-traitance-ae",
    pourquoi: "Facture d'un sous-traitant du bâtiment, catégorie AE (sans TVA) : 4452 au crédit, 445662 au débit, fournisseur dû du HT ; taux à confirmer par le cabinet.",
    dossier: { tva_regime: "normal", statut_juridique: "societe" },
    annee: "2023",
    recues: [{ numero: "ST-1", date: "2023-09-10", fournisseur: M, lignes: [{ libelle: "Pose de cloisons", ht: 5000, taux: 0, categorie: "AE" }] }],
    attendu: {
      pieces: { "ST-1": { "604000": { debit: 5000 }, "445662": { debit: 1000 }, "445220": { credit: 1000 }, "401000": { credit: 5000 } } },
      comptes: { "445660": { debit: 0 } },
      alertes: ["ST-1 (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  {
    nom: "recue-sous-traitance-ae-franchise",
    pourquoi: "La même facture en franchise : la TVA autoliquidée est due mais en charge.",
    dossier: { tva_regime: "franchise", statut_juridique: "micro" },
    annee: "2023",
    recues: [{ numero: "ST-2", date: "2023-09-11", fournisseur: M, lignes: [{ libelle: "Pose de cloisons", ht: 5000, taux: 0, categorie: "AE" }] }],
    attendu: {
      pieces: { "ST-2": { "604000": { debit: 6000 }, "445220": { credit: 1000 }, "401000": { credit: 5000 } } },
      comptes: { "445662": { debit: 0 } },
      alertes: ["ST-2 (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  {
    nom: "recue-mixte-s-et-ae",
    pourquoi: "Une facture qui porte à la fois de la TVA (fourniture) et une part autoliquidée (pose) : chaque part suit sa règle.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [{ numero: "ST-3", date: "2023-09-12", fournisseur: M, lignes: [{ libelle: "Fourniture", ht: 1000, taux: 20 }, { libelle: "Pose", ht: 2000, taux: 0, categorie: "AE" }] }],
    attendu: {
      pieces: { "ST-3": { "604000": { debit: 3000 }, "445660": { debit: 200 }, "445662": { debit: 400 }, "445220": { credit: 400 }, "401000": { credit: 3200 } } },
      alertes: ["ST-3 (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  // ── Relecture indépendante des points 3 et 5 : cas croisés ─────────────
  {
    nom: "recue-ae-acompte-puis-solde",
    pourquoi: "Acompte puis solde d'un sous-traitant en AE : la TVA autoliquidée de l'acompte ne se repasse pas au solde.",
    dossier: { tva_regime: "normal", statut_juridique: "societe" },
    annee: "2023",
    recues: [
      { numero: "ST-AC", date: "2023-05-02", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte pose", ht: 3000, taux: 0, categorie: "AE" }] },
      { numero: "ST-SO", date: "2023-06-02", fournisseur: M, lignes: [{ libelle: "Pose", ht: 10000, taux: 0, categorie: "AE" }], dejaVerse: 3000, precedentes: [{ numero: "ST-AC", type: 386 }] },
    ],
    attendu: {
      pieces: {
        "ST-AC": { "409100": { debit: 3000 }, "445662": { debit: 600 }, "445220": { credit: 600 }, "401000": { credit: 3000 } },
        "ST-SO": { "604000": { debit: 10000 }, "445662": { debit: 1400 }, "445220": { credit: 1400 }, "409100": { credit: 3000 }, "401000": { credit: 7000 } },
      },
      comptes: { "445220": { credit: 2000 }, "445662": { debit: 2000 }, "409100": { debit: 3000, credit: 3000 } },
      alertes: ["ST-AC (Menuiserie Arnaud) : autoliquidation (catégorie AE", "ST-SO (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  {
    nom: "recue-ae-acompte-puis-solde-franchise",
    pourquoi: "Le même couple en franchise : la TVA autoliquidée est due une fois et va en charge, l'avance (TVA comprise) est soldée en entier.",
    dossier: { tva_regime: "franchise", statut_juridique: "micro" },
    annee: "2023",
    recues: [
      { numero: "ST-AC2", date: "2023-05-03", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte pose", ht: 3000, taux: 0, categorie: "AE" }] },
      { numero: "ST-SO2", date: "2023-06-03", fournisseur: M, lignes: [{ libelle: "Pose", ht: 10000, taux: 0, categorie: "AE" }], dejaVerse: 3000, precedentes: [{ numero: "ST-AC2", type: 386 }] },
    ],
    attendu: {
      pieces: {
        "ST-AC2": { "409100": { debit: 3600 }, "445220": { credit: 600 }, "401000": { credit: 3000 } },
        "ST-SO2": { "604000": { debit: 12000 }, "445220": { credit: 1400 }, "409100": { credit: 3600 }, "401000": { credit: 7000 } },
      },
      comptes: { "445220": { credit: 2000 }, "445662": { debit: 0 }, "409100": { debit: 3600, credit: 3600 } },
      alertes: ["ST-AC2 (Menuiserie Arnaud) : autoliquidation (catégorie AE", "ST-SO2 (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  {
    nom: "recue-ae-avoir",
    pourquoi: "Avoir d'un sous-traitant en AE : l'autoliquidation s'inverse avec lui.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [{ numero: "ST-AV", date: "2023-09-20", fournisseur: M, type: 381, lignes: [{ libelle: "Avoir pose", ht: 1000, taux: 0, categorie: "AE" }] }],
    attendu: {
      pieces: { "ST-AV": { "604000": { credit: 1000 }, "445662": { credit: 200 }, "445220": { debit: 200 }, "401000": { debit: 1000 } } },
      alertes: ["ST-AV (Menuiserie Arnaud) : autoliquidation (catégorie AE"],
    },
  },
  {
    nom: "etranger-tva-francaise-biens-hors-ue",
    pourquoi: "TVA française sur des biens achetés hors UE : la nature saisie prime sur la règle d'importation, TVA déductible et signalée.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "US-FR", date: "2023-09-21", fournisseur: "Gear Inc", pays: "US", tva: "FR40303265045", categorie: "biens", ht: 1000, taux_tva: 20, montant_tva: 200, tva_facturee: "francaise", parRoute: true }],
    attendu: {
      pieces: { "US-FR": { "607000": { debit: 1000 }, "445660": { debit: 200 }, "401000": { credit: 1200 } } },
      alertes: ["US-FR (Gear Inc) : TVA française facturée par un fournisseur étranger"],
    },
  },
  // ── Exactitude (21/11) : périmètre déclaré, sous-comptes, avoir, taux AE ──
  {
    nom: "hors-champ-tva-etrangere",
    pourquoi: "TVA étrangère : opération située hors de France, jamais déclarée (statut « non déclarable »), mais en charge dans la comptabilité.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "HC-ET", date: "2023-03-12", fournisseur: "Hotel Berlin", pays: "DE", tva: "DE123456789", categorie: "services", ht: 300, taux_tva: 19, montant_tva: 57, tva_facturee: "etrangere", parRoute: true, statutApresSaisie: "hors_champ" }],
    attendu: { pieces: { "HC-ET": { "604000": { debit: 357 }, "401000": { credit: 357 } } } },
  },
  {
    nom: "hors-champ-importation",
    pourquoi: "Biens achetés hors UE sans TVA : importation, déclarée en douane, jamais à la plateforme ; aucune TVA sur l'écriture.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "HC-IM", date: "2023-03-13", fournisseur: "Gear Inc", pays: "US", tva: "98-7654321", categorie: "biens", ht: 800, tva_facturee: "aucune", parRoute: true, statutApresSaisie: "hors_champ" }],
    attendu: { pieces: { "HC-IM": { "607000": { debit: 800 }, "401000": { credit: 800 } } }, comptes: { "445200": { credit: 0 }, "445210": { credit: 0 } } },
  },
  {
    nom: "declare-services-ue",
    pourquoi: "Services d'un fournisseur de l'UE sans TVA : déclaré (reste en attente sur un compte de démonstration), TVA due intracommunautaire en 445200.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "DC-UE", date: "2023-03-14", fournisseur: "Design BV", pays: "NL", tva: "NL859048676B01", categorie: "services", ht: 1000, tva_facturee: "aucune", parRoute: true, statutApresSaisie: "en_attente" }],
    attendu: { pieces: { "DC-UE": { "604000": { debit: 1000 }, "445662": { debit: 200 }, "445200": { credit: 200 }, "401000": { credit: 1000 } } } },
  },
  {
    nom: "autoliquidation-hors-ue",
    pourquoi: "Services d'un fournisseur établi hors UE : autoliquidation ventilée dans son propre sous-compte (445210), pas avec l'intracommunautaire.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "US-SV", date: "2023-03-15", fournisseur: "Cloud Inc", pays: "US", tva: "98-1234567", categorie: "services", ht: 500, tva_facturee: "aucune", parRoute: true, statutApresSaisie: "en_attente" }],
    attendu: { pieces: { "US-SV": { "604000": { debit: 500 }, "445662": { debit: 100 }, "445210": { credit: 100 }, "401000": { credit: 500 } } }, comptes: { "445200": { credit: 0 } } },
  },
  {
    nom: "avoir-fournisseur-etranger",
    pourquoi: "Avoir d'un fournisseur de l'UE, saisi en montants positifs : l'écriture et l'autoliquidation s'inversent.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [{ numero: "AV-DE", date: "2023-03-16", fournisseur: "Kreativ GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 500, tva_facturee: "aucune", avoir: true, parRoute: true }],
    attendu: { pieces: { "AV-DE": { "604000": { credit: 500 }, "445662": { credit: 100 }, "445200": { debit: 100 }, "401000": { debit: 500 } } } },
  },
  {
    nom: "recue-ae-taux-choisi",
    pourquoi: "Facture de sous-traitance AE dont le titulaire a choisi 10 % : la TVA autoliquidée suit ce taux, plus rien à confirmer.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [{ numero: "ST-10", date: "2023-04-10", fournisseur: M, lignes: [{ libelle: "Rénovation logement", ht: 2000, taux: 0, categorie: "AE" }] }],
    tauxAe: [{ numero: "ST-10", taux: 10, status: 200 }],
    attendu: { pieces: { "ST-10": { "604000": { debit: 2000 }, "445662": { debit: 200 }, "445220": { credit: 200 }, "401000": { credit: 2000 } } }, alertes: [] },
  },
  {
    nom: "recue-ae-taux-refuse",
    pourquoi: "Un taux inexistant (7 %), ou un taux posé sur une facture sans autoliquidation, est refusé ; le taux normal reste présumé et signalé.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "ST-7", date: "2023-04-11", fournisseur: M, lignes: [{ libelle: "Pose", ht: 1000, taux: 0, categorie: "AE" }] },
      { numero: "FA-S", date: "2023-04-12", fournisseur: F, lignes: [{ libelle: "Impression", ht: 100, taux: 20 }] },
    ],
    tauxAe: [{ numero: "ST-7", taux: 7, status: 400 }, { numero: "FA-S", taux: 10, status: 400 }],
    attendu: { pieces: { "ST-7": { "445662": { debit: 200 }, "445220": { credit: 200 } } }, alertes: ["ST-7 (Menuiserie Arnaud) : autoliquidation (catégorie AE"] },
  },
  {
    nom: "recue-ae-sans-ventilation",
    pourquoi: "Facture AE dont la ventilation de TVA est vide : la part autoliquidée est lue sur les lignes.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [{ numero: "ST-L", date: "2023-04-13", fournisseur: M, sansVentilation: true, lignes: [{ libelle: "Pose", ht: 1500, taux: 0, categorie: "AE" }] }],
    attendu: { pieces: { "ST-L": { "604000": { debit: 1500 }, "445662": { debit: 300 }, "445220": { credit: 300 }, "401000": { credit: 1500 } } }, alertes: ["ST-L (Menuiserie Arnaud) : autoliquidation (catégorie AE"] },
  },
  {
    nom: "solde-sans-tva-apres-acompte",
    pourquoi: "Acompte à 20 %, solde sans TVA : la TVA déduite sur l'acompte est reprise, l'écriture reste équilibrée et le cabinet est prévenu.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    recues: [
      { numero: "MA-AC9", date: "2023-05-05", fournisseur: M, type: 386, lignes: [{ libelle: "Acompte", ht: 1000, taux: 20 }] },
      { numero: "MA-S9", date: "2023-06-05", fournisseur: M, lignes: [{ libelle: "Solde exonéré", ht: 3000, taux: 0 }], dejaVerse: 1200, precedentes: [{ numero: "MA-AC9", type: 386 }] },
    ],
    attendu: {
      pieces: { "MA-S9": { "604000": { debit: 3000 }, "445660": { debit: -200 }, "409100": { credit: 1000 }, "401000": { credit: 1800 } } },
      comptes: { "445660": { debit: 0 }, "409100": { debit: 1000, credit: 1000 } },
      alertes: ["MA-S9 (Menuiserie Arnaud) : TVA de l'acompte MA-AC9 à 20 % absente du solde"],
    },
  },
  {
    nom: "franchise-biens-ue-seuil",
    pourquoi: "Dossier en franchise qui achète des biens dans l'UE sans TVA : le cabinet reçoit les cumuls d'acquisitions qui décident si la TVA est due.",
    dossier: { tva_regime: "franchise", statut_juridique: "micro" },
    annee: "2023",
    etrangers: [
      { numero: "BI-22", date: "2022-11-02", fournisseur: "Holz GmbH", pays: "DE", tva: "DE811569869", categorie: "biens", ht: 4000, tva_facturee: "aucune" },
      { numero: "BI-23", date: "2023-05-02", fournisseur: "Holz GmbH", pays: "DE", tva: "DE811569869", categorie: "biens", ht: 2000, tva_facturee: "aucune" },
    ],
    attendu: {
      pieces: { "BI-23": { "607000": { debit: 2400 }, "445200": { credit: 400 }, "401000": { credit: 2000 } } },
      alertes: ["BI-23 (Holz GmbH) : dossier en franchise, acquisition de biens dans l'UE autoliquidée ; TVA due seulement au-delà de 10 000 € d'acquisitions (CGI art. 256 bis) ou sur option : 2000.00 € en 2023, 4000.00 € en 2022"],
    },
  },
  // ── Point 7 : alertes visibles avant l'export ────────────────────────────
  {
    nom: "alertes-nombreuses-avant-export",
    pourquoi: "Six achats en échec : les six figurent dans la fenêtre d'export et la note, la fiche du dossier en liste cinq puis résume.",
    dossier: { tva_regime: "normal" },
    annee: "2023",
    etrangers: [
      { numero: "KO-1", date: "2023-10-01", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 100, statut: "echec" },
      { numero: "KO-2", date: "2023-10-02", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 200, statut: "echec" },
      { numero: "KO-3", date: "2023-10-03", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 300, statut: "echec" },
      { numero: "KO-4", date: "2023-10-04", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 400, statut: "echec" },
      { numero: "KO-5", date: "2023-10-05", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 500, statut: "echec" },
      { numero: "KO-6", date: "2023-10-06", fournisseur: "Refus GmbH", pays: "DE", tva: "DE811569869", categorie: "services", ht: 600, statut: "echec" },
    ],
    attendu: { alertes: Array(6).fill("achat à l'étranger non déclaré") },
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
