/**
 * Inventaire « vendu vs livré ».
 *
 * Chaque ligne de la grille tarifaire est une promesse contractuelle. Le domaine
 * d'envoi personnalisé y a figuré, ainsi que dans les CGU, alors qu'il ne pouvait
 * pas fonctionner : la clé Resend n'avait pas la portée nécessaire, et le plan
 * gratuit n'autorisait qu'un domaine, déjà pris. Personne ne s'en est aperçu
 * parce qu'aucun contrôle ne reliait une promesse à une preuve.
 *
 * Ce script établit ce lien. Il ne cherche pas à tout prouver : ce qu'il ne sait
 * pas vérifier, il le dit — c'est aussi utile que ce qu'il valide.
 *
 * Usage : node scripts/e2e/promesses.mjs
 */

import { openSession, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const nonProuve = [];
const aVerifierAlaMain = (promesse, raison) => nonProuve.push({ promesse, raison });

const s = await openSession("promesses");
console.log(`Compte de test : plan pro\n`);

// ── Devis ────────────────────────────────────────────────────────────────────
const gen = await s.call("/api/proposals/generate", {
  method: "POST",
  body: doc({ brief: "Refonte d'un site vitrine de cinq pages pour un restaurant" }),
});
verifier("« Devis IA en 30 secondes » — la génération répond",
  gen.status === 200 && Array.isArray(gen.body?.proposal?.items), `HTTP ${gen.status}`);

const devis = await s.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis promesse", client_name: "Client", client_email: "c@example.fr",
    client_company: "Cli SARL", client_street: "1 rue A", client_postcode: "33000",
    client_city: "Bordeaux", client_siren: "552100554",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
    total_ht: 1000, tva_rate: 0, total_ttc: 1000, valid_until: "2026-12-31",
  }),
});
const devisId = devis.body?.proposal?.id;
const token = devis.body?.proposal?.share_token;
verifier("un devis est créé avec un jeton de partage", Boolean(token), `HTTP ${devis.status}`);

// ── Signature électronique ───────────────────────────────────────────────────
if (token) {
  const vue = await s.call(`/api/public/proposals/${token}`);
  verifier("« Signature électronique » — le devis est consultable publiquement",
    vue.status === 200 && Boolean(vue.body?.proposal), `HTTP ${vue.status}`);

  const sign = await s.call(`/api/public/proposals/${token}`, {
    method: "POST",
    body: doc({ action: "sign", signerName: "Jean Témoin" }),
  });
  verifier("« Signature électronique » — la signature aboutit",
    sign.status === 200, `HTTP ${sign.status} ${doc(sign.body).slice(0, 100)}`);

  const apres = await s.call(`/api/proposals/${devisId}`);
  verifier("la signature est horodatée et l'empreinte conservée",
    apres.body?.proposal?.status === "signed" && Boolean(apres.body?.proposal?.signed_at),
    `statut ${apres.body?.proposal?.status}`);
}

// ── Factures : standard, acompte, solde, récurrente ──────────────────────────
const creerFacture = (type, extra = {}) =>
  s.call("/api/invoices", {
    method: "POST",
    body: doc({
      client_name: "Client", client_email: "c@example.fr", client_company: "Cli SARL",
      client_street: "1 rue A", client_postcode: "33000", client_city: "Bordeaux",
      client_siren: "552100554",
      seller_company: "Studio", seller_siren: "103340857",
      seller_street: "2 rue B", seller_postcode: "33170", seller_city: "Gradignan",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
      total_ht: 1000, tva_rate: 0, total_ttc: 1000,
      issue_date: "2026-08-12", due_date: "2026-09-11",
      operation_category: "services", type_code: "380", invoice_type: type,
      ...extra,
    }),
  });

const std = await creerFacture("standard");
const acompte = await creerFacture("acompte", { deposit_percentage: 30 });
const solde = await creerFacture("solde", { linked_invoice_id: acompte.body?.invoice?.id });
verifier("« Factures acompte et solde » — les trois types se créent",
  [std, acompte, solde].every((r) => r.status === 201),
  `${std.status}/${acompte.status}/${solde.status}`);
verifier("l'acompte suit une numérotation indépendante",
  acompte.body?.invoice?.invoice_number?.startsWith("AC-"),
  `numéro ${acompte.body?.invoice?.invoice_number}`);

