/**
 * Traversée des emails sortants.
 *
 * Pourquoi en premier. Tout le produit passe par là : un devis qui ne part pas
 * n'est pas un devis. Et cette zone nous a déjà piégés — la clé Resend n'avait
 * pas la portée annoncée, et aucune route ne posait de Reply-To, si bien qu'une
 * réponse de client tombait dans le vide. Aucun de ces deux défauts n'était
 * visible autrement qu'en envoyant réellement.
 *
 * Ce script envoie de VRAIS emails. Destinataire par défaut : l'adresse de
 * Selim, pour qu'il puisse vérifier de ses yeux ce que reçoit un client.
 *
 * Usage : node scripts/e2e/emails.mjs [destinataire]
 */

import { openSession, verifier, bilan } from "./lib.mjs";

const DESTINATAIRE = process.argv[2] || "selim.b33@gmail.com";
const doc = (o) => JSON.stringify(o);

const s = await openSession("emails");
console.log(`Destinataire des tests : ${DESTINATAIRE}\n`);

// Le nom commercial doit apparaître dans le champ « De », et l'adresse de
// l'émetteur en Reply-To : c'est le profil qui les fournit.
await s.call("/api/profile", {
  method: "PATCH",
  body: doc({
    company_name: "Atelier Traversee",
    email: DESTINATAIRE,
    address_street: "1 rue du Test", address_postcode: "33000", address_city: "Bordeaux",
    siret: "10334085700012",
  }),
});
const profil = (await s.call("/api/profile")).body.profile;
verifier("le profil porte bien l'adresse de reponse attendue",
  profil.email === DESTINATAIRE, `obtenu ${profil.email}`);

// ── Devis ────────────────────────────────────────────────────────────────────
const devis = await s.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis - traversee emails",
    client_name: "Client Traversee", client_email: DESTINATAIRE,
    client_company: "Client SARL",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
    client_siren: "552100554",
    items: [{ description: "Prestation de traversee", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 }],
    total_ht: 1500, tva_rate: 0, total_ttc: 1500,
    valid_until: "2026-12-31", payment_terms: "30 jours net",
  }),
});
const devisId = devis.body?.proposal?.id;
const token = devis.body?.proposal?.share_token;

const envoiDevis = await s.call(`/api/proposals/${devisId}/send-email`, {
  method: "POST",
  body: doc({
    to: DESTINATAIRE,
    shareUrl: `https://getdeviso.fr/p/${token}`,
    senderName: "Atelier Traversee",
    proposalTitle: "Devis - traversee emails",
  }),
});
verifier("l'email de devis part sans erreur",
  envoiDevis.status === 200 && envoiDevis.body?.success === true,
  `HTTP ${envoiDevis.status} ${doc(envoiDevis.body).slice(0, 160)}`);

// ── Facture avec pièce jointe ────────────────────────────────────────────────
const facture = await s.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Client Traversee", client_email: DESTINATAIRE,
    client_company: "Client SARL",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
    client_siren: "552100554",
    seller_company: "Atelier Traversee", seller_siren: "103340857",
    seller_street: "1 rue du Test", seller_postcode: "33000", seller_city: "Bordeaux",
    items: [{ description: "Prestation de traversee", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 }],
    total_ht: 1500, tva_rate: 0, total_ttc: 1500,
    issue_date: "2026-08-12", due_date: "2026-09-11",
    operation_category: "services", type_code: "380", invoice_type: "standard",
  }),
});
const factureId = facture.body?.invoice?.id;

const envoiFacture = await s.call(`/api/invoices/${factureId}/send-email`, { method: "POST" });
verifier("l'email de facture part sans erreur, pièce jointe Factur-X comprise",
  envoiFacture.status === 200 && envoiFacture.body?.success === true,
  `HTTP ${envoiFacture.status} ${doc(envoiFacture.body).slice(0, 160)}`);

// L'envoi doit faire passer la facture en « envoyée » — c'est ce statut qui
// conditionne les relances. Copier un lien de paiement, lui, ne doit rien changer.
const apres = await s.call(`/api/invoices/${factureId}`);
verifier("l'envoi par email fait bien passer la facture en « envoyée »",
  apres.body?.invoice?.status === "sent", `statut ${apres.body?.invoice?.status}`);

// ── Relances manuelles ───────────────────────────────────────────────────────
const relanceFacture = await s.call(`/api/invoices/${factureId}/send-reminder`, { method: "POST" });
verifier("la relance de facture part sans erreur",
  relanceFacture.status === 200, `HTTP ${relanceFacture.status} ${doc(relanceFacture.body).slice(0, 140)}`);

const relanceDevis = await s.call(`/api/proposals/${devisId}/remind`, { method: "POST" });
verifier("la relance de devis part sans erreur",
  relanceDevis.status === 200, `HTTP ${relanceDevis.status} ${doc(relanceDevis.body).slice(0, 140)}`);

// ── Refus attendus ───────────────────────────────────────────────────────────
const sansEmail = await s.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Sans email", client_company: "X",
    seller_company: "Atelier Traversee", seller_siren: "103340857",
    items: [{ description: "X", quantity: 1, unit: "forfait", unit_price: 10, total: 10 }],
    total_ht: 10, tva_rate: 0, total_ttc: 10,
    issue_date: "2026-08-12", operation_category: "services", type_code: "380",
    invoice_type: "standard",
  }),
});
const refus = await s.call(`/api/invoices/${sansEmail.body?.invoice?.id}/send-email`, { method: "POST" });
verifier("une facture sans email client est refusée proprement",
  refus.status === 400, `HTTP ${refus.status}`);

console.log("");
console.log("── À vérifier de visu dans la boîte de réception ────────────");
console.log("  1. Le champ « De » affiche « Atelier Traversee », pas « Deviso »");
console.log("  2. Répondre à l'email adresse bien la réponse au compte émetteur");
console.log(`  3. L'email de facture porte une pièce jointe PDF`);
console.log("  4. Les liens pointent vers getdeviso.fr et s'ouvrent");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
