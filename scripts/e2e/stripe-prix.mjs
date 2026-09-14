/**
 * Les identifiants de prix désignent-ils encore ce qu'on croit vendre ?
 *
 * Pourquoi cette traversée existe. Le 14/09/2026, `.env.local` référençait pour
 * le plan Pro un prix **inexistant** — et pas seulement périmé : son préfixe de
 * compte n'était même pas celui de Deviso. Pour le plan Solo, il pointait un
 * ancien prix à 15,99 € alors que la grille affiche 18 €. Les trois autres
 * identifiants (annuels et siège) étaient purement absents. Rien ne le disait :
 * `PLANS` lit `process.env.X!`, le point d'exclamation promet au compilateur
 * une valeur qui n'existe pas, et le défaut ne se voit qu'au moment où un
 * client clique sur « S'abonner ».
 *
 * Ce que ce script vérifie, et qu'aucune relecture ne peut donner :
 *   · les cinq identifiants existent et désignent un prix ACTIF du compte ;
 *   · chaque prix porte le montant, la devise et la périodicité de la grille ;
 *   · l'endpoint webhook est enregistré, actif, pointe vers la production et
 *     couvre les événements dont le code dépend.
 *
 * ⚠️ Ce qu'il NE prouve PAS, et c'est capital : il lit `.env.local`, qui n'est
 * PAS la production. Vercel porte ses propres valeurs, illisibles d'ici. Un
 * `.env.local` vert ne dit rien de ce qui tourne sur getdeviso.fr — la leçon
 * des clés Resend du 28/08 vaut mot pour mot ici. La seule preuve côté
 * production reste la trace d'usage : un abonnement réellement créé sur le bon
 * prix (voir le tableau de bord Stripe).
 *
 * N'écrit rien. Uniquement des lectures.
 *
 * Usage : node scripts/e2e/stripe-prix.mjs
 */

import { verifier, bilan, secret } from "./lib.mjs";

/** La grille tarifaire, telle qu'elle est annoncée aux clients. */
const GRILLE = [
  { env: "STRIPE_SOLO_PRICE_ID",        libelle: "Solo mensuel",   centimes: 1800,  interval: "month" },
  { env: "STRIPE_SOLO_ANNUAL_PRICE_ID", libelle: "Solo annuel",    centimes: 17280, interval: "year"  },
  { env: "STRIPE_PRO_PRICE_ID",         libelle: "Pro mensuel",    centimes: 3400,  interval: "month" },
  { env: "STRIPE_PRO_ANNUAL_PRICE_ID",  libelle: "Pro annuel",     centimes: 32640, interval: "year"  },
  { env: "STRIPE_SEAT_PRICE_ID",        libelle: "Siège en plus",  centimes: 500,   interval: "month" },
];

/** Ce que le webhook traite réellement. Sans eux, un abonnement reste invisible. */
const EVENEMENTS_REQUIS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const CLE = secret("STRIPE_SECRET_KEY");

async function stripe(chemin) {
  const r = await fetch("https://api.stripe.com/v1/" + chemin, {
    headers: { Authorization: "Basic " + Buffer.from(CLE + ":").toString("base64") },
  });
  return { ok: r.ok, status: r.status, corps: await r.json() };
}

