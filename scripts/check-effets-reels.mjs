/**
 * Rien de ce qu'un compte de démonstration fait ne doit sortir de la base.
 *
 * Pourquoi ce fichier existe. La règle était déjà écrite, et déjà automatisée —
 * mais pour Stripe seulement (`lib/stripe-guard.ts`, `scripts/check-stripe.mjs`).
 * Elle n'avait jamais été étendue aux deux autres familles d'effets qui
 * franchissent la frontière du produit, et l'audit du 08/09/2026 a montré ce
 * que ça coûtait : depuis la démo ouverte en un clic sur la page d'accueil, un
 * visiteur pouvait faire partir de vrais courriels à l'adresse de son choix
 * depuis `noreply@getdeviso.fr`, et déposer une facture fictive de 3 120 € à
 * une commune réelle sur Chorus Pro, en production.
 *
 * Le critère est simple et c'est le seul qui compte : un effet qui sort de la
 * base de données n'est plus rattrapable par la purge des comptes de
 * démonstration au bout de deux heures.
 *
 * Comme `check-stripe.mjs`, ce contrôle porte sa contre-épreuve : on fabrique
 * un fichier fautif en mémoire et on vérifie qu'il serait bien détecté. Sans
 * elle, un contrôle qui ne trouve jamais rien est indiscernable d'un contrôle
 * cassé.
 *
 * Usage : node scripts/check-effets-reels.mjs
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

let echecs = 0;

// Un envoi est gardé s'il passe par `envoyerCourriel` (qui court-circuite les
// comptes de démonstration) ; un dépôt chez un tiers l'est par `estCompteDemo`,
// qui refuse franchement — il n'y a rien à simuler chez Chorus Pro.
const gardeEnvoi = (src) => /envoyerCourriel\s*\(/.test(src) && !/resend\.emails\.send/.test(src);
const gardeTiers = (src) => /estCompteDemo\s*\(/.test(src);

/**
 * Routes exemptées, avec la raison. Toute exemption doit être justifiable en
 * une phrase, sinon c'est un trou.
 */
const EXEMPTIONS = {
  // Tâches planifiées : pas d'utilisateur connecté, et elles filtrent déjà les
  // comptes de démonstration à la source de leur requête.
  "app/api/cron/send-reminders/route.ts": "cron, filtre is_demo dans sa requête",
  "app/api/cron/recurring/route.ts": "cron, aucun compte de démonstration n'a de facture récurrente",
  // Courriel de bienvenue à la création de compte : par construction, un compte
  // de démonstration n'en reçoit pas (l'adresse est @deviso.internal, et le
  // code l'exclut explicitement).
  "app/auth/callback/route.ts": "exclut explicitement les adresses @deviso.internal",
  // Signature d'un devis par le CLIENT, sur le lien public : il n'y a pas
  // d'utilisateur connecté, et le destinataire est le propriétaire du devis.
  "app/api/public/proposals/[token]/route.ts": "route publique, notifie le propriétaire du document",
  // Invitation d'équipe : refuse déjà les adresses @deviso.internal, et un
  // compte de démonstration n'a pas de plan Pro.
  "app/api/team/route.ts": "refuse les adresses @deviso.internal",
  // Demande de validation interne : le destinataire est le propriétaire de
  // l'espace, pas un tiers.
  "app/api/proposals/[id]/submit-for-approval/route.ts": "notifie le propriétaire de l'espace",
};

function controler(titre, fichiers, description, garde) {
  console.log("");
  console.log(`── ${titre} ─────────────────────────────────`);
  for (const f of fichiers) {
    const chemin = f.replace(/\\/g, "/");
    if (EXEMPTIONS[chemin]) {
      console.log(`  ·    ${chemin} — exempté : ${EXEMPTIONS[chemin]}`);
      continue;
    }
    const src = readFileSync(f, "utf8");
    if (garde(src)) {
      console.log(`  ok   ${chemin}`);
    } else {
      echecs++;
      console.error(`✗ ${chemin} — ${description}`);
    }
  }
}

// ── 1. Envoi de courriel ────────────────────────────────────────────────────
const envoient = globSync("app/**/route.ts").filter((f) => {
  const src = readFileSync(f, "utf8");
  return /resend\.emails\.send|envoyerCourriel\s*\(/.test(src);
});
controler(
  "Courriel : aucun envoi depuis un compte de démonstration",
  envoient,
  "envoie un courriel sans passer par estCompteDemo. Un message parti ne se purge pas, " +
    "et ce sont les plaintes pour courrier indésirable qui abîment la délivrabilité de tout le monde.",
  gardeEnvoi,
);

// ── 2. Dépôt chez un tiers ──────────────────────────────────────────────────
// Un DÉPÔT, pas une lecture : on ne retient que les routes qui écrivent
// réellement chez un tiers. Consulter un statut ou lire un annuaire ne laisse
// aucune trace qu'une purge ne rattraperait pas.
const tiers = globSync("app/api/**/route.ts").filter((f) => {
  const src = readFileSync(f, "utf8");
  const parleAuTiers = /https:\/\/[^"']*(aife|piste)\.gouv\.fr/i.test(src) || /superpdpConfig/.test(src);
  const ecrit = /method:\s*"(POST|PUT|PATCH|DELETE)"/.test(src);
  return parleAuTiers && ecrit;
});
controler(
  "Tiers : aucun dépôt en production depuis un compte de démonstration",
  tiers,
  "dépose un document chez Chorus Pro ou à la Plateforme Agréée sans passer par estCompteDemo.",
  gardeTiers,
);

// ── 3. Contre-épreuves ──────────────────────────────────────────────────────
console.log("");
console.log("── Contre-épreuves ───────────────────────────────────────────");
const fautif = `
  const { data: { user } } = await supabase.auth.getUser();
  await resend.emails.send({ to: "victime@exemple.fr", subject: "x", html: "y" });
`;
if (!gardeEnvoi(fautif)) {
  console.log("  ·    un fichier d'envoi sans garde-fou est bien détecté");
} else {
  echecs++;
  console.error("✗ contre-épreuve MUETTE : le détecteur ne voit plus l'absence de garde-fou");
}
const correct = `if (await estCompteDemo(user.id)) return NextResponse.json({}, { status: 403 });`;
if (gardeTiers(correct)) {
  console.log("  ·    un fichier gardé est bien reconnu");
} else {
  echecs++;
  console.error("✗ contre-épreuve MUETTE : le détecteur ne reconnaît plus un garde-fou correct");
}

console.log("");
if (echecs > 0) {
  console.error(`${echecs} route(s) peuvent produire un effet réel depuis la démonstration.`);
  process.exit(1);
}
console.log("check:effets-reels — aucun effet réel possible depuis un compte de démonstration.");
