/**
 * Rythme du résumé par e-mail du cabinet (20/11/2026), réglé par le cabinet
 * dans Paramètres > Notifications : reçu ou non, toutes les semaines, toutes
 * les deux semaines ou une fois par mois, le jour ouvré de son choix.
 *
 * Le cron passe chaque matin ; ce module décide seul si c'est le jour. Une
 * fonction pure, testée par scripts/e2e/resume-frequence.ts.
 */
export type FrequenceResume = "hebdo" | "quinzaine" | "mensuel";

export const FREQUENCES: { id: FrequenceResume; libelle: string }[] = [
  { id: "hebdo", libelle: "Chaque semaine" },
  { id: "quinzaine", libelle: "Toutes les deux semaines" },
  { id: "mensuel", libelle: "Une fois par mois" },
];

/** Jours ouvrés, numérotés comme Date.getUTCDay (1 = lundi). */
export const JOURS: { id: number; libelle: string }[] = [
  { id: 1, libelle: "lundi" },
  { id: 2, libelle: "mardi" },
  { id: 3, libelle: "mercredi" },
  { id: 4, libelle: "jeudi" },
  { id: 5, libelle: "vendredi" },
];

export const estFrequence = (v: unknown): v is FrequenceResume => FREQUENCES.some((f) => f.id === v);
export const estJour = (v: unknown): v is number => typeof v === "number" && JOURS.some((j) => j.id === v);

const JOUR_MS = 86_400_000;
const jourIso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Le résumé est-il dû ce jour-là ?
 * - le jour de la semaine doit être celui choisi ;
 * - toutes les deux semaines : au moins 13 jours depuis le dernier passage ;
 * - une fois par mois : le premier jour choisi du mois (quantième 1 à 7).
 * `dernierPassage` est la date (AAAA-MM-JJ) du dernier jour où le résumé était
 * dû, envoyé ou non (rien à signaler) : le rythme reste régulier.
 */
export function resumeDu(jour: Date, frequence: FrequenceResume, jourChoisi: number, dernierPassage: string | null): boolean {
  if (jour.getUTCDay() !== jourChoisi) return false;
  if (dernierPassage === jourIso(jour)) return false; // déjà traité aujourd'hui
  if (frequence === "mensuel") return jour.getUTCDate() <= 7;
  if (frequence === "quinzaine") {
    if (!dernierPassage) return true;
    return (Date.parse(jourIso(jour)) - Date.parse(dernierPassage)) / JOUR_MS >= 13;
  }
  return true;
}

/** Prochain jour d'envoi à partir de `depuis` (inclus), pour l'afficher au cabinet. */
export function prochainEnvoi(depuis: Date, frequence: FrequenceResume, jourChoisi: number, dernierPassage: string | null): Date {
  const d = new Date(Date.UTC(depuis.getUTCFullYear(), depuis.getUTCMonth(), depuis.getUTCDate()));
  for (let i = 0; i < 70; i++) {
    if (resumeDu(d, frequence, jourChoisi, dernierPassage)) return d;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

/** « chaque lundi », « un mardi sur deux », « le premier mercredi du mois ». */
export function rythmeEnClair(frequence: FrequenceResume, jourChoisi: number): string {
  const j = JOURS.find((x) => x.id === jourChoisi)?.libelle ?? "lundi";
  if (frequence === "quinzaine") return `un ${j} sur deux`;
  if (frequence === "mensuel") return `le premier ${j} du mois`;
  return `chaque ${j}`;
}
