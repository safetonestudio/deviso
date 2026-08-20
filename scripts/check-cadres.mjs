/**
 * Contrôle : toutes les pages du tableau de bord partagent le même cadre.
 *
 * Pourquoi ce contrôle existe. Les trois onglets de facturation — Devis,
 * Factures, Factures reçues — se présentaient de trois façons différentes :
 * l'une s'étalait sur toute la fenêtre faute de largeur, l'autre se collait à
 * gauche parce que `mx-auto` manquait, la troisième était correcte. En élargissant
 * la mesure, quatre largeurs distinctes cohabitaient sur les pages de liste.
 *
 * Aucune de ces différences n'était voulue. Elles se sont installées page après
 * page, chacune écrite à un moment différent, sans que rien ne rappelle la
 * convention.
 *
 * Deux cadres, et deux seulement :
 *
 *   · pages de **liste**       → `max-w-5xl mx-auto`
 *   · pages de **formulaire**  → `max-w-2xl mx-auto`
 *
 * La distinction n'est pas cosmétique. Une liste gagne à occuper la largeur
 * disponible ; un formulaire se saisit mieux sur une colonne courte, où l'œil
 * ne parcourt pas toute la fenêtre entre le libellé et le champ.
 *
 * Ce que ce contrôle ne prouve pas : que le rendu est agréable. Il vérifie une
 * convention, pas une mise en page.
 *
 * Usage : node scripts/check-cadres.mjs
 */

import { readFileSync } from "node:fs";

const LISTE = "max-w-5xl mx-auto";
const FORMULAIRE = "max-w-2xl mx-auto";

/** Chaque page et le cadre qu'elle doit porter. */
const PAGES = {
  "app/(dashboard)/dashboard/page.tsx": LISTE,
  "app/(dashboard)/proposals/page.tsx": LISTE,
  "app/(dashboard)/invoices/page.tsx": LISTE,
  "app/(dashboard)/factures-recues/page.tsx": LISTE,
  "app/(dashboard)/crm/page.tsx": LISTE,
  "app/(dashboard)/stats/page.tsx": LISTE,
  "app/(dashboard)/catalogue/page.tsx": LISTE,
  "app/(dashboard)/team/page.tsx": LISTE,
  "app/(dashboard)/paiements/page.tsx": FORMULAIRE,
  "app/(dashboard)/profil/page.tsx": FORMULAIRE,
  "app/(dashboard)/billing/page.tsx": FORMULAIRE,
};

/**
 * Extrait les classes du conteneur racine.
 *
 * On vise le `return (` indenté de deux espaces, celui du composant de page :
 * les retours anticipés (chargement, écran vide) sont plus profonds. Cette
 * distinction compte — une première version de ce script lisait l'état vide de
 * « Mes clients » et croyait la page centrée sur une colonne étroite.
 */
function cadreDe(chemin) {
  const source = readFileSync(chemin, "utf8");
  const m = source.match(/\n {2}return \(\s*\n\s*<>?\s*\n?\s*<div className="([^"]*)"/)
    ?? source.match(/\n {2}return \(\s*\n\s*<div className="([^"]*)"/);
  return m ? m[1] : null;
}

const porteCadre = (classes, attendu) =>
  attendu.split(" ").every((c) => classes.split(/\s+/).includes(c));

let echecs = 0;

for (const [chemin, attendu] of Object.entries(PAGES)) {
  let classes;
  try {
    classes = cadreDe(chemin);
  } catch {
    console.log(`✗ ${chemin} — fichier introuvable`);
    echecs++;
    continue;
  }

  const nom = chemin.replace("app/(dashboard)/", "").replace("/page.tsx", "");

  if (classes === null) {
    echecs++;
    console.log(`✗ ${nom} — conteneur racine non reconnu`);
    console.log(`    la page doit commencer par un <div className="…"> portant le cadre.`);
    continue;
  }

  if (!porteCadre(classes, attendu)) {
    echecs++;
    const type = attendu === LISTE ? "liste" : "formulaire";
    console.log(`✗ ${nom} — cadre « ${type} » attendu`);
    console.log(`    attendu : ${attendu}`);
    console.log(`    trouvé  : ${classes}`);
  }
}

// Contre-épreuve : le contrôle sait-il repérer un cadre absent ?
if (porteCadre("space-y-8", LISTE) || !porteCadre(`space-y-8 ${LISTE}`, LISTE)) {
  console.log("✗ contre-épreuve : la comparaison de cadres ne fonctionne pas.");
  echecs++;
} else {
  console.log("Contre-épreuve : un cadre manquant serait bien détecté.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} page(s) hors convention.`);
  process.exit(1);
}
console.log(
  `✓ Cadres — ${Object.keys(PAGES).length} pages, deux largeurs seulement (liste / formulaire)`
);
