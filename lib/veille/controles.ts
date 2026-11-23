import type { createAdminClient } from "@/lib/supabase/admin";
import { SCENARIOS } from "@/scripts/scenarios/catalogue";
import { ROLE_COMPTABLE } from "@/lib/droits";
import { construireResume } from "@/lib/cabinet-resume";
import { relancesDues } from "@/lib/relances";
import { pointagesDus, construirePointage } from "@/lib/pointage-paiement";
import { creerCompteJetable, supprimerComptes, type CompteJetable } from "./comptes";
import { jouerScenario } from "./banc";
import type { Resultat } from "./decision";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Les contrôles de la veille quotidienne (20/11/2026).
 *
 * 1. Comptes réels, LECTURE EN BASE SEULEMENT (aucun appel à Super PDP ni à
 *    Chorus Pro, chaque appel Super PDP coûte à Deviso) :
 *    - raccordement Super PDP en erreur (`session_status = error`, typiquement
 *      un jeton mort, à refaire par l'écran d'autorisation) ;
 *    - raccordement Super PDP vérifié mais plus synchronisé depuis 6 h (le cron
 *      passe toutes les heures : il ne tourne plus, ou échoue sans le dire) ;
 *    - dépôt Chorus Pro commencé il y a plus d'une heure sans référence reçue
 *      (verrou resté pris : la facture ne partira plus d'elle-même).
 *    Chorus Pro n'a pas d'état de raccordement en base : seuls ses dépôts se
 *    lisent.
 *
 * 2. Chemins critiques rejoués sur des comptes de démonstration JETABLES,
 *    supprimés à la fin :
 *    - exports comptables : chaque scénario du banc d'essai
 *      (scripts/scenarios/catalogue.ts), par les vraies routes ;
 *    - résumé cabinet construit, JAMAIS envoyé ;
 *    - relance de devis et de facture : ce qui partirait, rien n'est envoyé ;
 *    - relance de pointage : ce qui partirait, rien n'est écrit ni envoyé.
 */

export type OptionsVeille = {
  base: string;
  /** Liste des scénarios à jouer (défaut : tous, dans le temps imparti). */
  scenarios?: string[];
  /** Ne lire aucun compte réel (test de la veille). */
  sansComptesReels?: boolean;
  /** Casser volontairement un chemin (test de la veille uniquement). */
  casser?: "lien-cabinet" | null;
  /** Temps au-delà duquel on ne lance plus de nouveau scénario. */
  budgetMs?: number;
};

export type BilanVeille = { resultats: Resultat[]; nonJoues: string[]; dureeMs: number; nettoyage: string[] };

const JOUR_MS = 24 * 60 * 60 * 1000;
const ilYA = (ms: number) => new Date(Date.now() - ms).toISOString();
const jour = (d: Date) => d.toISOString().slice(0, 10);

export async function comptesReels(admin: Admin): Promise<Resultat[]> {
  const resultats: Resultat[] = [];
  const { data: connexions, error } = await admin
    .from("superpdp_connections")
    .select("user_id, session_status, last_error, last_sync_at, connected_at");
  if (error) return [{ id: "lecture:superpdp", libelle: "Lecture des raccordements Super PDP", ok: false, detail: error.message }];
  const ids = [...new Set((connexions ?? []).map((c) => c.user_id as string))];
  const { data: profils } = ids.length
    ? await admin.from("profiles").select("id, is_demo, company_name, full_name, email").in("id", ids)
    : { data: [] };
  const profil = new Map((profils ?? []).map((p) => [p.id as string, p]));
  const nom = (id: string) => {
    const p = profil.get(id);
    // Pas de tiret cadratin dans nos messages, même s'il vient d'un nom saisi.
    return String(p?.company_name || p?.full_name || p?.email || id.slice(0, 8)).replace(/\s*\u2014\s*/g, ", ");
  };
  for (const c of connexions ?? []) {
    const p = profil.get(c.user_id);
    if (!p || p.is_demo) continue;
    if (c.session_status === "error") {
      resultats.push({
        id: `superpdp:${c.user_id}`,
        libelle: `Super PDP, raccordement en erreur pour ${nom(c.user_id)}`,
        ok: false,
        detail: `${(c.last_error ?? "sans message").slice(0, 200).replace(/[.\s]+$/, "")}. À refaire par l'écran d'autorisation.`,
      });
    } else if (c.session_status === "verified") {
      const depuis = c.last_sync_at ?? c.connected_at;
      const fige = !depuis || new Date(depuis).getTime() < Date.now() - 6 * 60 * 60 * 1000;
      resultats.push({
        id: `superpdp-sync:${c.user_id}`,
        libelle: `Super PDP, synchronisation de ${nom(c.user_id)}`,
        ok: !fige,
        detail: fige ? `aucune synchronisation depuis ${depuis ?? "le raccordement"} (le cron passe toutes les heures)` : undefined,
      });
    }
  }

  const { data: depots, error: eChorus } = await admin
    .from("invoices")
    .select("id, user_id, invoice_number, chorus_pro_depot_debute_at")
    .not("chorus_pro_depot_debute_at", "is", null)
    .is("chorus_pro_ref", null)
    .lt("chorus_pro_depot_debute_at", ilYA(60 * 60 * 1000))
    .limit(50);
  if (eChorus) resultats.push({ id: "lecture:chorus", libelle: "Lecture des dépôts Chorus Pro", ok: false, detail: eChorus.message });
  for (const d of depots ?? []) {
    resultats.push({
      id: `chorus-depot:${d.id}`,
      libelle: `Chorus Pro, dépôt bloqué de la facture ${d.invoice_number ?? d.id}`,
      ok: false,
      detail: `dépôt commencé le ${d.chorus_pro_depot_debute_at}, aucune référence reçue`,
    });
  }
  return resultats;
}

/** Crée une facture par l'API, comme un utilisateur, puis la passe à « envoyée ». */
async function venteEchue(base: string, c: CompteJetable, emise: string, echeance: string): Promise<{ id: string; numero: string } | string> {
  const r = await fetch(`${base}/api/invoices`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie: c.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Client Veille", client_company: "Veille SARL", client_email: "veille-client@example.fr",
      client_street: "1 rue du Banc", client_postcode: "33000", client_city: "Bordeaux",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
      total_ht: 500, tva_rate: 0, total_ttc: 500, issue_date: emise, due_date: echeance,
      operation_category: "services", type_code: "380", invoice_type: "standard",
    }),
  });
  const corps = await r.json().catch(() => null);
  const id = corps?.invoice?.id;
  if (!id) return `création de facture par l'API : HTTP ${r.status} ${corps?.error ?? ""}`.trim();
  const s = await fetch(`${base}/api/invoices/${id}`, {
    method: "PATCH", redirect: "manual",
    headers: { cookie: c.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "sent" }),
  });
  if (s.status !== 200) return `passage de la facture à « envoyée » : HTTP ${s.status}`;
  return { id, numero: corps.invoice.invoice_number };
}

