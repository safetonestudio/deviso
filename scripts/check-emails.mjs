#!/usr/bin/env node
/**
 * Contrôle statique des emails destinés aux clients.
 *
 * Deux défauts trouvés par Selim en regardant sa boîte de réception, qu'aucune
 * assertion HTTP ne pouvait voir :
 *
 *  1. Les relances partaient au nom de « Deviso » alors que le devis initial
 *     partait au nom du prestataire. Le client recevait donc un rappel de
 *     paiement d'une société inconnue — ça ressemble à de l'hameçonnage et ça
 *     abîme la crédibilité de l'émetteur.
 *
 *  2. Les corps de message étaient écrits sans accents : « en attente de
 *     reglement », « Montant du », « deja effectue ». Dans un email commercial
 *     français, ça fait immédiatement amateur, voire spam.
 *
 * Usage : node scripts/check-emails.mjs
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const fichiers = globSync("app/api/**/*.ts");
let echecs = 0;

// ── 1. Expéditeur ────────────────────────────────────────────────────────────
// Seuls les messages réellement émis par Deviso peuvent porter son nom :
// l'invitation d'un collaborateur et la demande de validation interne.
const NOM_DEVISO_LEGITIME = [
  "app/api/team/route.ts",
  "app/api/proposals/[id]/submit-for-approval/route.ts",
];

for (const f of fichiers) {
  const src = readFileSync(f, "utf8");
  if (!src.includes("resend.emails.send")) continue;
  const chemin = f.replace(/\\/g, "/");
  if (NOM_DEVISO_LEGITIME.some((l) => chemin.endsWith(l))) continue;

  if (/from:\s*"Deviso </.test(src)) {
    console.error(
      `✗ ${chemin} — envoi au nom de « Deviso » : le client doit reconnaître son prestataire`
    );
    echecs++;
  }
}

// ── 2. Accents ───────────────────────────────────────────────────────────────
// Mots français courants dans ces messages, écrits sans accent.
const SANS_ACCENT = [
  ["deja", "déjà"], ["repondu", "répondu"], ["effectue", "effectué"],
  ["reglement", "règlement"], ["Envoye", "Envoyé"], ["Montant du<", "Montant dû<"],
  ["echeance", "échéance"], ["penalites", "pénalités"], ["creer", "créer"],
  ["refuse ", "refusé "], ["signe ", "signé "], ["traite.", "traité."],
];

for (const f of fichiers) {
  const src = readFileSync(f, "utf8");
  if (!src.includes("resend.emails.send")) continue;

  src.split("\n").forEach((ligne, i) => {
    const t = ligne.trim();
    // On ignore les commentaires : ils ne partent pas chez le client.
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
    for (const [faux, juste] of SANS_ACCENT) {
      // Bornes de mot : sans elles, « Envoye » matchait l'identifiant
      // `emailEnvoye`, qui ne part evidemment pas chez le client.
      const esc = faux.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const motif = new RegExp(
        (/^\w/.test(faux) ? "\\b" : "") + esc + (/\w$/.test(faux) ? "\\b" : "")
      );
      if (motif.test(ligne)) {
        console.error(
          `✗ ${f.replace(/\\/g, "/")}:${i + 1} — « ${faux} » sans accent, attendu « ${juste} »`
        );
        echecs++;
        return;
      }
    }
  });
}

if (echecs === 0) {
  console.log("✓ Emails clients — expéditeur au nom du prestataire, textes accentués");
}
process.exit(echecs > 0 ? 1 : 0);
