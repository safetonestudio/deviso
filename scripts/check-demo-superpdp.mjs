#!/usr/bin/env node
/**
 * check:demo-superpdp, une demonstration n atteint jamais la Plateforme Agreee.
 *
 * Constat du 18/10/2026 : apres le passage de Super PDP en production, la demo
 * affichait « Non raccorde » et « Transmission impossible ». La garde demo etait
 * posee route par route ; 17 routes ne l avaient pas, dont la route de statut,
 * appelee a chaque affichage du profil. Elle tentait de rafraichir le jeton
 * FICTIF aupres de la vraie plateforme, recevait invalid_grant et ecrivait
 * session_status = "error".
 *
 * La garde vit desormais au point de passage unique (accessTokenValide), plus la
 * revocation et la synchronisation. Ce controle verifie qu elle y reste, et
 * qu aucun nouveau fichier n appelle la plateforme en contournant ce passage.
 *
 * Usage : node scripts/check-demo-superpdp.mjs
 */
import { readFileSync, globSync } from "node:fs";

const erreurs = [];
const lire = (p) => readFileSync(p, "utf8");
const corps = (src, debut) => {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  return src.slice(i, i + 1600);
};

const lib = lire("lib/superpdp.ts");
const jeton = corps(lib, "async function accessTokenValide(");
if (!jeton) erreurs.push("lib/superpdp.ts : accessTokenValide introuvable, mettre a jour ce garde");
else {
  const garde = jeton.search(/estCompteDemo\(/);
  const premierAppel = jeton.search(/fetch\(|rafraichir|refreshTokens|oauth2\/token/);
  if (garde < 0 || !/throw new SuperPdpDemo/.test(jeton))
    erreurs.push("accessTokenValide : la garde demo (estCompteDemo + throw SuperPdpDemo) a disparu");
  else if (premierAppel >= 0 && premierAppel < garde)
    erreurs.push("accessTokenValide : un appel a la plateforme precede la garde demo");
}
const revoc = corps(lib, "export async function revokeToken(");
if (!revoc || !/JETON_DEMO/.test(revoc.slice(0, 300)))
  erreurs.push("revokeToken : le jeton de demonstration n est plus ecarte avant l appel");

const sync = corps(lire("lib/superpdp-sync.ts"), "export async function synchroniserFactures(");
if (!sync || !/estCompteDemo\(/.test(sync.slice(0, 900)))
  erreurs.push("synchroniserFactures : plus de sortie anticipee pour un compte demo (elle ecrirait last_error)");

if (/"demo-fictif-jamais-utilise"/.test(lire("app/api/demo/start/route.ts")))
  erreurs.push("demo/start : utiliser JETON_DEMO, pas le litteral (une seule source)");

// Appels directs a la plateforme : seuls ces fichiers y sont autorises.
// Les autres passent par superpdpFetch, donc par la garde.
const AUTORISES = new Set([
  "lib/superpdp.ts",                      // point de passage, OAuth, revocation
  "lib/superpdp-validation.ts",           // validation de document, sans jeton utilisateur
  "app/api/annuaire/entreprises/route.ts",// annuaire public, sans jeton utilisateur
  "lib/superpdp-annuaire.ts",             // annuaire national public (security: []), lecture seule
  "app/api/superpdp/callback/route.ts",   // retour OAuth, inatteignable en demo (connect garde)
]);
for (const f of [...globSync("app/**/*.ts"), ...globSync("lib/**/*.ts")]) {
  const chemin = f.replace(/\\/g, "/");
  if (AUTORISES.has(chemin)) continue;
  if (/fetch\(\s*`\$\{SUPERPDP_(API|HOST)\}/.test(lire(f)))
    erreurs.push(`${chemin} : appelle la plateforme directement, passer par superpdpFetch (garde demo)`);
}

if (erreurs.length) {
  for (const e of erreurs) console.error("✗ Demo/Super PDP : " + e);
  process.exit(1);
}
console.log("✓ Demo/Super PDP : garde au point de passage, revocation et synchronisation, aucun appel direct hors liste");
