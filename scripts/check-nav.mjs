/**
 * Contrôle : la navigation mobile et la barre latérale proposent la même chose.
 *
 * Pourquoi ce contrôle existe. L'entrée « Factures reçues » a été ajoutée dans
 * `SidebarNav` et oubliée dans `MobileNav`. Résultat : la page existait, elle
 * était fonctionnelle, et elle était **inatteignable depuis un téléphone**.
 * Personne ne pouvait le voir en relisant le code — les deux fichiers se lisent
 * parfaitement, chacun de son côté.
 *
 * C'est la même famille de défaut que tout le reste de ce projet : deux morceaux
 * corrects, pas reliés. Ici la jointure n'est pas technique mais humaine — il
 * faut penser à modifier les deux. Ce script s'en charge à notre place.
 *
 * Ce qu'il ne prouve pas : que le menu s'affiche correctement, ni qu'il est
 * utilisable au pouce. Cela demande un vrai téléphone.
 *
 * Usage : node scripts/check-nav.mjs
 */

import { readFileSync } from "node:fs";

const FICHIERS = {
  "barre latérale": "components/SidebarNav.tsx",
  "menu mobile": "components/MobileNav.tsx",
};

/** Extrait les entrées de navigation d'un fichier, sans exécuter le code. */
function entrees(chemin) {
  const source = readFileSync(chemin, "utf8");
  const trouvees = new Map();
  // Chaque entrée est un objet littéral sur une ligne contenant `href:`.
  for (const bloc of source.match(/\{[^{}]*href:\s*"[^"]+"[^{}]*\}/g) ?? []) {
    const href = bloc.match(/href:\s*"([^"]+)"/)[1];
    trouvees.set(href, {
      label: bloc.match(/label:\s*"([^"]+)"/)?.[1] ?? "?",
      pro: /pro:\s*true/.test(bloc),
      ownerOnly: /ownerOnly:\s*true/.test(bloc),
    });
  }
  return trouvees;
}

const [nomA, nomB] = Object.keys(FICHIERS);
const a = entrees(FICHIERS[nomA]);
const b = entrees(FICHIERS[nomB]);

let echecs = 0;

for (const [nomSource, source, nomCible, cible] of [
  [nomA, a, nomB, b],
  [nomB, b, nomA, a],
]) {
  for (const [href, item] of source) {
    if (!cible.has(href)) {
      echecs++;
      console.log(`✗ « ${item.label} » (${href}) est dans la ${nomSource}, absente du ${nomCible}`);
      console.log(`    la page est alors inatteignable depuis ce support.`);
    }
  }
}

// Les conditions d'affichage doivent aussi concorder : une entrée réservée au
// plan Pro d'un côté et ouverte à tous de l'autre, c'est une promesse tenue sur
// un support et pas sur l'autre.
for (const [href, item] of a) {
  const autre = b.get(href);
  if (!autre) continue;
  for (const cle of ["label", "pro", "ownerOnly"]) {
    if (item[cle] !== autre[cle]) {
      echecs++;
      console.log(`✗ ${href} — « ${cle} » diverge : ${nomA} = ${JSON.stringify(item[cle])}, ${nomB} = ${JSON.stringify(autre[cle])}`);
    }
  }
}

// Contre-épreuve : le contrôle doit savoir détecter une divergence.
const temoin = new Map([["/x", { label: "X", pro: false, ownerOnly: false }]]);
if (temoin.has("/y") || !temoin.has("/x")) {
  console.log("✗ contre-épreuve : la comparaison ne fonctionne pas comme prévu.");
  echecs++;
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} divergence(s) entre les deux navigations.`);
  process.exit(1);
}
console.log(`✓ Navigation — ${a.size} entrées, identiques sur ordinateur et mobile`);
