/**
 * Le webhook Stripe, traversé avec de vrais événements signés.
 *
 * C'est le maillon dont tout dépend et que personne ne voit : si un événement
 * est perdu, le client a payé et son plan reste « free », sans que rien ne le
 * signale. Le fichier porte d'ailleurs le récit de deux défauts déjà corrigés —
 * la marque d'idempotence posée AVANT le traitement, qui enterrait
 * définitivement un événement au premier incident réseau, et les erreurs
 * renvoyées en 200, qui disaient à Stripe de ne jamais réessayer.
 *
 * Rien de tout cela ne se vérifie en lisant le code : il faut envoyer
 * l'événement, avec une signature que la route accepte, et regarder la base.
 * C'est ce que fait ce script, contre l'application locale branchée sur le
 * faux Stripe (voir scripts/e2e/abonnement.mjs pour le montage).
 *
 * Usage : node scripts/e2e/webhook.mjs
 */

import { createHmac } from "node:crypto";
import { verifier, bilan, secret } from "./lib.mjs";

const FAUX = process.env.FAUX_STRIPE ?? "http://127.0.0.1:12111";
const APP = process.env.APP_LOCALE ?? "http://127.0.0.1:3100";
const PROJECT_REF = "mjhsafxzbufpughtxhnw";

const SECRET_WH = secret("STRIPE_WEBHOOK_SECRET");
const SERVICE = secret("SUPABASE_SERVICE_ROLE_KEY");
const SOLO_M = secret("STRIPE_SOLO_PRICE_ID");
const PRO_M = secret("STRIPE_PRO_PRICE_ID");
const SIEGE = secret("STRIPE_SEAT_PRICE_ID");
const SB = `https://${PROJECT_REF}.supabase.co`;

