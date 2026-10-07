// Garde : l'URL d'autorisation Super PDP ne doit JAMAIS porter
// superpdp_directory_entry_identifier sans superpdp_company_number.
//
// Né du bug prod du 07/10/2026 (commit 152ae40) : en fr_siren, l'identifiant
// d'annuaire partait seul et Super PDP refusait tout le tunnel
// (« superpdp_company_number is required with superpdp_directory_entry_identifier »).
// Invisible en bac à sable (scheme jamais fr_siren), donc aucun test ne le voyait.
//
// Deux volets :
//  1. fonctionnel : sur toute la matrice d'entrées, la fonction pure respecte
//     l'invariant, et pose bien les deux params ensemble (ou aucun) ;
//  2. statique : la route connect ne construit aucun param en direct, elle
//     délègue à la fonction pure (source unique), donc personne ne peut
//     réintroduire un set isolé sans casser ce garde.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  construireParamsAutorisation,
  violeInvariantAnnuaire,
} from "../lib/superpdp-authorize.ts";

const ici = dirname(fileURLToPath(import.meta.url));
let echecs = 0;
function verifier(nom, ok, detail = "") {
  console.log(`  ${ok ? "ok " : "ECHEC"}  ${nom}${detail ? `  (${detail})` : ""}`);
  if (!ok) echecs++;
}

const base = {
  clientId: "cid",
  redirectUri: "https://getdeviso.fr/api/superpdp/callback",
  state: "st",
  challenge: "ch",
};

console.log("── Invariant directory_entry_identifier ⟹ company_number ──────");

// Matrice : scheme x prefill x siren x email.
for (const scheme of ["fr_siren", "sandbox"]) {
  for (const prefillCompany of [true, false]) {
    for (const siren of ["103340857", null]) {
      for (const email of ["a@b.fr", null]) {
        const p = construireParamsAutorisation({ ...base, scheme, prefillCompany, siren, email });
        const cle = `scheme=${scheme} prefill=${prefillCompany} siren=${siren ? "oui" : "non"} email=${email ? "oui" : "non"}`;
        verifier(`invariant tenu, ${cle}`, !violeInvariantAnnuaire(p));
        // superpdp_send_and_receive=receive, toujours (objet du raccordement).
        verifier(`réception forcée, ${cle}`, p.get("superpdp_send_and_receive") === "receive");
      }
    }
  }
}

console.log("");
console.log("── Comportements attendus de pré-remplissage ──────────────────");

// Par défaut (prefill off) : ni company_number ni directory.
const defautFr = construireParamsAutorisation({ ...base, scheme: "fr_siren", prefillCompany: false, siren: "103340857", email: null });
verifier(
  "défaut (prefill off) : aucun pré-remplissage entreprise",
  !defautFr.has("superpdp_company_number") && !defautFr.has("superpdp_directory_entry_identifier")
);

// Prefill on + fr_siren + siren : les DEUX params, ensemble.
const prefFr = construireParamsAutorisation({ ...base, scheme: "fr_siren", prefillCompany: true, siren: "103340857", email: null });
verifier(
  "prefill on + fr_siren : company_number ET directory présents",
  prefFr.get("superpdp_company_number") === "103340857" &&
    prefFr.get("superpdp_directory_entry_identifier") === "103340857"
);

// Prefill on mais scheme non-fr_siren : company_number seul, pas de directory.
const prefSandbox = construireParamsAutorisation({ ...base, scheme: "sandbox", prefillCompany: true, siren: "103340857", email: null });
verifier(
  "prefill on + sandbox : company_number sans directory",
  prefSandbox.has("superpdp_company_number") && !prefSandbox.has("superpdp_directory_entry_identifier")
);

console.log("");
console.log("── Contre-épreuve : le détecteur voit le vrai bug ─────────────");

// Forme EXACTE du bug historique : directory seul, sans company_number.
const bug = new URLSearchParams({ superpdp_directory_entry_identifier: "103340857" });
verifier("le détecteur signale directory seul (bug du 07/10)", violeInvariantAnnuaire(bug) === true);
// Et il ne crie pas à tort quand les deux sont là.
const ok2 = new URLSearchParams({ superpdp_directory_entry_identifier: "103340857", superpdp_company_number: "103340857" });
verifier("le détecteur accepte les deux ensemble", violeInvariantAnnuaire(ok2) === false);

console.log("");
console.log("── Source unique : la route délègue, sans set en direct ───────");

const routeSrc = readFileSync(join(ici, "..", "app", "api", "superpdp", "connect", "route.ts"), "utf8");
// On vise le vrai signal de code (un appel params.set), pas une mention en
// commentaire : la route ne doit construire aucun paramètre à la main. Les
// cookies, eux, passent par res.cookies.set, donc ne matchent pas.
verifier(
  "connect/route.ts ne construit aucun param en direct (aucun params.set)",
  !routeSrc.includes("params.set(")
);
verifier(
  "connect/route.ts appelle construireParamsAutorisation",
  routeSrc.includes("construireParamsAutorisation(")
);

console.log("");
if (echecs > 0) {
  console.error(`check:superpdp-connect : ${echecs} échec(s).`);
  process.exit(1);
}
console.log("check:superpdp-connect : tout vert.");
