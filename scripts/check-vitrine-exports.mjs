#!/usr/bin/env node
/**
 * check:vitrine-exports, la vitrine et les droits ne doivent jamais se contredire.
 *
 * Né le 18/10/2026 : l'export FEC était ouvert Solo ET Pro dans la route, mais
 * la landing et la page d'abonnement le vendaient comme une fonction Pro. Ce
 * garde ne couvrait alors que trois exports. Il est désormais généralisé à
 * TOUTES les fonctions, autour d'une source unique : lib/plans.ts.
 *
 * Trois vérifications, dans cet ordre :
 *
 *   1. Matrice <-> routes. Pour chaque fonction dont une route porte la règle
 *      de plan en clair, la matrice doit dire exactement ce que la route
 *      applique. C'est ce qui empêche la matrice de mentir sur ce que fait
 *      l'app (le défaut d'origine du 18/10, mais pour toutes les fonctions).
 *
 *   2. Vitrines dérivées. La carte de prix (PricingSection) et la page
 *      d'abonnement (billing) doivent LIRE la matrice, pas retaper une liste.
 *      Une liste tapée à la main ré-ouvre la porte aux décalages : interdite.
 *
 *   3. Landing en prose (FreelanceLanding). Elle résume en texte libre : on
 *      vérifie au moins que les exports ne sont pas promis au mauvais plan.
 *
 * Usage : node scripts/check-vitrine-exports.mjs
 */
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(p, "utf8");
const erreurs = [];

/* ── Lecture de la source unique : id -> plans (hors "free") ──────────────── */
const plansSrc = lire("lib/plans.ts");
const matrice = new Map();
const reLigne = /\{\s*id:\s*"([^"]+)"[^}]*plans:\s*\[([^\]]*)\]/g;
let m;
while ((m = reLigne.exec(plansSrc)) !== null) {
  const id = m[1];
  const plans = [...m[2].matchAll(/"(free|solo|pro)"/g)].map((x) => x[1]);
  matrice.set(id, new Set(plans));
}
if (matrice.size === 0) erreurs.push("lib/plans.ts : matrice FEATURES illisible");

const payants = (set) => [...set].filter((p) => p !== "free").sort().join("+") || "(aucun)";

/* ── Invariant : tout ce que Solo donne, Pro le donne aussi ───────────────── */
for (const [id, set] of matrice) {
  if (set.has("solo") && !set.has("pro")) {
    erreurs.push(`matrice : "${id}" est donné à Solo mais pas à Pro (Pro doit inclure tout Solo)`);
  }
}

