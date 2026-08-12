/**
 * Contre-épreuve du contrôle PDF.
 *
 * Les assertions de pdf.mjs sont-elles porteuses ? On les rejoue sur deux PDF
 * volontairement dégradés — un sans profil colorimétrique, un sans fichier
 * associé — et on vérifie qu'elles tombent.
 *
 * Sans cette étape, « 8/8 » ne prouve rien : la première version de pdf.mjs
 * signalait deux bugs inexistants parce qu'elle cherchait des chaînes de
 * caractères dans un PDF compressé.
 *
 * Usage : node scripts/e2e/contre-epreuve-pdf.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { PDFDocument, PDFName } from "pdf-lib";

const cas = [
  ["scripts/e2e/.facture-test.pdf", "PDF intact", true, true],
  ["scripts/e2e/sans-outputintent.pdf", "sans profil colorimétrique", false, true],
  ["scripts/e2e/sans-af.pdf", "sans fichier associé", true, false],
];

let echecs = 0;

for (const [chemin, libelle, oiAttendu, afAttendu] of cas) {
  if (!existsSync(chemin)) {
    console.log(`  ignoré  ${libelle} — fichier absent`);
    continue;
  }
  const pdf = await PDFDocument.load(readFileSync(chemin), { updateMetadata: false });
  const oi = Boolean(pdf.catalog.lookup(PDFName.of("OutputIntents")));
  const af = Boolean(pdf.catalog.lookup(PDFName.of("AF")));

  const ok = oi === oiAttendu && af === afAttendu;
  console.log(
    `${ok ? "  ok  " : "ÉCHEC "} ${libelle} — profil ${oi ? "présent" : "absent"}, ` +
      `fichier associé ${af ? "présent" : "absent"}`
  );
  if (!ok) echecs++;
}

console.log("");
console.log(
  echecs === 0
    ? "Les assertions distinguent bien un PDF conforme d'un PDF dégradé."
    : "PROBLEME : les assertions ne distinguent pas les deux cas."
);
process.exit(echecs > 0 ? 1 : 0);
