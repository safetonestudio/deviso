/**
 * check:emoji — aucun emoji dans ce que l'utilisateur voit.
 *
 * Pourquoi ce contrôle existe. Les 133 emoji de l'interface étaient rendus par
 * la police du système : multicolores, et différents sur chaque appareil. À
 * côté d'une barre latérale en `lucide-react` (monochrome, trait fin), ça
 * faisait deux identités visuelles dans la même page. Signalé par Selim :
 * « these icons make the whole thing look extremely cheap ».
 *
 * Ils ont été remplacés le 22/08/2026. Ce script est là pour que la leçon tienne
 * sans être racontée : un emoji qui revient fait échouer `npm run verify`.
 *
 * ⚠️ Ce que ce contrôle NE couvre PAS — à écrire noir sur blanc, c'est la règle :
 *   · il ne dit rien du **choix** de l'icône (une `Bell` là où il fallait une
 *     `Send` passe au vert) ;
 *   · il ne dit rien de la **taille** ni de la **couleur** : une icône lucide
 *     en 32 px pastel au milieu d'une ligne de texte passe au vert ;
 *   · il ne regarde pas les commentaires de code, ni les objets d'email
 *     construits ailleurs qu'ici — l'objet est vérifié par `check:emails` ;
 *   · il ne voit pas les emoji saisis par un utilisateur dans ses propres
 *     données (titre de devis, nom de prestation) : ce sont ses données, pas
 *     notre interface.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = process.cwd();
const DOSSIERS = ["app", "components", "lib", "hooks"];
const IGNORE = new Set(["node_modules", ".next", ".git", "public"]);

/** Caractères pictographiques admis, avec la raison. */
const AUTORISES = new Map([
  ["©", "symbole de copyright, du texte et non une icône"],
]);

const PICTO = /\p{Extended_Pictographic}/u;

/**
 * Retire commentaires de ligne, commentaires de bloc et chaînes d'import.
 * Un `⚠️` en tête d'un commentaire d'avertissement n'est jamais rendu ; c'est
 * même la convention du projet. Le contrôle ne doit pas s'y opposer.
 */
function sansCommentaires(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function fichiers(dossier) {
  const out = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (IGNORE.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mjs)$/.test(e.name)) out.push(p);
    }
  })(dossier);
  return out;
}

const problemes = [];
let lus = 0;

for (const dossier of DOSSIERS) {
  let ok = true;
  try { ok = statSync(join(RACINE, dossier)).isDirectory(); } catch { ok = false; }
  if (!ok) continue;

  for (const f of fichiers(join(RACINE, dossier))) {
    lus++;
    const lignes = sansCommentaires(readFileSync(f, "utf8")).split(/\r?\n/);
    lignes.forEach((ligne, i) => {
      if (!PICTO.test(ligne)) return;
      for (const car of [...ligne]) {
        if (!PICTO.test(car)) continue;
        if (AUTORISES.has(car)) continue;
        problemes.push({
          fichier: relative(RACINE, f),
          ligne: i + 1,
          car,
          extrait: ligne.trim().slice(0, 120),
        });
      }
    });
  }
}

if (problemes.length === 0) {
  console.log(`check:emoji — ${lus} fichiers, aucun emoji dans l'interface.`);
  process.exit(0);
}

console.error(`check:emoji — ${problemes.length} emoji dans l'interface :\n`);
for (const p of problemes) {
  console.error(`  ${p.fichier}:${p.ligne}  ${p.car}`);
  console.error(`    ${p.extrait}`);
}
console.error(`
Remplacer par une icône lucide-react, alignée en taille et en couleur sur la
barre latérale (\`<Icon size={16} />\`, couleur héritée du texte). Si une entrée
correspond à une page du menu, reprendre l'icône de lib/navigation.ts.

Un caractère qui doit rester (symbole typographique, pas une icône) s'ajoute à
la table AUTORISES de ce script, avec sa raison.`);
process.exit(1);