const admin = (chemin, init = {}) =>
  fetch(`${SB}${chemin}`, {
    ...init,
    headers: {
      apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json", Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

/** La signature que Stripe pose, et que constructEvent vérifie. */
function signer(charge, secretWh, horodatage = Math.floor(Date.now() / 1000)) {
  const signature = createHmac("sha256", secretWh.replace(/^whsec_/, "").length === secretWh.length
    ? secretWh
    : secretWh)
    .update(`${horodatage}.${charge}`)
    .digest("hex");
  return `t=${horodatage},v1=${signature}`;
}

async function envoyer(evenement, { signatureValide = true } = {}) {
  const charge = JSON.stringify(evenement);
  const entete = signatureValide ? signer(charge, SECRET_WH) : "t=1,v1=deadbeef";
  const r = await fetch(`${APP}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "stripe-signature": entete, "content-type": "application/json" },
    body: charge,
  });
  let corps;
  try { corps = await r.json(); } catch { corps = null; }
  return { status: r.status, corps };
}

const profil = async (uid) =>
  (await admin(`/rest/v1/profiles?id=eq.${uid}&select=plan,subscription_status,stripe_subscription_id`).then((r) => r.json()))?.[0];

const EMAIL = `banc-webhook-${Date.now()}@getdeviso.fr`;
const MDP = `Bc!${Math.random().toString(36).slice(2)}A9`;
const CUS = `cus_wh_${Date.now()}`;
const SUB = `sub_wh_${Date.now()}`;

console.log("");
console.log("── Webhook Stripe : de l'événement signé jusqu'à la base ─────");
console.log("");

const creation = await admin("/auth/v1/admin/users", {
  method: "POST", body: JSON.stringify({ email: EMAIL, password: MDP, email_confirm: true }),
});
const u = await creation.json();
const UID = u.id;
verifier("un compte d'essai est créé", Boolean(UID), `HTTP ${creation.status}`);
if (!UID) process.exit(bilan());

try {
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "free", subscription_status: "inactive", stripe_customer_id: CUS, is_demo: false }),
  });

  // L'abonnement que le webhook ira relire chez « Stripe ».
  await fetch(`${FAUX}/_etat`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      clients: [{ id: CUS, object: "customer", email: EMAIL }],
      abonnements: [{
        id: SUB, customer: CUS, status: "trialing",
        // L'article SIÈGE est placé EN PREMIER : c'est exactement le cas qui
        // faisait renvoyer null à planFromPriceId et abandonner l'événement.
        items: [{ id: "si_s", price: SIEGE, quantity: 1 }, { id: "si_p", price: PRO_M, quantity: 1 }],
      }],
    }),
  });

  // ── 1. Signature ────────────────────────────────────────────────────
  const fausse = await envoyer({ id: "evt_faux", type: "checkout.session.completed", data: { object: {} } },
    { signatureValide: false });
  verifier("un événement mal signé est refusé", fausse.status === 400, `HTTP ${fausse.status}`);

  // ── 2. checkout.session.completed ───────────────────────────────────
  const evtId = `evt_chk_${Date.now()}`;
  const souscription = await envoyer({
    id: evtId, type: "checkout.session.completed",
    data: { object: { object: "checkout.session", mode: "subscription",
      customer: CUS, subscription: SUB, metadata: { target_plan: "pro", billing: "monthly" } } },
  });
  verifier("la souscription est acceptée", souscription.status === 200, `HTTP ${souscription.status}`);
  let p = await profil(UID);
  verifier("le plan payé est posé en base", p?.plan === "pro", `plan = ${p?.plan}`);
  verifier("l'essai est reflété tel quel", p?.subscription_status === "trialing", `statut = ${p?.subscription_status}`);
  verifier("l'abonnement est rattaché au profil", p?.stripe_subscription_id === SUB, `${p?.stripe_subscription_id}`);

  // ── 3. Idempotence ──────────────────────────────────────────────────
  const rejeu = await envoyer({
    id: evtId, type: "checkout.session.completed",
    data: { object: { object: "checkout.session", mode: "subscription",
      customer: CUS, subscription: SUB, metadata: { target_plan: "solo", billing: "monthly" } } },
  });
  verifier("le même événement rejoué est reconnu comme doublon",
    rejeu.status === 200 && rejeu.corps?.duplicate === true, JSON.stringify(rejeu.corps));
  p = await profil(UID);
  verifier("et il ne change rien au plan", p?.plan === "pro", `plan = ${p?.plan}`);

  // ── 4. L'article siège en premier ───────────────────────────────────
  const avecSiegeDevant = await envoyer({
    id: `evt_upd_${Date.now()}`, type: "customer.subscription.updated",
    data: { object: { id: SUB, object: "subscription", customer: CUS, status: "active",
      items: { object: "list", data: [
        { id: "si_s", price: { id: SIEGE } },
        { id: "si_p", price: { id: PRO_M } },
      ] } } },
  });
  verifier("un abonnement dont le SIÈGE est le premier article est traité",
    avecSiegeDevant.status === 200, `HTTP ${avecSiegeDevant.status}`);
  p = await profil(UID);
  verifier("et son plan est lu correctement malgré l'ordre",
    p?.plan === "pro" && p?.subscription_status === "active",
    `plan = ${p?.plan}, statut = ${p?.subscription_status}`);

  // ── 5. Impayé ───────────────────────────────────────────────────────
  await envoyer({
    id: `evt_pastdue_${Date.now()}`, type: "customer.subscription.updated",
    data: { object: { id: SUB, object: "subscription", customer: CUS, status: "past_due",
      items: { object: "list", data: [{ id: "si_p", price: { id: PRO_M } }] } } },
  });
  p = await profil(UID);
  verifier("un impayé retire l'accès au plan payant",
    p?.plan === "free" && p?.subscription_status === "past_due",
    `plan = ${p?.plan}, statut = ${p?.subscription_status}`);

  // ── 6. Reprise ──────────────────────────────────────────────────────
  await envoyer({
    id: `evt_reprise_${Date.now()}`, type: "customer.subscription.updated",
    data: { object: { id: SUB, object: "subscription", customer: CUS, status: "active",
      items: { object: "list", data: [{ id: "si_p", price: { id: SOLO_M } }] } } },
  });
  p = await profil(UID);
  verifier("le paiement repris rend l'accès, au bon plan",
    p?.plan === "solo" && p?.subscription_status === "active",
    `plan = ${p?.plan}, statut = ${p?.subscription_status}`);

  // ── 7. Résiliation ──────────────────────────────────────────────────
  await envoyer({
    id: `evt_del_${Date.now()}`, type: "customer.subscription.deleted",
    data: { object: { id: SUB, object: "subscription", customer: CUS, status: "canceled",
      items: { object: "list", data: [{ id: "si_p", price: { id: SOLO_M } }] } } },
  });
  p = await profil(UID);
  verifier("la résiliation ramène au plan gratuit",
    p?.plan === "free" && p?.subscription_status === "canceled", `plan = ${p?.plan}`);
  verifier("et détache l'abonnement du profil",
    p?.stripe_subscription_id === null, `${p?.stripe_subscription_id}`);

  // ── 8. Prix inconnu ─────────────────────────────────────────────────
  await admin(`/rest/v1/profiles?id=eq.${UID}`, { method: "PATCH", body: JSON.stringify({ plan: "pro" }) });
  const inconnu = await envoyer({
    id: `evt_inconnu_${Date.now()}`, type: "customer.subscription.updated",
    data: { object: { id: SUB, object: "subscription", customer: CUS, status: "canceled",
      items: { object: "list", data: [{ id: "si_x", price: { id: "price_dun_ancien_catalogue" } }] } } },
  });
  p = await profil(UID);
  verifier("un abonnement sur un prix hors grille n'est pas traité en silence",
    inconnu.status === 200 && p?.plan === "pro",
    `l'événement est acquitté et journalisé, mais AUCUN plan n'est modifié — ` +
    `plan resté à ${p?.plan}. C'est la raison pour laquelle les anciens prix ` +
    `doivent être archivés dans Stripe (voir test:stripe-prix).`);

  // ── 9. Événement ignoré ─────────────────────────────────────────────
  const ignore = await envoyer({
    id: `evt_autre_${Date.now()}`, type: "invoice.payment_succeeded",
    data: { object: { id: "in_x", object: "invoice" } },
  });
  verifier("un événement non géré est acquitté sans rien casser",
    ignore.status === 200, `HTTP ${ignore.status}`);
} finally {
  await admin(`/auth/v1/admin/users/${UID}`, { method: "DELETE" }).catch(() => {});
  console.log("");
  console.log("   compte d'essai supprimé.");
}

console.log("");
console.log("── Non couvert ───────────────────────────────────────────────");
console.log("  · la remise réelle par Stripe (réessais, ordre, délais).");
console.log("  · invoice.payment_failed : Stripe ne l'envoie pas à cet endpoint,");
console.log("    l'accès est coupé par customer.subscription.updated (past_due).");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
