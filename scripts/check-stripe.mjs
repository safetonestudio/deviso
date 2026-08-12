/**
 * Contrôle statique : aucune écriture Stripe sans garde-fou démonstration.
 *
 * Pourquoi ce contrôle existe. Le portail de facturation créait un vrai client
 * Stripe dans le compte de production quand un visiteur de la démo cliquait
 * « Gérer mon abonnement ». Le tunnel de paiement, lui, avait le contrôle. Le
 * défaut n'était donc pas une règle absente mais une règle appliquée à un
 * endroit sur deux — exactement le genre de trou qu'une relecture ne voit pas,
 * puisque chaque fichier lu isolément semble correct.
 *
 * Ce script énumère tout appel qui **écrit** dans Stripe et exige que le fichier
 * qui le contient refuse explicitement les comptes de démonstration. Un nouveau
 * point d'écriture ajouté demain fera échouer `npm run verify` tant qu'il n'aura
 * pas son garde-fou.
 *
 * Ce qu'il ne prouve pas : que le garde-fou est placé *avant* l'appel, ni qu'il
 * porte sur le bon identifiant. C'est `scripts/e2e/stripe.mjs` qui le traverse
 * réellement, en production, et qui constate les 403.
 *
 * Usage : node scripts/check-stripe.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ECRITURES = /stripe\.[A-Za-z.]*\.(create|update|del|cancel)\s*\(/g;
const GARDE = /estCompteDemo|is_demo/;

function fichiers(dossier, acc = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (nom === "node_modules" || nom === ".next") continue;
    if (statSync(chemin).isDirectory()) fichiers(chemin, acc);
    else if (/\.tsx?$/.test(nom)) acc.push(chemin);
  }
  return acc;
}

let echecs = 0;
let pointsDEcriture = 0;
const vus = [];

for (const chemin of [...fichiers("app"), ...fichiers("lib")]) {
  const source = readFileSync(chemin, "utf8");
  const appels = [...source.matchAll(ECRITURES)];
  if (appels.length === 0) continue;

  pointsDEcriture += appels.length;
  const protege = GARDE.test(source);
  vus.push({ chemin, appels: appels.length, protege });

  const marque = protege ? "  ok  " : " ÉCHEC";
  console.log(`${marque}  ${chemin} — ${appels.length} écriture(s) Stripe`);
  if (!protege) {
    echecs++;
    console.log(`        aucun refus des comptes de démonstration dans ce fichier.`);
    console.log(`        appels : ${appels.map((a) => a[0].replace(/\s*\($/, "")).join(", ")}`);
    console.log(`        corriger : importer estCompteDemo depuis @/lib/stripe-guard`);
    console.log(`                   et refuser avant tout appel d'écriture.`);
  }
}

console.log("");
console.log(`${pointsDEcriture} écritures Stripe réparties sur ${vus.length} fichiers.`);

// Contre-épreuve intégrée : le contrôle doit savoir échouer.
// On rejoue la détection sur un fichier fictif dépourvu de garde-fou.
const temoin = `import { stripe } from "@/lib/stripe";\nawait stripe.customers.create({});\n`;
const temoinDetecte = [...temoin.matchAll(ECRITURES)].length === 1 && !GARDE.test(temoin);
if (!temoinDetecte) {
  console.log("ÉCHEC  contre-épreuve : le contrôle ne détecte plus une écriture non gardée.");
  echecs++;
} else {
  console.log("Contre-épreuve : un fichier sans garde-fou est bien détecté.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} problème(s). Une écriture Stripe non gardée peut polluer le compte de production.`);
  process.exit(1);
}
console.log("Toute écriture Stripe est dans un fichier qui refuse les comptes de démonstration.");
