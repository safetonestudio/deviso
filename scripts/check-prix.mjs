/**
 * Aucun prix de Deviso n'est écrit à la main hors de `lib/grille-tarifaire.ts`.
 *
 * Pourquoi ce contrôle existe. Au changement de grille du 23/11/2026, les prix
 * étaient retapés dans quinze endroits : vitrine, page Abonnement, écran de fin
 * d'essai, boutons, bannières, CGU, page experts-comptables, données
 * structurées pour Google, guide de prise en main, scripts de contrôle. Chaque
 * oubli aurait affiché un prix qui n'est plus celui de Stripe. Tout lit
 * désormais la source unique ; ce script empêche le retour d'un montant écrit
 * en dur.
 *
 * Ce qu'il refuse, dans app/, components/ et lib/ :
 *   · une ligne qui parle d'une formule ou d'un siège ET porte un montant en
 *     euros écrit en chiffres (« Solo à 24 €/mois », « +8 € par utilisateur ») ;
 *   · un prix en dur dans les données structurées (`price: "24"`) ;
 *   · n'importe où, un montant de la grille en vigueur suivi de « € ».
 * Les montants d'exemple des articles et des devis de démonstration ne parlent
 * pas de formule : ils ne sont pas visés.
 *
 * Usage : node --experimental-strip-types scripts/check-prix.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { prix, PRIX_SIEGE } from "../lib/grille-tarifaire.ts";

const RACINES = ["app", "components", "lib"];
const SOURCE = join("lib", "grille-tarifaire.ts");

// Une ligne qui parle de la grille de Deviso.
const SUJET = /\b(Solo|Pro)\b|siège|utilisateur supplémentaire|par utilisateur|par personne|abonnement|formule/i;
// Un montant écrit en chiffres, suivi du signe euro (espace ordinaire ou insécable).
const MONTANT = /(?<![\w${])\d+(?:[,.]\d+)?(?:\s| | |"\s*\+\s*NB\s*\+\s*")?(?:€|euros?\b)/;
// Les montants de la grille en vigueur : écrits en clair hors de la source,
// ils signent un prix retapé à la main (« Facturé 230,40 € HT par an »).
const GRILLE = [...new Set([
  ...["solo", "pro"].flatMap((f) => Object.values(prix(f))),
  PRIX_SIEGE,
])].filter((m) => m.length > 1 || m === PRIX_SIEGE);
const ECHAP = (s) => s.replace(/[.,]/g, (c) => "\\" + c);
const MONTANT_GRILLE = new RegExp(String.raw`(?<![\d,.])(?:${GRILLE.map(ECHAP).join("|")})(?![\d,.])[\s  ]?(?:€|euros?\b)`);
// Un prix d'offre écrit en dur dans les données structurées.
const OFFRE = /"@type":\s*"Offer"[^}]*price:\s*"\d/;

function fichiers(dossier) {
  const out = [];
  for (const nom of readdirSync(dossier)) {
    const p = join(dossier, nom);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (/\.(tsx?|mjs)$/.test(nom)) out.push(p);
  }
  return out;
}

/** Les lignes fautives d'un texte, pour le contrôle et sa contre-épreuve. */
export function fautes(texte) {
  const res = [];
  texte.split("\n").forEach((ligne, i) => {
    if ((SUJET.test(ligne) && MONTANT.test(ligne)) || OFFRE.test(ligne) || MONTANT_GRILLE.test(ligne)) res.push({ n: i + 1, ligne: ligne.trim() });
  });
  return res;
}

// Contre-épreuves : le contrôle doit crier sur ces lignes, sinon il ne prouve rien.
const DOIT_CRIER = [
  'label="Passer Solo, 24€/mois"',
  'lignes: ["3 utilisateurs inclus, puis 8 € HT par mois et par personne"]',
  '{ "@type": "Offer", name: "Pro", price: "44", priceCurrency: "EUR" },',
  'prix: "24 à 44" + NB + "€ par mois", texte: "Solo"',
  'note: annuel ? "Facturé 230,40 € HT par an, soit 276,48 € TTC" : ""',
];
const NE_DOIT_PAS_CRIER = [
  '{ desc: "Gestion Instagram, 12 posts/mois", qty: "1 forfait/mois", price: "500 €" },',
  'label={`Passer Solo, ${grille("solo").mensuel}€/mois`}',
];

let echec = false;
for (const l of DOIT_CRIER) {
  if (fautes(l).length === 0) { console.error(`✗ contre-épreuve : le contrôle ne voit pas « ${l} »`); echec = true; }
}
for (const l of NE_DOIT_PAS_CRIER) {
  if (fautes(l).length > 0) { console.error(`✗ contre-épreuve : faux positif sur « ${l} »`); echec = true; }
}

const trouvees = [];
for (const racine of RACINES) {
  for (const f of fichiers(racine)) {
    if (f === SOURCE || f.includes(join("app", "blog")) || f.includes(join("api", "demo"))) continue;
    for (const { n, ligne } of fautes(readFileSync(f, "utf8"))) trouvees.push(`${f}:${n}  ${ligne.slice(0, 140)}`);
  }
}

if (trouvees.length) {
  console.error("✗ Prix écrits à la main hors de lib/grille-tarifaire.ts :");
  for (const t of trouvees) console.error("   " + t);
  console.error("  Lire les montants dans lib/grille-tarifaire.ts (prix(), PRIX_SIEGE).");
  echec = true;
}

if (echec) process.exit(1);
console.log("✓ check:prix, aucun prix écrit à la main hors de la source unique (contre-épreuves comprises)");
