import type { createAdminClient } from "@/lib/supabase/admin";
import { ventilationTva, type LigneMontant } from "./tva";
import { estAvoir } from "./exports-comptables";
import { accord, pluriel } from "./pluriel";
import { natureOperation } from "./superpdp-nature";
import { libelleStatut } from "./superpdp-statuts";
import { siretValide, toSiren } from "./facturx-helpers";
import { sansReponse } from "./pointage-paiement";
import { chargerAchats } from "./achats-export";

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

/** Etat de conformite d'un dossier a la reforme de la facturation electronique. */
export type Conformite = {
  raccordePA: boolean; // raccorde a une Plateforme Agreee
  joignableAnnuaire: boolean; // une ligne d'annuaire existe : peut recevoir
  siretValide: boolean; // SIRET present et cle de Luhn correcte
  tvaConforme: boolean; // regime TVA et n° de TVA coherents
  pret: boolean; // tout vert : recoit et aucune donnee de reference fausse
};

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
  superpdp_invoice_id: string | null;
  superpdp_encaisse_at: string | null;
  operation_category: string | null;
  pointage_demande_at?: string | null;
  pointage_demande_nb?: number | null;
  pointage_pas_encore_at?: string | null;
};

export type SyntheseDossier = {
  id: string;
  nom: string;
  siret: string | null;
  tvaRegime: string | null;
  tvaPeriodicite: string | null;
  raccorde: boolean;
  conformite: Conformite;
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
  "id, user_id, invoice_number, issue_date, due_date, status, total_ht, total_ttc, tva_rate, items, invoice_type, type_code, client_name, client_company, client_siren, client_country, superpdp_status, superpdp_error, paid_at, superpdp_invoice_id, superpdp_encaisse_at, operation_category, pointage_demande_at, pointage_demande_nb, pointage_pas_encore_at";

/** Seuil au-dela duquel un dossier sans facture est signale comme inactif. */
export const JOURS_INACTIVITE = 45;
/** Points d'achat listés un par un dans les anomalies d'un dossier ; au-delà, un résumé. */
const MAX_ACHATS_A_VERIFIER = 5;

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Une facture emise compte dans le chiffre d'affaires et la TVA ; un brouillon ou une annulation, non. */
export const estEmise = (f: Pick<FactureCabinet, "status">) => f.status === "sent" || f.status === "paid";

/** Un avoir vient en deduction : ses montants sont positifs, son type porte le sens. */
export const signe = (f: Pick<FactureCabinet, "invoice_type" | "type_code">) => (estAvoir(f) ? -1 : 1);

/**
 * Une facture porte-t-elle de la TVA ? Vrai des qu'un taux positif est
 * reellement facture (au moins un groupe de ventilation a un taux > 0 et un
 * montant de TVA non nul). Sert a reperer une TVA facturee par un dossier en
 * franchise en base, qui ne doit pas en collecter (art. 293 B CGI).
 */
export function factureAvecTva(f: FactureCabinet): boolean {
  const v = ventilationTva((f.items ?? []) as LigneMontant[], f.tva_rate);
  return v.groupes.some((g) => g.taux > 0 && g.montant_tva > 0.005);
}

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
    admin.from("profiles").select("id, company_name, full_name, siret, tva_regime, tva_periodicite, tva_number").in("id", ownerIds),
    // Table sans politique RLS (elle porte un jeton) : on ne lit que le statut
    // et l'adresse d'annuaire (jamais le jeton).
    admin.from("superpdp_connections").select("user_id, session_status, directory_address").in("user_id", ownerIds),
    lireFacturesDossiers(admin, ownerIds, `${annee - 1}-01-01`),
  ]);

  // Points d'achat que l'export signale « à vérifier » (acompte non retrouvé,
  // achat à l'étranger en échec, autoliquidation à confirmer) : ils doivent se
  // voir AVANT l'export, pas seulement dans la note de l'archive (21/11/2026).
  // Exercice en cours et précédent (clôture), sans appel à la BCE.
  const achatsAVerifier = new Map(
    await Promise.all(
      ownerIds.map(async (id): Promise<[string, string[]]> => {
        const lignes: string[] = [];
        for (const an of [annee, annee - 1]) {
          try {
            const { aVerifier } = await chargerAchats(id, String(an), { convertir: false });
            for (const t of aVerifier) lignes.push(`Achats ${an} à vérifier : ${t}`);
          } catch {
            // Lecture impossible : le tableau de bord reste lisible, l'export le dira.
          }
        }
        return [id, lignes];
      }),
    ),
  );

  const dossiers = ownerIds.map((id): SyntheseDossier => {
    const p = (profils ?? []).find((x) => x.id === id);
    const conn = (connexions ?? []).find((c) => c.user_id === id);
    const raccorde = conn?.session_status === "verified";
    // Joignable = raccorde ET une ligne d'annuaire existe. Raccorde sans ligne,
    // c'est le piege « se croit joignable et ne l'est pas » : ne recoit rien.
    const joignable = raccorde && !!conn?.directory_address;
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
      anomalies.push({ niveau: "rouge", libelle: `${pluriel(enEchec.length, "facture")} ${accord(enEchec.length, "refusée")}, ${accord(enEchec.length, "rejetée")} ou en erreur à la plateforme` });
    }
    const aSuivre = emises.filter((f) => !f.superpdp_error && estASuivrePlateforme(f.superpdp_status));
    if (aSuivre.length > 0) {
      anomalies.push({ niveau: "orange", libelle: `${pluriel(aSuivre.length, "facture")} en litige ou ${accord(aSuivre.length, "suspendue")}` });
    }
    const sansSiren = annee_.filter((f) => natureOperation(f) === "B2B" && !f.client_siren?.trim());
    if (sansSiren.length > 0) {
      anomalies.push({ niveau: "orange", libelle: `${pluriel(sansSiren.length, "facture")} à une entreprise française sans SIREN client` });
    }
    // Conformite TVA au regime declare dans le profil du client.
    const franchise = (p?.tva_regime ?? "franchise") === "franchise";
    let tvaRegimeOk = true;
    if (franchise) {
      // En franchise en base, le client ne doit pas collecter de TVA : une
      // facture avec TVA est une erreur a corriger (art. 293 B CGI).
      const avecTva = annee_.filter((f) => !estAvoir(f) && factureAvecTva(f));
      if (avecTva.length > 0) {
        tvaRegimeOk = false;
        anomalies.push({ niveau: "rouge", libelle: `${pluriel(avecTva.length, "facture")} avec TVA alors que le dossier est en franchise en base (art. 293 B CGI)` });
      }
    } else if (!p?.tva_periodicite) {
      // Assujetti sans periodicite : impossible de savoir quand il declare.
      tvaRegimeOk = false;
      anomalies.push({ niveau: "orange", libelle: "Assujetti à la TVA sans périodicité de déclaration renseignée" });
    }
    // Régime simplifié de TVA supprimé au 1er janvier 2027 (art. 38 LF 2025) :
    // le dossier passe d'office au trimestriel. Signalé dès novembre 2026 pour
    // que la périodicité soit mise à jour (le calendrier, lib/cabinet-tva-
    // calendrier.ts, applique déjà le trimestriel à partir de 2027).
    if (p?.tva_regime !== "franchise" && p?.tva_periodicite === "simplified" && aujourdhui >= "2026-11-01") {
      anomalies.push({ niveau: "orange", libelle: "Régime simplifié de TVA supprimé au 1er janvier 2027 : passer en déclaration trimestrielle" });
    }

    // Donnees de reference : un SIRET faux, un n° de TVA incoherent, ou une
    // entreprise raccordee mais pas joignable font rejeter les factures a la
    // plateforme. C'est la premiere chose que craint un cabinet avant la reforme.
    const siretOk = siretValide(p?.siret);
    if (!p?.siret) {
      anomalies.push({ niveau: "orange", libelle: "SIRET manquant" });
    } else if (!siretOk) {
      anomalies.push({ niveau: "orange", libelle: "SIRET invalide (clé de contrôle) : risque de rejet des factures" });
    }
    if (raccorde && !joignable) {
      anomalies.push({ niveau: "rouge", libelle: "Raccordé mais pas joignable à l'annuaire : l'entreprise ne peut pas recevoir de factures" });
    }
    const sirenP = toSiren(p?.siret);
    const tvaNum = (p?.tva_number ?? "").replace(/\s/g, "").toUpperCase();
    let tvaNumIncoherent = false;
    if (!franchise && tvaNum) {
      if (!/^FR[0-9A-Z]{2}\d{9}$/.test(tvaNum)) tvaNumIncoherent = true;
      else if (sirenP && tvaNum.slice(-9) !== sirenP) tvaNumIncoherent = true;
    }
    if (tvaNumIncoherent) {
      anomalies.push({ niveau: "orange", libelle: "N° de TVA incohérent avec le SIREN" });
    }

    // Etat de conformite reforme, pour le tableau de bord du cabinet.
    const conformite = {
      raccordePA: raccorde,
      joignableAnnuaire: joignable,
      siretValide: !!p?.siret && siretOk,
      tvaConforme: tvaRegimeOk && !tvaNumIncoherent,
      pret: joignable && !!p?.siret && siretOk && tvaRegimeOk && !tvaNumIncoherent,
    };
    if (impayes.nb > 0) {
      anomalies.push({ niveau: "orange", libelle: `${pluriel(impayes.nb, "facture")} ${accord(impayes.nb, "échue")} non ${accord(impayes.nb, "payée")}` });
    }
    // Relance de pointage restée sans réponse (au moins deux questions) : le
    // client n'a dit ni « payée » ni « pas encore ». Le paiement a peut-être
    // été reçu sans être déclaré, c'est ce que le cabinet doit vérifier.
    const muettes = echues.filter((f) => sansReponse(f, new Date()));
    if (muettes.length > 0) {
      anomalies.push({
        niveau: "orange",
        libelle: `${pluriel(muettes.length, "facture")} ${accord(muettes.length, "échue")} sans réponse du client à la question « payée ? » : paiement peut-être reçu sans être déclaré`,
      });
    }
    // Prestation payée, transmise à la plateforme, mais dont l'encaissement
    // (statut « Encaissée ») n'est jamais parti : pour une prestation de
    // services, c'est lui qui rend la TVA exigible côté administration. La
    // synchronisation le retente pendant sept jours (lib/superpdp-sync.ts) ;
    // au-delà, il faut une intervention, d'où l'alerte au cabinet (20/11/2026).
    const septJours = new Date(reference.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const encaissementManquant = emises.filter(
      (f) =>
        f.status === "paid" &&
        !!f.superpdp_invoice_id &&
        !f.superpdp_encaisse_at &&
        f.operation_category !== "goods" &&
        !!f.paid_at &&
        f.paid_at.slice(0, 10) < septJours,
    );
    if (encaissementManquant.length > 0) {
      anomalies.push({
        niveau: "orange",
        libelle: `${pluriel(encaissementManquant.length, "facture")} ${accord(encaissementManquant.length, "payée")} sans statut « encaissée » transmis à la plateforme`,
      });
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
        libelle: `Trou de numérotation : ${pluriel(totalTrous, "numéro")} ${accord(totalTrous, "manquant")} (${exemples}${reste > 0 ? `, +${reste}` : ""})`,
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

    const aVerifier = achatsAVerifier.get(id) ?? [];
    for (const libelle of aVerifier.slice(0, MAX_ACHATS_A_VERIFIER)) anomalies.push({ niveau: "orange", libelle });
    if (aVerifier.length > MAX_ACHATS_A_VERIFIER) {
      const reste = aVerifier.length - MAX_ACHATS_A_VERIFIER;
      anomalies.push({ niveau: "orange", libelle: `Achats à vérifier : ${reste} autre${reste > 1 ? "s" : ""} point${reste > 1 ? "s" : ""} (liste complète dans la fenêtre d'export)` });
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
      tvaRegime: p?.tva_regime ?? null,
      tvaPeriodicite: p?.tva_periodicite ?? null,
      raccorde,
      conformite,
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
