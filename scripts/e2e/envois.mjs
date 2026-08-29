/**
 * Garde-fous des quatre routes d'envoi (devis et factures, premier envoi et
 * relance).
 *
 * Pourquoi un script séparé de `emails.mjs`. Celui-ci envoie de VRAIS emails :
 * c'est ce qu'il faut pour juger un rendu, une pièce jointe ou un champ « De »,
 * mais c'est pour cette raison qu'il ne peut pas entrer dans `npm run verify` —
 * une suite qui tourne plusieurs fois par jour ne peut pas arroser une boîte de
 * réception, ni brûler le quota d'envoi.
 *
 * Ce script-ci ne déclenche **aucun envoi**. Il exerce uniquement les contrôles
 * rendus AVANT l'appel à Resend : authentification, appartenance du document à
 * l'espace de travail, données manquantes, état incompatible. C'est là que se
 * trouve la logique qui casse en silence, et c'est précisément la partie que
 * `emails.mjs` ne teste pas — lui vérifie le chemin heureux.
 *
 * Le contrôle le plus important est ailleurs qu'il n'y paraît : un membre
 * d'équipe doit atteindre les documents de l'espace. Onze routes filtraient
 * autrefois sur l'identifiant du collaborateur et lui renvoyaient 404. On le
 * prouve ici sans envoyer, grâce à une facture sans email client : si le membre
 * obtient « email manquant » (400) et non « introuvable » (404), c'est qu'il a
 * bien franchi la recherche du document.
 *
 * Usage : node scripts/e2e/envois.mjs
 */

import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const nonCouvert = [];
const aVerifierAutrement = (quoi, pourquoi) => nonCouvert.push({ quoi, pourquoi });

const INEXISTANT = "00000000-0000-0000-0000-000000000000";

console.log("── Mise en place ─────────────────────────────────────────────");
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);
console.log("  propriétaire et membre rattaché");
console.log("");

// Documents volontairement privés d'email client : ils permettent d'exercer
// toutes les routes d'envoi jusqu'au dernier contrôle, sans qu'aucun message ne
// parte réellement.
const factureSansEmail = await owner.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Client sans adresse",
    client_company: "Sans Adresse SARL",
    client_street: "1 rue Muette", client_postcode: "33000", client_city: "Bordeaux",
    client_siren: "552100554",
    seller_company: "Studio", seller_siren: "103340857",
    seller_street: "2 rue B", seller_postcode: "33170", seller_city: "Gradignan",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
    total_ht: 100, tva_rate: 0, total_ttc: 100,
    issue_date: "2026-08-29", due_date: "2026-09-28",
    operation_category: "services", type_code: "380", invoice_type: "standard",
  }),
});
const idFactureSansEmail = factureSansEmail.body?.invoice?.id;
verifier("une facture sans email client est créée pour les besoins du test", factureSansEmail.status === 201, `HTTP ${factureSansEmail.status}`);

const devisSansEmail = await owner.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis sans email client",
    client_name: "Client sans adresse", client_company: "Sans Adresse SARL",
    client_street: "1 rue Muette", client_postcode: "33000", client_city: "Bordeaux",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
    total_ht: 100, tva_rate: 0, total_ttc: 100, valid_until: "2026-12-31",
  }),
});
const idDevisSansEmail = devisSansEmail.body?.proposal?.id;
verifier("un devis sans email client est créé pour les besoins du test", devisSansEmail.status === 201, `HTTP ${devisSansEmail.status}`);

// ── Refus d'un anonyme ───────────────────────────────────────────────────────
console.log("");
console.log("── Aucune route d'envoi n'est ouverte à un anonyme ───────────");

for (const [chemin, intitule] of [
  [`/api/invoices/${idFactureSansEmail}/send-email`, "envoi d'une facture"],
  [`/api/invoices/${idFactureSansEmail}/send-reminder`, "relance d'une facture"],
  [`/api/proposals/${idDevisSansEmail}/send-email`, "envoi d'un devis"],
  [`/api/proposals/${idDevisSansEmail}/remind`, "relance d'un devis"],
]) {
  const r = await anonymous.call(chemin, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: doc({ to: "intrus@example.fr", shareUrl: "https://getdeviso.fr/p/x" }),
  });
  verifier(`${intitule} — un anonyme est refusé`, r.status === 401, `HTTP ${r.status}`);
}

// ── Document inexistant ──────────────────────────────────────────────────────
console.log("");
console.log("── Un document inexistant ne fait pas tomber la route ────────");

for (const [chemin, intitule] of [
  [`/api/invoices/${INEXISTANT}/send-email`, "envoi d'une facture"],
  [`/api/invoices/${INEXISTANT}/send-reminder`, "relance d'une facture"],
  [`/api/proposals/${INEXISTANT}/send-email`, "envoi d'un devis"],
  [`/api/proposals/${INEXISTANT}/remind`, "relance d'un devis"],
]) {
  const r = await owner.call(chemin, {
    method: "POST",
    body: doc({ to: "client@example.fr", shareUrl: "https://getdeviso.fr/p/x" }),
  });
  verifier(`${intitule} — document inexistant : 404`, r.status === 404, `HTTP ${r.status} ${doc(r.body).slice(0, 120)}`);
}

// ── Email client manquant ────────────────────────────────────────────────────
console.log("");
console.log("── Un email client manquant est dit clairement ───────────────");

