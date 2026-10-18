#!/usr/bin/env node
/**
 * check:vitrine-exports, la vitrine ne doit pas contredire les droits reels.
 *
 * Constat du 18/10/2026 : l export FEC etait ouvert aux plans Solo ET Pro dans
 * la route, l onboarding et la page Stats, mais la landing (deux endroits) et la
 * page d abonnement le vendaient comme une fonctionnalite Pro. Un client Solo
 * ignorait qu il l avait ; un prospect pouvait payer Pro pour l obtenir.
 *
 * La regle : on lit les droits dans les routes d export elles-memes, puis on
 * verifie chaque vitrine. Un export ouvert a Solo doit etre cite cote Solo ; un
 * export reserve a Pro ne doit pas etre promis cote Solo et doit etre cite cote Pro.
 *
 * Usage : node scripts/check-vitrine-exports.mjs
 */
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(p, "utf8");
const erreurs = [];

// 1) Droits reels, lus dans les routes
const EXPORTS = [
  { cle: "FEC", route: "app/api/export/fec/route.ts", motif: /\bFEC\b/ },
  { cle: "CSV", route: "app/api/export/invoices-csv/route.ts", motif: /\bCSV\b/ },
  { cle: "recap mensuel", route: "app/api/export/monthly-recap/route.ts", motif: /r[ée]cap/i },
];
for (const e of EXPORTS) {
  const src = lire(e.route);
  if (/\[\s*"solo"\s*,\s*"pro"\s*\]\.includes/.test(src)) e.solo = true;
  else if (/plan\s*!==\s*"pro"/.test(src)) e.solo = false;
  else erreurs.push(`${e.route} : regle de plan illisible, mettre a jour ce garde`);
}

// 2) Textes des vitrines, par plan
const bloc = (src, debut, fin) => {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  const j = src.indexOf(fin, i + debut.length);
  return src.slice(i, j < 0 ? undefined : j);
};
const pricing = lire("components/landing/PricingSection.tsx");
const landing = lire("components/landing/FreelanceLanding.tsx");
const billing = lire("app/(dashboard)/billing/page.tsx");
const ligne = (src, re) => (src.split("\n").find((l) => re.test(l)) ?? null);

const VITRINES = [
  { nom: "PricingSection (Solo)", plan: "solo", texte: bloc(pricing, "const SOLO_FEATURES", "];") },
  { nom: "PricingSection (Pro)", plan: "pro", texte: bloc(pricing, "const PRO_FEATURES", "];") },
  { nom: "FreelanceLanding (Solo)", plan: "solo", texte: ligne(landing, /name:\s*"Solo".*desc:/) },
  { nom: "FreelanceLanding (Pro)", plan: "pro", texte: ligne(landing, /name:\s*"Pro".*desc:/) },
  { nom: "billing (Solo)", plan: "solo", texte: bloc(billing, "solo: {", "},") },
  { nom: "billing (Pro)", plan: "pro", texte: bloc(billing, "pro: {", "},") },
];

for (const v of VITRINES) {
  if (!v.texte) { erreurs.push(`${v.nom} : bloc introuvable, mettre a jour ce garde`); continue; }
  for (const e of EXPORTS) {
    if (e.solo === undefined) continue;
    const cite = e.motif.test(v.texte);
    if (v.plan === "solo" && e.solo && !cite)
      erreurs.push(`${v.nom} : l export ${e.cle} est ouvert a Solo mais n est pas cite`);
    if (v.plan === "solo" && !e.solo && cite)
      erreurs.push(`${v.nom} : promet l export ${e.cle}, reserve a Pro dans la route`);
    if (v.plan === "pro" && !e.solo && !cite)
      erreurs.push(`${v.nom} : l export ${e.cle} (Pro) n est pas cite`);
  }
}

if (erreurs.length) {
  for (const e of erreurs) console.error("✗ Vitrine : " + e);
  process.exit(1);
}
const resume = EXPORTS.map((e) => `${e.cle}=${e.solo ? "Solo+Pro" : "Pro"}`).join(", ");
console.log(`✓ Vitrines alignees sur les droits des routes (${resume}), ${VITRINES.length} blocs verifies`);
