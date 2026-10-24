/**
 * Périodes de déclaration du micro-entrepreneur, telles que l'API Tierce
 * Déclaration auto-entrepreneur (TDAE) les attend.
 *
 * Source : ACOSS-Documentation-API-TDAEV1 v1.5.0, § 3.4 et 3.5, et contrat
 * Swagger de production 1.5.1 (objet Periode : `annee` obligatoire, `mois` OU
 * `trimestre`, jamais les deux).
 *
 * Fonctions pures, sans réseau : elles sont testées par
 * scripts/e2e/urssaf-tdae.mjs.
 */
import type { LigneRecette } from "@/lib/recettes";

/** Périodicité renvoyée par l'API 020 (`periodicite`, enum M | T). */
export type Periodicite = "M" | "T";

/** Objet Periode du contrat : mois OU trimestre selon la périodicité. */
export type PeriodeTdae =
  | { annee: number; mois: number; trimestre?: never }
  | { annee: number; trimestre: number; mois?: never };

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function libellePeriode(p: PeriodeTdae): string {
  return p.mois !== undefined ? `${MOIS[p.mois - 1]} ${p.annee}` : `${p.trimestre}e trimestre ${p.annee}`.replace(/^1e/, "1er");
}

/** Premier et dernier jour (AAAA-MM-JJ) couverts par la période. */
export function bornesPeriode(p: PeriodeTdae): { debut: string; fin: string } {
  const m1 = p.mois !== undefined ? p.mois : (p.trimestre - 1) * 3 + 1;
  const m2 = p.mois !== undefined ? p.mois : m1 + 2;
  const dernier = new Date(Date.UTC(p.annee, m2, 0)).getUTCDate();
  const mm = (m: number) => String(m).padStart(2, "0");
  return { debut: `${p.annee}-${mm(m1)}-01`, fin: `${p.annee}-${mm(m2)}-${String(dernier).padStart(2, "0")}` };
}

/** Dernier jour du mois (1..12) d'une année, au format AAAA-MM-JJ. */
function finDeMois(annee: number, mois: number): string {
  const d = new Date(Date.UTC(annee, mois, 0));
  return d.toISOString().slice(0, 10);
}

/** Mois (1..12) et année situés `n` mois après (annee, mois). */
function decaler(annee: number, mois: number, n: number): { annee: number; mois: number } {
  const i = annee * 12 + (mois - 1) + n;
  return { annee: Math.floor(i / 12), mois: (i % 12) + 1 };
}

/**
 * Date d'exigibilité d'une période, hors cas de début d'activité :
 * dernier jour du mois qui suit la période (mensuel : 31/01 pour décembre ;
 * trimestriel : 30/04, 31/07, 31/10, 31/01).
 */
export function exigibiliteStandard(p: PeriodeTdae): string {
  const dernierMois = p.mois !== undefined ? p.mois : p.trimestre * 3;
  const s = decaler(p.annee, dernierMois, 1);
  return finDeMois(s.annee, s.mois);
}

/**
 * Première date d'exigibilité selon la date de début d'activité (tableaux de la
 * documentation, § 3.5.1, page 18) :
 *  - mensuel : début en mois m, exigible le dernier jour de m + 4
 *    (début janvier, exigible 31 mai) ;
 *  - trimestriel : début au trimestre q, exigible le dernier jour du mois qui
 *    suit le trimestre q + 1 (début janvier à mars, exigible 31 juillet).
 */
export function premiereExigibilite(debutActivite: string, periodicite: Periodicite): string {
  const annee = Number(debutActivite.slice(0, 4));
  const mois = Number(debutActivite.slice(5, 7));
  if (periodicite === "M") {
    const e = decaler(annee, mois, 4);
    return finDeMois(e.annee, e.mois);
  }
  const finTrimestreSuivant = Math.ceil(mois / 3) * 3 + 3;
  const e = decaler(annee, finTrimestreSuivant, 1);
  return finDeMois(e.annee, e.mois);
}

/**
 * Date d'exigibilité effective : la standard, repoussée à la première
 * exigibilité si la période tombe dans le délai de début d'activité.
 * L'URSSAF renvoie de toute façon `dateExigibilite` après déclaration : c'est
 * sa valeur qui fait foi, celle-ci sert à l'affichage avant envoi.
 */
