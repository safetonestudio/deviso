/**
 * check:tirets, aucun tiret cadratin U+2014 dans le code ni le contenu.
 *
 * Pourquoi ce controle existe. Le tiret cadratin U+2014 utilise comme incise ou
 * connecteur est une signature typique du texte produit par une IA. Signale par
 * Selim le 27/09/2026 : il n'en veut nulle part, c'est typique de code fait par
 * l'IA. Les 2389 occurrences ont ete remplacees par de la ponctuation ce jour.
 *
 * Contrairement a check:emoji, ce controle NE retire PAS les commentaires : le
 * tiret cadratin ne doit apparaitre nulle part, commentaires de code compris,
 * puisque c'est justement la qu'il trahit l'origine IA.
 *
 * Ce qu'il ne couvre pas : le tiret demi-cadratin U+2013 n'est PAS interdit, il
 * sert a des plages legitimes (dates, prix) ; et les donnees JSON de reference
 * (ex. docs/superpdp/openapi.json) ne sont pas scannees.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = process.cwd();
const IGNORE = new Set(["node_modules", ".next", ".git", "public"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mjs"]);
const CADRATIN = String.fromCharCode(0x2014);

// Outils tiers installés dans le dépôt (skills Claude : design-taste, motion…,
// ajoutés le 04/11/2026). Ce ne sont ni le code ni le contenu de Deviso, rien
// n'en est servi aux visiteurs, et les réécrire reviendrait à modifier des
// fichiers de fournisseurs que leurs mises à jour écraseraient.
// docs/reference : notes de travail locales, hors Git (.gitignore), dont des
// extraits de sources tierces cites tels quels.
const DOSSIERS_TIERS = new Set([join(".claude", "skills"), join("docs", "reference")]);
// Fichier régénéré par `next dev` à chaque lancement (non suivi par git).
const FICHIERS_GENERES = new Set(["AGENTS.md"]);

const ignoreDir = (nom, chemin) =>
  IGNORE.has(nom) || nom.startsWith("_scratch") || DOSSIERS_TIERS.has(relative(RACINE, chemin));

function fichiers(dir) {
  const out = [];
  for (const nom of readdirSync(dir)) {
    const chemin = join(dir, nom);
    const st = statSync(chemin);
    if (st.isDirectory()) {
      if (!ignoreDir(nom, chemin)) out.push(...fichiers(chemin));
    } else if (EXTENSIONS.has(chemin.slice(chemin.lastIndexOf("."))) && !FICHIERS_GENERES.has(relative(RACINE, chemin))) {
      out.push(chemin);
    }
  }
  return out;
}

const fautifs = [];
for (const f of fichiers(RACINE)) {
  const lignes = readFileSync(f, "utf8").split(/\r?\n/);
  lignes.forEach((ligne, i) => {
    if (ligne.includes(CADRATIN)) {
      fautifs.push(`${relative(RACINE, f)}:${i + 1}: ${ligne.trim().slice(0, 120)}`);
    }
  });
}

if (fautifs.length) {
  console.error(`✗ check:tirets, ${fautifs.length} tiret(s) cadratin U+2014 trouve(s). Remplacez par de la ponctuation :\n`);
  console.error(fautifs.slice(0, 50).join("\n"));
  if (fautifs.length > 50) console.error(`... et ${fautifs.length - 50} autre(s).`);
  process.exit(1);
}
console.log("✓ Tirets, aucun tiret cadratin U+2014 dans le code ni le contenu.");
