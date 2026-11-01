import { tvaParTaux, type FactureCabinet } from "./cabinet-dossiers";

/**
 * Calendrier de TVA du cockpit cabinet.
 *
 * Deviso connait, pour chaque dossier, sa periodicite de declaration
 * (profiles.tva_periodicite) et la TVA reellement collectee mois par mois. Le
 * comptable peut donc voir d'un coup d'oeil, pour tout son portefeuille, quelle
 * TVA est prete a declarer sur la derniere periode close et laquelle s'accumule
 * sur la periode en cours, sans ouvrir chaque dossier.
 *
 * Fonctions pures : elles travaillent sur des factures DEJA lues par un
 * appelant qui a verifie l'acces (lib/cabinet-acces.ts). Aucune lecture ici.
 */

export type Periodicite = "monthly" | "quarterly" | "simplified";

export type PeriodeTva = {
  cle: string;
  libelle: string;
  base_ht: number;
  tva: number;
  debut: string; // AAAA-MM-JJ inclus
  fin: string; // AAAA-MM-JJ inclus
};

export type LigneCalendrier = {
  id: string;
  nom: string;
  // null = dossier en franchise (rien a declarer) ou periodicite non renseignee.
  periodicite: Periodicite | null;
  franchise: boolean;
  aDeclarer: PeriodeTva | null; // derniere periode close, prete a declarer
  enCours: PeriodeTva | null; // periode contenant la date de reference
};

const pad = (n: number) => String(n).padStart(2, "0");
const arrondi = (n: number) => Math.round(n * 100) / 100;

const estPeriodicite = (v: string | null): v is Periodicite =>
  v === "monthly" || v === "quarterly" || v === "simplified";

/** Montants de TVA (avoirs deduits) sur les factures emises d'une fenetre de dates. */
function periode(cle: string, libelle: string, debut: string, fin: string, factures: FactureCabinet[]): PeriodeTva {
  const dans = factures.filter((f) => f.issue_date >= debut && f.issue_date <= fin);
  const parTaux = tvaParTaux(dans);
  return {
    cle,
    libelle,
    debut,
    fin,
    base_ht: arrondi(parTaux.reduce((s, t) => s + t.base_ht, 0)),
    tva: arrondi(parTaux.reduce((s, t) => s + t.tva, 0)),
  };
}

function bornesMois(annee: number, mois0: number) {
  const debut = `${annee}-${pad(mois0 + 1)}-01`;
  const fin = new Date(Date.UTC(annee, mois0 + 1, 0)).toISOString().slice(0, 10);
  const libelle = new Date(Date.UTC(annee, mois0, 1)).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { cle: `${annee}-${pad(mois0 + 1)}`, libelle, debut, fin };
}

function bornesTrimestre(annee: number, t: number) {
  const mois0 = t * 3;
  const debut = `${annee}-${pad(mois0 + 1)}-01`;
  const fin = new Date(Date.UTC(annee, mois0 + 3, 0)).toISOString().slice(0, 10);
  const nom = ["1er", "2e", "3e", "4e"][t];
  return { cle: `${annee}-T${t + 1}`, libelle: `${nom} trimestre ${annee}`, debut, fin };
}

function bornesAnnee(annee: number) {
  return { cle: `${annee}`, libelle: `annee ${annee}`, debut: `${annee}-01-01`, fin: `${annee}-12-31` };
}

/**
 * Echeance TVA d'un dossier : derniere periode close (a declarer) et periode en
 * cours, selon sa periodicite. `reference` donne la date du jour.
 */
export function echeanceDossier(
  periodicite: Periodicite,
  factures: FactureCabinet[],
  reference: Date,
): { aDeclarer: PeriodeTva; enCours: PeriodeTva } {
  const an = reference.getUTCFullYear();
  const m = reference.getUTCMonth(); // 0-11

  if (periodicite === "monthly") {
    const cour = bornesMois(an, m);
    const precM = m === 0 ? 11 : m - 1;
    const precA = m === 0 ? an - 1 : an;
    const prec = bornesMois(precA, precM);
    return {
      enCours: periode(cour.cle, cour.libelle, cour.debut, cour.fin, factures),
      aDeclarer: periode(prec.cle, prec.libelle, prec.debut, prec.fin, factures),
    };
  }
  if (periodicite === "quarterly") {
    const t = Math.floor(m / 3);
    const cour = bornesTrimestre(an, t);
    const precT = t === 0 ? 3 : t - 1;
    const precA = t === 0 ? an - 1 : an;
    const prec = bornesTrimestre(precA, precT);
    return {
      enCours: periode(cour.cle, cour.libelle, cour.debut, cour.fin, factures),
      aDeclarer: periode(prec.cle, prec.libelle, prec.debut, prec.fin, factures),
    };
  }
  // simplified : declaration annuelle (CA12).
  const cour = bornesAnnee(an);
  const prec = bornesAnnee(an - 1);
  return {
    enCours: periode(cour.cle, cour.libelle, cour.debut, cour.fin, factures),
    aDeclarer: periode(prec.cle, prec.libelle, prec.debut, prec.fin, factures),
  };
}

const URGENCE: Record<Periodicite, number> = { monthly: 0, quarterly: 1, simplified: 2 };

/**
 * Calendrier TVA de tout le portefeuille. Les dossiers assujettis d'abord
 * (periodicite la plus frequente en tete, puis la TVA a declarer la plus
 * elevee), les dossiers en franchise ensuite (rien a declarer).
 */
export function calendrierTva(
  dossiers: { id: string; nom: string; tvaRegime: string | null; tvaPeriodicite: string | null }[],
  factures: FactureCabinet[],
  reference: Date = new Date(),
): LigneCalendrier[] {
  const lignes = dossiers.map((d): LigneCalendrier => {
    const franchise = (d.tvaRegime ?? "franchise") === "franchise";
    const facturesDossier = factures.filter((f) => f.user_id === d.id);
    if (franchise || !estPeriodicite(d.tvaPeriodicite)) {
      return { id: d.id, nom: d.nom, periodicite: null, franchise, aDeclarer: null, enCours: null };
    }
    const e = echeanceDossier(d.tvaPeriodicite, facturesDossier, reference);
    return { id: d.id, nom: d.nom, periodicite: d.tvaPeriodicite, franchise: false, aDeclarer: e.aDeclarer, enCours: e.enCours };
  });

  return lignes.sort((a, b) => {
    if (a.franchise !== b.franchise) return a.franchise ? 1 : -1;
    const ua = a.periodicite ? URGENCE[a.periodicite] : 3;
    const ub = b.periodicite ? URGENCE[b.periodicite] : 3;
    if (ua !== ub) return ua - ub;
    return (b.aDeclarer?.tva ?? 0) - (a.aDeclarer?.tva ?? 0) || a.nom.localeCompare(b.nom);
  });
}

export const LIBELLE_PERIODICITE: Record<Periodicite, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  simplified: "Annuelle (RSI)",
};
