/**
 * Contrôle : la route d'invitation du comptable et la garde d'accès du layout
 * s'accordent sur les plans où l'expert-comptable a accès.
 *
 * Le défaut rendu impossible : /api/team/comptable autorise l'invitation dès
 * Solo, tandis que app/(dashboard)/layout.tsx suspendait tout invité hors Pro,
 * comptable compris. On invitait donc un comptable en Solo pour le suspendre à
 * l'entrée. La parité est garantie par une source unique, PLANS_ACCES_COMPTABLE
 * dans lib/droits.ts : ce contrôle vérifie que les deux fichiers la consomment,
 * sans redéfinir leur propre liste de plans en dur.
 *
 * Usage : node scripts/check-comptable-plan.mjs
 */

import { readFileSync } from "node:fs";

const SOURCE = "lib/droits.ts";
const CONSOMMATEURS = {
  "route comptable": "app/api/team/comptable/route.ts",
  "garde du layout": "app/(dashboard)/layout.tsx",
};
const LISTE_EN_DUR = /["']solo["']\s*,\s*["']pro["']|["']pro["']\s*,\s*["']solo["']/;

let echecs = 0;
const droits = readFileSync(SOURCE, "utf8");

if (!/export const PLANS_ACCES_COMPTABLE\s*=/.test(droits)) {
  echecs++;
  console.log(`✗ ${SOURCE} ne définit pas PLANS_ACCES_COMPTABLE`);
}

for (const [nom, chemin] of Object.entries(CONSOMMATEURS)) {
  const code = readFileSync(chemin, "utf8");
  if (!/\bPLANS_ACCES_COMPTABLE\b/.test(code)) {
    echecs++;
    console.log(`✗ ${nom} (${chemin}) n'utilise pas PLANS_ACCES_COMPTABLE`);
  }
  if (!/from\s+"@\/lib\/droits"/.test(code)) {
    echecs++;
    console.log(`✗ ${nom} n'importe pas @/lib/droits`);
  }
  if (LISTE_EN_DUR.test(code)) {
    echecs++;
    console.log(`✗ ${nom} redéfinit une liste de plans en dur au lieu d'utiliser PLANS_ACCES_COMPTABLE`);
  }
}

if (!LISTE_EN_DUR.test('new Set(["solo", "pro"])')) {
  echecs++;
  console.log("✗ contre-épreuve : le motif ne repère plus une liste de plans en dur.");
} else {
  console.log("Contre-épreuve : une liste de plans en dur serait bien détectée.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} problème(s) de parité comptable.`);
  process.exit(1);
}
console.log("✓ Comptable : route et garde du layout partagent PLANS_ACCES_COMPTABLE, aucune liste en dur");
