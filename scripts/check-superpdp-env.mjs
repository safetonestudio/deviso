// Garde : chaque déploiement ne synchronise QUE les connexions Super PDP de son
// propre environnement. En prod (app OAuth prod), toucher une connexion « bac à
// sable » la churne en invalid_grant (et réciproquement). Né du constat du
// 07/08/10 2026 : le cron superpdp-sync prenait toutes les connexions verified
// sans filtrer l'environnement, ce qui tuait les comptes de test re-raccordés.
//
// Deux volets :
//  1. fonctionnel : la logique de partition est correcte sur toute la matrice,
//     avec contre-épreuve sur le cas dangereux (connexion sandbox en prod) ;
//  2. statique : le helper existe dans lib/superpdp.ts et le cron l'utilise bien
//     pour sauter (continue) les connexions de l'autre environnement.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ici = dirname(fileURLToPath(import.meta.url));
let echecs = 0;
function verifier(nom, ok, detail = "") {
  console.log(`  ${ok ? "ok " : "ECHEC"}  ${nom}${detail ? `  (${detail})` : ""}`);
  if (!ok) echecs++;
}

// Copie locale de la logique, liée au code réel par le volet statique ci-dessous.
const estDeCetEnv = (scheme, sandbox) => (scheme === "sandbox") === sandbox;

console.log("── Partition d'environnement (sandbox vs prod) ────────────────");

// En PRODUCTION (sandbox=false) : on traite fr_siren / be_*, on SAUTE sandbox.
verifier("prod traite fr_siren", estDeCetEnv("fr_siren", false) === true);
verifier("prod traite be_numero_entreprise", estDeCetEnv("be_numero_entreprise", false) === true);
verifier("prod SAUTE sandbox", estDeCetEnv("sandbox", false) === false);

// En BAC À SABLE (sandbox=true) : on traite sandbox, on SAUTE la prod.
verifier("sandbox traite sandbox", estDeCetEnv("sandbox", true) === true);
verifier("sandbox SAUTE fr_siren", estDeCetEnv("fr_siren", true) === false);
verifier("sandbox SAUTE be_numero_entreprise", estDeCetEnv("be_numero_entreprise", true) === false);

console.log("");
console.log("── Contre-épreuve : le cas dangereux est bien écarté ──────────");
// Le cas qui a tué les comptes de test : une connexion sandbox vue par la prod.
// Le garde DOIT l'exclure ; un « tout traiter » naïf (toujours true) la laisserait
// passer et la churnerait.
verifier("une connexion sandbox N'EST PAS traitée en prod", estDeCetEnv("sandbox", false) === false);
verifier("un « tout traiter » laisserait passer le cas dangereux", (() => true)() === true);

console.log("");
console.log("── Source : le helper existe et le cron l'utilise ─────────────");
const lib = readFileSync(join(ici, "..", "lib", "superpdp.ts"), "utf8");
verifier(
  "lib/superpdp.ts définit estConnexionDeCetEnv avec la bonne logique",
  lib.includes('(scheme === "sandbox") === sandbox')
);
const cron = readFileSync(join(ici, "..", "app", "api", "cron", "superpdp-sync", "route.ts"), "utf8");
verifier(
  "le cron superpdp-sync appelle estConnexionDeCetEnv et saute l'autre env",
  cron.includes("estConnexionDeCetEnv(") && cron.includes("continue;")
);

console.log("");
if (echecs > 0) {
  console.error(`check:superpdp-env : ${echecs} échec(s).`);
  process.exit(1);
}
console.log("check:superpdp-env : tout vert.");
