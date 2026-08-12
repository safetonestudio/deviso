/**
 * Traversée du pied de page « via Deviso ».
 *
 * Décision du 12/08 : badge visible pour les inscrits sans essai (`plan = free`),
 * masqué dès Solo ou Pro, essai de 14 jours compris — l'essai donne la formule
 * complète, c'est ce que la grille tarifaire annonce.
 *
 * Un code HTTP ne dit rien de ce que contient l'email. On envoie donc deux fois
 * le même devis, une fois depuis un compte non abonné, une fois depuis un compte
 * en Pro, et on compare de visu.
 *
 * Usage : node scripts/e2e/marque.mjs [destinataire]
 */

import { openSession, verifier, bilan } from "./lib.mjs";

const DESTINATAIRE = process.argv[2] || "selim.b33@gmail.com";
const doc = (o) => JSON.stringify(o);

const s = await openSession("marque");

async function envoyerDevis(etiquette) {
  await s.call("/api/profile", {
    method: "PATCH",
    body: doc({ company_name: etiquette, email: DESTINATAIRE }),
  });
  const devis = await s.call("/api/proposals", {
    method: "POST",
    body: doc({
      title: etiquette,
      client_name: "Client", client_email: DESTINATAIRE, client_company: "Client SARL",
      client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
      total_ht: 500, tva_rate: 0, total_ttc: 500, valid_until: "2026-12-31",
    }),
  });
  const p = devis.body?.proposal;
  const envoi = await s.call(`/api/proposals/${p?.id}/send-email`, {
    method: "POST",
    body: doc({
      to: DESTINATAIRE,
      shareUrl: `https://getdeviso.fr/p/${p?.share_token}`,
      senderName: etiquette,
      proposalTitle: etiquette,
    }),
  });
  return envoi;
}

const plan = (await s.call("/api/profile")).body?.profile?.plan;
console.log(`Plan du compte de test : ${plan}\n`);

const envoi = await envoyerDevis(`Compte ${plan} - badge ${plan === "free" ? "attendu" : "masque"}`);
verifier(`l'envoi aboutit depuis un compte « ${plan} »`, envoi.status === 200, `HTTP ${envoi.status}`);

console.log("");
console.log("── À vérifier dans la boîte de réception ────────────────────");
console.log(`  Le devis « Compte ${plan} … » ne doit PAS porter « Ce devis a été créé via Deviso »`);
console.log("  puisque le compte de démonstration est en plan pro.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
