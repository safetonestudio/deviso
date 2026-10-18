#!/usr/bin/env node
/**
 * check:prod, la production sert-elle bien le dernier commit de main ?
 *
 * Constat du 18/10/2026 : deux commits pousses a quelques minutes d intervalle.
 * Vercel a fini de construire le plus ancien en dernier et l a promu en
 * production, ecrasant le plus recent. Le correctif du theme clair etait donc
 * hors ligne alors que tout semblait vert (build READY, garde au vert).
 *
 * A lancer apres chaque push : node scripts/check-prod-a-jour.mjs --attendre
 * (attend jusqu a 8 min que le deploiement arrive, puis echoue s il n arrive pas
 * ou si une version plus ancienne est en ligne).
 */
import { execSync } from "node:child_process";

const BASE = process.env.E2E_BASE_URL || "https://getdeviso.fr";
const attendre = process.argv.includes("--attendre");
const attendu = execSync("git rev-parse HEAD").toString().trim();
const limite = Date.now() + (attendre ? 8 * 60_000 : 0);

const enLigne = async () => {
  let r;
  try { r = await fetch(`${BASE}/api/version?t=${Date.now()}`, { cache: "no-store" }); } catch (e) { return `injoignable (${e.cause?.code ?? e.message})`; }
  if (!r.ok) return `HTTP ${r.status}`;
  return (await r.json()).sha ?? "inconnue";
};

// process.exit() juste apres un fetch fait planter Node sous Windows
// (assertion UV_HANDLE_CLOSING) et masque le code de sortie : on pose exitCode.
const estSha = (v) => /^[0-9a-f]{40}$/.test(String(v));
async function principal() {
  for (;;) {
    const sha = await enLigne();
    if (sha === attendu) {
      console.log(`\u2713 Production a jour : ${BASE} sert ${attendu.slice(0, 7)} (HEAD de main)`);
      return 0;
    }
    if (Date.now() >= limite) {
      let ancetre = false;
      if (estSha(sha)) { try { execSync(`git merge-base --is-ancestor ${sha} ${attendu}`, { stdio: "ignore" }); ancetre = true; } catch {} }
      console.error(
        `\u2717 Production perimee : ${BASE} sert ${estSha(sha) ? sha.slice(0, 7) : sha}, main est ${attendu.slice(0, 7)}.` +
          (ancetre ? " La version en ligne est PLUS ANCIENNE : un deploiement anterieur a pu etre promu apres le plus recent." : "")
      );
      return 1;
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
}
process.exitCode = await principal();
