/**
 * Contre-épreuve du script d'emails.
 *
 * Question posée : l'assertion « l'email part sans erreur » est-elle porteuse,
 * ou passerait-elle même si l'envoi échouait ? On force un échec réel côté
 * Resend en donnant une adresse destinataire invalide, et on vérifie que la
 * route le remonte au lieu de répondre 200.
 *
 * Usage : node scripts/e2e/contre-epreuve-emails.mjs
 */

import { openSession } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const s = await openSession("emails");

const facture = await s.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Adresse invalide",
    client_email: "ceci n est pas une adresse",
    client_company: "X",
    seller_company: "Atelier Traversee", seller_siren: "103340857",
    items: [{ description: "X", quantity: 1, unit: "forfait", unit_price: 10, total: 10 }],
    total_ht: 10, tva_rate: 0, total_ttc: 10,
    issue_date: "2026-08-12", operation_category: "services",
    type_code: "380", invoice_type: "standard",
  }),
});

const envoi = await s.call(`/api/invoices/${facture.body?.invoice?.id}/send-email`, { method: "POST" });

console.log(`HTTP ${envoi.status} — ${doc(envoi.body).slice(0, 200)}`);
console.log("");
if (envoi.status === 200) {
  console.log("PROBLEME : la route repond 200 alors que l'adresse est invalide.");
  console.log("L'assertion du script d'emails ne prouve donc rien.");
  process.exit(1);
}
console.log("L'echec est bien remonte : l'assertion du script d'emails est porteuse.");
