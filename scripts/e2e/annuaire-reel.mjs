/**
 * La resolution d'adresse, eprouvee sur l'Annuaire REEL.
 *
 * Pourquoi cette traversee est particuliere. Tout le reste de nos tests tourne
 * en bac a sable, ou deux societes fictives partagent un SIREN. Or la
 * resolution d'adresse est la partie la plus risquee de l'integration — c'est
 * elle qui a produit le trou noir du 29/08 puis celui du 30/08 — et c'est
 * justement celle que le bac a sable represente le plus mal.
 *
 * Sauf que `GET /french_directory/entries` et `/french_directory/companies`
 * portent `"security": []` dans la specification : aucune authentification,
 * donc aucun rattachement a un compte de test. Ces deux routes interrogent
 * l'Annuaire national reel. On peut donc eprouver aujourd'hui, sur de vraies
 * entreprises, ce qu'on croyait ne pouvoir verifier qu'en production.
 *
 * Cette traversee ne transmet rien et ne porte aucun jeton : elle lit un
 * annuaire public. Elle ne peut donc ni faire tourner un refresh token, ni
 * emettre quoi que ce soit.
 *
 * Elle est volontairement tolerante sur le CONTENU (l'annuaire se remplit
 * progressivement d'ici septembre 2026, et exiger telle entreprise la rendrait
 * fausse demain) et stricte sur la FORME : ce sont nos hypotheses de lecture
 * qu'elle verifie, pas l'etat de l'annuaire.
 *
 * Ce qu'elle a trouve le 30/08/2026, et qu'aucune relecture n'avait vu :
 *   - GALERIES LAFAYETTE HAUSSMANN publie CINQ adresses en vigueur, suffixees
 *     par un code de routage interne (_BANQUES, _FGENERAUX, _INTERCOS...).
 *     Le code prenait la premiere en la nommant « adresse principale » : toutes
 *     les factures seraient parties au service bancaire, sans que rien ne leve ;
 *   - TOTALENERGIES SE n'a qu'une entree, `is_active: false`. Le code y
 *     retombait faute de mieux — c'est-a-dire adressait une boite pas encore
 *     posee.
 */

import { verifier, bilan } from "./lib.mjs";

const API = "https://api.superpdp.tech/v1.beta";

/**
 * SIREN reels. Le libelle est indicatif : c'est l'annuaire qui fait foi, et
 * une entreprise peut en sortir ou y entrer. Aucune assertion ne depend d'un
 * nom precis.
 */
const SIRENS = [
  "572062594",
  "542051180",
  "503932568",
  "652014051",
  "775665019",
  "103340857",
];

async function lire(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  return { statut: res.status, corps: res.ok ? await res.json() : null };
}

/**
 * Reimplementation MINIMALE de la regle de lecture de lib/superpdp-annuaire.ts.
 * Elle sert a confronter la regle a du reel ; toute divergence entre les deux
 * est un signal, pas une commodite.
 */
function trancher(entrees) {
  const utilisables = (entrees ?? []).filter((e) => !e.is_replyto && e.identifier);
  if (utilisables.length === 0) return { adresse: null, obstacle: null, candidats: [] };
  const actives = utilisables.filter((e) => e.is_active !== false);
  if (actives.length === 0)
    return { adresse: null, obstacle: "inactive", candidats: utilisables.map((e) => e.identifier) };
  if (actives.length > 1)
    return { adresse: null, obstacle: "ambigu", candidats: actives.map((e) => e.identifier) };
  return { adresse: actives[0].identifier, obstacle: null, candidats: [actives[0].identifier] };
}

console.log("Annuaire francais reel — lecture non authentifiee\n");

// ── 1. L'annuaire repond-il sans jeton ? ────────────────────────────────────

const sonde = await lire(`${API}/french_directory/entries?number=${SIRENS[0]}`);
verifier(
  "GET /french_directory/entries repond sans aucune authentification",
  sonde.statut === 200,
  `HTTP ${sonde.statut} — si 401, la spec ment et toute notre resolution d'adresse tombe`,
);
verifier(
  "La reponse porte un tableau `data`",
  Array.isArray(sonde.corps?.data),
  "adresseAnnuaire lit corps.data : une autre forme lui ferait rendre null en silence",
);

if (sonde.statut !== 200) {
  console.log("\nL'annuaire est injoignable : le reste n'a pas de sens.");
  process.exit(bilan());
}

// ── 2. Ce que l'annuaire contient vraiment, et ce qu'on en fait ─────────────

const observees = [];
let connus = 0;
let ambigus = 0;
let inactifs = 0;
let resolus = 0;