const envoiSansEmail = await owner.call(`/api/invoices/${idFactureSansEmail}/send-email`, { method: "POST" });
verifier(
  "envoyer une facture sans email client est refusé, pas tenté",
  envoiSansEmail.status === 400,
  `HTTP ${envoiSansEmail.status} ${doc(envoiSansEmail.body).slice(0, 120)}`
);

const relanceSansEmail = await owner.call(`/api/invoices/${idFactureSansEmail}/send-reminder`, { method: "POST" });
verifier(
  "relancer une facture sans email client est refusé",
  relanceSansEmail.status === 400,
  `HTTP ${relanceSansEmail.status} ${doc(relanceSansEmail.body).slice(0, 120)}`
);

const relanceDevisSansEmail = await owner.call(`/api/proposals/${idDevisSansEmail}/remind`, { method: "POST" });
verifier(
  "relancer un devis sans email client est refusé",
  relanceDevisSansEmail.status === 400,
  `HTTP ${relanceDevisSansEmail.status} ${doc(relanceDevisSansEmail.body).slice(0, 120)}`
);

// L'envoi d'un devis prend son destinataire dans le corps de la requête, pas
// sur le document : c'est l'absence de ces paramètres qui doit être signalée.
const envoiDevisSansParametres = await owner.call(`/api/proposals/${idDevisSansEmail}/send-email`, {
  method: "POST",
  body: doc({}),
});
verifier(
  "envoyer un devis sans destinataire ni lien est refusé",
  envoiDevisSansParametres.status === 400,
  `HTTP ${envoiDevisSansParametres.status} ${doc(envoiDevisSansParametres.body).slice(0, 120)}`
);

// ── Un devis signé ne se relance plus ────────────────────────────────────────
console.log("");
console.log("── Un devis signé ne se relance plus ─────────────────────────");

const tousDevis = await owner.call("/api/proposals");
const signe = (tousDevis.body?.proposals ?? []).find((p) => p.status === "signed" && p.client_email);
verifier("le jeu de démonstration fournit un devis signé avec email client", Boolean(signe));

if (signe) {
  // Relancer un client qui a déjà signé, c'est lui redemander de signer ce
  // qu'il a signé. Le contrôle intervient avant l'envoi.
  const relanceSigne = await owner.call(`/api/proposals/${signe.id}/remind`, { method: "POST" });
  verifier(
    "relancer un devis déjà signé est refusé",
    relanceSigne.status === 400,
    `HTTP ${relanceSigne.status} ${doc(relanceSigne.body).slice(0, 140)}`
  );
}

// ── Le membre d'équipe atteint bien les documents de l'espace ────────────────
console.log("");
console.log("── Un membre d'équipe atteint les documents de l'espace ──────");

// Le cœur du script. Un 400 « email manquant » prouve que le membre a franchi
// la recherche du document ; un 404 signalerait le retour de la panne qui a
// coûté onze routes.
const membreFacture = await member.call(`/api/invoices/${idFactureSansEmail}/send-email`, { method: "POST" });
verifier(
  "un membre atteint la facture de l'espace (400 « email manquant », et non 404)",
  membreFacture.status === 400,
  `HTTP ${membreFacture.status} ${doc(membreFacture.body).slice(0, 140)}`
);

const membreRelanceFacture = await member.call(`/api/invoices/${idFactureSansEmail}/send-reminder`, { method: "POST" });
verifier(
  "un membre atteint la facture pour la relancer (400, et non 404)",
  membreRelanceFacture.status === 400,
  `HTTP ${membreRelanceFacture.status} ${doc(membreRelanceFacture.body).slice(0, 140)}`
);

const membreRelanceDevis = await member.call(`/api/proposals/${idDevisSansEmail}/remind`, { method: "POST" });
verifier(
  "un membre atteint le devis pour le relancer (400, et non 404)",
  membreRelanceDevis.status === 400,
  `HTTP ${membreRelanceDevis.status} ${doc(membreRelanceDevis.body).slice(0, 140)}`
);

const membreEnvoiDevis = await member.call(`/api/proposals/${idDevisSansEmail}/send-email`, {
  method: "POST",
  body: doc({}),
});
verifier(
  "un membre est arrêté sur les paramètres d'envoi du devis, pas sur un 404",
  membreEnvoiDevis.status === 400,
  `HTTP ${membreEnvoiDevis.status} ${doc(membreEnvoiDevis.body).slice(0, 140)}`
);

// ── Ce que ce script ne prouve pas ───────────────────────────────────────────
aVerifierAutrement(
  "L'envoi réel d'un email et son contenu",
  "c'est l'objet de scripts/e2e/emails.mjs (nom d'expéditeur, Reply-To, pièce jointe Factur-X, accents), volontairement hors de verify puisqu'il écrit à une vraie boîte."
);
aVerifierAutrement(
  "Le passage automatique en « envoyée » après un envoi réussi",
  "vérifié par emails.mjs : le contrôle exige un envoi abouti, impossible ici sans écrire à quelqu'un."
);
aVerifierAutrement(
  "La traduction des erreurs Resend (adresse invalide, quota dépassé)",
  "exige de provoquer un vrai refus côté Resend ; c'est ce que fait scripts/e2e/contre-epreuve-emails.mjs, à lancer à la main."
);
aVerifierAutrement(
  "L'absence du pied de page « via Deviso » selon le plan",
  "différence de rendu dans le message ; scripts/e2e/marque.mjs l'envoie pour comparaison à l'œil."
);

console.log("");
console.log("── Non couvert par ce script ─────────────────────────────────");
for (const n of nonCouvert) console.log(`  ? ${n.quoi}\n      ${n.pourquoi}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
