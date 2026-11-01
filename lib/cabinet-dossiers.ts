import type { createAdminClient } from "@/lib/supabase/admin";
import { ventilationTva, type LigneMontant } from "./tva";
import { estAvoir } from "./exports-comptables";
import { natureOperation } from "./superpdp-nature";
import { libelleStatut } from "./superpdp-statuts";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Synthese des dossiers clients pour le cockpit cabinet.
 *
 * Repond aux questions que le comptable se pose deja : quels dossiers
 * demandent mon attention et pourquoi, combien ont-ils facture, quelle TVA ont-
 * ils collectee. Lecture seule, par la cle de service : l'appelant doit avoir
 * verifie l'acces (lib/cabinet-acces.ts) AVANT de passer des identifiants ici.
 */

export type Niveau = "rouge" | "orange" | "vert";
export type Anomalie = { niveau: "rouge" | "orange"; libelle: string };

export type FactureCabinet = {
  id: string;
  user_id: string;
  invoice_number: string | null;
  issue_date: string;
  due_date: string | null;
  status: string;
  total_ht: number | null;
  total_ttc: number | null;
  tva_rate: number;
  items: unknown;
  invoice_type: string | null;
  type_code: string | null;
  client_name: string | null;
  client_company: string | null;
  client_siren: string | null;
  client_country: string | null;
  superpdp_status: string | null;
  superpdp_error: string | null;
  paid_at: string | null;
};

export type SyntheseDossier = {
  id: string;
  nom: string;
  siret: string | null;
  raccorde: boolean;
  nbFacturesAnnee: number;
  nbFacturesMois: number;
  caHtMois: number;
  caHtAnnee: number;
  tvaAnnee: number;
  derniereFacture: string | null;
  impayes: { nb: number; montant: number };
  anomalies: Anomalie[];
  niveau: Niveau;
};

const COLONNES_FACTURES =
  "id, user_id, invoice_number, issue_date, due_date, status, total_ht, total_ttc, tva_rate, items, invoice_type, type_code, client_name, client_company, client_siren, client_country, superpdp_status, superpdp_error, paid_at";

/** Seuil au-dela duquel un dossier sans facture est signale comme inactif. */
export const JOURS_INACTIVITE = 45;

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Une facture emise compte dans le chiffre d'affaires et la TVA ; un brouillon ou une annulation, non. */
export const estEmise = (f: Pick<FactureCabinet, "status">) => f.status === "sent" || f.status === "paid";

/** Un avoir vient en deduction : ses montants sont positifs, son type porte le sens. */
export const signe = (f: Pick<FactureCabinet, "invoice_type" | "type_code">) => (estAvoir(f) ? -1 : 1);

export async function lireFacturesDossiers(admin: Admin, ownerIds: string[], depuis: string): Promise<FactureCabinet[]> {
  if (ownerIds.length === 0) return [];
  const { data, error } = await admin
    .from("invoices")
    .select(COLONNES_FACTURES)
    .in("user_id", ownerIds)
    .gte("issue_date", depuis)
    .order("issue_date", { ascending: false });
  if (error) throw new Error(`Lecture des factures impossible : ${error.message}`);
  return (data ?? []) as unknown as FactureCabinet[];
}

/** TVA collectee par taux sur un ensemble de factures (avoirs deduits). */
export function tvaParTaux(factures: FactureCabinet[]): { taux: number; base_ht: number; tva: number }[] {
  const parTaux = new Map<number, { base_ht: number; tva: number }>();
  for (const f of factures) {
    if (!estEmise(f)) continue;
    const s = signe(f);
    const v = ventilationTva((f.items ?? []) as LigneMontant[], f.tva_rate);
    for (const g of v.groupes) {
      const cur = parTaux.get(g.taux) ?? { base_ht: 0, tva: 0 };
      cur.base_ht += s * g.base_ht;
      cur.tva += s * g.montant_tva;
      parTaux.set(g.taux, cur);
    }
  }
  return [...parTaux.entries()]
    .map(([taux, v]) => ({ taux, base_ht: arrondi(v.base_ht), tva: arrondi(v.tva) }))
    .sort((a, b) => b.taux - a.taux);
}

