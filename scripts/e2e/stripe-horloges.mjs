/**
 * Les parcours d'abonnement que personne n'a jamais souscrits, rejoués en MODE
 * TEST Stripe avec des horloges de test (test clocks). Aucun débit réel.
 *
 * Pourquoi. Au 20/11/2026, seul le Pro mensuel avait réellement tourné (juillet,
 * en production). L'annuel (Solo et Pro), le siège supplémentaire, le passage
 * mensuel -> annuel et la fin d'essai sans carte n'avaient JAMAIS été parcourus :
 * leurs prix étaient justes, leur tunnel non prouvé. Le faux Stripe
 * (`faux-stripe.mjs`) prouve nos appels, pas la sémantique de Stripe ; ici c'est
 * le vrai Stripe qui calcule les factures, les prorations, la fin d'essai.
 *
 * Le montage :
 *   - un catalogue de test (mêmes montants que la grille LIVE), créé une fois et
 *     retrouvé ensuite par `lookup_key` ;
 *   - l'application locale (`next dev`), lancée par ce script avec la clé de
 *     test, les prix de test et un secret de webhook local ;
 *   - une horloge de test par parcours : on avance le temps de 15 jours, d'un
 *     mois, d'un an, et Stripe produit les vrais événements ;
 *   - ces événements sont lus chez Stripe (`events.list`), signés avec le secret
 *     local et livrés à `/api/webhooks/stripe` : la route jugée est la vraie ;
 *   - des comptes Supabase jetables, supprimés à la fin ; leur adresse est
 *     `delivered+...@resend.dev`, boîte de test de Resend : les courriels
 *     partent réellement par Resend, n'arrivent chez personne.
 *
 * Ce que ce banc NE rejoue PAS : la page de paiement hébergée par Stripe
 * (Checkout). L'abonnement est créé par l'API avec les paramètres que la route
 * passe à Checkout, et `stripe_subscription_id` est posé comme le ferait
 * `checkout.session.completed`. La route est appelée pour la reprise après fin
 * d'essai, et la session qu'elle ouvre est relue chez Stripe.
 *
 * Prérequis : `.env.stripe-test.local` (ignoré par git) avec
 * STRIPE_TEST_SECRET_KEY=sk_test_..., et `.env.local`.
 * Usage : npm run test:stripe-horloges [-- --seulement=annuel,siege,siege-annuel,periodicite,essai,ancien]
 */

