/**
 * Le refus d'une facture reçue (fr:210), de bout en bout, SANS dépendance externe.
 *
 * Refuser exige d'être le DESTINATAIRE d'une vraie facture reçue. Le montage
 * autrefois manquant (un compte destinataire avec session + une entrante
 * refusable) est désormais monté par le script lui-même :
 *   1. l'ÉMETTEUR (Burger Queen, compte sandbox action-capable) émet une facture
 *      adressée à la ligne d'annuaire du DESTINATAIRE ;
 *   2. le DESTINATAIRE (SafeTone, verified) la reçoit et la refuse.
 *
 * La session du destinataire est MINÉE via le service-role (magic link
 * non destructif : ni mot de passe changé, ni session existante invalidée),
 * donc le refus abouti est éprouvé à chaque `npm run verify` sans qu'aucun
 * identifiant supplémentaire n'ait à être renseigné. `E2E_REFUS_EMAIL` /
 * `E2E_REFUS_PASSWORD` restent honorés s'ils sont fournis (ils priment).
 *
 * Le montage « une entreprise s'adresse une facture à elle-même » a été essayé
 * et écarté : la plateforme le rejette (fr:213), une facture dont l'émetteur est
 * le destinataire n'existe pas pour elle.
 *
 * Usage : node scripts/e2e/superpdp-refus.mjs
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";
const SIREN_PARTAGE = "315143296";
const SAFETONE_ID = "767be0c3-6978-4a43-a15f-454fa38146e3";
const LIGNE_SAFETONE = "0225:315143296_106362";

const doc = (o) => JSON.stringify(o);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jour = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

function cookieFor(t) {
  const session = {
    access_token: t.access_token, refresh_token: t.refresh_token,
    token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  return `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
}
function caller(cookie) {
  return async (path, init = {}) => {
    const r = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
      redirect: "manual",
    });
    const texte = await r.text();
    let body; try { body = JSON.parse(texte); } catch { body = texte.slice(0, 300); }
    return { status: r.status, body };
  };
}
async function sessionMotDePasse(creds) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: ANON_KEY }, body: doc(creds),
  });
  if (!res.ok) throw new Error(`Connexion impossible : HTTP ${res.status}`);
  return cookieFor(await res.json());
}
/** Session minée via service-role, sans mot de passe (magic link non destructif). */
async function sessionMinee(userId) {
  const admin = createClient(SUPABASE_URL, secret("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u, error: e1 } = await admin.auth.admin.getUserById(userId);
  if (e1) throw new Error(`getUserById : ${e1.message}`);
  const { data: link, error: e2 } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
  if (e2) throw new Error(`generateLink : ${e2.message}`);
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: e3 } = await anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "email" });
  if (e3) throw new Error(`verifyOtp : ${e3.message}`);
  return cookieFor(sess.session);
}

console.log("");
console.log("── Refus d'une facture reçue (fr:210), montage autonome ──────");
console.log(`   base : ${BASE}`);

const emetteur = caller(await sessionMotDePasse({ email: "superpdp-test@getdeviso.fr", password: secret("E2E_SUPERPDP_PASSWORD") }));
const destinataire = caller(
  process.env.E2E_REFUS_EMAIL
    ? await sessionMotDePasse({ email: process.env.E2E_REFUS_EMAIL, password: secret("E2E_REFUS_PASSWORD") })
    : await sessionMinee(SAFETONE_ID)
);
console.log(`   émetteur : Burger Queen · destinataire : ${process.env.E2E_REFUS_EMAIL ?? "SafeTone (session minée)"}`);
console.log("");