/** Statut plateforme qui clot la facture sur un echec (refusee, rejetee, irrecevable). */
export function estEchecPlateforme(code: string | null | undefined): boolean {
  const st = libelleStatut(code);
  return !!st && st.ton === "attention" && !!st.cloture;
}

/** Statut plateforme qui demande un suivi sans etre un echec (litige, suspension). */
export function estASuivrePlateforme(code: string | null | undefined): boolean {
  const st = libelleStatut(code);
  return !!st && st.ton === "attention" && !st.cloture;
}

const RANG: Record<Niveau, number> = { rouge: 0, orange: 1, vert: 2 };

// Numero de facture Deviso : « AAAA-NNN », une seule serie par an partagee par
// les factures et les avoirs (lib/*numerotation*). Les numeros hors format
// (tests, imports) sont ignores.
const RE_NUMERO = /^(\d{4})-(\d+)$/;

/**
 * Trous de numerotation : numeros manquants A L'INTERIEUR de la serie d'une
 * annee (entre le plus petit et le plus grand emis). La continuite de la
 * numerotation est une obligation legale, et un trou est la premiere chose
 * qu'un comptable cherche. On ne signale que les trous interieurs : une serie
 * qui commence a 003 n'est pas un trou (report d'un autre outil, numero de
 * depart choisi), un numero manquant au milieu en est un.
 */
export function trousNumerotation(factures: FactureCabinet[]): { annee: number; manquants: number[] }[] {
  const parAn = new Map<number, Set<number>>();
  for (const f of factures) {
    if (!estEmise(f)) continue;
    const m = f.invoice_number?.match(RE_NUMERO);
    if (!m) continue;
    const an = Number(m[1]);
    if (!parAn.has(an)) parAn.set(an, new Set());
    parAn.get(an)!.add(Number(m[2]));
  }
  const out: { annee: number; manquants: number[] }[] = [];
  for (const [annee, set] of parAn) {
    const nums = [...set];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const manquants: number[] = [];
    for (let i = min; i <= max; i++) if (!set.has(i)) manquants.push(i);
    if (manquants.length) out.push({ annee, manquants });
  }
  return out.sort((a, b) => b.annee - a.annee);
}

