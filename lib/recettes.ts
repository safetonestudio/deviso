import type { SupabaseClient } from "@supabase/supabase-js";
import { natureEffective } from "./nature-operation";
import { ventilationTva, type LigneMontant } from "./tva";

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
  operation_category?: string | null;
  items?: { description?: string | null; total?: unknown; nature?: unknown; tva_rate?: number | null }[] | null;
  tva_rate?: number | string | null;
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
  // Ventes de biens ou prestations de services : abattements et seuils micro
  // differents (71 %/203 100 EUR vs 50 %/83 600 EUR, plafonds 2026), la declaration se fait
  // par categorie. Lu de invoices.operation_category (meme source que le FEC).
  // « mixte » : facture dont les lignes portent les deux natures ; le detail
  // est dans `repartition`, ventile LIGNE PAR LIGNE (23/11/2026).
  categorie: "biens" | "services" | "mixte";
  /** HT et TTC encaisses par categorie, signes comme `ht` / `ttc`. */
  repartition: { biens: { ht: number; ttc: number }; services: { ht: number; ttc: number } };
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Repartition biens / services d'une recette, LIGNE PAR LIGNE. Chaque ligne va
 * a sa nature (lib/nature-operation.ts : la sienne, sinon celle de la
 * facture, une mixte sans detail retombant en services comme le FEC). La part
 * des biens est la ventilation de LEURS lignes, chacune a son propre taux de
 * TVA (lib/tva.ts, meme calcul que la facture) ; les services prennent le
 * reste, si bien que la somme des parts vaut toujours la recette.
 */
function repartitionRecette(f: FactureRecette, signe: number, ht: number, ttc: number): LigneRecette["repartition"] {
  const lignes = f.items ?? [];
  const tout = (biens: boolean) => ({
    biens: { ht: biens ? ht : 0, ttc: biens ? ttc : 0 },
    services: { ht: biens ? 0 : ht, ttc: biens ? 0 : ttc },
  });
  if (lignes.length === 0) return tout(f.operation_category === "goods");
  const deBiens = lignes.filter((l) => natureEffective(l, f.operation_category) === "goods");
  if (deBiens.length === lignes.length) return tout(true);
  if (deBiens.length === 0) return tout(false);
  const v = ventilationTva(deBiens as LigneMontant[], Number(f.tva_rate) || 0);
  const biensHt = r2(signe * v.total_ht);
  const biensTtc = r2(signe * v.total_ttc);
  return {
    biens: { ht: biensHt, ttc: biensTtc },
    services: { ht: r2(ht - biensHt), ttc: r2(ttc - biensTtc) },
  };
}

const CHAMPS = "id, invoice_number, client_name, client_company, status, invoice_type, total_ht, total_ttc, paid_at, issue_date, payment_mode, tva_rate, operation_category, items";

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
  const ht = signe * Number(f.total_ht ?? 0);
  const ttc = signe * Number(f.total_ttc ?? f.total_ht ?? 0);
  const repartition = repartitionRecette(f, signe, ht, ttc);
  const aBiens = repartition.biens.ht !== 0 || repartition.biens.ttc !== 0;
  const aServices = repartition.services.ht !== 0 || repartition.services.ttc !== 0;
  return {
    id: f.id,
    date: String(brute).slice(0, 10),
    dateEstimee: !f.paid_at,
    numero: f.invoice_number ?? "",
    client: f.client_company || f.client_name || "",
    nature: nature || (f.invoice_type === "avoir" ? "Avoir" : "Prestation"),
    ht,
    ttc,
    mode: estModeReglement(f.payment_mode) ? f.payment_mode : null,
    categorie: aBiens && aServices ? "mixte" : aBiens ? "biens" : aServices ? "services" : f.operation_category === "goods" ? "biens" : "services",
    repartition,
  };
}

export type TotalCategorie = { ht: number; ttc: number; nb: number };

/**
 * Totaux par categorie (ventes de biens / prestations de services), pour la
 * declaration micro : les deux relevent d'abattements et de seuils distincts.
 */
export function totauxParCategorie(lignes: LigneRecette[]): { biens: TotalCategorie; services: TotalCategorie } {
  const vide = (): TotalCategorie => ({ ht: 0, ttc: 0, nb: 0 });
  const acc = { biens: vide(), services: vide() };
  for (const l of lignes) {
    for (const cle of ["biens", "services"] as const) {
      const part = l.repartition[cle];
      if (part.ht === 0 && part.ttc === 0 && l.categorie !== (cle === "biens" ? "biens" : "services")) continue;
      acc[cle].ht += part.ht;
      acc[cle].ttc += part.ttc;
      acc[cle].nb += 1;
    }
  }
  acc.biens.ht = r2(acc.biens.ht); acc.biens.ttc = r2(acc.biens.ttc);
  acc.services.ht = r2(acc.services.ht); acc.services.ttc = r2(acc.services.ttc);
  return acc;
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
