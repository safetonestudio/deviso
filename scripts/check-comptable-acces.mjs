/**
 * Garde de forme de l'acces expert-comptable.
 *
 * L'invariant tient a trois endroits, et un seul oubli le casse en silence :
 *  1. Un comptable est en LECTURE SEULE quoi qu'il arrive (lib/droits.ts).
 *  2. Un comptable ne compte dans AUCUN siege facture (lib/stripe-seats.ts).
 *  3. Un comptable ne compte pas dans le quota de sieges ni dans la liste des
 *     membres (app/api/team/route.ts).
 * Plus l'existence de l'endpoint dedie, avec son garde de plan (des Solo).
 *
 * Comme check-comptable.mjs, chaque controle porte sa contre-epreuve : un motif
 * fautif fabrique sur place, dont on verifie qu'il serait bien detecte. Un
 * controle qui ne trouve jamais rien est indiscernable d'un controle casse.
 *
 * Usage : node scripts/check-comptable-acces.mjs
 */
import { readFileSync } from "node:fs";

let echecs = 0;
const lire = (p) => readFileSync(p, "utf8");
const ok = (nom) => console.log("  ok   " + nom);
const ko = (nom, d) => { console.error("ECHEC  " + nom + (d ? " : " + d : "")); echecs++; };
function verifier(nom, condition) { condition ? ok(nom) : ko(nom); }

// Detecteurs
const forceLectureSeule = (s) =>
  /role === ROLE_COMPTABLE\)\s*return\s*\{\s*\.\.\.PERMISSIONS_AUCUNE/.test(s);
const exclutComptable = (s) =>
  (s.match(/\.neq\("role", ROLE_COMPTABLE\)/g) || []).length;

// 1. droits.ts : comptable force en lecture seule
const droits = lire("lib/droits.ts");
verifier("droitsDe court-circuite le comptable en lecture seule", forceLectureSeule(droits));
// contre-epreuve : sans la ligne, le detecteur doit echouer
verifier("contre-epreuve (droits sans court-circuit est detecte)",
  !forceLectureSeule(droits.replace(/if \(data\?\.role === ROLE_COMPTABLE\).*/g, "")));

// 2. stripe-seats.ts : comptable hors siege facture
const seats = lire("lib/stripe-seats.ts");
verifier("synchroniserSieges exclut le comptable du comptage", exclutComptable(seats) >= 1);
verifier("contre-epreuve (comptage sans neq est detecte)",
  exclutComptable(seats.replace(/\.neq\("role", ROLE_COMPTABLE\)/g, "")) === 0);

// 3. team/route.ts : comptable hors liste ET hors quota de sieges (2 requetes)
const team = lire("app/api/team/route.ts");
verifier("team/route exclut le comptable de la liste et du quota (>=2)", exclutComptable(team) >= 2);

// 4. endpoint dedie present, garde de plan des Solo, role pose a l'insertion
const ep = lire("app/api/team/comptable/route.ts");
verifier("endpoint comptable : garde de plan (PLAN_REQUIRED des Solo)",
  /PLANS_AUTORISES/.test(ep) && /"solo"/.test(ep) && /refusPlan\(\)/.test(ep));
verifier("endpoint comptable : insertion avec role comptable",
  /role: ROLE_COMPTABLE/.test(ep));
verifier("contre-epreuve (garde de plan absente est detectee)",
  !(/PLANS_AUTORISES/.test(ep.replace(/PLANS_AUTORISES/g, "X"))));

if (echecs > 0) {
  console.error("\n" + echecs + " controle(s) en echec.");
  process.exit(1);
}
console.log("\nAcces expert-comptable : garde OK.");