/* ── 1) Matrice <-> règles de plan réellement appliquées dans les routes ──── */
// Classe la règle de plan d'une route en ensemble de plans payants autorisés.
function regleRoute(src) {
  if (/can\(\s*\w+\s*,\s*"[^"]+"\s*\)/.test(src)) return "matrice"; // déjà piloté par la matrice
  if (/\[\s*"solo"\s*,\s*"pro"\s*\]\.includes/.test(src)) return new Set(["solo", "pro"]);
  if (/plan\s*===\s*"free"/.test(src) || /profile\.plan\s*===\s*"free"/.test(src)) return new Set(["solo", "pro"]);
  if (/plan\s*!==\s*"pro"/.test(src)) return new Set(["pro"]);
  return null; // illisible
}

const ROUTE_RULES = [
  { id: "fecExport", routes: ["app/api/export/fec/route.ts"] },
  { id: "csvRecap",  routes: ["app/api/export/invoices-csv/route.ts", "app/api/export/monthly-recap/route.ts"] },
  { id: "crm",       routes: ["app/api/crm/route.ts"] },
  { id: "catalog",   routes: ["app/api/catalog/route.ts"] },
  { id: "templates", routes: ["app/api/templates/route.ts"] },
  { id: "invoices",  routes: ["app/api/invoices/route.ts"] },
  { id: "logo",      routes: ["app/api/profile/logo/route.ts"] },
  { id: "recurring", routes: ["app/api/recurring/route.ts"] },
  { id: "livreRecettes", routes: ["app/api/export/livre-recettes/route.ts"] },
];

let croisees = 0;
for (const r of ROUTE_RULES) {
  const attendu = matrice.get(r.id);
  if (!attendu) { erreurs.push(`matrice : fonction "${r.id}" absente, attendue par un garde de route`); continue; }
  const attenduPayant = payants(attendu);
  for (const route of r.routes) {
    let src;
    try { src = lire(route); } catch { erreurs.push(`${route} : fichier introuvable (garde "${r.id}")`); continue; }
    const regle = regleRoute(src);
    if (regle === "matrice") { croisees++; continue; } // la route lit déjà la matrice, rien à contredire
    if (regle === null) { erreurs.push(`${route} : règle de plan illisible, mettre à jour ce garde ou la route`); continue; }
    const vuPayant = payants(regle);
    if (vuPayant !== attenduPayant) {
      erreurs.push(`"${r.id}" : la route ${route} applique ${vuPayant}, la matrice dit ${attenduPayant}`);
    } else croisees++;
  }
}

/* ── 2) Les vitrines dérivent de la matrice, aucune liste tapée à la main ─── */
const pricing = lire("components/landing/PricingSection.tsx");
if (!/planFeatures\(\s*"solo"\s*\)/.test(pricing) || !/proOnlyFeatures\(/.test(pricing))
  erreurs.push("PricingSection.tsx : ne dérive pas de la matrice (planFeatures/proOnlyFeatures attendus)");
if (/const\s+SOLO_FEATURES\s*=\s*\[/.test(pricing))
  erreurs.push("PricingSection.tsx : SOLO_FEATURES est un tableau tapé à la main (doit venir de planFeatures)");
if (!/\.\.\.proOnlyFeatures\(\)/.test(pricing))
  erreurs.push("PricingSection.tsx : la carte Pro ne déploie pas proOnlyFeatures() (liste Pro non dérivée)");

const billing = lire("app/(dashboard)/billing/page.tsx");
if (!/planFeatures\(\s*"solo"\s*\)/.test(billing) || !/proOnlyFeatures\(/.test(billing))
  erreurs.push("billing/page.tsx : descriptions non dérivées de la matrice");

/* ── 3) Landing en prose : les exports ne sont pas promis au mauvais plan ── */
const landing = lire("components/landing/FreelanceLanding.tsx");
const ligne = (src, re) => src.split("\n").find((l) => re.test(l)) ?? null;
const soloProse = ligne(landing, /name:\s*"Solo".*desc:/);
const proProse  = ligne(landing, /name:\s*"Pro".*desc:/);
const EXPORTS_PROSE = [
  { id: "fecExport", motif: /\bFEC\b/ },
  { id: "csvRecap",  motif: /\bCSV\b/ },
];
if (!soloProse || !proProse) {
  erreurs.push("FreelanceLanding.tsx : lignes de prix Solo/Pro introuvables, mettre à jour ce garde");
} else {
  for (const e of EXPORTS_PROSE) {
    const set = matrice.get(e.id);
    if (!set) continue;
    if (!set.has("solo") && e.motif.test(soloProse))
      erreurs.push(`FreelanceLanding (Solo) : promet ${e.id}, réservé à Pro dans la matrice`);
  }
}

/* ── Contre-épreuve : le classifieur voit-il encore les deux cas ? ────────── */
if (payants(regleRoute(`if (profile?.plan !== "pro") return 403;`)) !== "pro")
  erreurs.push("contre-épreuve ratée : une règle pro-only n'est plus détectée");
if (payants(regleRoute(`if (!["solo","pro"].includes(profile?.plan ?? "")) return 403;`)) !== "pro+solo")
  erreurs.push("contre-épreuve ratée : une règle solo+pro n'est plus détectée");

if (erreurs.length) {
  for (const e of erreurs) console.error("✗ " + e);
  process.exit(1);
}
console.log(`✓ Vitrine <-> droits alignés : ${matrice.size} fonctions dans la matrice, ${croisees} règles de route croisées, vitrines dérivées.`);
