/**
 * Traversée ciblée : le nom de l'expéditeur sur les relances.
 *
 * Le défaut corrigé ne se voit pas dans un code HTTP — les relances partaient
 * déjà en 200 quand elles s'affichaient « Deviso ». La seule preuve est dans la
 * boîte de réception. Ce script renvoie donc une relance de devis et une de
 * facture, pour comparaison directe avec les captures d'avant correction.
 *
 * Usage : node scripts/e2e/relances-nom.mjs [destinataire]
 */

import { openSession, verifier, bilan } from "./lib.mjs";

const DESTINATAIRE = process.argv[2] || "selim.b33@gmail.com";
const NOM_ATTENDU = "Atelier Traversee";
const doc = (o) => JSON.stringify(o);

const s = await openSession("emails");

await s.call("/api/profile", {
  method: "PATCH",
  body: doc({ company_name: NOM_ATTENDU, email: DESTINATAIRE }),
});

// ── Devis, puis relance ──────────────────────────────────────────────────────
const devis = await s.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis - verification du nom d'expediteur",
    client_name: "Client", client_email: DESTINATAIRE, client_company: "Client SARL",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 900, total: 900 }],
    total_ht: 900, tva_rate: 0, total_ttc: 900, valid_until: "2026-12-31",
  }),
});
const relanceDevis = await s.call(`/api/proposals/${devis.body?.proposal?.id}/remind`, { method: "POST" });
verifier("la relance de devis est repartie", relanceDevis.status === 200, `HTTP ${relanceDevis.status}`);

// ── Facture envoyée, puis relance ────────────────────────────────────────────
const facture = await s.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Client", client_email: DESTINATAIRE, client_company: "Client SARL",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
    seller_company: NOM_ATTENDU, seller_siren: "103340857",
    seller_street: "1 rue du Test", seller_postcode: "33000", seller_city: "Bordeaux",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 900, total: 900 }],
    total_ht: 900, tva_rate: 0, total_ttc: 900,
    issue_date: "2026-08-12", due_date: "2026-09-11",
    operation_category: "services", type_code: "380", invoice_type: "standard",
  }),
});
const relanceFacture = await s.call(`/api/invoices/${facture.body?.invoice?.id}/send-reminder`, { method: "POST" });
verifier("la relance de facture est repartie", relanceFacture.status === 200, `HTTP ${relanceFacture.status}`);

console.log("");
console.log(`Deux relances envoyees a ${DESTINATAIRE}.`);
console.log(`Le champ « De » doit afficher « ${NOM_ATTENDU} », plus « Deviso ».`);
console.log("Les corps de message doivent porter leurs accents : reglement -> reglement accentue,");
console.log("Montant du -> Montant du accentue, deja effectue -> deja effectue accentues.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
