#!/usr/bin/env node
/**
 * Controle du cablage Sentry (@sentry/nextjs v10).
 *
 * Piege : les dependances, withSentryConfig et le DSN peuvent tous etre en place
 * alors que RIEN n est capture. En v10, les points de montage sont instrumentation.ts
 * (serveur + edge), instrumentation-client.ts (navigateur) et app/global-error.tsx
 * (erreurs de rendu React). Les anciens sentry.client.config.ts a la racine ne sont
 * plus charges seuls. Un monitoring aveugle se lit comme un monitoring sain : ni tsc
 * ni le build ne le voient. Ce garde verifie que la chaine est reellement reliee.
 *
 * Usage : node scripts/check-sentry.mjs
 */
import { readFileSync, existsSync } from "node:fs";

const erreurs = [];
const lire = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

// instrumentation.ts : monte serveur + edge et cable onRequestError
const instr = lire("instrumentation.ts");
if (!instr) {
  erreurs.push("instrumentation.ts absent : les erreurs serveur et edge ne remontent pas");
} else {
  if (!/export\s+async\s+function\s+register/.test(instr)) erreurs.push("instrumentation.ts : fonction register() manquante");
  if (!/sentry\.server\.config/.test(instr)) erreurs.push("instrumentation.ts : import de sentry.server.config manquant");
  if (!/sentry\.edge\.config/.test(instr)) erreurs.push("instrumentation.ts : import de sentry.edge.config manquant");
  if (!/captureRequestError|onRequestError/.test(instr)) erreurs.push("instrumentation.ts : onRequestError (captureRequestError) manquant");
}

// instrumentation-client.ts : init navigateur
const client = lire("instrumentation-client.ts");
if (!client) erreurs.push("instrumentation-client.ts absent : les erreurs cote navigateur ne remontent pas");
else if (!/Sentry\.init\s*\(/.test(client)) erreurs.push("instrumentation-client.ts : Sentry.init manquant");

// app/global-error.tsx : erreurs de rendu React
const ge = lire("app/global-error.tsx");
if (!ge) erreurs.push("app/global-error.tsx absent : les erreurs de rendu React ne sont pas capturees");
else if (!/captureException/.test(ge)) erreurs.push("app/global-error.tsx : Sentry.captureException manquant");

// withSentryConfig : upload + instrumentation build
const nc = lire("next.config.ts");
if (!nc || !/withSentryConfig/.test(nc)) erreurs.push("next.config.ts : withSentryConfig manquant");

// ancien point d entree deprecie qui prete a confusion
if (existsSync("sentry.client.config.ts")) erreurs.push("sentry.client.config.ts present : deprecie en v10, remplacer par instrumentation-client.ts");

if (erreurs.length) {
  for (const e of erreurs) console.error("✗ Sentry : " + e);
  process.exit(1);
}
console.log("✓ Sentry cable : instrumentation (serveur/edge), instrumentation-client (navigateur), global-error (React), withSentryConfig");
