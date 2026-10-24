import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SOURCE UNIQUE DES RECETTES ENCAISSEES.
 *
 * Le livre des recettes, le recapitulatif CA/URSSAF et la tuile « encaisse ce
 * mois » lisent tous ce fichier. Avant le 24/10/2026, le calcul etait ecrit dans
 * la page du tableau de bord, et la tuile « encaisse ce mois » en avait un
 * second, different (date de creation de la facture au lieu de la date
 * d'encaissement) : deux chiffres pour la meme notion.
 *
 * Regles, celles du micro-entrepreneur, qui declare ce qu'il a percu :
 *   - une recette = une facture au statut « paid » ;
 *   - sa date est celle de l'ENCAISSEMENT (paid_at). A defaut, la date
 *     d'emission, signalee comme estimee : le livre doit dire qu'elle manque ;
 *   - un avoir rembourse vient en deduction (montants negatifs) ;
 *   - le CA declare a l'URSSAF est HORS TAXES, le livre montre aussi le TTC
 *     effectivement encaisse.
 */

export const MODES_REGLEMENT = {
  virement: "Virement",
  carte: "Carte / paiement en ligne",
  cheque: "Chèque",
  especes: "Espèces",
  prelevement: "Prélèvement",
  autre: "Autre",
} as const;

export type ModeReglement = keyof typeof MODES_REGLEMENT;

export function estModeReglement(v: unknown): v is ModeReglement {
  return typeof v === "string" && v in MODES_REGLEMENT;
}

export type FactureRecette = {
  id: string;
  invoice_number: string | null;
  client_name: string | null;
  client_company?: string | null;
  status: string;
  invoice_type?: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  paid_at: string | null;
  issue_date: string | null;
  payment_mode?: string | null;
  items?: { description?: string | null }[] | null;
};

export type LigneRecette = {
  id: string;
  date: string; // AAAA-MM-JJ
  dateEstimee: boolean;
  numero: string;
  client: string;
  nature: string;
  ht: number;
  ttc: number;
  mode: ModeReglement | null;
};

const CHAMPS = "id, invoice_number, client_name, client_company, status, invoice_type, total_ht, total_ttc, paid_at, issue_date, payment_mode, items";

/** Une facture payee devient une ligne de recette ; sinon null. */
export function ligneRecette(f: FactureRecette): LigneRecette | null {
  if (f.status !== "paid") return null;
  const brute = f.paid_at || f.issue_date;
  if (!brute) return null;
  const signe = f.invoice_type === "avoir" ? -1 : 1;
  const nature = (f.items ?? [])
    .map((i) => (i?.description ?? "").trim())
    .filter(Boolean)
    .join(" ; ")
    .slice(0, 200);
  return {
    id: f.id,
    date: String(brute).slice(0, 10),
    dateEstimee: !f.paid_at,
    numero: f.invoice_number ?? "",
    client: f.client_company || f.client_name || "",
    nature: nature || (f.invoice_type === "avoir" ? "Avoir" : "Prestation"),
    ht: signe * Number(f.total_ht ?? 0),
    ttc: signe * Number(f.total_ttc ?? f.total_ht ?? 0),
    mode: estModeReglement(f.payment_mode) ? f.payment_mode : null,
  };
}

/** Lignes de recette triees par date d'encaissement, puis par numero. */
export function lignesRecettes(factures: FactureRecette[], annee?: number): LigneRecette[] {
  return factures
    .map(ligneRecette)
    .filter((l): l is LigneRecette => l !== null)
    .filter((l) => annee === undefined || Number(l.date.slice(0, 4)) === annee)
    .sort((a, b) => a.date.localeCompare(b.date) || a.numero.localeCompare(b.numero));
}

/** CA HT encaisse par mois (index 0 = janvier) pour une annee. */
export function caMensuelHt(factures: FactureRecette[], annee: number): number[] {
  const mois = Array(12).fill(0) as number[];
  for (const l of lignesRecettes(factures, annee)) mois[Number(l.date.slice(5, 7)) - 1] += l.ht;
  return mois.map((v) => Math.round(v * 100) / 100);
}

/** TTC encaisse sur un mois donne (AAAA-MM). */
export function encaisseTtcDuMois(factures: FactureRecette[], aaaaMm: string): number {
  return lignesRecettes(factures)
    .filter((l) => l.date.startsWith(aaaaMm))
    .reduce((s, l) => s + l.ttc, 0);
}

/**
 * Factures payees d'un espace pouvant tomber dans l'annee (paid_at dans
 * l'annee, ou paid_at absent et emission dans l'annee). Lecture PAGINEE :
 * PostgREST plafonne une reponse a 1 000 lignes, un livre tronque en silence
 * serait faux.
 */
export async function lireFacturesPayees(
  client: SupabaseClient,
  workspaceId: string,
  annee: number
): Promise<FactureRecette[]> {
  const deb = `${annee}-01-01`;
  const fin = `${annee}-12-31`;
  const toutes: FactureRecette[] = [];
  for (let page = 0; page < 100; page++) {
    const { data, error } = await client
      .from("invoices")
      .select(CHAMPS)
      .eq("user_id", workspaceId)
      .eq("status", "paid")
      .or(`and(paid_at.gte.${deb},paid_at.lte.${fin}),and(paid_at.is.null,issue_date.gte.${deb},issue_date.lte.${fin})`)
      .order("id", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`Lecture des recettes impossible : ${error.message}`);
    toutes.push(...((data ?? []) as FactureRecette[]));
    if (!data || data.length < 1000) break;
  }
  return toutes;
}
