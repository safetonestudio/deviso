/**
 * Plan de comptes du FEC, réglable par le cabinet (20/11/2026).
 *
 * Chaque cabinet a ses conventions (411 ou 4110000, 706100, journal « VE »
 * plutôt que « VT »...). Sans réglage, le cabinet devait corriger chaque
 * import. Le plan est enregistré sur le profil du cabinet
 * (profiles.plan_comptes_fec) et appliqué aux FEC qu'il exporte depuis son
 * espace ; l'export fait par le client lui-même garde le plan par défaut.
 *
 * Sans dépendance serveur : importé par l'écran de réglage.
 */
export type PlanComptesFec = {
  journalVentes: string;
  journalBanque: string;
  clients: string;
  ventesServices: string;
  ventesBiens: string;
  tvaCollectee: string;
  tvaNonExigible: string;
  banque: string;
  // Achats (20/11/2026) : factures reçues par la plateforme agréée et achats
  // auprès de fournisseurs étrangers.
  journalAchats: string;
  fournisseurs: string;
  avancesFournisseurs: string;
  achatsServices: string;
  achatsBiens: string;
  tvaDeductible: string;
  tvaDeductibleAutoliq: string;
  tvaAutoliquidee: string;
};

export const PLAN_PAR_DEFAUT: PlanComptesFec = {
  journalVentes: "VT",
  journalBanque: "BQ",
  clients: "411000",
  ventesServices: "706000",
  ventesBiens: "707000",
  tvaCollectee: "445710",
  tvaNonExigible: "445740",
  banque: "512000",
  journalAchats: "HA",
  fournisseurs: "401000",
  avancesFournisseurs: "409100",
  achatsServices: "604000",
  achatsBiens: "607000",
  tvaDeductible: "445660",
  tvaDeductibleAutoliq: "445662",
  tvaAutoliquidee: "445200",
};

export const LIBELLES_PLAN: Record<keyof PlanComptesFec, string> = {
  journalVentes: "Journal des ventes",
  journalBanque: "Journal de banque",
  clients: "Compte clients (collectif)",
  ventesServices: "Prestations de services",
  ventesBiens: "Ventes de marchandises",
  tvaCollectee: "TVA collectée",
  tvaNonExigible: "TVA collectée non exigible (encaissements)",
  banque: "Banque",
  journalAchats: "Journal des achats",
  fournisseurs: "Compte fournisseurs (collectif)",
  avancesFournisseurs: "Acomptes versés aux fournisseurs",
  achatsServices: "Achats de prestations de services",
  achatsBiens: "Achats de marchandises",
  tvaDeductible: "TVA déductible",
  tvaDeductibleAutoliq: "TVA déductible autoliquidée (achats à l'étranger)",
  tvaAutoliquidee: "TVA due autoliquidée (achats à l'étranger)",
};

const estJournal = (v: unknown) => typeof v === "string" && /^[A-Z0-9]{1,6}$/.test(v);
const estCompte = (v: unknown) => typeof v === "string" && /^[0-9]{3,12}$/.test(v);

/**
 * Plan complet et valide à partir d'une saisie partielle, ou une erreur
 * lisible. Les comptes doivent rester dans leur classe (411, 70, 4457, 51) :
 * un compte de TVA saisi en classe 6 fausserait toutes les déclarations.
 */
export function validerPlan(saisie: unknown): { plan: PlanComptesFec } | { erreur: string } {
  if (saisie === null || saisie === undefined) return { plan: PLAN_PAR_DEFAUT };
  if (typeof saisie !== "object") return { erreur: "Plan de comptes invalide" };
  const s = saisie as Record<string, unknown>;
  const plan = { ...PLAN_PAR_DEFAUT };
  for (const cle of Object.keys(PLAN_PAR_DEFAUT) as (keyof PlanComptesFec)[]) {
    const v = typeof s[cle] === "string" ? (s[cle] as string).trim().toUpperCase() : s[cle];
    if (v === undefined || v === "") continue;
    const journal = cle.startsWith("journal");
    if (journal ? !estJournal(v) : !estCompte(v)) {
      return { erreur: `${LIBELLES_PLAN[cle]} : ${journal ? "1 à 6 lettres ou chiffres" : "3 à 12 chiffres"}` };
    }
    plan[cle] = v as string;
  }
  const classes: [keyof PlanComptesFec, string][] = [
    ["clients", "411"], ["ventesServices", "70"], ["ventesBiens", "70"],
    ["tvaCollectee", "4457"], ["tvaNonExigible", "4457"], ["banque", "51"],
    ["fournisseurs", "401"], ["avancesFournisseurs", "409"], ["achatsServices", "60"], ["achatsBiens", "60"],
    ["tvaDeductible", "4456"], ["tvaDeductibleAutoliq", "4456"], ["tvaAutoliquidee", "4452"],
  ];
  for (const [cle, prefixe] of classes) {
    if (!plan[cle].startsWith(prefixe)) return { erreur: `${LIBELLES_PLAN[cle]} : doit commencer par ${prefixe}` };
  }
  if (new Set([plan.journalVentes, plan.journalBanque, plan.journalAchats]).size < 3) {
    return { erreur: "Les journaux de ventes, d'achats et de banque doivent être différents" };
  }
  // Quadra ne lit que 2 caractères de code journal (lib/export-quadra.ts) :
  // « VT1 » et « VT2 » y deviendraient le même journal, ventes et achats
  // mélangés sans erreur à l'import.
  const deux = [plan.journalVentes, plan.journalBanque, plan.journalAchats].map((j) => j.slice(0, 2));
  if (new Set(deux).size < 3) {
    return { erreur: "Les journaux de ventes, d'achats et de banque doivent différer dès leurs 2 premiers caractères (Quadra n'en lit que 2)" };
  }
  if (plan.tvaCollectee === plan.tvaNonExigible) return { erreur: "La TVA non exigible doit avoir son propre compte" };
  return { plan };
}
