// Garde statique du modèle d'autorisations (voir CLAUDE.md, « Membres d'équipe »).
//
// Il ne teste pas le comportement — c'est le rôle des e2e — mais il empêche la
// régression la plus probable : qu'un refactor déplace ou supprime une garde
// sans que personne ne le voie. Chaque route sensible DOIT porter sa garde.
// Si tu ajoutes une route qui accomplit un des cinq actes, ou un acte
// titulaire-seul, ajoute-la ici : c'est le point unique qui dit « ceci est
// gardé, et par quoi ».

import { readFileSync } from "node:fs";

const R = "app/api";
let echecs = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const ko = (m) => { console.log(`  ÉCHEC ${m}`); echecs++; };

function lire(chemin) {
  try { return readFileSync(chemin, "utf8"); }
  catch { ko(`fichier introuvable : ${chemin}`); return ""; }
}

// 1) Les cinq actes réglables → exigerActe avec la bonne clé.
const ACTES = [
  ["proposals/[id]/send-email/route.ts", "envoyer_devis"],
  ["invoices/[id]/send-email/route.ts", "envoyer_facture"],
  ["superpdp/invoices/[id]/emettre/route.ts", "transmettre_pa"],
  ["invoices/[id]/chorus-pro/route.ts", "deposer_chorus"],
  ["superpdp/invoices/[id]/refuser/route.ts", "refuser_facture_recue"],
];
for (const [f, acte] of ACTES) {
  const src = lire(`${R}/${f}`);
  const re = new RegExp(`exigerActe\\([^)]*"${acte}"`);
  if (re.test(src)) ok(`${f} garde « ${acte} »`);
  else ko(`${f} ne garde PAS « ${acte} » (exigerActe manquant)`);
}

// 2) Le passage d'un devis à « sent » est gardé côté serveur, pas seulement en UI.
{
  const src = lire(`${R}/proposals/[id]/route.ts`);
  if (/modifs\.status === "sent"[\s\S]{0,200}exigerActe\([^)]*"envoyer_devis"/.test(src))
    ok("proposals PATCH garde status=sent par « envoyer_devis »");
  else ko("proposals PATCH : status=sent n'est pas gardé par « envoyer_devis »");
}

// 2 bis) Le passage d'une FACTURE à « sent » est gardé par « envoyer_facture ».
{
  const src = lire(`${R}/invoices/[id]/route.ts`);
  if (/body\.status === "sent"[\s\S]{0,200}exigerActe\([^)]*"envoyer_facture"/.test(src))
    ok("invoices PATCH garde status=sent par « envoyer_facture »");
  else ko("invoices PATCH : status=sent n'est pas gardé par « envoyer_facture »");
}

// 3) Actes titulaire-seul → exigerTitulaire présent.
const TITULAIRE = [
  "export/fec/route.ts",
  "export/invoices-csv/route.ts",
  "export/monthly-recap/route.ts",
  "crm/route.ts",
  "stats/route.ts",
  "superpdp/invoices/[id]/encaisser/route.ts",
  "superpdp/connect/route.ts",
  "proposals/[id]/route.ts",       // DELETE
  "invoices/[id]/route.ts",        // DELETE + PATCH (paiement)
  "team/route.ts",                 // POST (inviter)
  "team/[memberId]/route.ts",      // DELETE (retirer) + PATCH (permissions)
];
for (const f of TITULAIRE) {
  const src = lire(`${R}/${f}`);
  if (/exigerTitulaire\(/.test(src)) ok(`${f} appelle exigerTitulaire`);
  else ko(`${f} n'appelle PAS exigerTitulaire`);
}

// 4) Marquer une facture payée = titulaire seul (encaissement).
{
  const src = lire(`${R}/invoices/[id]/route.ts`);
  if (/status === "paid" \|\| body\.paid_at !== undefined[\s\S]{0,160}exigerTitulaire/.test(src))
    ok("invoices PATCH garde « payée » par exigerTitulaire");
  else ko("invoices PATCH : « payée »/paid_at n'est pas gardé par exigerTitulaire");
}

// 5) L'ancien circuit de validation ne doit PAS réapparaître.
import { existsSync } from "node:fs";
for (const mort of ["proposals/[id]/approve", "proposals/[id]/reject", "proposals/[id]/submit-for-approval"]) {
  if (existsSync(`${R}/${mort}/route.ts`))
    ko(`la route supprimée « ${mort} » est réapparue (ancien circuit de validation)`);
  else ok(`« ${mort} » reste supprimée`);
}

console.log("");
if (echecs > 0) {
  console.log(`check:droits — ${echecs} échec(s). Le modèle d'autorisations n'est pas intègre.`);
  process.exit(1);
}
console.log("check:droits — modèle d'autorisations intègre : 5 actes gardés, titulaire-seul gardé, ancien circuit absent.");