// ── L'émetteur émet une vraie facture vers la ligne du destinataire ──────────
const numero = `REFUS-E2E-${Date.now()}`;
const cre = await emetteur("/api/invoices", { method: "POST", body: doc({
  seller_company: "Burger Queen", seller_siren: SIREN_PARTAGE,
  seller_street: "809 avenue du Languedoc", seller_postcode: "12100", seller_city: "Millau",
  client_name: "SafeTone Studio", client_company: "SafeTone Studio", client_siren: SIREN_PARTAGE,
  client_directory_address: LIGNE_SAFETONE, client_country: "FR",
  client_street: "12 rue de Test", client_postcode: "33850", client_city: "Leognan",
  items: [{ description: "Prestation refus fr:210", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
  total_ht: 100, tva_rate: 20, total_ttc: 120,
  issue_date: jour(0), due_date: jour(30), type_code: "380", invoice_type: "standard",
  payment_terms: "30 jours net", operation_category: "services", invoice_number: numero,
})});
const idEmise = cre.body?.invoice?.id;
verifier("l'émetteur crée une facture pour le destinataire", cre.status === 201 && Boolean(idEmise), `HTTP ${cre.status} ${doc(cre.body).slice(0, 160)}`);

if (idEmise) {
  await emetteur(`/api/invoices/${idEmise}`, { method: "PATCH", body: doc({ status: "sent" }) });
  const em = await emetteur(`/api/superpdp/invoices/${idEmise}/emettre`, { method: "POST" });
  verifier("elle est transmise à la ligne d'annuaire du destinataire", em.status === 200 && em.body?.emise === true, `HTTP ${em.status} ${doc(em.body).slice(0, 200)}`);
}

// ── Garde-fous ───────────────────────────────────────────────────────────────
// Sur une facture SORTANTE (celle qu'on vient d'émettre), l'émetteur ne peut pas
// la refuser : refuser est un acte de destinataire.
// L'émetteur synchronise son miroir pour y voir sa facture fraîchement émise.
// Le miroir ne contient la facture SORTANTE qu'une fois la PA sortie de son
// ingestion (statut api:uploaded pendant quelques dizaines de secondes). On
// synchronise et on réessaie jusqu'à ce que la route cesse de renvoyer 404
// (facture pas encore dans le miroir), sinon ce garde-fou court plus vite que
// l'ingestion et échoue à tort sur une facture pourtant bien émise.
let surSortante = null;
for (let i = 0; i < 14; i++) {
  await emetteur("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });
  const r = await emetteur("/api/invoices");
  const idSortante = (r.body?.invoices ?? []).find((x) => x.superpdp_invoice_id)?.superpdp_invoice_id ?? null;
  if (idSortante) {
    surSortante = await emetteur(`/api/superpdp/invoices/${idSortante}/refuser`, { method: "POST", body: doc({ motif: "DOUBLON" }) });
    if (surSortante.status !== 404) break;
  }
  await sleep(8000);
}
verifier(
  "on ne refuse pas une facture qu'on a soi-même émise",
  Boolean(surSortante) && surSortante.status === 400 && /Sens invalide/.test(doc(surSortante.body)),
  `HTTP ${surSortante?.status} ${doc(surSortante?.body).slice(0, 200)}`
);
const inconnue = await destinataire("/api/superpdp/invoices/999999999/refuser", { method: "POST", body: doc({ motif: "DOUBLON" }) });
verifier("refuser la facture d'un autre espace renvoie introuvable, pas une fuite", inconnue.status === 404, `HTTP ${inconnue.status}`);

// ── Le destinataire reçoit, puis refuse ──────────────────────────────────────
let cible = null;
for (let i = 0; i < 14; i++) {
  await destinataire("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });
  const inv = await destinataire("/api/superpdp/factures-recues");
  const arr = inv.body?.factures ?? [];
  cible = arr.find((f) => (f.number || f.invoice_number || "") === numero);
  if (cible && cible.last_status_code && cible.last_status_code !== "api:uploaded") break;
  cible = null;
  await sleep(8000);
}
verifier("la facture émise redescend bien comme facture reçue chez le destinataire", Boolean(cible), `numéro ${numero} introuvable côté reçu après synchronisations`);

if (cible) {
  // Motif hors nomenclature : refusé avant tout appel à la plateforme.
  const motifInvalide = await destinataire(`/api/superpdp/invoices/${cible.id}/refuser`, { method: "POST", body: doc({ motif: "PARCE_QUE" }) });
  verifier("un motif hors nomenclature est refusé avant tout appel à la plateforme", motifInvalide.status === 400 && /Motif invalide/.test(doc(motifInvalide.body)), `HTTP ${motifInvalide.status} ${doc(motifInvalide.body).slice(0, 160)}`);

  const refus = await destinataire(`/api/superpdp/invoices/${cible.id}/refuser`, { method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }) });
  verifier("la facture reçue est refusée auprès de la Plateforme Agréée (fr:210)", refus.status === 200 && refus.body?.refusee === true, `HTTP ${refus.status} ${doc(refus.body).slice(0, 250)}`);

  const refusBis = await destinataire(`/api/superpdp/invoices/${cible.id}/refuser`, { method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }) });
  verifier("un second refus est reconnu comme déjà fait, sans nouvel événement", refusBis.status === 200 && refusBis.body?.dejaRefusee === true, `HTTP ${refusBis.status} ${doc(refusBis.body).slice(0, 200)}`);

  const apres = await destinataire("/api/superpdp/factures-recues");
  const ligne = (apres.body?.factures ?? []).find((f) => f.id === cible.id);
  verifier("le refus est visible sur la facture reçue", ligne?.last_status_code === "fr:210", `statut affiché : ${ligne?.last_status_code}`);
}

console.log("");
process.exit(bilan() > 0 ? 1 : 0);