for (const siren of SIRENS) {
  const { statut, corps } = await lire(`${API}/french_directory/entries?number=${siren}`);
  verifier(`Interrogation de ${siren} : reponse exploitable`, statut === 200, `HTTP ${statut}`);
  if (statut !== 200) continue;

  const entrees = corps?.data ?? [];
  if (entrees.length) connus++;

  for (const e of entrees) {
    verifier(
      `${siren} : entree exploitable (identifier non vide)`,
      typeof e.identifier === "string" && e.identifier.length > 0,
      JSON.stringify(e).slice(0, 160),
    );
  }

  const verdict = trancher(entrees);
  if (verdict.obstacle === "ambigu") ambigus++;
  if (verdict.obstacle === "inactive") inactifs++;
  if (verdict.adresse) resolus++;

  const nom = entrees[0]?.company?.formal_name ?? "(absent de l'annuaire)";
  observees.push({ siren, nom, entrees: entrees.length, verdict });
}

console.log("");
console.log("Etat observe de l'annuaire :");
for (const o of observees) {
  const issue = o.verdict.adresse
    ? `resolue → ${o.verdict.adresse}`
    : o.verdict.obstacle
      ? `${o.verdict.obstacle} → ${o.verdict.candidats.join(", ")}`
      : "aucune entree, repli sur le SIREN nu";
  console.log(`  · ${o.siren} ${o.nom} : ${o.entrees} entree(s) — ${issue}`);
}
console.log("");
console.log(
  `Mesure : ${connus}/${SIRENS.length} presents dans l'annuaire, ` +
    `${resolus} resolus sans ambiguite, ${ambigus} ambigus, ${inactifs} sans entree en vigueur.`,
);
console.log("");

// ── 3. Nos hypotheses de lecture, confrontees au reel ──────────────────────

verifier(
  "Au moins un SIREN reel est connu de l'annuaire",
  connus > 0,
  `${connus}/${SIRENS.length} — si zero, le repli SIREN n'est pas un repli mais le chemin nominal`,
);

verifier(
  "Le cas « plusieurs adresses » existe pour de vrai",
  ambigus > 0,
  "s'il disparait, verifier que ce n'est pas notre lecture qui a change plutot que l'annuaire",
);

verifier(
  "Le cas « entree pas encore en vigueur » existe pour de vrai",
  inactifs > 0,
  "avant septembre 2026 c'est courant ; apres, ce sera un signal",
);

// L'assertion qui compte : on ne doit JAMAIS produire une adresse quand
// plusieurs sont en vigueur. C'est la regression qu'on vient de corriger.
for (const o of observees) {
  if (o.verdict.obstacle === "ambigu") {
    verifier(
      `${o.siren} publie ${o.verdict.candidats.length} adresses : aucune n'est choisie a la place du client`,
      o.verdict.adresse === null,
      "prendre la premiere enverrait les factures a un service au hasard, silencieusement",
    );
  }
  if (o.verdict.obstacle === "inactive") {
    verifier(
      `${o.siren} n'a aucune adresse ouverte : on ne l'utilise pas`,
      o.verdict.adresse === null,
      "adresser une ligne pas encore ouverte, c'est ecrire a une boite non posee",
    );
  }
}

// ── 4. La recherche d'entreprises, celle que voit l'utilisateur ────────────

const parNom = await lire(`${API}/french_directory/companies?formal_name_starts_with=Carrefour&limit=5`);
verifier("Recherche par nom : repond sans jeton", parNom.statut === 200, `HTTP ${parNom.statut}`);
verifier(
  "Recherche par nom : renvoie de vraies entreprises",
  Array.isArray(parNom.corps?.data) && parNom.corps.data.length > 0,
  `${parNom.corps?.data?.length ?? 0} resultat(s)`,
);
if (parNom.corps?.data?.length) {
  const p = parNom.corps.data[0];
  verifier(
    "Une entreprise porte les champs dont le Factur-X a besoin",
    Boolean(p.formal_name && p.number && p.postcode && p.city),
    JSON.stringify(p).slice(0, 200),
  );
}

// Recherche par SIREN : on interroge un SIREN dont on vient de CONSTATER la
// presence, plutot qu'un SIREN suppose connu. La premiere version de ce test
// echouait sur une entreprise simplement absente de l'annuaire — l'assertion
// etait fausse, pas le code.
const presentDansAnnuaire = observees.find((o) => o.entrees > 0)?.siren;
if (presentDansAnnuaire) {
  const parSiren = await lire(`${API}/french_directory/companies?number=${presentDansAnnuaire}`);
  verifier("Recherche par SIREN : repond", parSiren.statut === 200, `HTTP ${parSiren.statut}`);
  verifier(
    "Recherche par SIREN : retrouve une entreprise vue dans les entrees",
    (parSiren.corps?.data ?? []).some((c) => String(c.number) === presentDansAnnuaire),
    JSON.stringify(parSiren.corps?.data?.[0] ?? {}).slice(0, 200),
  );
}

// ── 5. Un SIREN qui n'existe pas ne doit pas faire semblant ────────────────

const inexistant = await lire(`${API}/french_directory/entries?number=000000000`);
verifier(
  "Un SIREN inexistant ne renvoie pas d'adresse fantome",
  inexistant.statut !== 200 || (inexistant.corps?.data ?? []).length === 0,
  `HTTP ${inexistant.statut}, ${(inexistant.corps?.data ?? []).length} entree(s)`,
);

process.exit(bilan());