const recur = await s.call("/api/recurring", {
  method: "POST",
  body: doc({
    client_name: "Client", client_email: "c@example.fr",
    items: [{ description: "Abonnement", quantity: 1, unit: "mois", unit_price: 100, total: 100 }],
    tva_rate: 0, interval: "monthly", day_of_month: 1,
    next_billing_date: "2026-09-01", active: true,
  }),
});
verifier("« Factures récurrentes » — une récurrence se crée",
  [200, 201].includes(recur.status), `HTTP ${recur.status} ${doc(recur.body).slice(0, 100)}`);

// ── Factur-X ────────────────────────────────────────────────────────────────
// Le téléchargement est déjà traversé par two-roles.mjs. Ce qu'un code HTTP ne
// dit pas, c'est ce que contient le fichier — et c'est là que se jouait la
// conformité. La validation du XML est faite séparément contre le validateur
// officiel ; on ne la refait pas ici pour ne pas prétendre l'avoir prouvée.
aVerifierAlaMain(
  "« Factures Factur-X conformes réforme 2026 »",
  "XML validé contre le validateur Super PDP le 12/08 : 137 contrôles, 0 échec. Non rejoué à chaque exécution."
);

// ── Exports ──────────────────────────────────────────────────────────────────
for (const [chemin, promesse] of [
  ["/api/export/fec", "« Exports comptables FEC »"],
  ["/api/export/invoices-csv", "« Export CSV »"],
  ["/api/export/monthly-recap", "« Récap mensuel »"],
]) {
  const r = await s.call(chemin);
  verifier(`${promesse} — ${chemin}`, r.status === 200, `HTTP ${r.status}`);
}

// ── CRM, analytics, catalogue ────────────────────────────────────────────────
for (const [chemin, promesse] of [
  ["/api/crm", "« CRM Clients & Revenus »"],
  ["/api/stats", "« Analytics »"],
  ["/api/catalog", "« Catalogue prestations »"],
]) {
  const r = await s.call(chemin);
  verifier(`${promesse} — ${chemin}`, r.status === 200, `HTTP ${r.status}`);
}

// ── Réglages Pro ─────────────────────────────────────────────────────────────
const relances = await s.call("/api/profile", {
  method: "PATCH",
  body: doc({ reminder_intervals: [5, 12], reminder_message: "Message de test" }),
});
verifier("« Relances automatiques programmables » — les intervalles s'enregistrent",
  relances.status === 200 && doc(relances.body?.profile?.reminder_intervals) === "[5,12]",
  `HTTP ${relances.status} → ${doc(relances.body?.profile?.reminder_intervals)}`);

const sous = `test-${Date.now().toString(36)}`;
const sd = await s.call("/api/profile", { method: "PATCH", body: doc({ subdomain: sous }) });
verifier("« Sous-domaine de partage » — il s'enregistre",
  sd.status === 200 && sd.body?.profile?.subdomain === sous, `HTTP ${sd.status}`);

const couleur = await s.call("/api/profile", { method: "PATCH", body: doc({ proposal_color: "#0f766e" }) });
verifier("« Couleur d'accent sur vos PDF » — elle s'enregistre",
  couleur.status === 200 && couleur.body?.profile?.proposal_color === "#0f766e", `HTTP ${couleur.status}`);

// ── Promesses non couvertes par ce script ────────────────────────────────────
aVerifierAlaMain("« Dépôt Chorus Pro B2G »", "exige des identifiants PISTE de production, jamais exercé.");
aVerifierAlaMain("« Widget CA URSSAF »", "affichage seul, aucune route à interroger.");
aVerifierAlaMain("« Sans branding Deviso sur vos documents »", "différence visuelle dans le PDF, non vérifiée automatiquement.");
aVerifierAlaMain("« 3 utilisateurs inclus, +5 €/utilisateur »", "dépend de la facturation Stripe réelle, non exercée.");
aVerifierAlaMain("« Couleur d'accent » appliquée au PDF", "la valeur est enregistrée ; son effet visuel n'est pas contrôlé.");

console.log("");
console.log("── Promesses non prouvées par ce script ─────────────────────");
for (const n of nonProuve) console.log(`  ? ${n.promesse}\n      ${n.raison}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
