/**
 * Traversée du tunnel de paiement, sans jamais débiter.
 *
 * Stripe est en mode réel. On ne va donc pas jusqu'au paiement : on vérifie les
 * garde-fous, c'est-à-dire ce qui empêche des écritures parasites dans le compte
 * de production. C'est là qu'était le défaut : le portail de facturation créait
 * un vrai client Stripe à la volée, sans contrôle du mode démonstration. Un
 * visiteur de la démo remplissait donc le compte de production de fiches
 * orphelines, purgées de la base au bout de deux heures mais jamais de Stripe.
 *
 * Usage : node scripts/e2e/stripe.mjs
 */

import { openSession, anonymous, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const s = await openSession("stripe");

console.log("── Refus attendus ───────────────────────────────────────────");

for (const chemin of ["/api/stripe/checkout", "/api/stripe/portal"]) {
  const anon = await anonymous.call(chemin, { method: "POST" });
  verifier(`${chemin} — anonyme refusé`, anon.status === 401, `HTTP ${anon.status}`);
}

const planInvalide = await s.call("/api/stripe/checkout", {
  method: "POST",
  body: doc({ plan: "plan-qui-n-existe-pas" }),
});
verifier("un plan inconnu est refusé", planInvalide.status === 400, `HTTP ${planInvalide.status}`);

console.log("");
console.log("── Le mode démonstration ne touche pas le compte Stripe ─────");

const checkoutDemo = await s.call("/api/stripe/checkout", {
  method: "POST",
  body: doc({ plan: "solo", billing: "monthly" }),
});
verifier(
  "le tunnel de paiement refuse un compte de démonstration",
  checkoutDemo.status === 403,
  `HTTP ${checkoutDemo.status} ${doc(checkoutDemo.body).slice(0, 120)}`
);

const portalDemo = await s.call("/api/stripe/portal", { method: "POST" });
verifier(
  "le portail de facturation refuse un compte de démonstration",
  portalDemo.status === 403,
  `HTTP ${portalDemo.status} ${doc(portalDemo.body).slice(0, 140)} ` +
    `(un 200 signifierait qu'un client Stripe vient d'être créé en production)`
);

console.log("");
console.log("── Non couvert par ce script ────────────────────────────────");
console.log("  · le paiement lui-même, et le webhook qui active l'abonnement :");
console.log("    Stripe est en mode réel, un test impliquerait un vrai débit.");
console.log("  · à vérifier une fois, à la main, avec une carte réelle puis remboursement.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
