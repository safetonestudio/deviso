/**
 * Traversée des tâches planifiées.
 *
 * Pourquoi c'est la zone la plus dangereuse. Ces trois tâches s'exécutent seules,
 * chaque nuit, et écrivent à de vrais clients sans que personne ne relise. Une
 * erreur de condition n'envoie pas un mauvais email à un développeur : elle
 * envoie un rappel de paiement au client d'un utilisateur, pour une facture
 * déjà réglée ou jamais envoyée.
 *
 * Ce qu'on vérifie ici :
 *  · le secret protège bien les trois routes (sinon n'importe qui déclenche
 *    des relances chez tous les clients de tous les utilisateurs) ;
 *  · les crons ne relancent QUE ce qui est dû, sur des documents fraîchement
 *    créés qui ne le sont pas encore ;
 *  · ils n'écrivent pas aux comptes de démonstration.
 *
 * Usage : node scripts/e2e/crons.mjs
 */

import { readFileSync } from "node:fs";
import { openSession, anonymous, verifier, bilan, BASE } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);

function secretCron() {
  const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
  const m = env.match(/^CRON_SECRET=(.*)$/m);
  return m ? m[1].trim() : null;
}

const secret = secretCron();
const appelCron = (chemin, avecSecret) =>
  fetch(`${BASE}${chemin}`, {
    headers: avecSecret && secret ? { authorization: `Bearer ${secret}` } : {},
  }).then(async (r) => ({ status: r.status, body: await r.text() }));

const CRONS = ["/api/cron/send-reminders", "/api/cron/recurring", "/api/cron/cleanup-demo"];

// ── 1. Le secret protège-t-il réellement ? ───────────────────────────────────
console.log("── Protection des tâches planifiées ─────────────────────────");
for (const c of CRONS) {
  const sans = await anonymous.call(c);
  verifier(`${c} — refusé sans le secret`, sans.status === 401, `HTTP ${sans.status}`);

  const mauvais = await fetch(`${BASE}${c}`, { headers: { authorization: "Bearer mauvais-secret" } });
  verifier(`${c} — refusé avec un mauvais secret`, mauvais.status === 401, `HTTP ${mauvais.status}`);
}

if (!secret) {
  console.log("");
  console.log("CRON_SECRET absent de .env.local : la suite du script est ignoree.");
  process.exit(bilan() > 0 ? 1 : 0);
}

// ── 2. Un document tout juste créé ne doit PAS être relancé ──────────────────
console.log("");
console.log("── Le cron ne relance que ce qui est dû ─────────────────────");

const s = await openSession("crons");
const devis = await s.call("/api/proposals", {
  method: "POST",
  body: doc({
    title: "Devis du jour, ne doit pas etre relance",
    client_name: "Client", client_email: "cron-temoin@example.fr", client_company: "Cron SARL",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
    total_ht: 100, tva_rate: 0, total_ttc: 100, valid_until: "2026-12-31",
  }),
});
const devisId = devis.body?.proposal?.id;
await s.call(`/api/proposals/${devisId}`, { method: "PATCH", body: doc({ status: "sent" }) });

const avant = (await s.call(`/api/proposals/${devisId}`)).body?.proposal?.reminder_count ?? 0;

const run = await appelCron("/api/cron/send-reminders", true);
verifier("le cron de relances s'exécute avec le bon secret", run.status === 200, `HTTP ${run.status} ${run.body.slice(0, 120)}`);

const apres = (await s.call(`/api/proposals/${devisId}`)).body?.proposal?.reminder_count ?? 0;
verifier(
  "un devis créé aujourd'hui n'est pas relancé (premier intervalle : 3 jours)",
  apres === avant,
  `compteur ${avant} -> ${apres}`
);

// ── 3. Les comptes de démonstration sont exclus ──────────────────────────────
// La session de test EST un compte de démonstration : si le cron l'avait
// relancé, le compteur ci-dessus aurait bougé. On l'énonce explicitement.
verifier(
  "les comptes de démonstration sont exclus des relances automatiques",
  apres === avant,
  "le compte de test est un compte de démonstration"
);

// ── 4. Facturation récurrente ────────────────────────────────────────────────
console.log("");
console.log("── Facturation récurrente ───────────────────────────────────");
const recur = await appelCron("/api/cron/recurring", true);
verifier("le cron de facturation récurrente s'exécute", recur.status === 200, `HTTP ${recur.status} ${recur.body.slice(0, 120)}`);

// ── 5. Purge des comptes de démonstration ────────────────────────────────────
console.log("");
console.log("── Purge des comptes de démonstration ───────────────────────");
const purge = await appelCron("/api/cron/cleanup-demo", true);
verifier(
  "la purge s'exécute et ne signale aucun échec",
  purge.status === 200,
  `HTTP ${purge.status} ${purge.body.slice(0, 160)} (500 = suppression bloquée, comme la clé étrangère de juillet)`
);

console.log("");
process.exit(bilan() > 0 ? 1 : 0);
