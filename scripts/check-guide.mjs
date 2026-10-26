/**
 * Contrôle : chaque page du tableau de bord est couverte par le mode guidé.
 *
 * Le mode guidé, ce sont les bandeaux <GuidedTourBanner> affichés en haut de
 * chaque page quand l'utilisateur l'active. Le défaut qu'on rend ici impossible :
 * ajouter une page à la navigation et oublier son bandeau. C'est exactement ce
 * qui était arrivé à « Factures reçues », « Déclarations », « Achats à
 * l'étranger », « Livre des recettes » et « Abonnement » : présentes au menu,
 * absentes du mode guidé.
 *
 * Ce que le contrôle vérifie :
 *   1. toute page de navigation (hors exclusions déclarées) rend un bandeau ;
 *   2. toute clé pageKey utilisée existe dans le type PageKey du composant ;
 *   3. toute clé déclarée sert quelque part (pas de contenu mort).
 *
 * Ce qu'il ne prouve pas : que le texte du bandeau est juste, ni qu'il s'affiche
 * bien. Cela demande des yeux.
 *
 * Usage : node scripts/check-guide.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const NAV = "lib/navigation.ts";
const BANNER = "components/GuidedTourBanner.tsx";
const DASHBOARD = "app/(dashboard)";

// Pages de navigation volontairement sans bandeau par page.
const EXCLUS = new Set([
  "/prise-en-main", // le hub qui porte l'interrupteur du mode guidé, pas une page guidée
]);

let echecs = 0;
const fail = (m) => { echecs++; console.log("✗ " + m); };

// ── 1. Clés déclarées dans le type PageKey ────────────────────────────────
const banner = readFileSync(BANNER, "utf8");
const clesDeclarees = new Set(
  [...banner.matchAll(/^\s*\|\s*"([^"]+)"/gm)].map((m) => m[1])
);
if (clesDeclarees.size === 0) fail(`aucune clé PageKey trouvée dans ${BANNER}`);

// ── 2. Références pageKey="..." dans tout le tableau de bord ───────────────
function fichiersTsx(dir) {
  const out = [];
  for (const nom of readdirSync(dir)) {
    if (nom === "node_modules" || nom === ".next" || nom.startsWith(".fuse_hidden")) continue;
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) out.push(...fichiersTsx(p));
    else if (nom.endsWith(".tsx")) out.push(p);
  }
  return out;
}
const clesUtilisees = new Set();
for (const f of fichiersTsx(DASHBOARD)) {
  for (const m of readFileSync(f, "utf8").matchAll(/pageKey="([^"]+)"/g)) clesUtilisees.add(m[1]);
}

for (const k of clesUtilisees) {
  if (!clesDeclarees.has(k)) fail(`pageKey "${k}" utilisée mais absente du type PageKey de ${BANNER}`);
}
for (const k of clesDeclarees) {
  if (!clesUtilisees.has(k)) fail(`clé "${k}" déclarée dans ${BANNER} mais jamais utilisée (contenu mort)`);
}

// ── 3. Chaque page de navigation rend un bandeau ──────────────────────────
const nav = readFileSync(NAV, "utf8");
const hrefs = [...nav.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
let verifiees = 0;
for (const href of hrefs) {
  if (EXCLUS.has(href)) continue;
  const page = `${DASHBOARD}${href}/page.tsx`;
  if (!existsSync(page)) { fail(`page introuvable pour ${href} (${page})`); continue; }
  if (!/<GuidedTourBanner\b/.test(readFileSync(page, "utf8"))) {
    fail(`${href} : la page ne rend pas de <GuidedTourBanner> (mode guidé absent)`);
  } else {
    verifiees++;
  }
}

// ── Contre-épreuve : le contrôle sait-il repérer une page sans bandeau ? ───
const temoinSansBandeau = "export default function P() { return <div>rien</div>; }";
if (/<GuidedTourBanner\b/.test(temoinSansBandeau)) {
  fail("contre-épreuve : le motif ne distingue plus une page sans bandeau.");
} else {
  console.log("Contre-épreuve : une page sans bandeau serait bien détectée.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} problème(s) de couverture du mode guidé.`);
  process.exit(1);
}
console.log(
  `✓ Mode guidé : ${verifiees} page(s) de navigation couvertes, ${clesDeclarees.size} clés, aucune orpheline ni morte`
);
