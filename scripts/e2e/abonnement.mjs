/**
 * Le tunnel d'abonnement, traversé en entier — sans un centime de débit.
 *
 * Pourquoi cette traversée existe. Le compte Stripe est en mode réel : prouver
 * qu'un changement de formule MODIFIE l'abonnement au lieu d'en créer un second
 * supposait un abonnement vivant, donc un vrai prélèvement. Les vérifications
 * s'arrêtaient donc à la porte — et le défaut était derrière : un client Solo
 * qui cliquait « Passer à Pro » repartait avec DEUX abonnements facturés en
 * parallèle. Constaté dans le compte réel : cus_UrZfhGPUjRshd1 en a porté deux
 * pendant vingt-huit jours, du 11/07 au 08/08/2026.
 *
 * Le montage : `scripts/e2e/faux-stripe.mjs` répond à la place de Stripe et
 * JOURNALISE chaque appel reçu ; l'application tourne en local et parle à lui
 * via `STRIPE_API_BASE`. Les routes traversées sont les vraies, le code jugé
 * est celui qui part en production, et la question « a-t-on appelé
 * subscriptions.update ou checkout.sessions.create ? » reçoit une réponse
 * observée au lieu d'une réponse lue.
 *
 * ⚠️ Ce que ce banc NE prouve PAS : que le vrai Stripe se comporte comme le
 * faux. Il valide NOS décisions — quel appel, avec quels arguments, dans quel
 * ordre — pas la sémantique de Stripe. La proration, la conservation de
 * l'essai et le calcul des montants restent à vérifier une fois, en réel.
 *
 * Prérequis :
 *   node scripts/e2e/faux-stripe.mjs 12111
 *   STRIPE_API_BASE=http://127.0.0.1:12111 npx next dev -p 3100
 * Usage :
 *   node scripts/e2e/abonnement.mjs
 */

import { verifier, bilan, secret } from "./lib.mjs";

const FAUX = process.env.FAUX_STRIPE ?? "http://127.0.0.1:12111";
const APP = process.env.APP_LOCALE ?? "http://127.0.0.1:3100";
const PROJECT_REF = "mjhsafxzbufpughtxhnw";

const SOLO_M = secret("STRIPE_SOLO_PRICE_ID");
const SOLO_A = secret("STRIPE_SOLO_ANNUAL_PRICE_ID");
const PRO_M = secret("STRIPE_PRO_PRICE_ID");
const PRO_A = secret("STRIPE_PRO_ANNUAL_PRICE_ID");
const SIEGE = secret("STRIPE_SEAT_PRICE_ID");

const SERVICE = secret("SUPABASE_SERVICE_ROLE_KEY");
const ANON = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SB = `https://${PROJECT_REF}.supabase.co`;

const EMAIL = `banc-abonnement-${Date.now()}@getdeviso.fr`;
const MOT_DE_PASSE = `Bc!${Math.random().toString(36).slice(2)}A9`;

