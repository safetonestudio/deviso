/**
 * Cycle de vie d'une session de démonstration.
 *
 * Ce que ce script cherche à mettre en défaut, dans l'ordre d'importance :
 *
 * 1. **Un compte de démo survit à la sortie.** C'était le défaut constaté :
 *    la purge ne se déclenchait qu'au lancement d'une *nouvelle* démo, donc le
 *    ménage était proportionnel au trafic. Sans visiteur, les comptes restaient.
 * 2. **Le mécanisme est trop agressif.** Symétrique et bien plus grave
 *    commercialement : une session vivante supprimée sous les pieds d'un
 *    prospect. Un test qui ne vérifierait que la suppression laisserait passer
 *    ce cas — il faut prouver les deux sens.
 * 3. **Un vrai compte peut être supprimé par ces routes.** Elles s'exécutent
 *    avec la clé de service, qui ignore les politiques RLS.
 *
 * Usage : node scripts/e2e/demo.mjs
 */

import { openSession, anonymous, verifier, bilan, BASE } from "./lib.mjs";

const jsonDe = (r) => (typeof r.body === "object" && r.body !== null ? r.body : {});

console.log("── Refus attendus ───────────────────────────────────────────");

for (const chemin of ["/api/demo/end", "/api/demo/heartbeat"]) {
  const anon = await anonymous.call(chemin, { method: "POST" });
  const attendu = chemin === "/api/demo/end" ? [200] : [401];
  verifier(
    `${chemin} — sans session : ${attendu.join("/")}`,
    attendu.includes(anon.status),
    `HTTP ${anon.status} — /end répond 200 volontairement : rien à supprimer, ` +
      `et un double clic sur « Quitter » ne doit pas afficher d'erreur`
  );
}

console.log("");
console.log("── Une session vivante n'est pas supprimée ──────────────────");

const vivante = await openSession("demo-vivante");

const battement = await vivante.call("/api/demo/heartbeat", { method: "POST" });
verifier(
  "le battement de cœur est accepté et reconnaît une démo",
  battement.status === 200 && jsonDe(battement).demo === true,
  `HTTP ${battement.status} ${JSON.stringify(battement.body).slice(0, 140)}`
);

// Le battement déclenche la purge : c'est justement le moment où une session
// vivante pourrait se supprimer elle-même par erreur.
const apresPurge = await vivante.call("/api/profile");
verifier(
  "la session survit à la purge qu'elle vient de déclencher",
  apresPurge.status === 200,
  `HTTP ${apresPurge.status} — un 401 signifierait que la démo se coupe elle-même`
);

const purge = jsonDe(battement).purge;
verifier(
  "la purge s'exécute depuis le battement, sans échec",
  purge && purge.errors === 0,
  `${JSON.stringify(purge)} — c'est ce qui rend le ménage proportionnel aux ` +
    `sessions actives et non aux démos créées`
);

console.log("");
console.log("── La sortie explicite supprime vraiment le compte ──────────");

const sortante = await openSession("demo-sortante");
const avant = await sortante.call("/api/profile");
verifier("la démo est bien vivante avant la sortie", avant.status === 200, `HTTP ${avant.status}`);

const fin = await sortante.call("/api/demo/end", { method: "POST" });
verifier(
  "/api/demo/end confirme la suppression",
  fin.status === 200 && jsonDe(fin).ended === true,
  `HTTP ${fin.status} ${JSON.stringify(fin.body).slice(0, 140)}`
);

// Le point qui compte : le compte doit avoir disparu côté serveur, pas
// seulement côté navigateur. Une déconnexion sans suppression donnerait
// exactement le même écran à l'utilisateur.
const apres = await sortante.call("/api/profile");
verifier(
  "le compte n'existe plus après la sortie",
  apres.status === 401 || apres.status === 404,
  `HTTP ${apres.status} — un 200 signifierait que « Quitter la démo » ne fait ` +
    `que déconnecter, en laissant le compte factice en base`
);

const reFin = await sortante.call("/api/demo/end", { method: "POST" });
verifier(
  "un second appel ne casse rien (double clic sur le bouton)",
  reFin.status === 200,
  `HTTP ${reFin.status}`
);

console.log("");
console.log("── Non couvert par ce script ────────────────────────────────");
console.log("  · la suppression par inactivité (10 min de silence) : le script");
console.log("    devrait attendre 10 minutes réelles. Règle de décision vérifiée");
console.log("    séparément en SQL, sur les deux côtés de la limite.");
console.log("  · le battement envoyé par le navigateur lui-même : ici on appelle");
console.log("    la route directement. Le câblage du composant reste à voir à l'œil.");
console.log(`  · base testée : ${BASE}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
