import { createAdminClient } from "@/lib/supabase/admin";
import type { AchatExport } from "@/lib/exports-comptables";
import { enFranchise } from "@/lib/statut-entreprise";

/**
 * Les achats d'un dossier pour une année, prêts pour le FEC et Quadra
 * (20/11/2026). Un FEC sans achats n'est pas une comptabilité : le cabinet
 * devait les ressaisir à la main.
 *
 * Deux sources, toutes deux déjà en base :
 *  - les factures REÇUES par la plateforme agréée (fournisseurs français),
 *    hors factures refusées (fr:210) ou rejetées (fr:213), qui n'existent pas
 *    comptablement ;
 *  - les achats auprès de fournisseurs ÉTRANGERS (e-reporting), quel que soit
 *    l'état de leur transmission : l'achat a eu lieu, déclaré ou non.
 *
 * Achats à l'étranger, trois cas (revue du 20/11) :
 *  - TVA facturée par le fournisseur (montant_tva > 0) : TVA étrangère, non
 *    déductible en France, elle est une charge ;
 *  - aucune TVA facturée, fournisseur de l'UE ou service hors UE :
 *    autoliquidation, la TVA française (20 %) est due et, sauf franchise,
 *    déductible. Le formulaire de saisie demande 0 dans ce cas : la TVA
 *    autoliquidée se CALCULE ici, elle n'est jamais saisie ;
 *  - biens achetés hors UE : importation, la TVA se liquide sur la valeur en
 *    douane (déclaration d'importation), pas sur la facture : aucune ligne de
 *    TVA ici, le cabinet la passe depuis le document douanier.
 *
 * Dossier en franchise en base : aucune TVA n'est déductible, elle va en charge.
 *
 * Les achats en devise sont convertis au cours de référence BCE du jour de la
 * facture (ou du dernier jour publié avant), fixé à la première lecture puis
 * conservé. Une devise que la BCE ne publie pas ne fait pas échouer l'export
 * en silence : l'achat est listé dans `nonRepris`, et l'appelant le dit.
 */

const STATUTS_EXCLUS = ["fr:210", "fr:213"];
/** Codes de document d'avoir (UNTDID 1001) admis par la norme française. */
const CODES_AVOIR = ["381", "261", "262", "396", "502", "503"];
const TAUX_FRANCAIS = [20, 10, 8.5, 5.5, 2.1, 1.05, 0.9];
/** Taux français appliqué à une autoliquidation (taux normal). */
export const TAUX_AUTOLIQUIDATION = 20;
const UE = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "GR", "EL", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
const PAGE = 1000;

const nombre = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Taux déduit des totaux, ramené au taux français le plus proche s'il est à moins de 0,2 point. */
export function tauxDeduit(ht: number, tva: number): number {
  if (!(ht > 0) || !(tva > 0)) return 0;
  const brut = (tva / ht) * 100;
  const proche = TAUX_FRANCAIS.find((t) => Math.abs(t - brut) < 0.2);
  return proche ?? Math.round(brut * 100) / 100;
}

export const estAvoirRecu = (typeCode: unknown) => CODES_AVOIR.includes(String(typeCode ?? "").trim());

/** Ventilation par taux lue dans la facture structurée, si elle y figure. */
function ventilation(en: unknown): { taux: number; montant: number }[] | null {
  const vb = (en as { vat_break_down?: unknown } | null)?.vat_break_down;
  if (!Array.isArray(vb) || vb.length === 0) return null;
  const lignes = vb
    .map((g: Record<string, unknown>) => {
      const cle = (motif: RegExp) => Object.keys(g).find((k) => motif.test(k));
      const kTaux = cle(/rate/i);
      const kMontant = cle(/tax_amount|vat_amount/i);
      return kTaux && kMontant ? { taux: nombre(g[kTaux]), montant: nombre(g[kMontant]) } : null;
    })
    .filter((x): x is { taux: number; montant: number } => !!x);
  return lignes.length > 0 ? lignes : null;
}

