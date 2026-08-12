/**
 * Traversée deux rôles.
 *
 * Hypothèse testée : dans un espace de travail, un membre d'équipe doit pouvoir
 * faire sur les documents tout ce que le propriétaire peut faire. C'est la
 * promesse du plan Pro, vendue 34 €/mois.
 *
 * Ce que ça aurait attrapé : onze routes filtraient sur l'identifiant de
 * l'utilisateur au lieu de celui de l'espace de travail. Le collaborateur voyait
 * les factures dans la liste et se prenait un 404 dès qu'il tentait de les
 * ouvrir, télécharger, envoyer ou relancer. Aucun des quatre audits ne l'a vu,
 * parce qu'aucun n'avait jamais ouvert de session de collaborateur.
 *
 * Usage : node scripts/e2e/two-roles.mjs
 */

import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);

console.log("── Mise en place ─────────────────────────────────────────────");
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);
console.log(`  propriétaire : ${owner.email}`);
console.log(`  membre       : ${member.email} (rattaché)`);
console.log("");

// Le membre doit désormais résoudre vers l'espace du propriétaire.
const vueMembre = await member.call("/api/invoices");
verifier(
  "le membre voit les factures de l'espace de travail",
  vueMembre.status === 200 && Array.isArray(vueMembre.body.invoices),
  `HTTP ${vueMembre.status}`
);

console.log("");
console.log("── Documents créés par le propriétaire ──────────────────────");

const devis = await owner.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis de traversée",
    client_name: "Client Témoin",
    client_email: "temoin@example.fr",
    client_company: "Témoin SARL",
    client_street: "3 rue des Tests",
    client_postcode: "33000",
    client_city: "Bordeaux",
    client_siren: "552100554",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
    total_ht: 1000, tva_rate: 0, total_ttc: 1000,
    valid_until: "2026-12-31", payment_terms: "30 jours net",
  }),
});
verifier("le propriétaire crée un devis", devis.status === 201, `HTTP ${devis.status} ${doc(devis.body).slice(0, 120)}`);
const devisId = devis.body?.proposal?.id;

const facture = await owner.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Client Témoin",
    client_email: "temoin@example.fr",
    client_company: "Témoin SARL",
    client_street: "3 rue des Tests",
    client_postcode: "33000",
    client_city: "Bordeaux",
    client_siren: "552100554",
    seller_company: "Studio Témoin",
    seller_siren: "103340857",
    seller_street: "1 rue Vendeur", seller_postcode: "33170", seller_city: "Gradignan",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
    total_ht: 1000, tva_rate: 0, total_ttc: 1000,
    issue_date: "2026-08-12", due_date: "2026-09-11",
    operation_category: "services", type_code: "380", invoice_type: "standard",
  }),
});
verifier("le propriétaire crée une facture", facture.status === 201, `HTTP ${facture.status} ${doc(facture.body).slice(0, 120)}`);
const factureId = facture.body?.invoice?.id;

// L'adresse doit avoir été recomposée par l'API, pas stockée telle quelle.
verifier(
  "l'adresse client est recomposée à l'écriture",
  facture.body?.invoice?.client_address === "3 rue des Tests, 33000 Bordeaux",
  `obtenu « ${facture.body?.invoice?.client_address} »`
);

console.log("");
console.log("── Chaque route, dans les trois rôles ───────────────────────");

/**
 * `membre` décrit ce que le collaborateur doit obtenir. Presque toujours la même
 * chose que le propriétaire : les documents appartiennent à l'espace, pas à la
 * personne qui les a créés.
 */
const routes = [
  { m: "GET",  p: "/api/profile" },
  { m: "GET",  p: "/api/invoices" },
  { m: "GET",  p: "/api/proposals" },
  { m: "GET",  p: "/api/catalog" },
  { m: "GET",  p: "/api/crm" },
  { m: "GET",  p: "/api/stats" },
  { m: "GET",  p: "/api/notifications" },
  { m: "GET",  p: "/api/templates" },
  { m: "GET",  p: "/api/recurring" },
  { m: "GET",  p: "/api/team" },
  { m: "GET",  p: () => `/api/invoices/${factureId}` },
  { m: "GET",  p: () => `/api/invoices/${factureId}/download`, attendu: [200] },
  { m: "GET",  p: () => `/api/proposals/${devisId}` },
  // Sans lien de paiement configuré, 400 est la bonne réponse. Ce qui serait
  // faux, c'est un 404 : il signifierait « facture introuvable pour vous ».
  { m: "POST", p: () => `/api/invoices/${factureId}/payment-link`, attendu: [200, 400] },
  { m: "POST", p: () => `/api/proposals/${devisId}/remind`, attendu: [200, 400] },
];

for (const r of routes) {
  const chemin = typeof r.p === "function" ? r.p() : r.p;
  const attendu = r.attendu ?? [200];
  const init = { method: r.m };

  const anon = await anonymous.call(chemin, init);
  verifier(`${r.m} ${chemin} — anonyme refusé`, anon.status === 401 || anon.status === 307, `HTTP ${anon.status}`);

  const prop = await owner.call(chemin, init);
  verifier(`${r.m} ${chemin} — propriétaire`, attendu.includes(prop.status), `HTTP ${prop.status}`);

  const memb = await member.call(chemin, init);
  verifier(`${r.m} ${chemin} — membre d'équipe`, attendu.includes(memb.status),
    `HTTP ${memb.status}${memb.status === 404 ? " (route filtrée sur l'utilisateur au lieu de l'espace)" : ""}`);
}

console.log("");
console.log("── Le membre peut aussi modifier ────────────────────────────");
const patch = await member.call(`/api/invoices/${factureId}`, {
  method: "PATCH",
  body: doc({ notes: "Modifié par le collaborateur" }),
});
verifier("le membre modifie une facture de l'espace", patch.status === 200, `HTTP ${patch.status}`);

console.log("");
// Pas de nettoyage explicite : les comptes de démonstration sont purgés
// automatiquement au bout de deux heures, et à chaque nouveau lancement de démo.
console.log("── Comptes de test laissés à la purge automatique (2 h) ─────");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
