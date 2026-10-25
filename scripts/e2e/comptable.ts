/**
 * Acces expert-comptable : l'invariant de lecture seule, traverse pour de vrai.
 *
 * On appelle la VRAIE fonction droitsDe (lib/droits.ts) avec un faux client
 * admin (aucun reseau), et on verifie qu'un role "comptable" ne recoit jamais
 * aucun acte, meme si sa ligne porte des permissions toutes ouvertes. C'est le
 * coeur de la securite : un comptable ne peut que consulter.
 *
 * Usage : npx tsx scripts/e2e/comptable.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Faux client admin : repond une seule ligne team_members, sans reseau.
function fauxAdmin(ligne: unknown, erreur: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.maybeSingle = () => Promise.resolve({ data: ligne, error: erreur });
  return { from: () => chain } as never;
}

const OWNER = "11111111-1111-1111-1111-111111111111";
const MEMBRE = "22222222-2222-2222-2222-222222222222";

async function main() {
  const { droitsDe, PERMISSIONS_AUCUNE, ACTES, ROLE_COMPTABLE } = await import("@/lib/droits");

  const tousOuverts = {
    envoyer_devis: true, envoyer_facture: true, transmettre_pa: true,
    deposer_chorus: true, refuser_facture_recue: true,
  };

  // 1. Le titulaire a tous les droits (sans meme lire la base).
  const dTit = await droitsDe(OWNER, OWNER, fauxAdmin({ role: ROLE_COMPTABLE, permissions: PERMISSIONS_AUCUNE }));
  verifier("titulaire : tous les actes autorises", ACTES.every((a) => dTit[a] === true));

  // 2. Le comptable reste en lecture seule MEME avec des permissions toutes a true.
  const dCompta = await droitsDe(MEMBRE, OWNER, fauxAdmin({ role: ROLE_COMPTABLE, permissions: tousOuverts }));
  verifier("comptable : aucun acte autorise malgre des permissions ouvertes", ACTES.every((a) => dCompta[a] === false));

  // 3. Contre-epreuve : un membre normal recoit bien le droit accorde.
  const dMembre = await droitsDe(MEMBRE, OWNER, fauxAdmin({ role: "member", permissions: { ...PERMISSIONS_AUCUNE, envoyer_devis: true } }));
  verifier("membre normal : recoit le droit accorde, et pas les autres",
    dMembre.envoyer_devis === true && dMembre.envoyer_facture === false);

  // 4. Lecture impossible : on refuse tout plutot que d'accorder par defaut.
  const dErr = await droitsDe(MEMBRE, OWNER, fauxAdmin(null, { message: "boom" }));
  verifier("erreur de lecture : aucun acte autorise", ACTES.every((a) => dErr[a] === false));

  bilan();
}

main();