export async function syntheseDossiers(
  admin: Admin,
  ownerIds: string[],
  reference: Date = new Date(),
): Promise<SyntheseDossier[]> {
  if (ownerIds.length === 0) return [];

  const annee = reference.getFullYear();
  const ym = reference.toISOString().slice(0, 7);
  const aujourdhui = reference.toISOString().slice(0, 10);

  const [{ data: profils }, { data: connexions }, factures] = await Promise.all([
    admin.from("profiles").select("id, company_name, full_name, siret").in("id", ownerIds),
    // Table sans politique RLS (elle porte un jeton) : on ne lit que le statut.
    admin.from("superpdp_connections").select("user_id, session_status").in("user_id", ownerIds),
    lireFacturesDossiers(admin, ownerIds, `${annee - 1}-01-01`),
  ]);

  const dossiers = ownerIds.map((id): SyntheseDossier => {
    const p = (profils ?? []).find((x) => x.id === id);
    const raccorde = (connexions ?? []).some((c) => c.user_id === id && c.session_status === "verified");
    const toutes = factures.filter((f) => f.user_id === id);
    const emises = toutes.filter(estEmise);
    const annee_ = emises.filter((f) => f.issue_date.startsWith(String(annee)));
    const mois = annee_.filter((f) => f.issue_date.startsWith(ym));
    const ht = (fs: FactureCabinet[]) => arrondi(fs.reduce((s, f) => s + signe(f) * Number(f.total_ht ?? 0), 0));
    const tvaAnnee = arrondi(tvaParTaux(annee_).reduce((s, t) => s + t.tva, 0));
    const derniere = emises[0]?.issue_date ?? null;

    const echues = emises.filter((f) => f.status === "sent" && !estAvoir(f) && f.due_date && f.due_date < aujourdhui);
    const impayes = {
      nb: echues.length,
      montant: arrondi(echues.reduce((s, f) => s + Number(f.total_ttc ?? 0), 0)),
    };

    const anomalies: Anomalie[] = [];
    if (!raccorde) {
      anomalies.push({ niveau: "rouge", libelle: "Non raccordé à une plateforme agréée (réception obligatoire depuis le 1er septembre 2026)" });
    }
    // Le statut officiel fait foi (lib/superpdp-statuts.ts, tableau 8 DGFiP) :
    // une facture refusee (fr:210), rejetee (fr:213) ou irrecevable est un
    // echec, au meme titre qu'une erreur technique de transmission.
    const enEchec = emises.filter((f) => f.superpdp_error || estEchecPlateforme(f.superpdp_status));
    if (enEchec.length > 0) {
      anomalies.push({ niveau: "rouge", libelle: `${enEchec.length} facture(s) refusée(s), rejetée(s) ou en erreur à la plateforme` });
    }
    const aSuivre = emises.filter((f) => !f.superpdp_error && estASuivrePlateforme(f.superpdp_status));
    if (aSuivre.length > 0) {
      anomalies.push({ niveau: "orange", libelle: `${aSuivre.length} facture(s) en litige ou suspendue(s)` });
    }
    const sansSiren = annee_.filter((f) => natureOperation(f) === "B2B" && !f.client_siren?.trim());
    if (sansSiren.length > 0) {
      anomalies.push({ niveau: "orange", libelle: `${sansSiren.length} facture(s) à une entreprise française sans SIREN client` });
    }
    if (impayes.nb > 0) {
      anomalies.push({ niveau: "orange", libelle: `${impayes.nb} facture(s) échue(s) non payée(s)` });
    }
    const trous = trousNumerotation(emises);
    const totalTrous = trous.reduce((n, t) => n + t.manquants.length, 0);
    if (totalTrous > 0) {
      const fmt = (t: { annee: number; manquants: number[] }) =>
        t.manquants.slice(0, 3).map((n) => `${t.annee}-${String(n).padStart(3, "0")}`).join(", ");
      const exemples = trous.map(fmt).join(", ");
      const reste = totalTrous - trous.reduce((n, t) => n + Math.min(t.manquants.length, 3), 0);
      anomalies.push({
        niveau: "orange",
        libelle: `Trou de numérotation : ${totalTrous} numéro(s) manquant(s) (${exemples}${reste > 0 ? `, +${reste}` : ""})`,
      });
    }
    if (!derniere) {
      anomalies.push({ niveau: "orange", libelle: "Aucune facture émise" });
    } else {
      const jours = Math.floor((reference.getTime() - new Date(derniere).getTime()) / 86_400_000);
      if (jours > JOURS_INACTIVITE) {
        anomalies.push({ niveau: "orange", libelle: `Aucune facture émise depuis ${jours} jours` });
      }
    }

    const niveau: Niveau = anomalies.some((a) => a.niveau === "rouge")
      ? "rouge"
      : anomalies.length > 0
        ? "orange"
        : "vert";

    return {
      id,
      nom: p?.company_name || p?.full_name || "Client sans nom",
      siret: p?.siret ?? null,
      raccorde,
      // Un avoir est deduit du CA et de la TVA, mais ce n'est pas une facture.
      nbFacturesAnnee: annee_.filter((f) => !estAvoir(f)).length,
      nbFacturesMois: mois.filter((f) => !estAvoir(f)).length,
      caHtMois: ht(mois),
      caHtAnnee: ht(annee_),
      tvaAnnee,
      derniereFacture: derniere,
      impayes,
      anomalies,
      niveau,
    };
  });

  // L'exception d'abord : les dossiers qui demandent une action en tete.
  return dossiers.sort(
    (a, b) => RANG[a.niveau] - RANG[b.niveau] || b.anomalies.length - a.anomalies.length || a.nom.localeCompare(b.nom),
  );
}
