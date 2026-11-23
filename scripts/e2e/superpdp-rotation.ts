/**
 * Faux « autorisation plus valide » après deux renouvellements simultanés.
 *
 * Rejoue sans réseau la course du 23/11/2026 (compte de test Atelier Lumière,
 * 16:40:18 UTC) : deux appels rafraîchissent avec le même jeton, le premier
 * réussit mais n'écrit son nouveau jeton qu'un peu plus tard, le second reçoit
 * `invalid_grant`. Il ne doit marquer l'erreur que si personne n'a renouvelé.
 * Règle : lib/superpdp-rotation.ts. Aucun appel à Super PDP.
 *
 * Lancer : npx -y tsx scripts/e2e/superpdp-rotation.ts
 */
import { readFileSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

(async () => {
  const { rotationParUnAutre, DELAIS_RELECTURE_MS, MESSAGE_AUTORISATION_PERDUE } = await import("@/lib/superpdp-rotation");

  // Horloge simulée : `attendre` avance le temps, la base « voit » le nouveau
  // jeton à partir de l'instant où le gagnant l'écrit.
  function scenario(ecritureGagnantMs: number | null) {
    let t = 0;
    let lectures = 0;
    const attendre = async (ms: number) => { t += ms; };
    const relire = async () => {
      lectures++;
      const ecrit = ecritureGagnantMs !== null && t >= ecritureGagnantMs;
      return { refresh_token: ecrit ? "nouveau" : "ancien" };
    };
    return { attendre, relire, temps: () => t, lectures: () => lectures };
  }

  console.log("── La course ──────────────────────────────────────────────────");
  {
    const s = scenario(600); // le cas du 23/11 : écriture du gagnant 0,6 s après
    const r = await rotationParUnAutre("ancien", s.relire, s.attendre);
    verifier("gagnant qui écrit 0,6 s après : on se range derrière lui, pas d'erreur", r?.refresh_token === "nouveau", JSON.stringify(r));
  }
  {
    const s = scenario(0); // le gagnant a déjà écrit
    const r = await rotationParUnAutre("ancien", s.relire, s.attendre);
    verifier("gagnant déjà écrit : trouvé dès la première lecture, sans attendre", r?.refresh_token === "nouveau" && s.temps() === 0 && s.lectures() === 1);
  }
  {
    const s = scenario(null); // personne n'a renouvelé : jeton vraiment mort
    const r = await rotationParUnAutre("ancien", s.relire, s.attendre);
    const total = DELAIS_RELECTURE_MS.reduce((a, b) => a + b, 0);
    verifier("jeton vraiment mort : null, donc l'erreur est écrite", r === null);
    verifier(`et l'attente reste bornée (${total} ms, ${DELAIS_RELECTURE_MS.length} lectures)`, s.temps() === total && s.lectures() === DELAIS_RELECTURE_MS.length, `${s.temps()} ms`);
  }
  {
    let n = 0;
    const r = await rotationParUnAutre("ancien", async () => { n++; if (n === 1) throw new Error("base injoignable"); return { refresh_token: "nouveau" }; }, async () => {});
    verifier("une lecture en échec n'interrompt pas les suivantes", r?.refresh_token === "nouveau");
  }
  {
    // Contre-épreuve : l'ancienne garde (une seule lecture, immédiate) aurait
    // conclu au jeton mort dans le cas du 23/11.
    const s = scenario(600);
    const r = await rotationParUnAutre("ancien", s.relire, s.attendre, [0]);
    verifier("contre-épreuve : une seule lecture immédiate se trompe (le défaut d'origine)", r === null);
  }

  console.log("── Le branchement dans lib/superpdp.ts ────────────────────────");
  const src = readFileSync("lib/superpdp.ts", "utf8");
  const blocErreur = src.slice(src.indexOf("if (/invalid_grant/i.test(detail))"), src.indexOf("const dureeMs"));
  verifier("la relecture passe par rotationParUnAutre", /rotationParUnAutre\(conn\.refresh_token/.test(blocErreur));
  verifier(
    "l'erreur ne s'écrit que si le jeton en base est toujours celui qui a échoué",
    /session_status: "error"[\s\S]*\.eq\("refresh_token", conn\.refresh_token\)/.test(blocErreur),
  );
  const apres = src.slice(src.indexOf("const dureeMs"), src.indexOf("return tokens.access_token"));
  verifier(
    "un renouvellement réussi efface ce seul message d'erreur, et rien d'autre",
    /session_status: "verified", last_error: null[\s\S]*\.eq\("session_status", "error"\)[\s\S]*\.eq\("last_error", MESSAGE_AUTORISATION_PERDUE\)/.test(apres),
  );
  console.log("── La garde d'environnement ───────────────────────────────────");
  const { estConnexionDeCetEnv } = await import("@/lib/superpdp");
  verifier("production : un raccordement de production est utilisable", estConnexionDeCetEnv("fr_siren", false));
  verifier("production : un raccordement du bac à sable ne l'est pas (le cas d'Atelier Lumière)", !estConnexionDeCetEnv("sandbox", false));
  verifier("poste de test : un raccordement de production ne l'est pas (le cas du 20/11)", !estConnexionDeCetEnv("fr_siren", true));
  verifier("poste de test : un raccordement du bac à sable l'est", estConnexionDeCetEnv("sandbox", true));
  const avantRenouvellement = src.slice(src.indexOf("async function accessTokenValide"), src.indexOf("tokens = await refreshTokens"));
  verifier(
    "la garde passe AVANT tout renouvellement, et lève « non raccordé » sans rien écrire",
    /if \(!estConnexionDeCetEnv\(conn\.company_number_scheme, isSandbox\(\)\)\)\s*\{\s*throw new SuperPdpAutreEnvironnement/.test(avantRenouvellement) &&
      !/saveConnection|\.update\(/.test(avantRenouvellement.slice(avantRenouvellement.indexOf("estConnexionDeCetEnv(conn")).split("const expiration")[0]),
  );
  verifier("SuperPdpAutreEnvironnement est un « non raccordé » (les routes le gèrent déjà)", /class SuperPdpAutreEnvironnement extends SuperPdpNotConnected/.test(src));

  verifier("le message affiché n'a pas changé de texte", MESSAGE_AUTORISATION_PERDUE === "Votre autorisation Super PDP n'est plus valide. Reconnectez votre entreprise.");

  bilan();
})();