async function devisEnvoye(base: string, c: CompteJetable, titre: string): Promise<string | { id: string }> {
  const r = await fetch(`${base}/api/proposals`, {
    method: "POST", redirect: "manual",
    headers: { cookie: c.cookie, "content-type": "application/json" },
    body: JSON.stringify({
      title: titre, client_name: "Client Veille", client_email: "veille-client@example.fr", client_company: "Veille SARL",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 300, total: 300 }],
      total_ht: 300, tva_rate: 0, total_ttc: 300, valid_until: jour(new Date(Date.now() + 30 * JOUR_MS)),
    }),
  });
  const corps = await r.json().catch(() => null);
  const id = corps?.proposal?.id;
  if (!id) return `création de devis par l'API : HTTP ${r.status} ${corps?.error ?? ""}`.trim();
  const s = await fetch(`${base}/api/proposals/${id}`, {
    method: "PATCH", redirect: "manual",
    headers: { cookie: c.cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "sent" }),
  });
  if (s.status !== 200) return `passage du devis à « envoyé » : HTTP ${s.status}`;
  return { id };
}

export async function cheminsCritiques(admin: Admin, options: OptionsVeille): Promise<BilanVeille> {
  const debut = Date.now();
  const resultats: Resultat[] = [];
  const tous = SCENARIOS.filter((s) => !options.scenarios || options.scenarios.includes(s.nom));
  let nonJoues: string[] = tous.map((s) => `export:${s.nom}`);
  const comptes: { client: CompteJetable | null; autre: CompteJetable | null; cabinet: CompteJetable | null } = { client: null, autre: null, cabinet: null };
  const echec = (id: string, libelle: string, detail: string) => resultats.push({ id, libelle, ok: false, detail });
  let nettoyage: string[] = [];

  try {
    try {
      comptes.client = await creerCompteJetable(admin, "Veille, dossier client");
      comptes.autre = await creerCompteJetable(admin, "Veille, second dossier");
      comptes.cabinet = await creerCompteJetable(admin, "Veille, cabinet");
    } catch (e) {
      echec("veille:comptes", "Création des comptes de démonstration de la veille", (e as Error).message);
      return { resultats, nonJoues: [...nonJoues, "resume-cabinet", "relance-devis", "relance-facture", "pointage"], dureeMs: Date.now() - debut, nettoyage };
    }
    resultats.push({ id: "veille:comptes", libelle: "Création des comptes de démonstration de la veille", ok: true });
    const client = comptes.client;
    const autre = comptes.autre;
    const cabinet = comptes.cabinet;

    for (const dossier of [client, autre]) {
      await admin.from("team_members").insert({
        owner_id: dossier.userId, member_id: cabinet.userId, email: cabinet.email,
        role: ROLE_COMPTABLE, status: "active", accepted_at: new Date().toISOString(),
      });
    }
    // Contre-épreuve du test de la veille : on retire le lien cabinet-dossier,
    // la jointure dont dépendent l'export cabinet et le résumé.
    if (options.casser === "lien-cabinet") {
      await admin.from("team_members").delete().eq("member_id", cabinet.userId);
    }

    // ── Relances et pointage : des documents qui DOIVENT partir, et un qui ne le doit pas ──
    const maintenant = new Date();
    const facture = await venteEchue(options.base, client, jour(new Date(Date.now() - 10 * JOUR_MS)), jour(new Date(Date.now() - 3 * JOUR_MS)));
    const ancien = await devisEnvoye(options.base, client, "Devis de la veille, à relancer");
    const recent = await devisEnvoye(options.base, client, "Devis de la veille, du jour");
    if (typeof ancien !== "string") {
      await admin.from("proposals").update({ created_at: new Date(Date.now() - 4 * JOUR_MS).toISOString() }).eq("id", ancien.id);
    }

    try {
      const dues = await relancesDues(admin, { seulement: client.userId, inclureDemo: true, maintenant });
      if (typeof ancien === "string" || typeof recent === "string") {
        echec("relance-devis", "Relance de devis (ce qui partirait)", typeof ancien === "string" ? ancien : (recent as string));
      } else {
        const r = dues.find((d) => d.id === ancien.id);
        const faux = dues.find((d) => d.id === recent.id);
        const ok = !!r && !faux && r.message.subject.startsWith("Votre devis vous attend") && r.message.to === "veille-client@example.fr"
          && r.message.from.startsWith("Veille, dossier client") && r.message.html.includes("Devis de la veille");
        resultats.push({
          id: "relance-devis", libelle: "Relance de devis (ce qui partirait)", ok,
          detail: ok ? undefined : !r ? "le devis envoyé il y a 4 jours ne serait pas relancé" : faux ? "le devis du jour serait relancé" : `message inattendu : ${r.message.subject}`,
        });
      }
      if (typeof facture === "string") echec("relance-facture", "Relance de facture (ce qui partirait)", facture);
      else {
        const r = dues.find((d) => d.id === facture.id);
        const ok = !!r && r.message.subject.startsWith("Rappel de paiement") && r.message.subject.includes(facture.numero);
        resultats.push({ id: "relance-facture", libelle: "Relance de facture (ce qui partirait)", ok, detail: ok ? undefined : r ? `message inattendu : ${r.message.subject}` : "la facture échue ne serait pas relancée" });
      }
    } catch (e) {
      echec("relance-devis", "Relance de devis (ce qui partirait)", (e as Error).message);
    }

    try {
      if (typeof facture === "string") echec("pointage", "Relance de pointage (ce qui partirait)", facture);
      else {
        const { erreur, parTitulaire } = await pointagesDus(admin, maintenant, { seulement: client.userId });
        const liste = parTitulaire.get(client.userId) ?? [];
        const vue = liste.find((f) => f.id === facture.id);
        const message = vue ? construirePointage(liste, { prenom: "Veille", base: options.base, maintenant }) : null;
        const ok = !erreur && !!message && message.sujet.includes(facture.numero) && message.html.includes(`/invoices/${facture.id}?pointage=payee`);
        resultats.push({
          id: "pointage", libelle: "Relance de pointage (ce qui partirait)", ok,
          detail: ok ? undefined : erreur ?? (vue ? `message inattendu : ${message?.sujet}` : "la facture échue ne serait pas pointée"),
        });
      }
    } catch (e) {
      echec("pointage", "Relance de pointage (ce qui partirait)", (e as Error).message);
    }

    // ── Résumé cabinet, construit et jamais envoyé ──
    try {
      const resume = await construireResume(admin, cabinet.userId, maintenant, "chaque lundi", { inclureDemo: true });
      const ok = !!resume && resume.sujet.startsWith("Votre portefeuille Deviso") && resume.html.includes("Veille, dossier client");
      resultats.push({
        id: "resume-cabinet", libelle: "Résumé cabinet (construit, non envoyé)", ok,
        detail: ok ? undefined : resume ? `résumé inattendu : ${resume.sujet}` : "aucun résumé alors que le dossier a une facture échue impayée",
      });
    } catch (e) {
      echec("resume-cabinet", "Résumé cabinet (construit, non envoyé)", (e as Error).message);
    }

    // ── Exports comptables : le banc d'essai, dans le temps imparti ──
    // On commence chaque jour à un scénario différent : si le temps manque, les
    // suivants seront joués les jours d'après, aucun n'est oublié durablement.
    const budget = options.budgetMs ?? 180_000;
    const decalage = tous.length ? Math.floor(Date.now() / JOUR_MS) % tous.length : 0;
    const ordre = [...tous.slice(decalage), ...tous.slice(0, decalage)];
    for (const sc of ordre) {
      if (Date.now() - debut > budget) break;
      const id = `export:${sc.nom}`;
      try {
        const ecarts = await jouerScenario(admin, sc, { client, autre, cabinet }, options.base);
        resultats.push({ id, libelle: `Exports comptables, scénario « ${sc.nom} »`, ok: ecarts.length === 0, detail: ecarts.slice(0, 3).join(" ; ") || undefined });
      } catch (e) {
        echec(id, `Exports comptables, scénario « ${sc.nom} »`, (e as Error).message);
      }
      nonJoues = nonJoues.filter((n) => n !== id);
    }
  } finally {
    // Les liens cabinet partent avec les comptes (lib/demo-cleanup.ts).
    nettoyage = await supprimerComptes(admin, [comptes.client, comptes.autre, comptes.cabinet]);
  }
  return { resultats, nonJoues, dureeMs: Date.now() - debut, nettoyage };
}
