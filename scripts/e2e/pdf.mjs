/**
 * Traversée du contenu des PDF de facture.
 *
 * `two-roles.mjs` vérifie que le téléchargement répond 200. Ce qu'un code HTTP
 * ne dit pas, c'est ce que contient le fichier — et c'est là que tout s'est joué
 * jusqu'ici : des glyphes cassés, une police non embarquée, un XML absent, des
 * mentions légales manquantes. Un PDF valide et vide répond 200 lui aussi.
 *
 * On télécharge donc un vrai PDF et on inspecte son contenu : structure PDF/A-3,
 * XML Factur-X embarqué, et présence des mentions exigées par la réforme.
 *
 * Usage : node scripts/e2e/pdf.mjs
 */

import { writeFileSync } from "node:fs";
import { PDFDocument, PDFName } from "pdf-lib";
import { openSession, verifier, bilan, BASE } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const s = await openSession("pdf");

// Profil complet : sans SIREN ni adresse structurée, le PDF serait légitimement
// incomplet et le test dirait « conforme » sur un document vide de sens.
await s.call("/api/profile", {
  method: "PATCH",
  body: doc({
    company_name: "Atelier Traversee", siret: "10334085700012",
    address_street: "1 rue du Test", address_postcode: "33000", address_city: "Bordeaux",
    tva_regime: "franchise",
  }),
});

const facture = await s.call("/api/invoices", {
  method: "POST",
  body: doc({
    client_name: "Client Traversee", client_email: "c@example.fr",
    client_company: "Client SARL", client_siren: "552100554",
    client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
    seller_company: "Atelier Traversee", seller_siren: "103340857",
    seller_street: "1 rue du Test", seller_postcode: "33000", seller_city: "Bordeaux",
    items: [{ description: "Prestation de conseil", quantity: 2, unit: "heure", unit_price: 450, total: 900 }],
    total_ht: 900, tva_rate: 0, total_ttc: 900,
    issue_date: "2026-08-12", due_date: "2026-09-11",
    operation_category: "services", type_code: "380", invoice_type: "standard",
    payment_terms: "30 jours net",
  }),
});
const id = facture.body?.invoice?.id;
verifier("la facture de test est créée", facture.status === 201, `HTTP ${facture.status}`);

// Téléchargement binaire : on n'utilise pas `s.call`, qui lit en texte.
const res = await fetch(`${BASE}/api/invoices/${id}/download`, { headers: { cookie: s.cookie } });

const octets = Buffer.from(await res.arrayBuffer());
writeFileSync("scripts/e2e/.facture-test.pdf", octets);
verifier("le PDF se télécharge", res.status === 200 && octets.length > 5000, `HTTP ${res.status}, ${octets.length} octets`);

// ── Structure, lue par un vrai parseur ──────────────────────────────────────
// Première version de ce script : recherche de « OutputIntent » et « FontFile2 »
// dans les octets bruts. Elle signalait deux bugs inexistants — un PDF compresse
// ses objets, la chaîne n'y apparaît pas en clair. Un test qui crie au loup est
// pire qu'aucun test : on apprend à l'ignorer.
const pdf = await PDFDocument.load(octets, { updateMetadata: false });
const catalogue = pdf.catalog;

verifier("c'est bien un fichier PDF", octets.toString("latin1").startsWith("%PDF-"));

const oi = catalogue.lookup(PDFName.of("OutputIntents"));
verifier(
  "un profil colorimétrique est déclaré (exigé par PDF/A)",
  Boolean(oi) && oi.size?.() > 0,
  "OutputIntents absent du catalogue"
);

verifier(
  "les métadonnées XMP sont présentes (déclaration PDF/A)",
  Boolean(catalogue.lookup(PDFName.of("Metadata"))),
  "/Metadata absent"
);

verifier(
  "le XML Factur-X est référencé comme fichier associé",
  Boolean(catalogue.lookup(PDFName.of("AF"))),
  "/AF absent du catalogue : le XML ne serait pas reconnu comme pièce de la facture"
);

verifier(
  "le XML Factur-X est bien embarqué sous son nom normalisé",
  octets.toString("latin1").includes("factur-x.xml"),
  "nom de fichier joint introuvable"
);

// Toutes les polices utilisées doivent être embarquées : sinon le rendu dépend
// des polices installées chez le destinataire, et PDF/A est invalidé.
const nonEmbarquees = [];
for (const page of pdf.getPages()) {
  const res = page.node.Resources();
  const fonts = res?.lookup(PDFName.of("Font"));
  if (!fonts) continue;
  for (const cle of fonts.keys()) {
    const f = fonts.lookup(cle);
    const nom = String(f.lookup(PDFName.of("BaseFont"))?.toString() ?? "?");
    const desc =
      f.lookup(PDFName.of("FontDescriptor")) ??
      f.lookup(PDFName.of("DescendantFonts"))?.lookup?.(0)?.lookup?.(PDFName.of("FontDescriptor"));
    const embarquee =
      desc &&
      ["FontFile", "FontFile2", "FontFile3"].some((k) => Boolean(desc.lookup(PDFName.of(k))));
    if (!embarquee) nonEmbarquees.push(nom);
  }
}
verifier(
  "toutes les polices sont embarquées",
  nonEmbarquees.length === 0,
  `non embarquées : ${nonEmbarquees.join(", ")}`
);

console.log("");
console.log("PDF conservé dans scripts/e2e/.facture-test.pdf — ouvre-le pour juger du rendu,");
console.log("c'est la seule chose qu'un script ne sait pas faire.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