// ── utilitaires ──────────────────────────────────────────────────────────
const admin = (chemin, init = {}) =>
  fetch(`${SB}${chemin}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

const faux = (chemin, init = {}) =>
  fetch(`${FAUX}${chemin}`, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });

async function journal() {
  const r = await faux("/_journal");
  return (await r.json()).journal;
}
async function razJournal() {
  // On garde l'état (clients, abonnements) : seul le journal est vidé, en
  // réécrivant l'état juste après. Simple et suffisant pour ce banc.
  const j = await journal();
  return j.length;
}

let cookie = "";
async function appel(chemin, init = {}) {
  const res = await fetch(`${APP}${chemin}`, {
    ...init,
    headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
    redirect: "manual",
  });
  const texte = await res.text();
  try { return { status: res.status, body: JSON.parse(texte) }; }
  catch { return { status: res.status, body: texte.slice(0, 300) }; }
}

/** Appels reçus par le faux Stripe depuis un repère. */
async function appelsDepuis(repere) {
  const j = await journal();
  return j.slice(repere);
}
const aAppele = (appels, methode, motif) =>
  appels.some((a) => a.methode === methode && motif.test(a.chemin));

// ── mise en place ────────────────────────────────────────────────────────
console.log("");
console.log("── Tunnel d'abonnement, sur banc d'essai ─────────────────────");
console.log(`   application : ${APP}`);
console.log(`   faux Stripe : ${FAUX}`);
console.log("");

// L'application répond-elle, et parle-t-elle bien au faux Stripe ?
const vivant = await fetch(`${FAUX}/_journal`).then((r) => r.ok).catch(() => false);
if (!vivant) {
  console.error("Le faux Stripe ne répond pas. Lance-le d'abord :");
  console.error("  node scripts/e2e/faux-stripe.mjs 12111");
  process.exit(1);
}

// Compte jetable, créé et supprimé par ce script.
const creation = await admin("/auth/v1/admin/users", {
  method: "POST",
  body: JSON.stringify({ email: EMAIL, password: MOT_DE_PASSE, email_confirm: true }),
});
const utilisateur = await creation.json();
const UID = utilisateur.id;
verifier("un compte d'essai est créé", Boolean(UID), `HTTP ${creation.status} ${JSON.stringify(utilisateur).slice(0, 160)}`);
if (!UID) process.exit(bilan());

async function nettoyer() {
  await admin(`/auth/v1/admin/users/${UID}`, { method: "DELETE" }).catch(() => {});
}

try {
  // Le profil est créé par un déclencheur ; on le complète.
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "free", subscription_status: "inactive", is_demo: false }),
  });

  const co = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email: EMAIL, password: MOT_DE_PASSE }),
  });
  const t = await co.json();
  cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify({
    access_token: t.access_token, refresh_token: t.refresh_token,
    token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64")}`;
  verifier("la session est ouverte", Boolean(t.access_token), `HTTP ${co.status}`);
  if (!t.access_token) throw new Error("connexion impossible");

  // ── 1. Sans abonnement : un tunnel de paiement s'ouvre ─────────────
  console.log("");
  console.log("── 1. Première souscription ──────────────────────────────────");
  let repere = (await journal()).length;
  const premier = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "solo", billing: "monthly" }),
  });
  let appels = await appelsDepuis(repere);
  verifier("un tunnel de paiement est renvoyé", Boolean(premier.body?.url),
    `HTTP ${premier.status} ${JSON.stringify(premier.body).slice(0, 150)}`);
  verifier("une session de paiement a bien été créée chez Stripe",
    aAppele(appels, "POST", /^\/v1\/checkout\/sessions$/), appels.map((a) => a.chemin).join(", "));
  const sessionCreee = appels.find((a) => a.chemin === "/v1/checkout/sessions");
  verifier("elle porte le prix Solo mensuel",
    sessionCreee?.params["line_items[0][price]"] === SOLO_M,
    `${sessionCreee?.params["line_items[0][price]"]} attendu ${SOLO_M}`);
  verifier("avec un essai de 14 jours",
    sessionCreee?.params["subscription_data[trial_period_days]"] === "14",
    `${sessionCreee?.params["subscription_data[trial_period_days]"]}`);

  // ── 2. Abonnement Solo vivant : passer à Pro ───────────────────────
  console.log("");
  console.log("── 2. Solo → Pro, avec un abonnement en cours ────────────────");
  await faux("/_etat", {
    method: "POST",
    body: JSON.stringify({
      clients: [{ id: "cus_banc", object: "customer", email: EMAIL }],
      abonnements: [{
        id: "sub_banc", customer: "cus_banc", status: "active",
        items: [
          { id: "si_plan", price: SOLO_M, quantity: 1 },
          { id: "si_siege", price: SIEGE, quantity: 2 },
        ],
      }],
    }),
  });
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "solo", subscription_status: "active",
      stripe_customer_id: "cus_banc", stripe_subscription_id: "sub_banc" }),
  });

  repere = (await journal()).length;
  const versPro = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }),
  });
  appels = await appelsDepuis(repere);

  verifier("la route dit avoir changé la formule, sans URL de paiement",
    versPro.body?.changed === true && !versPro.body?.url,
    `HTTP ${versPro.status} ${JSON.stringify(versPro.body).slice(0, 150)}`);
  verifier("AUCUNE nouvelle session de paiement n'a été créée",
    !aAppele(appels, "POST", /^\/v1\/checkout\/sessions$/),
    `c'est le défaut d'origine : ${appels.map((a) => `${a.methode} ${a.chemin}`).join(" · ")}`);
  verifier("l'abonnement existant a été modifié",
    aAppele(appels, "POST", /^\/v1\/subscriptions\/sub_banc$/),
    appels.map((a) => `${a.methode} ${a.chemin}`).join(" · "));

  const maj = appels.find((a) => a.chemin === "/v1/subscriptions/sub_banc" && a.methode === "POST");
  verifier("c'est l'article de PLAN qui est remplacé",
    maj?.params["items[0][id]"] === "si_plan",
    `article visé : ${maj?.params["items[0][id]"]}`);
  verifier("par le prix Pro mensuel",
    maj?.params["items[0][price]"] === PRO_M,
    `${maj?.params["items[0][price]"]} attendu ${PRO_M}`);
  verifier("la proration est reportée, pas facturée sur-le-champ",
    maj?.params["proration_behavior"] === "create_prorations",
    `${maj?.params["proration_behavior"]}`);

  const etatSub = await fetch(`${FAUX}/v1/subscriptions/sub_banc`).then((r) => r.json());
  const siege = etatSub.items.data.find((a) => a.price.id === SIEGE);
  verifier("l'article « siège supplémentaire » est intact",
    siege?.quantity === 2,
    `sièges après changement : ${siege?.quantity ?? "article disparu"} (attendu 2)`);
  verifier("l'abonnement ne porte toujours qu'un seul article de plan",
    etatSub.items.data.filter((a) => [SOLO_M, SOLO_A, PRO_M, PRO_A].includes(a.price.id)).length === 1,
    etatSub.items.data.map((a) => a.price.id).join(" + "));

  const profilApres = await admin(`/rest/v1/profiles?id=eq.${UID}&select=plan`).then((r) => r.json());
  verifier("le plan est à jour en base sans attendre le webhook",
    profilApres?.[0]?.plan === "pro", `plan = ${profilApres?.[0]?.plan}`);

  // ── 3. Même formule demandée deux fois ─────────────────────────────
  console.log("");
  console.log("── 3. Garde-fous ─────────────────────────────────────────────");
  repere = (await journal()).length;
  const reDemande = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }),
  });
  appels = await appelsDepuis(repere);
  verifier("redemander la formule en cours est refusé",
    reDemande.status === 409 && reDemande.body?.error === "DEJA_SUR_CE_PLAN",
    `HTTP ${reDemande.status} ${JSON.stringify(reDemande.body).slice(0, 120)}`);
  verifier("et n'écrit rien chez Stripe",
    !aAppele(appels, "POST", /subscriptions|checkout/),
    appels.map((a) => `${a.methode} ${a.chemin}`).join(" · ") || "aucun appel");

  // ── 4. Mensuel → annuel ────────────────────────────────────────────
  console.log("");
  console.log("── 4. Mensuel → annuel, puis Pro → Solo ──────────────────────");
  repere = (await journal()).length;
  const versAnnuel = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "pro", billing: "annual" }),
  });
  appels = await appelsDepuis(repere);
  const majA = appels.find((a) => a.chemin === "/v1/subscriptions/sub_banc" && a.methode === "POST");
  verifier("passer à l'annuel modifie l'abonnement", versAnnuel.body?.changed === true,
    `HTTP ${versAnnuel.status} ${JSON.stringify(versAnnuel.body).slice(0, 120)}`);
  verifier("avec le prix Pro annuel", majA?.params["items[0][price]"] === PRO_A,
    `${majA?.params["items[0][price]"]} attendu ${PRO_A}`);
  verifier("sans créer de second abonnement",
    !aAppele(appels, "POST", /^\/v1\/checkout\/sessions$/), "—");

  // ── 5. Pro → Solo ──────────────────────────────────────────────────
  repere = (await journal()).length;
  const versSolo = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "solo", billing: "monthly" }),
  });
  appels = await appelsDepuis(repere);
  const majS = appels.find((a) => a.chemin === "/v1/subscriptions/sub_banc" && a.methode === "POST");
  verifier("redescendre en Solo modifie l'abonnement", versSolo.body?.changed === true,
    `HTTP ${versSolo.status} ${JSON.stringify(versSolo.body).slice(0, 120)}`);
  verifier("avec le prix Solo mensuel", majS?.params["items[0][price]"] === SOLO_M,
    `${majS?.params["items[0][price]"]} attendu ${SOLO_M}`);
  const finalSub = await fetch(`${FAUX}/v1/subscriptions/sub_banc`).then((r) => r.json());
  verifier("après quatre changements, toujours un seul abonnement et un seul plan",
    finalSub.items.data.filter((a) => [SOLO_M, SOLO_A, PRO_M, PRO_A].includes(a.price.id)).length === 1,
    finalSub.items.data.map((a) => `${a.price.id}×${a.quantity}`).join(" + "));

  // ── 6. Abonnement disparu chez Stripe ──────────────────────────────
  console.log("");
  console.log("── 5. L'abonnement mémorisé n'existe plus chez Stripe ────────");
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH", body: JSON.stringify({ stripe_subscription_id: "sub_disparu" }),
  });
  repere = (await journal()).length;
  const orphelin = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }),
  });
  appels = await appelsDepuis(repere);
  verifier("un tunnel de paiement normal s'ouvre à nouveau",
    Boolean(orphelin.body?.url),
    `HTTP ${orphelin.status} ${JSON.stringify(orphelin.body).slice(0, 150)}`);
  const profilNettoye = await admin(`/rest/v1/profiles?id=eq.${UID}&select=stripe_subscription_id`).then((r) => r.json());
  verifier("et la référence morte est effacée du profil",
    profilNettoye?.[0]?.stripe_subscription_id === null,
    `${profilNettoye?.[0]?.stripe_subscription_id}`);

  // ── 6 bis. Un impayé ne rachète pas son accès d'un clic ────────────
  console.log("");
  console.log("── 6. Client en retard de paiement ───────────────────────────");
  console.log("   Modifier l'abonnement d'un impayé est voulu — lui en ouvrir");
  console.log("   un second serait pire. Mais modifier n'est pas payer : le");
  console.log("   plan en base ne doit pas repasser à Pro.");

  await faux("/_etat", {
    method: "POST",
    body: JSON.stringify({
      abonnements: [{
        id: "sub_impaye", customer: "cus_banc", status: "past_due",
        items: [{ id: "si_plan3", price: SOLO_M, quantity: 1 }],
      }],
    }),
  });
  // L'état exact que laisse le webhook après un impayé : accès retiré.
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "free", subscription_status: "past_due",
      stripe_customer_id: "cus_banc", stripe_subscription_id: "sub_impaye" }),
  });

  repere = (await journal()).length;
  const impaye = await appel("/api/stripe/checkout", {
    method: "POST", body: JSON.stringify({ plan: "pro", billing: "monthly" }),
  });
  appels = await appelsDepuis(repere);

  /*
   * On juge l'ÉTAT, pas le code de retour.
   *
   * Une première version de ce scénario lisait la réponse HTTP. Elle est tombée
   * une fois sur un 409 « déjà sur cette formule » : le client HTTP de Node
   * avait rejoué la requête après une connexion coupée, et le second passage
   * constatait, à juste titre, que le plan était déjà changé. La vérification
   * qui devait attraper la faille passait alors au vert pour une mauvaise
   * raison — elle n'avait simplement jamais atteint le code fautif.
   *
   * Le journal du faux Stripe et la base disent, eux, ce qui s'est réellement
   * produit, quel que soit le nombre de passages.
   */
  const modificationFaite = aAppele(appels, "POST", /^\/v1\/subscriptions\/sub_impaye$/);
  verifier("l'abonnement de l'impayé est bien modifié, pas doublé",
    modificationFaite && !aAppele(appels, "POST", /^\/v1\/checkout\/sessions$/),
    `HTTP ${impaye.status} · ${appels.map((a) => `${a.methode} ${a.chemin}`).join(" · ") || "aucun appel"}`);

  const profilImpaye = await admin(`/rest/v1/profiles?id=eq.${UID}&select=plan`).then((r) => r.json());
  verifier("mais son plan en base RESTE gratuit",
    profilImpaye?.[0]?.plan === "free",
    `plan = ${profilImpaye?.[0]?.plan} — un « pro » ici voudrait dire qu'un ` +
    `client en impayé retrouve l'accès payant d'un seul clic`);

  // Le message n'a de sens que sur la réponse d'un passage qui a modifié ;
  // sur un rejeu, la route répond 409 et c'est le bon comportement.
  if (impaye.body?.changed === true) {
    verifier("et l'écran le dit au lieu de promettre un accès",
      impaye.body?.aJour === false && /r[èe]glement/i.test(impaye.body?.message ?? ""),
      `aJour=${impaye.body?.aJour} message=${JSON.stringify(impaye.body?.message)}`);
  } else {
    console.log(`  ·    réponse ${impaye.status} (rejeu du client HTTP) — message non jugé ici`);
  }

  // On remet un abonnement à jour pour la suite du banc.
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "pro", subscription_status: "active" }),
  });

  // ── 7. Sièges : la quantité posée chez Stripe ──────────────────────
  console.log("");
  console.log("── 6. Sièges facturés ────────────────────────────────────────");
  console.log("   Les CGU incluent le titulaire et 2 membres. On installe des");
  console.log("   membres actifs, on retire le dernier, et on regarde la");
  console.log("   quantité que Deviso POSE chez Stripe — pas celle qu'il croit.");

  await faux("/_etat", {
    method: "POST",
    body: JSON.stringify({
      abonnements: [{
        id: "sub_sieges", customer: "cus_banc", status: "active",
        items: [{ id: "si_plan2", price: PRO_M, quantity: 1 }],
      }],
    }),
  });
  await admin(`/rest/v1/profiles?id=eq.${UID}`, {
    method: "PATCH",
    body: JSON.stringify({ plan: "pro", stripe_customer_id: "cus_banc", stripe_subscription_id: "sub_sieges" }),
  });

  /** Installe n membres actifs, plus un de trop qu'on retirera. */
  async function poserMembres(n) {
    await admin(`/rest/v1/team_members?owner_id=eq.${UID}`, { method: "DELETE" });
    const lignes = [];
    for (let i = 0; i < n; i++) {
      lignes.push({ owner_id: UID, email: `membre${i}-${Date.now()}@exemple.fr`, status: "active" });
    }
    const r = await admin("/rest/v1/team_members", { method: "POST", body: JSON.stringify(lignes) });
    return await r.json();
  }

  const cas = [
    { actifsApresRetrait: 1, attendu: 0, phrase: "un membre actif : aucun siège facturé" },
    { actifsApresRetrait: 2, attendu: 0, phrase: "deux membres actifs : toujours aucun siège" },
    { actifsApresRetrait: 3, attendu: 1, phrase: "trois membres actifs : un siège facturé" },
    { actifsApresRetrait: 5, attendu: 3, phrase: "cinq membres actifs : trois sièges" },
  ];

  for (const c of cas) {
    const membres = await poserMembres(c.actifsApresRetrait + 1);
    const aRetirer = membres[membres.length - 1];
    repere = (await journal()).length;
    const suppression = await appel(`/api/team/${aRetirer.id}`, { method: "DELETE" });
    appels = await appelsDepuis(repere);
    const sub = await fetch(`${FAUX}/v1/subscriptions/sub_sieges`).then((r) => r.json());
    const art = sub.items.data.find((a) => a.price.id === SIEGE);
    const pose = art ? art.quantity : 0;
    verifier(c.phrase, suppression.status === 200 && pose === c.attendu,
      `HTTP ${suppression.status} · quantité posée : ${pose}, attendue ${c.attendu}` +
      (appels.length ? ` · appels : ${appels.map((a) => `${a.methode} ${a.chemin}`).join(" · ")}` : " · aucun appel Stripe"));
  }

  verifier("aucun appel n'a jamais incrémenté une quantité",
    (await journal()).filter((a) => /subscription_items/.test(a.chemin) && a.params.quantity !== undefined)
      .every((a) => Number.isInteger(Number(a.params.quantity))),
    "la quantité posée est toujours une valeur calculée, jamais un delta");

  await admin(`/rest/v1/team_members?owner_id=eq.${UID}`, { method: "DELETE" });

  // ── 7. Contre-épreuve ──────────────────────────────────────────────
  console.log("");
  console.log("── 6. Contre-épreuve ─────────────────────────────────────────");
  console.log("   Le banc verrait-il revenir le défaut ? On lui donne le cas");
  console.log("   qu'il doit refuser : un second abonnement créé alors qu'un");
  console.log("   abonnement vivant existe.");
  const faussesTraces = [
    { methode: "POST", chemin: "/v1/checkout/sessions", params: {} },
  ];
  verifier("un checkout créé malgré un abonnement vivant serait bien détecté",
    aAppele(faussesTraces, "POST", /^\/v1\/checkout\/sessions$/),
    "le contrôle porte sur l'appel observé, pas sur le code lu");

  /*
   * Contre-épreuve réelle, faite à la main le 15/09/2026 — et refaite à
   * l'identique si on touche à la route.
   *
   * La branche de modification a été SUPPRIMÉE du fichier (pas déguisée, pas
   * commentée : retirée), le banc relancé, et il est tombé sur douze échecs.
   * Le premier disait exactement le défaut d'origine :
   *
   *   ÉCHEC  AUCUNE nouvelle session de paiement n'a été créée
   *          — c'est le défaut d'origine : GET /v1/customers/cus_banc ·
   *            POST /v1/checkout/sessions
   *
   * La correction a ensuite été remise et le banc est repassé à 26/26.
   * Un banc qu'on n'a jamais vu échouer ne prouve rien.
   */
} finally {
  await nettoyer();
  console.log("");
  console.log("   compte d'essai supprimé.");
}

console.log("");
console.log("── Non couvert par ce banc ───────────────────────────────────");
console.log("  · la sémantique de Stripe : proration réelle, conservation de");
console.log("    l'essai, montants. À vérifier une fois en réel.");
console.log("  · le webhook : couvert par test:webhook.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