import { spawn, execSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import Stripe from "stripe";
import { verifier, bilan, secret } from "./lib.mjs";
import { CENTIMES, euros } from "../../lib/grille-tarifaire.ts";

// ── configuration ────────────────────────────────────────────────────────
function cleDeTest() {
  if (process.env.STRIPE_TEST_SECRET_KEY) return process.env.STRIPE_TEST_SECRET_KEY;
  for (const f of [".env.stripe-test.local", "../../../.env.stripe-test.local"]) {
    if (!existsSync(f)) continue;
    const l = readFileSync(f, "utf8").split(/\r?\n/).find((x) => x.startsWith("STRIPE_TEST_SECRET_KEY="));
    if (l) return l.slice(l.indexOf("=") + 1).trim();
  }
  throw new Error("STRIPE_TEST_SECRET_KEY introuvable (.env.stripe-test.local).");
}
const CLE = cleDeTest();
// Garde absolue : ce banc avance des horloges et crée des abonnements. En mode
// réel, ce serait des débits. Il refuse tout ce qui n'est pas une clé de test.
if (!/^sk_test_/.test(CLE) && !/^rk_test_/.test(CLE)) {
  console.error("Refus : la clé fournie n'est pas une clé de MODE TEST.");
  process.exit(1);
}
const stripe = new Stripe(CLE, { apiVersion: "2025-02-24.acacia" });

const PORT = Number(process.env.PORT_HORLOGES ?? 3107);
const APP = `http://127.0.0.1:${PORT}`;
const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SB = `https://${PROJECT_REF}.supabase.co`;
const SERVICE = secret("SUPABASE_SERVICE_ROLE_KEY");
const ANON = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SECRET_WH = `whsec_banc_${randomBytes(16).toString("hex")}`;
const JOUR = 86400;
const RUN = Date.now().toString(36);

const arg = process.argv.find((a) => a.startsWith("--seulement="));
const SEULEMENT = arg ? new Set(arg.split("=")[1].split(",")) : null;
const joue = (nom) => !SEULEMENT || SEULEMENT.has(nom);

// ── catalogue de test, lu dans la grille LIVE (lib/grille-tarifaire.ts) ──
// La clé de recherche porte le montant : un changement de grille crée de
// nouveaux prix de test au lieu de réutiliser ceux de l'ancienne grille.
const GRILLE = [
  { cle: `deviso_banc_solo_m_${CENTIMES.solo.mensuel}`, nom: "Solo mensuel (banc)", montant: CENTIMES.solo.mensuel, intervalle: "month", env: "STRIPE_SOLO_PRICE_ID" },
  { cle: `deviso_banc_solo_a_${CENTIMES.solo.annuel}`, nom: "Solo annuel (banc)", montant: CENTIMES.solo.annuel, intervalle: "year", env: "STRIPE_SOLO_ANNUAL_PRICE_ID" },
  { cle: `deviso_banc_pro_m_${CENTIMES.pro.mensuel}`, nom: "Pro mensuel (banc)", montant: CENTIMES.pro.mensuel, intervalle: "month", env: "STRIPE_PRO_PRICE_ID" },
  { cle: `deviso_banc_pro_a_${CENTIMES.pro.annuel}`, nom: "Pro annuel (banc)", montant: CENTIMES.pro.annuel, intervalle: "year", env: "STRIPE_PRO_ANNUAL_PRICE_ID" },
  { cle: `deviso_banc_siege_${CENTIMES.siege}`, nom: "Siège supplémentaire (banc)", montant: CENTIMES.siege, intervalle: "month", env: "STRIPE_SEAT_PRICE_ID" },
  { cle: `deviso_banc_siege_a_${CENTIMES.siegeAnnuel}`, nom: "Siège supplémentaire annuel (banc)", montant: CENTIMES.siegeAnnuel, intervalle: "year", env: "STRIPE_SEAT_ANNUAL_PRICE_ID" },
];

async function catalogue() {
  const existants = await stripe.prices.list({ lookup_keys: GRILLE.map((g) => g.cle), active: true, limit: 10 });
  const P = {};
  for (const g of GRILLE) {
    let prix = existants.data.find((p) => p.lookup_key === g.cle);
    if (!prix) {
      const produit = await stripe.products.create({ name: g.nom });
      prix = await stripe.prices.create({
        product: produit.id, currency: "eur", unit_amount: g.montant,
        recurring: { interval: g.intervalle }, lookup_key: g.cle,
      });
    }
    P[g.env] = prix.id;
  }
  return P;
}

// ── Supabase (clé de service) ────────────────────────────────────────────
const admin = (chemin, init = {}) =>
  fetch(`${SB}${chemin}`, {
    ...init,
    headers: {
      apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json", Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

const comptes = [];
async function creerCompte(etiquette) {
  const email = `delivered+horloge-${RUN}-${etiquette}@resend.dev`;
  const mdp = `Hz!${randomBytes(9).toString("hex")}A9`;
  const r = await admin("/auth/v1/admin/users", {
    method: "POST", body: JSON.stringify({ email, password: mdp, email_confirm: true }),
  });
  const u = await r.json();
  if (!u.id) throw new Error(`création du compte ${etiquette} : HTTP ${r.status} ${JSON.stringify(u).slice(0, 160)}`);
  comptes.push(u.id);
  await admin(`/rest/v1/profiles?id=eq.${u.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      full_name: `Banc ${etiquette}`, company_name: `Banc horloges ${etiquette}`,
      plan: "free", subscription_status: null, is_demo: false,
    }),
  });
  const co = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email, password: mdp }),
  });
  const t = await co.json();
  const cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify({
    access_token: t.access_token, refresh_token: t.refresh_token, token_type: "bearer",
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64")}`;
  return { id: u.id, email, cookie };
}

async function profil(id) {
  const r = await admin(`/rest/v1/profiles?id=eq.${id}&select=plan,subscription_status,stripe_subscription_id,stripe_customer_id`);
  return (await r.json())[0];
}
const majProfil = (id, champs) =>
  admin(`/rest/v1/profiles?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(champs) });

async function appel(compte, chemin, init = {}) {
  const res = await fetch(`${APP}${chemin}`, {
    ...init,
    headers: { cookie: compte.cookie, ...(init.body ? { "content-type": "application/json" } : {}) },
    redirect: "manual",
  });
  const texte = await res.text();
  try { return { status: res.status, body: JSON.parse(texte), texte }; }
  catch { return { status: res.status, body: null, texte }; }
}

// ── application locale, branchée sur le mode test ────────────────────────
const journalApp = [];
let app;
async function demarrerApp(P) {
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT), "-H", "127.0.0.1"], {
    env: {
      ...process.env, ...P,
      NODE_ENV: "development",
      STRIPE_SECRET_KEY: CLE,
      STRIPE_WEBHOOK_SECRET: SECRET_WH,
      NEXT_PUBLIC_APP_URL: APP,
      STRIPE_API_BASE: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lire = (b) => { for (const l of b.toString().split(/\r?\n/)) if (l.trim()) journalApp.push(l); };
  app.stdout.on("data", lire);
  app.stderr.on("data", lire);
  for (let i = 0; i < 120; i++) {
    const ok = await fetch(`${APP}/api/version`).then((r) => r.status < 500).catch(() => false);
    if (ok) return true;
    await pause(1000);
  }
  return false;
}
function arreterApp() {
  if (!app?.pid) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${app.pid} /T /F`, { stdio: "ignore" });
    else app.kill("SIGTERM");
  } catch { /* déjà arrêtée */ }
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = (motif) => journalApp.filter((l) => motif.test(l)).length;

// ── événements Stripe -> webhook local ───────────────────────────────────
const T0 = Math.floor(Date.now() / 1000) - 5;
const livres = new Set();
const clientsSuivis = new Set();

function signer(charge) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", SECRET_WH).update(`${t}.${charge}`).digest("hex");
  return `t=${t},v1=${v1}`;
}
async function livrer(evenement) {
  const charge = JSON.stringify(evenement);
  const r = await fetch(`${APP}/api/webhooks/stripe`, {
    method: "POST", headers: { "stripe-signature": signer(charge), "content-type": "application/json" }, body: charge,
  });
  return r.status;
}
/**
 * L'abonnement d'une facture. Les événements sont rendus dans la version d'API
 * par défaut du COMPTE, pas celle du SDK : depuis 2025-03-31 (basil), le champ
 * `subscription` a quitté la racine de la facture pour
 * `parent.subscription_details.subscription`. On lit les deux.
 */
const subDeFacture = (f) => f.subscription ?? f.parent?.subscription_details?.subscription ?? null;
const clientDe = (e) => {
  const o = e.data.object;
  return o.object === "customer" ? o.id : o.customer;
};

/** Livre tous les événements nouveaux des clients suivis, dans l'ordre chronologique. */
async function synchroniser() {
  const nouveaux = [];
  for await (const e of stripe.events.list({ created: { gte: T0 }, limit: 100 })) {
    if (livres.has(e.id)) continue;
    if (!clientsSuivis.has(clientDe(e))) continue;
    nouveaux.push(e);
  }
  nouveaux.reverse();
  const statuts = [];
  for (const e of nouveaux) {
    livres.add(e.id);
    statuts.push(await livrer(e));
  }
  return { nouveaux, statuts };
}

/** Attend qu'un événement attendu soit arrivé chez Stripe, en livrant au fil de l'eau. */
async function attendre(predicat, delai = 90_000) {
  const vus = [];
  const fin = Date.now() + delai;
  while (Date.now() < fin) {
    const { nouveaux, statuts } = await synchroniser();
    vus.push(...nouveaux);
    if (statuts.some((s) => s !== 200)) console.error(`   ! livraison webhook : ${statuts.join(",")}`);
    const e = vus.find(predicat);
    if (e) { await pause(1500); vus.push(...(await synchroniser()).nouveaux); return { trouve: e, vus }; }
    await pause(2500);
  }
  return { trouve: null, vus };
}

// ── horloges ─────────────────────────────────────────────────────────────
const horloges = [];
async function nouvelleHorloge(nom) {
  const h = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000), name: `banc ${nom} ${RUN}` });
  horloges.push(h.id);
  return h;
}
async function avancer(h, secondes) {
  const actuelle = await stripe.testHelpers.testClocks.retrieve(h.id);
  await stripe.testHelpers.testClocks.advance(h.id, { frozen_time: actuelle.frozen_time + secondes });
  for (let i = 0; i < 120; i++) {
    const s = await stripe.testHelpers.testClocks.retrieve(h.id);
    if (s.status === "ready") return s.frozen_time;
    if (s.status === "internal_failure") throw new Error(`horloge ${h.id} en échec`);
    await pause(2000);
  }
  throw new Error(`horloge ${h.id} : avance trop longue`);
}

