/**
 * Garde : la facture à l'écran et son PDF disent la même chose.
 *
 * Depuis le 24/11/2026, la page d'une facture montre une reproduction du PDF
 * Factur-X (components/document/FeuilleFacture.tsx). Ce que l'utilisateur voit
 * doit être ce que reçoit son client : les deux rendus lisent donc les mêmes
 * textes, calculés par `contenuFacture()` (lib/facture-contenu.ts).
 *
 * Ce contrôle vérifie que :
 *  1. les deux rendus appellent `contenuFacture()` ;
 *  2. chaque champ de `ContenuFacture` est affiché par les DEUX rendus
 *     (un champ ajouté au PDF seul, ou à l'écran seul, fait échouer) ;
 *  3. aucun des deux n'écrit en dur une mention que la source porte déjà.
 *
 * Usage : node scripts/check-feuille-facture.mjs
 */
import { readFileSync } from "node:fs";

const lire = (f) => readFileSync(f, "utf8");
const SOURCE = "lib/facture-contenu.ts";
const RENDUS = ["lib/invoice-pdf.tsx", "components/document/FeuilleFacture.tsx"];
let ko = 0;
const exige = (intitule, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "  KO  "} ${intitule}${!ok && detail ? `\n       ${detail}` : ""}`);
  if (!ok) ko++;
};

/** Champs de l'interface ContenuFacture. */
export function champs(src) {
  const m = src.match(/export interface ContenuFacture \{([\s\S]*?)\n\}/);
  if (!m) return [];
  return [...m[1].matchAll(/^\s{2}(\w+)\s*:/gm)].map((x) => x[1]);
}
/** Champs non lus par un rendu (`c.x`, ou déstructuré `const { x } = c`). */
export function manquants(rendu, liste) {
  const destructures = [...rendu.matchAll(/const \{([^}]*)\} = c\b/g)].flatMap((x) => x[1].split(",").map((s) => s.trim()));
  return liste.filter((k) => !new RegExp("\\bc\\." + k + "\\b").test(rendu) && !destructures.includes(k));
}
const MENTIONS = [/Mentions l[ée]gales/, /Modalit[ée]s de paiement/, /Nature de l'op[ée]ration/, /Art\. L441-10/, /Total TTC/];

const liste = champs(lire(SOURCE));
exige(`${SOURCE} décrit le contenu (${liste.length} champs)`, liste.length >= 10);
for (const f of RENDUS) {
  const src = lire(f);
  exige(`${f} lit contenuFacture()`, /contenuFacture\(/.test(src));
  const m = manquants(src, liste);
  exige(`${f} affiche chaque champ du contenu`, m.length === 0, `non affichés : ${m.join(", ")}`);
  const durs = MENTIONS.filter((r) => r.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")));
  exige(`${f} n'écrit aucune mention en dur`, durs.length === 0, `en dur : ${durs.join(", ")}`);
}

// Contre-épreuves : le contrôle doit crier sur un rendu qui oublie un champ
// ou qui réécrit une mention.
const rendu = lire(RENDUS[1]);
exige("contre-épreuve : un rendu sans les mentions EST détecté", manquants(rendu.replaceAll("c.mentions", "x"), liste).includes("mentions"));
exige("contre-épreuve : une mention en dur EST détectée", MENTIONS.some((r) => r.test(`${rendu}\n<p>Mentions légales</p>`)));

if (ko) { console.log(`\ncheck:feuille-facture ECHEC (${ko})`); process.exit(1); }
console.log("\ncheck:feuille-facture, l'écran et le PDF lisent le même contenu.");