const eur = (c) => (c / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

console.log("");
console.log("── Les prix vendus existent-ils, et au bon montant ? ──────────");
console.log("   source lue : .env.local — PAS la production. Voir l'en-tête.");
console.log("");

const compte = await stripe("account");
verifier(
  "la clé Stripe ouvre bien le compte de Deviso",
  compte.ok && compte.corps.id === "acct_1Tme0gC7DMFvUE5O",
  compte.ok ? `compte ${compte.corps.id}` : `HTTP ${compte.status}`
);

const referencés = new Set();

for (const { env, libelle, centimes, interval } of GRILLE) {
  let id = null;
  try {
    id = secret(env);
  } catch {
    verifier(`${libelle} — l'identifiant est renseigné`, false, `${env} absent de .env.local`);
    continue;
  }
  referencés.add(id);

  const p = await stripe(`prices/${id}`);
  if (!p.ok) {
    verifier(
      `${libelle} — le prix existe sur le compte`,
      false,
      `${id} → HTTP ${p.status} ${p.corps?.error?.message ?? ""}`
    );
    continue;
  }

  const prix = p.corps;
  const conforme =
    prix.active === true &&
    prix.unit_amount === centimes &&
    prix.currency === "eur" &&
    prix.recurring?.interval === interval &&
    (prix.recurring?.interval_count ?? 1) === 1;

  verifier(
    `${libelle} — ${eur(centimes)} € par ${interval === "year" ? "an" : "mois"}`,
    conforme,
    `${eur(prix.unit_amount ?? 0)} ${String(prix.currency).toUpperCase()} / ` +
      `${prix.recurring?.interval ?? "ponctuel"} · actif=${prix.active}`
  );
}

console.log("");
console.log("── Le webhook est-il branché, et sur les bons événements ? ────");

const hooks = await stripe("webhook_endpoints?limit=20");
const prod = hooks.ok
  ? hooks.corps.data.find((h) => h.url === "https://getdeviso.fr/api/webhooks/stripe")
  : null;

verifier(
  "un endpoint webhook pointe vers la production",
  Boolean(prod),
  prod ? prod.url : `endpoints connus : ${hooks.corps?.data?.map((h) => h.url).join(", ") || "aucun"}`
);

if (prod) {
  verifier("cet endpoint est activé", prod.status === "enabled", `statut ${prod.status}`);
  const manquants = EVENEMENTS_REQUIS.filter(
    (e) => !prod.enabled_events.includes(e) && !prod.enabled_events.includes("*")
  );
  verifier(
    "il couvre les événements dont le code dépend",
    manquants.length === 0,
    manquants.length ? `manque : ${manquants.join(", ")}` : prod.enabled_events.join(", ")
  );
}

console.log("");
console.log("── Anciens prix encore actifs ────────────────────────────────");

const actifs = await stripe("prices?limit=100&active=true&expand[]=data.product");
/**
 * Anciens prix laissés actifs sciemment, avec leur raison. Chacun doit finir
 * archivé dans Stripe ; en attendant, ils sont tolérés NOMMÉMENT pour qu'un
 * nouvel orphelin, lui, fasse échouer la traversée.
 */
const TOLERES = new Map([
  ["price_1TnUfmC7DMFvUE5OG7oOuLz3", "Solo 15,99 € — grille abandonnée, aucun abonnement vivant (14/09/2026)"],
  ["price_1TmtoOC7DMFvUE5ONRi07YgD", "Pro 29 € — grille abandonnée, aucun abonnement vivant (14/09/2026)"],
  ["price_1TmtlsC7DMFvUE5Oa3dsFvFZ", "Solo 19 € — porté par un abonnement résilié en août (14/09/2026)"],
]);

const orphelins = actifs.ok
  ? actifs.corps.data.filter((p) => !referencés.has(p.id) && p.recurring && !TOLERES.has(p.id))
  : [];

if (TOLERES.size > 0) {
  console.log(`  ·    ${TOLERES.size} ancien(s) prix encore actifs, tolérés nommément :`);
  for (const [id, raison] of TOLERES) console.log(`         ${raison}`);
  console.log("         Les archiver dans Stripe, puis vider TOLERES.");
}

verifier(
  "aucun prix récurrent actif INATTENDU hors de la grille",
  orphelins.length === 0,
  orphelins.length
    ? orphelins
        .map((p) => `${eur(p.unit_amount)} € ${p.product?.name ?? ""} (${p.id})`)
        .join(" · ") +
      " — un abonnement sur un prix hors grille renvoie null dans " +
      "planFromPriceId : le webhook journalise et n'applique AUCUN changement " +
      "de plan. L'archiver dans Stripe, ou l'ajouter à TOLERES avec sa raison."
    : "la grille, plus les anciens prix tolérés nommément"
);

console.log("");
console.log("── Contre-épreuves ───────────────────────────────────────────");

const bidon = await stripe("prices/price_ceci_nexiste_pas");
verifier(
  "un identifiant inventé est bien rejeté par Stripe",
  !bidon.ok && bidon.status === 404,
  `HTTP ${bidon.status}`
);

verifier(
  "un montant faux serait bien détecté",
  ((p) => p.unit_amount !== 1799)(await stripe("prices/" + secret("STRIPE_SOLO_PRICE_ID")).then((r) => r.corps)),
  "le contrôle compare le montant, pas seulement l'existence"
);

console.log("");
console.log("── Non couvert ───────────────────────────────────────────────");
console.log("  · les valeurs réellement posées sur Vercel : illisibles d'ici.");
console.log("  · le paiement lui-même : Stripe est en mode réel.");
console.log("  · l'annuel et le siège supplémentaire n'ont jamais été souscrits");
console.log("    en production — leur prix est juste, leur tunnel n'est pas prouvé.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
