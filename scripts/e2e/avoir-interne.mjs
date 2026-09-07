/**
 * Un avoir se transmet-il ? La regle, et rien d'autre.
 *
 * Pourquoi cette traversee existe. La regle est courte, elle tient en une
 * phrase du dossier de specifications externes de la DGFiP (v3.2, p. 60), et
 * elle se trompe dans les deux sens :
 *
 *   - transmettre l'avoir d'une facture REFUSEE declare deux fois la meme
 *     annulation a l'administration ;
 *   - ne PAS transmettre l'avoir d'une facture encaissee laisse
 *     l'administration croire a un chiffre d'affaires qui n'existe plus.
 *
 * Aucun des deux ne leve d'erreur nulle part : ce sont des erreurs fiscales
 * silencieuses. C'est exactement le profil de defaut que cette suite de tests
 * existe pour attraper, et la raison pour laquelle la regle a ete extraite
 * dans son propre module plutot que glissee dans la route d'emission.
 *
 * Aucun reseau, aucun compte, aucune facture creee.
 */

import { verifier, bilan } from "./lib.mjs";
import { verdictAvoir } from "../../lib/superpdp-avoir.ts";
import { MOTIFS_REFUS, estMotifValide, motifParCode } from "../../lib/superpdp-motifs.ts";
import { STATUTS } from "../../lib/superpdp-statuts.ts";

console.log("");
console.log("── L'avoir interne : ce qui ne doit pas partir ────────────────");
console.log("");

// ── Les trois cas ou l'avoir reste dans les livres ──────────────────────────

// Le mot attendu est accentue : c'est le texte que l'utilisateur lira, et une
// comparaison sans accent laisserait passer un message ecrit a moitie.
for (const [statut, mot] of [
  ["fr:210", "refusée"],
  ["fr:213", "rejetée"],
  ["fr:501", "rejetée"],
]) {
  const v = verdictAvoir(statut);
  verifier(
    `un avoir sur une facture ${statut} reste interne`,
    v.interne === true,
    "le statut obligatoire a deja porte l'annulation jusqu'a l'administration",
  );
  verifier(
    `et le message dit qu'elle a ete ${mot}`,
    new RegExp(mot, "i").test(v.message),
    v.message,
  );
}

verifier(
  "le message explique le risque, pas seulement l'interdiction",
  /deux fois/i.test(verdictAvoir("fr:210").message),
  "« vous ne pouvez pas » sans « parce que » se lit comme un bug de l'outil",
);

// ── Le sens inverse, qui est l'autre moitie du risque ───────────────────────

for (const statut of [
  "fr:212", // encaissee : c'est LE cas ou l'avoir doit imperativement partir
  "fr:205",
  "fr:200",
  "fr:211",
  null,
  undefined,
  "",
]) {
  const v = verdictAvoir(statut);
  verifier(
    `un avoir sur une facture ${statut === null ? "sans statut" : statut === undefined ? "jamais transmise" : statut || "au statut vide"} se transmet`,
    v.interne === false && v.message === "",
    "rien d'autre qu'un avoir electronique n'apprendrait l'annulation a l'administration",
  );
}

verifier(
  "les statuts Peppol ne declenchent pas la regle francaise",
  ["api:rejected", "api:invalid"].every((s) => verdictAvoir(s).interne === false),
  "ces factures ne produisent aucun flux F1 auquel la regle pourrait s'appliquer",
);

// ── La table des statuts, confrontee au tableau 8 lu le 07/09/2026 ──────────

const obligatoires = Object.entries(STATUTS)
  .filter(([, s]) => s.obligatoire)
  .map(([code]) => code)
  .sort();

verifier(
  "quatre statuts obligatoires, exactement ceux du tableau 8",
  JSON.stringify(obligatoires) === JSON.stringify(["fr:200", "fr:210", "fr:212", "fr:213"]),
  obligatoires.join(", "),
);

verifier(
  "aucun code 214-228 ne porte de libelle invente",
  ![
    "fr:215", "fr:216", "fr:217", "fr:218", "fr:219", "fr:220",
    "fr:221", "fr:222", "fr:223", "fr:224", "fr:225", "fr:226",
    "fr:227", "fr:228",
  ].some((c) => c in STATUTS),
  "le tableau 8 s'arrete a 213 et se declare non exhaustif : traduire au-dela serait inventer",
);

verifier(
  "fr:214 n'est ni obligatoire ni cloturant",
  STATUTS["fr:214"] && !STATUTS["fr:214"].obligatoire && !STATUTS["fr:214"].cloture,
  "il vient de l'enumeration de la plateforme, pas du tableau 8",
);

// ── Les motifs de refus, confrontes a la nomenclature de l'annexe 7 ─────────

verifier(
  "treize motifs, ceux que l'API a elle-meme nommes",
  MOTIFS_REFUS.length === 13,
  `${MOTIFS_REFUS.length} motifs`,
);

verifier(
  "aucun motif « autre » : ce statut n'en a pas",
  !estMotifValide("AUTRE"),
  "la nomenclature complete en contient un, la liste du statut 210 non",
);

verifier(
  "DOUBLE_FACT porte le libelle de la nomenclature, pas la deduction du code",
  motifParCode("DOUBLE_FACT").libelle === "Données réglementaires F1 en doublon",
  motifParCode("DOUBLE_FACT").libelle,
);

verifier(
  "et sa description renvoie explicitement vers DOUBLON",
  /Facture en doublon/i.test(motifParCode("DOUBLE_FACT").description ?? ""),
  "c'est le motif que choisirait a tort quelqu'un facture deux fois",
);

verifier(
  "CMD_ERR dit sa restriction d'emploi, qu'aucun libelle ne peut contenir",
  /avant la facturation/i.test(motifParCode("CMD_ERR").description ?? ""),
  motifParCode("CMD_ERR").description,
);

verifier(
  "tous les motifs sont sources",
  MOTIFS_REFUS.every((m) => m.sourced === true),
  "un libelle deduit du code a deja ete faux deux fois",
);

bilan();
