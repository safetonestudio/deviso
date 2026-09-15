/**
 * Les sièges facturés correspondent-ils à ce que les CGU promettent ?
 *
 * Le calcul est pur : on peut le juger sans toucher à Stripe. Ce que ce script
 * vérifie, c'est la jointure entre un texte contractuel et une fonction — le
 * genre d'écart qui ne se voit ni à la compilation ni à la relecture, et qui
 * s'était installé : l'ancienne version facturait un siège dès le PREMIER
 * collaborateur, quand les CGU en incluent deux.
 *
 * Usage : node --experimental-strip-types scripts/e2e/sieges.mjs
 */

import { readFileSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";
import { siegesDus, MEMBRES_INCLUS } from "../../lib/sieges.ts";

console.log("");
console.log("── Sièges facturés : la fonction contre les CGU ───────────────");
console.log("");

const cgu = readFileSync("app/cgu/page.tsx", "utf8");

verifier(
  "les CGU annoncent bien le titulaire et 2 membres inclus",
  /3 utilisateurs inclus[^<]*le titulaire du compte et 2 membres/.test(cgu),
  "si la grille change, ce contrôle doit échouer AVANT la facturation"
);

verifier(
  "MEMBRES_INCLUS vaut ce que les CGU annoncent",
  MEMBRES_INCLUS === 2,
  `MEMBRES_INCLUS = ${MEMBRES_INCLUS}`
);

const attendu = [
  [0, 0, "le titulaire seul ne paie aucun siège"],
  [1, 0, "le premier collaborateur est inclus"],
  [2, 0, "le deuxième collaborateur est inclus"],
  [3, 1, "le troisième collaborateur est le premier siège facturé"],
  [4, 2, "puis un siège par collaborateur"],
  [10, 8, "et cela reste vrai à la limite de dix membres"],
];

for (const [membres, sieges, phrase] of attendu) {
  verifier(phrase, siegesDus(membres) === sieges, `${membres} membre(s) → ${siegesDus(membres)} siège(s), attendu ${sieges}`);
}

verifier(
  "un décompte négatif ne produit pas de siège négatif",
  siegesDus(-3) === 0,
  `${siegesDus(-3)} — un avoir involontaire serait pire qu'une surfacturation`
);

console.log("");
console.log("── Contre-épreuve ────────────────────────────────────────────");
verifier(
  "un calcul qui facturerait dès le premier membre serait bien détecté",
  ((faux) => faux(1) !== siegesDus(1))((n) => n),
  "siegesDus(1) doit valoir 0, pas 1"
);

console.log("");
console.log("── Non couvert ───────────────────────────────────────────────");
console.log("  · la pose réelle de la quantité chez Stripe : il faudrait un");
console.log("    abonnement vivant, donc un débit réel.");
console.log("  · l'alignement en cas de divergence déjà installée : la fonction");
console.log("    la répare au prochain appel, ce n'est pas prouvé ici.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