/** Cours BCE (unités de `devise` pour 1 euro) au `jour`, ou au dernier jour publié avant. */
export async function coursBce(devise: string, jour: string): Promise<{ taux: number; date: string }> {
  const fin = new Date(`${jour}T12:00:00Z`);
  const debut = new Date(fin.getTime() - 14 * 24 * 60 * 60 * 1000);
  const url =
    `https://data-api.ecb.europa.eu/service/data/EXR/D.${encodeURIComponent(devise)}.EUR.SP00.A` +
    `?startPeriod=${debut.toISOString().slice(0, 10)}&endPeriod=${jour}&format=csvdata`;
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(r.status === 404 ? `la BCE ne publie pas de cours pour ${devise}` : `BCE HTTP ${r.status}`);
  const lignes = (await r.text()).trim().split(/\r?\n/);
  const entete = lignes[0]?.split(",") ?? [];
  const iDate = entete.indexOf("TIME_PERIOD");
  const iValeur = entete.indexOf("OBS_VALUE");
  const obs = lignes
    .slice(1)
    .map((l) => l.split(","))
    .map((c) => ({ date: c[iDate], taux: Number(c[iValeur]) }))
    .filter((o) => o.date && o.date <= jour && o.taux > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const dernier = obs[obs.length - 1];
  if (!dernier) throw new Error(`aucun cours ${devise} publié avant le ${jour}`);
  return dernier;
}

const jourParis = (d: Date) =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Lit toutes les lignes, page par page : au-delà de 1 000, PostgREST tronque sans prévenir. */
async function toutLire<T>(page: (de: number, a: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const tout: T[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await page(de, de + PAGE - 1);
    if (error) throw new Error(error.message);
    tout.push(...(data ?? []));
    if (!data || data.length < PAGE) return tout;
  }
}

export type AchatsDuDossier = {
  achats: AchatExport[];
  /** Achats qu'on n'a pas pu convertir en euros, décrits pour l'utilisateur. */
  nonRepris: string[];
  /** Points que le cabinet doit vérifier (solde dont l'acompte n'est pas retrouvé). */
  aVerifier: string[];
};

type Recue = {
  id: number;
  number: string | null;
  issue_date: string;
  seller_name: string | null;
  total_without_vat: unknown;
  total_vat: unknown;
  total_with_vat: unknown;
  last_status_code: string | null;
  en_invoice: unknown;
};

const ACOMPTE = "386";
const typeDe = (en: Record<string, unknown> | null) => String(en?.type_code ?? "").trim();
const sirenDe = (en: Record<string, unknown> | null) =>
  ((en?.seller as Record<string, unknown> | undefined)?.legal_registration_identifier as { value?: string } | undefined)?.value ?? null;
const tvasDe = (f: Recue): { taux: number; montant: number }[] => {
  const ht = nombre(f.total_without_vat);
  const tva = nombre(f.total_vat);
  return ventilation(f.en_invoice) ?? (tva > 0 ? [{ taux: tauxDeduit(ht, tva), montant: tva }] : []);
};
const memeFournisseur = (a: Recue, b: Recue) => {
  const sa = sirenDe(a.en_invoice as Record<string, unknown> | null);
  const sb = sirenDe(b.en_invoice as Record<string, unknown> | null);
  if (sa && sb) return sa.replace(/\D/g, "").slice(0, 9) === sb.replace(/\D/g, "").slice(0, 9);
  return (a.seller_name ?? "").trim().toLowerCase() === (b.seller_name ?? "").trim().toLowerCase();
};

/**
 * Les acomptes qu'un SOLDE reprend (20/11/2026).
 *
 * Le solde annonce le montant déjà versé (BT-113, `totals.paid_amount`) et, en
 * principe, la facture d'acompte qu'il suit (BT-25, `preceding_invoice_references`).
 * On cherche, chez le même fournisseur et parmi ses factures d'acompte (386)
 * antérieures, d'abord celles que le solde nomme, sinon UNE seule facture
 * d'acompte du montant versé. On n'impute que si les montants concordent : au
 * moindre doute on ne devine pas, l'écriture reste la facture telle quelle et
 * le point est signalé au cabinet.
 */
export function acomptesDuSolde(solde: Recue, acomptes: Recue[], dejaImputes: Set<number>): Recue[] | null {
  const en = solde.en_invoice as Record<string, unknown> | null;
  const verse = nombre((en?.totals as Record<string, unknown> | undefined)?.paid_amount);
  if (!(verse > 0)) return null;
  const candidats = acomptes.filter(
    (a) => !dejaImputes.has(a.id) && a.id !== solde.id && a.issue_date <= solde.issue_date && memeFournisseur(a, solde)
  );
  const refs = ((en?.preceding_invoice_references as { reference?: string }[] | undefined) ?? [])
    .map((r) => (r.reference ?? "").trim())
    .filter(Boolean);
  const somme = (l: Recue[]) => l.reduce((s, a) => s + nombre(a.total_with_vat), 0);
  if (refs.length > 0) {
    const nommes = candidats.filter((a) => a.number && refs.includes(a.number.trim()));
    if (nommes.length > 0 && Math.abs(somme(nommes) - verse) < 0.015) return nommes;
  }
  const memeMontant = candidats.filter((a) => Math.abs(nombre(a.total_with_vat) - verse) < 0.015);
  return memeMontant.length === 1 ? memeMontant : null;
}

export async function chargerAchats(userId: string, annee: string): Promise<AchatsDuDossier> {
  const admin = createAdminClient();
  const achats: AchatExport[] = [];
  const nonRepris: string[] = [];
  const aVerifier: string[] = [];

  const { data: profil } = await admin.from("profiles").select("tva_regime").eq("id", userId).maybeSingle();
  // Même règle que le tableau de bord : régime absent = franchise.
  const franchise = enFranchise(profil?.tva_regime);

  // ── Factures reçues (fournisseurs français) ─────────────────────────────
  const recues = await toutLire<Recue>((de, a) =>
    admin
      .from("superpdp_invoices")
      .select("id, number, issue_date, seller_name, total_without_vat, total_vat, total_with_vat, last_status_code, en_invoice")
      .eq("user_id", userId)
      .eq("direction", "in")
      .gte("issue_date", `${annee}-01-01`)
      .lte("issue_date", `${annee}-12-31`)
      .order("issue_date", { ascending: true })
      .order("id", { ascending: true })
      .range(de, a)
  );
  // Toutes les factures d'acompte reçues du dossier, toutes années : un acompte
  // de décembre se solde en janvier.
  const acomptes = (
    await toutLire<Recue>((de, a) =>
      admin
        .from("superpdp_invoices")
        .select("id, number, issue_date, seller_name, total_without_vat, total_vat, total_with_vat, last_status_code, en_invoice")
        .eq("user_id", userId)
        .eq("direction", "in")
        .eq("en_invoice->>type_code", ACOMPTE)
        .order("issue_date", { ascending: true })
        .order("id", { ascending: true })
        .range(de, a)
    )
  ).filter((f) => !STATUTS_EXCLUS.includes(f.last_status_code ?? ""));
  const dejaImputes = new Set<number>();

  for (const f of recues) {
    if (STATUTS_EXCLUS.includes(f.last_status_code ?? "")) continue;
    const en = f.en_invoice as Record<string, unknown> | null;
    const estAcompte = typeDe(en) === ACOMPTE;
    let imputations: AchatExport["imputations"];
    if (!estAcompte && !estAvoirRecu(en?.type_code)) {
      const trouves = acomptesDuSolde(f, acomptes, dejaImputes);
      const verse = nombre((en?.totals as Record<string, unknown> | undefined)?.paid_amount);
      if (trouves) {
        trouves.forEach((a) => dejaImputes.add(a.id));
        imputations = trouves.map((a) => ({
          ref: a.number ?? "",
          ht: nombre(a.total_without_vat),
          ttc: nombre(a.total_with_vat),
          tvas: tvasDe(a),
        }));
      } else if (verse > 0 && acomptes.some((a) => a.id !== f.id && memeFournisseur(a, f))) {
        // Un déjà-versé sans acompte retrouvé chez un fournisseur qui en a
        // émis : on ne devine pas, on le signale.
        aVerifier.push(
          `${f.number ?? "Facture"} (${f.seller_name ?? "fournisseur"}) : ${verse.toFixed(2)} € déjà versés, acompte correspondant non retrouvé, TVA de l'acompte peut-être déduite deux fois`
        );
      }
    }
    achats.push({
      ref: f.number ?? "",
      date: f.issue_date,
      fournisseur: f.seller_name ?? "Fournisseur",
      siren: sirenDe(en),
      categorie: null,
      ht: nombre(f.total_without_vat),
      tvas: tvasDe(f),
      avoir: estAvoirRecu(en?.type_code),
      acompte: estAcompte,
      imputations,
      nonDeductible: franchise,
    });
  }

  // ── Achats auprès de fournisseurs étrangers ────────────────────────────
  const etrangers = await toutLire((de, a) =>
    admin
      .from("superpdp_achats_int")
      .select("id, fournisseur_nom, fournisseur_pays, fournisseur_tva, numero, date_facture, categorie, devise, montant_ht, taux_tva, montant_tva, taux_change, montant_ht_eur, montant_tva_eur")
      .eq("user_id", userId)
      .gte("date_facture", `${annee}-01-01`)
      .lte("date_facture", `${annee}-12-31`)
      .order("date_facture", { ascending: true })
      .order("id", { ascending: true })
      .range(de, a)
  );
  const cache = new Map<string, { taux: number; date: string }>();
  const aujourdhui = jourParis(new Date());
  for (const a of etrangers) {
    const devise = (a.devise || "EUR").toUpperCase();
    const ref = a.numero?.trim() || `ACHAT-${String(a.id).slice(0, 8)}`;
    let ht = nombre(a.montant_ht);
    let tvaFacturee = nombre(a.montant_tva);
    if (devise !== "EUR") {
      if (a.montant_ht_eur !== null && a.montant_ht_eur !== undefined) {
        ht = nombre(a.montant_ht_eur);
        tvaFacturee = nombre(a.montant_tva_eur);
      } else {
        const cle = `${devise}|${a.date_facture}`;
        let cours = cache.get(cle);
        if (!cours) {
          try {
            cours = await coursBce(devise, a.date_facture);
            cache.set(cle, cours);
          } catch (e) {
            nonRepris.push(`${ref} (${a.fournisseur_nom}, ${a.montant_ht} ${devise}) : ${(e as Error).message}`);
            continue;
          }
        }
        ht = arrondi(ht / cours.taux);
        tvaFacturee = arrondi(tvaFacturee / cours.taux);
        // Fixé une fois, et seulement pour une facture d'un jour passé : le
        // cours du jour n'est publié que l'après-midi.
        if (a.date_facture < aujourdhui) {
          await admin
            .from("superpdp_achats_int")
            .update({ taux_change: cours.taux, date_taux_change: cours.date, montant_ht_eur: ht, montant_tva_eur: tvaFacturee })
            .eq("id", a.id)
            .is("montant_ht_eur", null);
        }
      }
    }
    const pays = String(a.fournisseur_pays ?? "").toUpperCase();
    const biens = a.categorie === "biens";
    const importation = biens && !UE.includes(pays);
    const tvaEtrangere = tvaFacturee > 0;
    const autoliquidation = !tvaEtrangere && !importation;
    achats.push({
      ref,
      date: a.date_facture,
      fournisseur: a.fournisseur_nom,
      tvaIntra: a.fournisseur_tva,
      categorie: biens ? "biens" : "services",
      ht,
      tvas: autoliquidation
        ? [{ taux: TAUX_AUTOLIQUIDATION, montant: arrondi((ht * TAUX_AUTOLIQUIDATION) / 100) }]
        : tvaEtrangere
          ? [{ taux: nombre(a.taux_tva), montant: tvaFacturee }]
          : [],
      autoliquidation,
      tvaEtrangere,
      nonDeductible: franchise,
      devise: devise !== "EUR" ? devise : null,
      montantDevise: devise !== "EUR" ? nombre(a.montant_ht) + nombre(a.montant_tva) : null,
    });
  }

  return { achats, nonRepris, aVerifier };
}
