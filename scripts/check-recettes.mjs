#!/usr/bin/env node
/**
 * Garde du livre des recettes : distinction ventes de biens / prestations de
 * services. Le CA micro se declare par categorie (abattements et seuils
 * differents : 71 %/203 100 EUR pour les biens, 50 %/83 600 EUR pour les
 * services, plafonds 2026). Sans cette distinction, le livre ne permet pas de remplir la
 * declaration d'une activite mixte. La source est invoices.operation_category,
 * la meme que l'export FEC : les deux ne peuvent pas diverger.
 *
 * Usage : node scripts/check-recettes.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

let echecs = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const ko = (m, p) => { echecs++; console.log(`  KO   ${m}\n       ${p}`); };
const exige = (m, c, p) => (c ? ok(m) : ko(m, p));
const contre = (m, d) => (d ? ok(`contre-epreuve : ${m} EST detecte`) : ko(`contre-epreuve : ${m}`, "le controle ne verrait pas l'infraction"));
const lire = (f) => readFileSync(f, "utf8");

console.log("");
console.log("-- check:recettes --");
console.log("");

const lib = lire(join("lib", "recettes.ts"));
const route = lire(join("app", "api", "export", "livre-recettes", "route.ts"));
const page = lire(join("app", "(dashboard)", "livre-recettes", "page.tsx"));

// 1. Categorie calculee depuis operation_category, et ce champ est bien lu.
const mappe = (s) => /categorie: f\.operation_category === "goods" \? "biens" : "services"/.test(s);
const champLu = /const CHAMPS[^;]*operation_category/.test(lib);
exige("recettes, catégorie calculée depuis operation_category", mappe(lib) && champLu, "sans operation_category dans la lecture ET le mapping, toute recette passerait en services");
contre("une catégorie figée en services", !mappe(lib.replace('f.operation_category === "goods" ? "biens" : "services"', '"services"')));

// 2. Totaux par categorie exposes.
exige("recettes, totaux par catégorie exposés", /export function totauxParCategorie/.test(lib), "la déclaration micro a besoin du CA ventilé par catégorie");

// 3. Export CSV du livre : colonne Categorie.
exige(
  "export livre des recettes, colonne Catégorie présente",
  /"Catégorie"/.test(route) && /Vente de biens/.test(route) && /Prestation de services/.test(route),
  "le CSV du livre doit distinguer ventes de biens et prestations de services",
);
contre("un export sans colonne catégorie", !/"Catégorie"/.test(route.replace('"Catégorie", ', "")));

// 4. Page du livre : repartition par categorie affichee.
exige(
  "page livre des recettes, répartition par catégorie affichée",
  /totauxParCategorie\(/.test(page) && /Répartition pour la déclaration/.test(page),
  "le titulaire doit voir le CA biens vs services pour remplir sa déclaration",
);

console.log("");
if (echecs) {
  console.log(`check:recettes, ${echecs} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("check:recettes, livre des recettes : biens / services distingués (écran, export, source unique operation_category).");