async function clientStripe(compte, horloge, avecCarte) {
  const c = await stripe.customers.create({
    email: compte.email, test_clock: horloge.id, metadata: { supabase_user_id: compte.id, banc: RUN },
  });
  clientsSuivis.add(c.id);
  if (avecCarte) {
    const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: c.id });
    await stripe.customers.update(c.id, { invoice_settings: { default_payment_method: pm.id } });
  }
  await majProfil(compte.id, { stripe_customer_id: c.id });
  return c;
}

/** Ce que Checkout crée pour un premier abonnement (cf. app/api/stripe/checkout). */
async function abonnementCommeCheckout(client, prix, plan, billing, { essai = true, finEssai = "cancel" } = {}) {
  return stripe.subscriptions.create({
    customer: client.id,
    items: [{ price: prix }],
    ...(essai
      ? { trial_period_days: 14, trial_settings: { end_behavior: { missing_payment_method: finEssai } } }
      : {}),
    metadata: { target_plan: plan, billing },
  });
}

// ════════════════════════════════════════════════════════════════════════
console.log("");
console.log("── Abonnements en mode test Stripe, horloges de test ────────");

let P;
try {
  // Portail LIVE : lecture seule, aucune écriture.
  const live = secret("STRIPE_SECRET_KEY");
  if (/^sk_live_|^rk_live_/.test(live)) {
    const r = await fetch("https://api.stripe.com/v1/billing_portal/configurations?limit=10&expand[]=data.features.subscription_update.products", {
      headers: { Authorization: `Bearer ${live}` },
    });
    const cfg = (await r.json()).data?.find((c) => c.is_default);
    const su = cfg?.features?.subscription_update;
    const prixPortail = (su?.products ?? []).flatMap((p) => p.prices).sort();
    const grille = ["STRIPE_SOLO_PRICE_ID", "STRIPE_SOLO_ANNUAL_PRICE_ID", "STRIPE_PRO_PRICE_ID", "STRIPE_PRO_ANNUAL_PRICE_ID"].map(secret).sort();
    verifier("portail LIVE : changement de formule activé", su?.enabled === true);
    verifier("portail LIVE : limité aux 4 prix de la grille", JSON.stringify(prixPortail) === JSON.stringify(grille), prixPortail.join(","));
    verifier("portail LIVE : quantité non modifiable", (su?.products ?? []).every((p) => !p.adjustable_quantity?.enabled));
    verifier("portail LIVE : l'essai continue après un changement", su?.trial_update_behavior === "continue_trial", su?.trial_update_behavior);
    verifier("portail LIVE : écart au prorata, pas de débit immédiat", su?.proration_behavior === "create_prorations", su?.proration_behavior);
  }

  P = await catalogue();
  verifier(`catalogue de test prêt (${GRILLE.length} prix)`, Object.keys(P).length === GRILLE.length);
  console.log("   démarrage de l'application locale (mode test)...");
  const demarree = await demarrerApp(P);
  verifier("application locale démarrée", demarree, journalApp.slice(-5).join(" | "));
  if (!demarree) throw new Error("application locale injoignable");

  // ── 1. Solo annuel et Pro annuel, avec carte ─────────────────────────
  if (joue("annuel")) {
    for (const [plan, cle, montant] of [["solo", "STRIPE_SOLO_ANNUAL_PRICE_ID", CENTIMES.solo.annuel], ["pro", "STRIPE_PRO_ANNUAL_PRICE_ID", CENTIMES.pro.annuel]]) {
      console.log("");
      console.log(`── ${plan === "solo" ? "Solo" : "Pro"} annuel : essai, premier paiement, renouvellement ──`);
      const compte = await creerCompte(`${plan}-annuel`);
      const h = await nouvelleHorloge(`${plan}-annuel`);
      const client = await clientStripe(compte, h, true);
      const sub = await abonnementCommeCheckout(client, P[cle], plan, "annual");
      await majProfil(compte.id, { stripe_subscription_id: sub.id, plan, subscription_status: sub.status });
      verifier("abonnement créé en essai", sub.status === "trialing", sub.status);
      verifier("au prix annuel de test", sub.items.data[0].price.recurring.interval === "year");

      await avancer(h, 15 * JOUR);
      const { trouve } = await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id && e.data.object.amount_paid > 0);
      verifier("fin d'essai avec carte : première facture payée", Boolean(trouve), "invoice.paid absent");
      verifier(`montant de la grille (${montant / 100} €)`, trouve?.data.object.amount_paid === montant, `${trouve?.data.object.amount_paid}`);
      let p = await profil(compte.id);
      verifier(`webhook : plan ${plan}, abonnement actif`, p.plan === plan && p.subscription_status === "active", JSON.stringify(p));
      verifier("aucun courriel de fin d'essai pour un essai payé", lignes(new RegExp(`fin d'essai.*${compte.id}`)) === 0);

      await avancer(h, 366 * JOUR);
      const ren = await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id && e.data.object.billing_reason === "subscription_cycle");
      verifier("un an plus tard : renouvellement annuel facturé", ren.trouve?.data.object.amount_paid === montant, `${ren.trouve?.data.object.amount_paid}`);
      p = await profil(compte.id);
      verifier("toujours actif après le renouvellement", p.plan === plan && p.subscription_status === "active", JSON.stringify(p));
    }
  }

  // ── 2. Siège supplémentaire ──────────────────────────────────────────
  if (joue("siege")) {
    console.log("");
    console.log("── Pro mensuel + siège supplémentaire ─────────────────────");
    const titulaire = await creerCompte("siege-titulaire");
    const membre = await creerCompte("siege-membre");
    const h = await nouvelleHorloge("siege");
    const client = await clientStripe(titulaire, h, true);
    const sub = await abonnementCommeCheckout(client, P.STRIPE_PRO_PRICE_ID, "pro", "monthly", { essai: false });
    await majProfil(titulaire.id, { stripe_subscription_id: sub.id, plan: "pro", subscription_status: sub.status });
    await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id);
    verifier(`Pro mensuel actif et payé (${euros(CENTIMES.pro.mensuel)} €)`, sub.status === "active", sub.status);

    // Deux membres déjà actifs (inclus), puis un troisième accepte son invitation.
    await admin("/rest/v1/team_members", {
      method: "POST",
      body: JSON.stringify([
        { owner_id: titulaire.id, email: `inclus1-${RUN}@example.com`, status: "active", role: "member" },
        { owner_id: titulaire.id, email: `inclus2-${RUN}@example.com`, status: "active", role: "member" },
      ]),
    });
    const inv = await (await admin("/rest/v1/team_members", {
      method: "POST",
      body: JSON.stringify({ owner_id: titulaire.id, email: membre.email, status: "pending", role: "member" }),
    })).json();
    const acc = await appel(membre, `/api/team/accept/${inv[0].invite_token}`);
    verifier("le 3e collaborateur accepte l'invitation", acc.status === 307 || acc.status === 302, `HTTP ${acc.status}`);
    let s = await stripe.subscriptions.retrieve(sub.id);
    const siege = s.items.data.find((i) => i.price.id === P.STRIPE_SEAT_PRICE_ID);
    verifier("un article « siège » est ajouté, quantité 1", siege?.quantity === 1, JSON.stringify(s.items.data.map((i) => [i.price.id, i.quantity])));

    await avancer(h, 32 * JOUR);
    const { trouve } = await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id && e.data.object.billing_reason === "subscription_cycle");
    const lignesFacture = trouve ? (await stripe.invoices.listLineItems(trouve.data.object.id, { limit: 20 })).data : [];
    const ligneSiege = lignesFacture.find((l) => l.price?.id === P.STRIPE_SEAT_PRICE_ID && !l.proration);
    verifier(`le mois suivant : ${euros(CENTIMES.pro.mensuel)} € + ${euros(CENTIMES.siege)} € de siège facturés`, ligneSiege?.amount === CENTIMES.siege && trouve.data.object.amount_paid >= CENTIMES.pro.mensuel + CENTIMES.siege,
      `${trouve?.data.object.amount_paid} ; lignes ${lignesFacture.map((l) => `${l.amount}${l.proration ? "p" : ""}`).join(",")}`);
    const p = await profil(titulaire.id);
    verifier("webhook : toujours Pro malgré deux articles", p.plan === "pro" && p.subscription_status === "active", JSON.stringify(p));
    await admin(`/rest/v1/team_members?owner_id=eq.${titulaire.id}`, { method: "DELETE" });
  }

  // ── 2 bis. Siège sur un abonnement ANNUEL ────────────────────────────
  // Stripe refuse deux périodicités sur un abonnement : avant le 23/11/2026,
  // le siège mensuel ne s'ajoutait jamais à un Pro annuel (collaborateur non
  // facturé), et un Pro mensuel avec siège ne pouvait pas passer à l'annuel.
  if (joue("siege-annuel")) {
    console.log("");
    console.log("── Pro annuel + siège, et passage à l'annuel avec siège ───");
    const deuxInclus = (owner) => admin("/rest/v1/team_members", {
      method: "POST",
      body: JSON.stringify([
        { owner_id: owner, email: `inclus1-${RUN}-${owner.slice(0, 6)}@example.com`, status: "active", role: "member" },
        { owner_id: owner, email: `inclus2-${RUN}-${owner.slice(0, 6)}@example.com`, status: "active", role: "member" },
      ]),
    });
    const inviter = async (owner, membre) => {
      const inv = await (await admin("/rest/v1/team_members", {
        method: "POST",
        body: JSON.stringify({ owner_id: owner, email: membre.email, status: "pending", role: "member" }),
      })).json();
      return appel(membre, `/api/team/accept/${inv[0].invite_token}`);
    };

    // a) Pro annuel : le 3e collaborateur doit être facturé au siège ANNUEL.
    const tA = await creerCompte("sa-titulaire");
    const mA = await creerCompte("sa-membre");
    const hA = await nouvelleHorloge("sa");
    const cA = await clientStripe(tA, hA, true);
    const subA = await abonnementCommeCheckout(cA, P.STRIPE_PRO_ANNUAL_PRICE_ID, "pro", "annual", { essai: false });
    await majProfil(tA.id, { stripe_subscription_id: subA.id, plan: "pro", subscription_status: subA.status });
    await deuxInclus(tA.id);
    const accA = await inviter(tA.id, mA);
    verifier("Pro annuel : le 3e collaborateur accepte l'invitation", accA.status === 307 || accA.status === 302, `HTTP ${accA.status}`);
    const sA = await stripe.subscriptions.retrieve(subA.id);
    const siegeA = sA.items.data.find((i) => i.price.id === P.STRIPE_SEAT_ANNUAL_PRICE_ID);
    verifier(`Pro annuel : un siège ANNUEL (${euros(CENTIMES.siegeAnnuel)} €) est ajouté, quantité 1`, siegeA?.quantity === 1,
      JSON.stringify(sA.items.data.map((i) => [i.price.id, i.quantity])));
    verifier("Pro annuel : aucun siège mensuel sur l'abonnement", !sA.items.data.some((i) => i.price.id === P.STRIPE_SEAT_PRICE_ID));

    // a bis) Ce même Pro annuel avec siège redescend en Solo MENSUEL : le siège
    // doit disparaître dans le même appel, et la facture immédiate (changement
    // de périodicité) ne doit porter aucun siège.
    const rS = await appel(tA, "/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "solo", billing: "monthly", confirmerRetraitMembres: true }) });
    verifier("Pro annuel avec siège -> Solo mensuel accepté", rS.body?.changed === true, `HTTP ${rS.status} ${rS.texte.slice(0, 200)}`);
    const sS = await stripe.subscriptions.retrieve(subA.id);
    verifier("après passage à Solo : seul l'article Solo mensuel reste", sS.items.data.length === 1 && sS.items.data[0].price.id === P.STRIPE_SOLO_PRICE_ID,
      JSON.stringify(sS.items.data.map((i) => [i.price.id, i.quantity])));
    const facturesS = (await stripe.invoices.list({ subscription: subA.id, limit: 5 })).data;
    const lignesS = (await Promise.all(facturesS.map((fa) => stripe.invoices.listLineItems(fa.id, { limit: 50 })))).flatMap((l) => l.data);
    verifier("aucune ligne de siège mensuel facturée au passage à Solo", !lignesS.some((l) => l.price?.id === P.STRIPE_SEAT_PRICE_ID && l.amount > 0),
      lignesS.map((l) => `${l.price?.id}:${l.amount}`).join(","));
    const membresRestants = await (await admin(`/rest/v1/team_members?owner_id=eq.${tA.id}&select=id`)).json();
    verifier("après passage à Solo : collaborateurs retirés", Array.isArray(membresRestants) && membresRestants.length === 0, JSON.stringify(membresRestants).slice(0, 120));

    // b) Pro mensuel avec un siège, passage à l'annuel par la route de Deviso.
    const tB = await creerCompte("sb-titulaire");
    const mB = await creerCompte("sb-membre");
    const hB = await nouvelleHorloge("sb");
    const cB = await clientStripe(tB, hB, true);
    const subB = await abonnementCommeCheckout(cB, P.STRIPE_PRO_PRICE_ID, "pro", "monthly", { essai: false });
    await majProfil(tB.id, { stripe_subscription_id: subB.id, plan: "pro", subscription_status: subB.status });
    await deuxInclus(tB.id);
    await inviter(tB.id, mB);
    let sB = await stripe.subscriptions.retrieve(subB.id);
    verifier("Pro mensuel : un siège mensuel est en place", sB.items.data.some((i) => i.price.id === P.STRIPE_SEAT_PRICE_ID && i.quantity === 1),
      JSON.stringify(sB.items.data.map((i) => [i.price.id, i.quantity])));
    const r = await appel(tB, "/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro", billing: "annual" }) });
    verifier("passage à l'annuel accepté par la route", r.body?.changed === true, `HTTP ${r.status} ${r.texte.slice(0, 200)}`);
    sB = await stripe.subscriptions.retrieve(subB.id);
    const ids = sB.items.data.map((i) => i.price.id);
    verifier("après passage : formule Pro ANNUELLE et siège ANNUEL, quantité 1",
      ids.includes(P.STRIPE_PRO_ANNUAL_PRICE_ID) && sB.items.data.some((i) => i.price.id === P.STRIPE_SEAT_ANNUAL_PRICE_ID && i.quantity === 1) && sB.items.data.length === 2,
      JSON.stringify(sB.items.data.map((i) => [i.price.id, i.quantity])));

    for (const o of [tA.id, tB.id]) await admin(`/rest/v1/team_members?owner_id=eq.${o}`, { method: "DELETE" });
  }

  // ── 3. Mensuel -> annuel, par la route de Deviso ─────────────────────
  if (joue("periodicite")) {
    console.log("");
    console.log("── Passage mensuel -> annuel (abonné payant) ──────────────");
    const compte = await creerCompte("m2a");
    const h = await nouvelleHorloge("m2a");
    const client = await clientStripe(compte, h, true);
    const sub = await abonnementCommeCheckout(client, P.STRIPE_SOLO_PRICE_ID, "solo", "monthly", { essai: false });
    await majProfil(compte.id, { stripe_subscription_id: sub.id, plan: "solo", subscription_status: "active" });
    await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id);
    await avancer(h, 10 * JOUR);

    const r = await appel(compte, "/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "solo", billing: "annual" }) });
    verifier("la route modifie l'abonnement, sans nouvelle page de paiement", r.body?.changed === true && !r.body?.url, `HTTP ${r.status} ${r.texte.slice(0, 160)}`);
    const s = await stripe.subscriptions.retrieve(sub.id);
    verifier("même abonnement, désormais au prix Solo annuel", s.items.data.length === 1 && s.items.data[0].price.id === P.STRIPE_SOLO_ANNUAL_PRICE_ID, s.items.data.map((i) => i.price.id).join(","));
    const { trouve } = await attendre((e) => e.type === "invoice.paid" && subDeFacture(e.data.object) === sub.id && e.data.object.billing_reason === "subscription_update");
    const paye = trouve?.data.object.amount_paid ?? -1;
    verifier("facture annuelle diminuée du crédit du mois entamé", paye > CENTIMES.solo.annuel - CENTIMES.solo.mensuel && paye < CENTIMES.solo.annuel, `${paye}`);
    const autres = (await stripe.subscriptions.list({ customer: client.id, status: "all" })).data.length;
    verifier("un seul abonnement chez le client", autres === 1, `${autres}`);
    const p = await profil(compte.id);
    verifier("webhook : Solo actif", p.plan === "solo" && p.subscription_status === "active", JSON.stringify(p));

    console.log("");
    console.log("── Passage mensuel -> annuel pendant l'essai ─────────────");
    const c2 = await creerCompte("m2a-essai");
    const h2 = await nouvelleHorloge("m2a-essai");
    const cl2 = await clientStripe(c2, h2, false);
    const sub2 = await abonnementCommeCheckout(cl2, P.STRIPE_PRO_PRICE_ID, "pro", "monthly");
    await majProfil(c2.id, { stripe_subscription_id: sub2.id, plan: "pro", subscription_status: "trialing" });
    await avancer(h2, 4 * JOUR);
    const r2 = await appel(c2, "/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro", billing: "annual" }) });
    verifier("changement accepté pendant l'essai", r2.body?.changed === true, r2.texte.slice(0, 160));
    const s2 = await stripe.subscriptions.retrieve(sub2.id);
    verifier("l'essai continue, même date de fin", s2.status === "trialing" && s2.trial_end === sub2.trial_end, `${s2.status} ${s2.trial_end} / ${sub2.trial_end}`);
    const factures2 = (await stripe.invoices.list({ customer: cl2.id })).data;
    verifier("rien n'est prélevé pendant l'essai", factures2.every((f) => f.amount_paid === 0), factures2.map((f) => f.amount_paid).join(","));
    await attendre((e) => e.type === "customer.subscription.updated" && e.data.object.id === sub2.id);
    const p2 = await profil(c2.id);
    verifier("webhook : Pro en essai", p2.plan === "pro" && p2.subscription_status === "trialing", JSON.stringify(p2));
  }

  // ── 4. Fin d'essai sans carte ────────────────────────────────────────
  if (joue("essai")) {
    console.log("");
    console.log("── Fin d'essai sans carte : rappel, coupure, courriel, écran ─");
    const compte = await creerCompte("essai");
    const h = await nouvelleHorloge("essai");
    const client = await clientStripe(compte, h, false);
    const sub = await abonnementCommeCheckout(client, P.STRIPE_PRO_PRICE_ID, "pro", "monthly");
    await majProfil(compte.id, { stripe_subscription_id: sub.id, plan: "pro", subscription_status: "trialing" });

    await avancer(h, 11 * JOUR + 3600);
    const j3 = await attendre((e) => e.type === "customer.subscription.trial_will_end" && e.data.object.id === sub.id);
    verifier("J-3 : Stripe annonce la fin d'essai", Boolean(j3.trouve));
    verifier("J-3 : le rappel part par Resend", lignes(new RegExp(`rappel J-3 : courriel envoyé au titulaire ${compte.id}`)) === 1,
      journalApp.filter((l) => l.includes(compte.id)).join(" | "));
    let p = await profil(compte.id);
    verifier("J-3 : accès Pro intact", p.plan === "pro", JSON.stringify(p));

    await avancer(h, 3 * JOUR + 3600);
    const fin = await attendre((e) => e.type === "customer.subscription.deleted" && e.data.object.id === sub.id);
    verifier("fin d'essai : Stripe résilie l'abonnement", Boolean(fin.trouve));
    const factures = (await stripe.invoices.list({ customer: client.id })).data;
    verifier("aucune facture impayée laissée chez Stripe", factures.every((f) => f.status !== "open"), factures.map((f) => `${f.status}:${f.amount_due}`).join(","));
    p = await profil(compte.id);
    verifier("accès coupé (plan free)", p.plan === "free", JSON.stringify(p));
    verifier("profil marqué « essai terminé »", p.subscription_status === "essai_termine", JSON.stringify(p));
    verifier("abonnement mort oublié", p.stripe_subscription_id === null, JSON.stringify(p));
    const motifCourriel = new RegExp(`fin d'essai : courriel envoyé au titulaire ${compte.id}`);
    verifier("courriel de fin d'essai envoyé par Resend", lignes(motifCourriel) === 1, journalApp.filter((l) => l.includes(compte.id)).join(" | "));

    // Le même fait raconté une seconde fois (rejeu sous un autre identifiant).
    const rejeu = { ...fin.trouve, id: `${fin.trouve.id}_rejeu` };
    const st = await livrer(rejeu);
    await pause(1000);
    verifier("un second récit du même fait ne renvoie pas de courriel", st === 200 && lignes(motifCourriel) === 1, `HTTP ${st}, ${lignes(motifCourriel)} envoi(s)`);

    const tdb = await appel(compte, "/dashboard");
    verifier("à la connexion : écran « Ton essai est terminé »", tdb.texte.includes('data-ecran="essai-termine"') && tdb.texte.includes("Ton essai est terminé"), `HTTP ${tdb.status}`);
    verifier("l'écran porte le bouton d'ajout de carte", tdb.texte.includes("Ajouter une carte"));
    const fac = await appel(compte, "/invoices");
    verifier("autres pages : bandeau « Ton essai est terminé »", fac.texte.includes('data-bandeau="essai-termine"'), `HTTP ${fac.status}`);
    const bil = await appel(compte, "/billing");
    verifier("page Abonnement : pas de bandeau en double", bil.status === 200 && !bil.texte.includes('data-bandeau="essai-termine"'), `HTTP ${bil.status}`);

    // Contre-cas : le titulaire résilie LUI-MÊME pendant l'essai (ce que fait
    // le portail, « à la fin de la période »). Ce n'est pas une fin d'essai
    // subie : ni marque, ni courriel.
    const volontaire = await creerCompte("essai-resilie");
    const hv = await nouvelleHorloge("essai-resilie");
    const cv = await clientStripe(volontaire, hv, false);
    const subv = await abonnementCommeCheckout(cv, P.STRIPE_SOLO_PRICE_ID, "solo", "monthly");
    await majProfil(volontaire.id, { stripe_subscription_id: subv.id, plan: "solo", subscription_status: "trialing" });
    await avancer(hv, 2 * JOUR);
    await stripe.subscriptions.update(subv.id, { cancel_at_period_end: true });
    await avancer(hv, 13 * JOUR);
    const finv = await attendre((e) => e.type === "customer.subscription.deleted" && e.data.object.id === subv.id);
    const pv = await profil(volontaire.id);
    verifier("résiliation voulue pendant l'essai : résiliée, pas « essai terminé »",
      Boolean(finv.trouve) && pv.plan === "free" && pv.subscription_status === "canceled", JSON.stringify(pv));
    verifier("résiliation voulue : aucun courriel de fin d'essai",
      lignes(new RegExp(`fin d'essai : courriel envoyé au titulaire ${volontaire.id}`)) === 0);

    const rep = await appel(compte, "/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro", billing: "annual" }) });
    verifier("« Ajouter une carte » ouvre une page de paiement Stripe", typeof rep.body?.url === "string", rep.texte.slice(0, 160));
    const idSession = rep.body?.url?.match(/(cs_test_[A-Za-z0-9]+)/)?.[1];
    const session = idSession ? await stripe.checkout.sessions.retrieve(idSession, { expand: ["line_items"] }) : null;
    verifier("carte exigée tout de suite (pas de second essai)", session?.payment_method_collection === "always", session?.payment_method_collection);
    verifier("pour la formule choisie (Pro annuel)", session?.line_items?.data[0]?.price?.id === P.STRIPE_PRO_ANNUAL_PRICE_ID);
    verifier("pour ce client", session?.customer === client.id);
  }

  // ── 5. Ancien réglage Stripe (facture à la fin d'essai) ──────────────
  if (joue("ancien")) {
    console.log("");
    console.log("── Fin d'essai sans carte, réglage d'avant le 20/11 ──────");
    const compte = await creerCompte("ancien");
    const h = await nouvelleHorloge("ancien");
    const client = await clientStripe(compte, h, false);
    const sub = await abonnementCommeCheckout(client, P.STRIPE_SOLO_PRICE_ID, "solo", "monthly", { finEssai: "create_invoice" });
    await majProfil(compte.id, { stripe_subscription_id: sub.id, plan: "solo", subscription_status: "trialing" });
    await avancer(h, 14 * JOUR + 3600);
    const { trouve } = await attendre((e) => e.type === "customer.subscription.updated" && e.data.object.id === sub.id
      && e.data.object.status === "past_due");
    verifier("Stripe passe l'abonnement en impayé", Boolean(trouve), "past_due jamais vu");
    await pause(2000);
    await synchroniser();
    const p = await profil(compte.id);
    verifier("reconnu comme fin d'essai : accès coupé et marqué", p.plan === "free" && p.subscription_status === "essai_termine", JSON.stringify(p));
    verifier("courriel de fin d'essai envoyé une fois", lignes(new RegExp(`fin d'essai : courriel envoyé au titulaire ${compte.id}`)) === 1);

    // Contre-cas : une carte enregistrée mais REFUSÉE donne la même séquence
    // Stripe. Ce n'est pas « aucune carte » : impayé ordinaire, pas de courriel.
    const refuse = await creerCompte("carte-refusee");
    const hr = await nouvelleHorloge("carte-refusee");
    const cr = await stripe.customers.create({ email: refuse.email, test_clock: hr.id, metadata: { banc: RUN } });
    clientsSuivis.add(cr.id);
    const pmr = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: cr.id });
    await stripe.customers.update(cr.id, { invoice_settings: { default_payment_method: pmr.id } });
    await majProfil(refuse.id, { stripe_customer_id: cr.id });
    const subr = await abonnementCommeCheckout(cr, P.STRIPE_SOLO_PRICE_ID, "solo", "monthly", { finEssai: "create_invoice" });
    await majProfil(refuse.id, { stripe_subscription_id: subr.id, plan: "solo", subscription_status: "trialing" });
    await avancer(hr, 14 * JOUR + 3600);
    const vr = await attendre((e) => e.type === "customer.subscription.updated" && e.data.object.id === subr.id
      && e.data.object.status === "past_due");
    await pause(2000);
    await synchroniser();
    const pr = await profil(refuse.id);
    verifier("carte refusée : impayé ordinaire, pas « essai terminé »",
      Boolean(vr.trouve) && pr.plan === "free" && pr.subscription_status === "past_due", JSON.stringify(pr));
    verifier("carte refusée : aucun courriel « aucune carte »",
      lignes(new RegExp(`fin d'essai : courriel envoyé au titulaire ${refuse.id}`)) === 0);
  }
} catch (err) {
  verifier("le banc va au bout sans exception", false, err?.stack ?? String(err));
} finally {
  console.log("");
  console.log("── Nettoyage ───────────────────────────────────────────────");
  for (const id of horloges) await stripe.testHelpers.testClocks.del(id).catch(() => {});
  for (const id of comptes) {
    await admin(`/rest/v1/team_members?owner_id=eq.${id}`, { method: "DELETE" }).catch(() => {});
    await admin(`/auth/v1/admin/users/${id}`, { method: "DELETE" }).catch(() => {});
  }
  console.log(`   ${horloges.length} horloge(s) et ${comptes.length} compte(s) supprimés`);
  if (process.env.HORLOGES_JOURNAL) {
    console.log(journalApp.filter((l) => /webhook|Error|error/.test(l)).slice(-40).join("\n"));
  }
  arreterApp();
}

process.exit(bilan());
