/**
 * Fermer une ligne d'annuaire : la regle, pas l'appel.
 *
 * Pourquoi cette traversee ne ferme aucune ligne. Fermer pour de vrai rend une
 * entreprise INJOIGNABLE : plus aucun fournisseur en France ne peut lui adresser
 * de facture, et rouvrir suppose de repasser par la Plateforme Agreee. C'est
 * exactement le genre d'action qu'on ne fait pas « pour voir », et une suite de
 * tests qui la ferait a chaque passage detruirait l'environnement qu'elle est
 * censee proteger.
 *
 * On eprouve donc ce qui porte le risque — la decision — et on le fait sans
 * reseau, sans compte, et sans consequence. C'est la meme raison qui a fait
 * extraire `factureBloquee` dans son propre module.
 */

import { verifier, bilan } from "./lib.mjs";
import { decisionFermeture } from "../../lib/superpdp-fermeture.ts";

console.log("");
console.log("── Fermeture d'une ligne d'annuaire : ce qui decide ───────────");
console.log("");

// ── Le garde-fou central ────────────────────────────────────────────────────

const migration = decisionFermeture("en_erreur");
verifier(
  "une ligne EN ERREUR n'est jamais fermee",
  migration.fermer === false && migration.raison === "migration",
  "c'est l'etat normal d'une portabilite : supprimer interromprait le transfert",
);
verifier(
  "et le refus explique qu'il s'agit d'un transfert en cours",
  /transfert/i.test(migration.message ?? ""),
  migration.message,
);
verifier(
  "il donne le delai, pour que l'attente ait une fin",
  /cinq jours/i.test(migration.message ?? ""),
  "sans delai annonce, « attendez » se lit « c'est casse »",
);

// ── L'absence n'est pas une erreur ──────────────────────────────────────────

for (const rien of ["absente", null, undefined]) {
  const d = decisionFermeture(rien);
  verifier(
    `sans ligne (${String(rien)}), on ne ferme rien et on ne s'alarme pas`,
    d.fermer === false && d.raison === "absente",
    JSON.stringify(d),
  );
}

// ── Ce qui DOIT pouvoir se fermer ───────────────────────────────────────────

for (const etat of ["joignable", "programmee", "en_cours"]) {
  verifier(
    `une ligne « ${etat} » peut etre fermee`,
    decisionFermeture(etat).fermer === true,
    "refuser obligerait a attendre une date d'effet pour pouvoir renoncer",
  );
}

// ── Un etat inconnu ne bloque pas, mais ne detruit pas non plus ─────────────
//
// Leur nomenclature evolue. Le comportement par defaut doit rester previsible :
// on ne veut ni un refus permanent sur un etat qu'on ne connait pas encore, ni
// une suppression declenchee par un libelle qu'on n'a jamais vu. Ici, seul
// `en_erreur` protege — on documente donc que tout autre etat autorise.
verifier(
  "un etat inconnu autorise la fermeture, comme un etat sain",
  decisionFermeture("etat_futur_inconnu").fermer === true,
  "a revoir si leur nomenclature ajoute un etat transitoire",
);

console.log("");
console.log("── Non couvert par ce script ────────────────────────────────");
console.log("  · la suppression elle-meme (DELETE /directory_entries/{id}) :");
console.log("    la jouer fermerait une vraie ligne et rendrait le compte de");
console.log("    test injoignable, ce qui casserait toutes les autres");
console.log("    traversees. Verifie a la main, une fois, avant mise en prod.");
console.log("  · l'ordre fermeture-puis-revocation dans la route de");
console.log("    debranchement : le tester supposerait de debrancher.");

process.exit(bilan());