export function dateExigibilite(p: PeriodeTdae, periodicite: Periodicite, debutActivite?: string | null): string {
  const std = exigibiliteStandard(p);
  if (!debutActivite) return std;
  const premiere = premiereExigibilite(debutActivite, periodicite);
  return premiere > std ? premiere : std;
}

/** Période qui contient une date donnée (AAAA-MM-JJ). */
export function periodeDe(date: string, periodicite: Periodicite): PeriodeTdae {
  const annee = Number(date.slice(0, 4));
  const mois = Number(date.slice(5, 7));
  return periodicite === "M" ? { annee, mois } : { annee, trimestre: Math.ceil(mois / 3) };
}

/** Période qui précède immédiatement `p`. */
export function periodePrecedente(p: PeriodeTdae): PeriodeTdae {
  if (p.mois !== undefined) {
    const d = decaler(p.annee, p.mois, -1);
    return { annee: d.annee, mois: d.mois };
  }
  return p.trimestre === 1 ? { annee: p.annee - 1, trimestre: 4 } : { annee: p.annee, trimestre: p.trimestre - 1 };
}

/**
 * Période dont la déclaration est attendue à la date `aujourdhui` : la période
 * close la plus récente (le mois ou le trimestre écoulé). L'URSSAF reste seule
 * juge de l'ouverture réelle (erreur APPEL_INCONNU sinon), notamment en début
 * d'activité où plusieurs périodes sont déclarées à la même échéance.
 */
export function periodeADeclarer(periodicite: Periodicite, aujourdhui: string): PeriodeTdae {
  return periodePrecedente(periodeDe(aujourdhui, periodicite));
}

/**
 * Arrondi imposé par l'URSSAF (§ 3.5.1, règle DGFiP) : montants entiers,
 * centimes >= 0,50 arrondis à l'unité supérieure, < 0,50 à l'inférieure.
 * 1458,50 => 1459 ; 2365,47 => 2365.
 */
export function arrondiUrssaf(montant: number): number {
  // Passage par les centimes entiers pour neutraliser les erreurs binaires
  // (1458.5 peut valoir 1458.4999999 après une somme de flottants).
  const centimes = Math.round(montant * 100);
  return Math.floor((centimes + 50) / 100);
}

export type CaPeriode = {
  periode: PeriodeTdae;
  /** Somme HT encaissée exacte (avoirs déduits), en euros. */
  encaisseHt: number;
  /** Montant à transmettre : arrondi URSSAF, jamais négatif. */
  montantDeclarable: number;
  /** Nombre d'encaissements pris en compte. */
  nombre: number;
  /** Encaissements dont la date réelle manque (date d'émission utilisée). */
  datesEstimees: number;
  /** Vrai si les avoirs dépassent les encaissements sur la période. */
  negatifRamene: boolean;
};

/**
 * CA à déclarer pour une période, calculé depuis le livre des recettes (même
 * source que la page Livre des recettes et le tableau de bord).
 */
export function caDeLaPeriode(lignes: LigneRecette[], p: PeriodeTdae): CaPeriode {
  const { debut, fin } = bornesPeriode(p);
  const dans = lignes.filter((l) => l.date >= debut && l.date <= fin);
  const encaisseHt = Math.round(dans.reduce((s, l) => s + l.ht, 0) * 100) / 100;
  return {
    periode: p,
    encaisseHt,
    montantDeclarable: Math.max(0, arrondiUrssaf(encaisseHt)),
    nombre: dans.length,
    datesEstimees: dans.filter((l) => l.dateEstimee).length,
    negatifRamene: encaisseHt < 0,
  };
}

export function estPeriodeValide(v: unknown): v is PeriodeTdae {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  if (!Number.isInteger(p.annee) || (p.annee as number) < 2000 || (p.annee as number) > 2100) return false;
  const aMois = p.mois !== undefined && p.mois !== null;
  const aTrim = p.trimestre !== undefined && p.trimestre !== null;
  if (aMois === aTrim) return false;
  if (aMois) return Number.isInteger(p.mois) && (p.mois as number) >= 1 && (p.mois as number) <= 12;
  return Number.isInteger(p.trimestre) && (p.trimestre as number) >= 1 && (p.trimestre as number) <= 4;
}

export function periodeConformeA(p: PeriodeTdae, periodicite: Periodicite): boolean {
  return periodicite === "M" ? p.mois !== undefined : p.trimestre !== undefined;
}
