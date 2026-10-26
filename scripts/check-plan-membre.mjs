/**
 * Contrôle : le plan de l'espace n'est jamais lu avec le client de l'invité.
 *
 * Le défaut rendu impossible : app/(dashboard)/layout.tsx lisait le plan du
 * PROPRIÉTAIRE de l'espace avec le client utilisateur. Or profiles est en RLS
 * « auth.uid() = id » : un membre ne peut pas lire la ligne du propriétaire, la
 * lecture revenait vide, le plan retombait sur "free", et TOUT invité était
 * suspendu même sur un espace payant. Le plan de l'espace doit se lire via un
 * client privilégié (createAdminClient / getWorkspaceProfile).
 *
 * Usage : node scripts/check-plan-membre.mjs
 */

import { readFileSync } from "node:fs";

const F = "app/(dashboard)/layout.tsx";
const LECTURE_UTILISATEUR = /supabase\s*\.from\("profiles"\)\s*\.select\("plan"\)/;
const LECTURE_ADMIN = /createAdminClient\(\)\s*\.from\("profiles"\)\s*\.select\("plan"\)/;

let echecs = 0;
const fail = (m) => { echecs++; console.log("✗ " + m); };
const code = readFileSync(F, "utf8");

if (LECTURE_UTILISATEUR.test(code)) {
  fail(`${F} lit le plan de l'espace avec le client utilisateur (bloqué par la RLS pour un invité). Passer par createAdminClient ou getWorkspaceProfile.`);
}
if (!LECTURE_ADMIN.test(code) && !/getWorkspaceProfile[^;]*\bplan\b/.test(code)) {
  fail(`${F} ne lit pas le plan de l'espace via un client privilégié.`);
}

// Contre-épreuve : une lecture par le client utilisateur serait-elle repérée ?
if (!LECTURE_UTILISATEUR.test('supabase.from("profiles").select("plan").eq("id", x)')) {
  fail("contre-épreuve : le motif ne repère plus une lecture de plan par le client utilisateur.");
} else {
  console.log("Contre-épreuve : une lecture de plan par le client utilisateur serait détectée.");
}

console.log("");
if (echecs > 0) {
  console.log(`${echecs} problème(s) de lecture du plan de l'espace.`);
  process.exit(1);
}
console.log("✓ Plan de l'espace lu via un client privilégié, jamais via le client de l'invité");
