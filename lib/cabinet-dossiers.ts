import type { createAdminClient } from "@/lib/supabase/admin";
import { ventilationTva, type LigneMontant } from "./tva";
import { estAvoir } from "./exports-comptables";
import { natureOperation } from "./superpdp-nature";

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

const RANG: Record<Niveau, number> = { rouge: 0, orange: 1, vert: 2 };

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
    const enErreur = emises.filter((f) => f.superpdp_error);
    if (enErreur.length > 0) {
      anomalies.push({ niveau: "rouge", libelle: `${enErreur.length} facture(s) en erreur de transmission à la plateforme` });
    }
    const sansSiren = annee_.filter((f) => natureOperation(f) === "B2B" && !f.client_siren?.trim());
    if (sansSiren.length > 0) {
      anomalies.push({ niveau: "orange", libelle: `${sansSiren.length} facture(s) à une entreprise française sans SIREN client` });
    }
    if (impayes.nb > 0) {
      anomalies.push({ niveau: "orange", libelle: `${impayes.nb} facture(s) échue(s) non payée(s)` });
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
      nbFacturesAnnee: annee_.length,
      nbFacturesMois: mois.length,
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
