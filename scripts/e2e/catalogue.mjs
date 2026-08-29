/**
 * Catalogue de prestations et modèles de devis — écriture, pas seulement lecture.
 *
 * Ce qui était testé jusqu'ici : `GET /api/catalog` répond 200 (promesses.mjs et
 * two-roles.mjs). Rien d'autre. Or c'est à l'écriture que la panne récurrente de
 * ce projet se manifeste : une route qui filtre sur l'identifiant de
 * l'utilisateur au lieu de celui de l'espace de travail marche pour le
 * propriétaire — son identifiant EST celui de l'espace — et casse pour tout
 * collaborateur. Onze routes en souffraient ; la liste s'affichait, l'action
 * renvoyait 404.
 *
 * Ce script exerce donc chaque écriture **deux fois** : une fois en
 * propriétaire, une fois en membre d'équipe. Un catalogue qu'un collaborateur
 * peut lire mais pas modifier est un défaut, pas une politique : le plan Pro est
 * vendu sur le travail à plusieurs.
 *
 * Usage : node scripts/e2e/catalogue.mjs
 */

import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const nonCouvert = [];
const aVerifierAutrement = (quoi, pourquoi) => nonCouvert.push({ quoi, pourquoi });

console.log("── Mise en place ─────────────────────────────────────────────");
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);
// Espace de travail sans lien avec le précédent, pour éprouver l'étanchéité.
// On réutilise une étiquette existante plutôt que de consommer un compte de
// démonstration de plus sur le quota horaire.
const etranger = await openSession("promesses");
console.log(`  propriétaire, membre rattaché, et un espace étranger`);
console.log("");

// ── Catalogue : lecture ──────────────────────────────────────────────────────
console.log("── Catalogue — lecture ───────────────────────────────────────");

const lectureAnonyme = await anonymous.call("/api/catalog");
verifier("un anonyme ne lit pas le catalogue", lectureAnonyme.status === 401, `HTTP ${lectureAnonyme.status}`);

const lectureProprietaire = await owner.call("/api/catalog");
verifier(
  "le propriétaire lit son catalogue",
  lectureProprietaire.status === 200 && Array.isArray(lectureProprietaire.body?.items),
  `HTTP ${lectureProprietaire.status}`
);

const lectureMembre = await member.call("/api/catalog");
verifier(
  "un membre lit le catalogue de l'espace, pas un catalogue vide",
  lectureMembre.status === 200 && (lectureMembre.body?.items ?? []).length > 0,
  `HTTP ${lectureMembre.status} — ${(lectureMembre.body?.items ?? []).length} prestation(s)`
);

// ── Catalogue : création ─────────────────────────────────────────────────────
console.log("");
console.log("── Catalogue — création ──────────────────────────────────────");

const sansNom = await owner.call("/api/catalog", { method: "POST", body: doc({ unit_price: 100 }) });
verifier("une prestation sans nom est refusée", sansNom.status === 400, `HTTP ${sansNom.status}`);

const creationAnonyme = await anonymous.call("/api/catalog", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: doc({ name: "Intrus" }),
});
verifier("un anonyme ne crée pas de prestation", creationAnonyme.status === 401, `HTTP ${creationAnonyme.status}`);

const forfait = await owner.call("/api/catalog", {
  method: "POST",
  body: doc({ name: "Prestation de traversée", description: "Créée par la suite e2e", unit: "forfait", unit_price: 750, type: "fixed" }),
});
verifier(
  "le propriétaire crée une prestation au forfait",
  forfait.status === 201 && forfait.body?.item?.unit_price === 750,
  `HTTP ${forfait.status} ${doc(forfait.body).slice(0, 140)}`
);

// Règle métier : une prestation horaire se facture à l'heure, quoi qu'envoie le
// formulaire. Sans ce forçage, un devis afficherait « 3 forfaits à 150 € ».
const horaire = await owner.call("/api/catalog", {
  method: "POST",
  body: doc({ name: "Prestation horaire de traversée", unit: "forfait", unit_price: 150, type: "hourly" }),
});
verifier(
  "une prestation horaire est forcée à l'unité « heure », même si le formulaire dit autre chose",
  horaire.status === 201 && horaire.body?.item?.unit === "heure",
  `unité ${horaire.body?.item?.unit}`
);

const typeInconnu = await owner.call("/api/catalog", {
  method: "POST",
  body: doc({ name: "Prestation type inconnu", unit_price: 10, type: "abracadabra" }),
});
verifier(
  "un type inconnu retombe sur « fixed » au lieu d'être enregistré tel quel",
  typeInconnu.status === 201 && typeInconnu.body?.item?.type === "fixed",
  `type ${typeInconnu.body?.item?.type}`
);

const creationMembre = await member.call("/api/catalog", {
  method: "POST",
  body: doc({ name: "Prestation créée par un membre", unit_price: 200, type: "fixed" }),
});
verifier(
  "un membre d'équipe peut enrichir le catalogue de l'espace",
  creationMembre.status === 201,
  `HTTP ${creationMembre.status} ${doc(creationMembre.body).slice(0, 140)}`
);

// La prestation créée par le membre doit atterrir dans l'espace du
// propriétaire, pas dans un espace fantôme au nom du collaborateur.
const vueProprietaire = await owner.call("/api/catalog");
verifier(
  "ce qu'un membre crée apparaît bien dans le catalogue du propriétaire",
  (vueProprietaire.body?.items ?? []).some((i) => i.id === creationMembre.body?.item?.id),
  "la prestation créée par le membre est absente de la vue du propriétaire"
);

// ── Catalogue : modification et suppression ──────────────────────────────────
console.log("");
console.log("── Catalogue — modification et suppression ───────────────────");

const idForfait = forfait.body?.item?.id;

const modification = await owner.call(`/api/catalog/${idForfait}`, {
  method: "PATCH",
  body: doc({ unit_price: 950, description: "Tarif révisé" }),
});
verifier(
  "le propriétaire modifie une prestation",
  modification.status === 200 && modification.body?.item?.unit_price === 950,
  `HTTP ${modification.status} ${doc(modification.body).slice(0, 140)}`
);

// Seul un jeu de champs est modifiable. Laisser passer `user_id` permettrait de
// déplacer une prestation dans l'espace de quelqu'un d'autre.
const champInterdit = await owner.call(`/api/catalog/${idForfait}`, {
  method: "PATCH",
  body: doc({ user_id: etranger.userId, name: "Nom légitime" }),
});
const apresChampInterdit = await owner.call("/api/catalog");
verifier(
  "un champ non autorisé est ignoré, la prestation reste dans l'espace",
  champInterdit.status === 200 &&
    (apresChampInterdit.body?.items ?? []).some((i) => i.id === idForfait),
  `HTTP ${champInterdit.status}`
);

const modificationMembre = await member.call(`/api/catalog/${creationMembre.body?.item?.id}`, {
  method: "PATCH",
  body: doc({ unit_price: 260 }),
});
verifier(
  "un membre d'équipe modifie une prestation de l'espace",
  modificationMembre.status === 200 && modificationMembre.body?.item?.unit_price === 260,
  `HTTP ${modificationMembre.status} ${doc(modificationMembre.body).slice(0, 200)}`
);

// Étanchéité : un espace étranger ne doit pas pouvoir toucher cette prestation.
const modificationEtrangere = await etranger.call(`/api/catalog/${idForfait}`, {
  method: "PATCH",
  body: doc({ unit_price: 1 }),
});
const apresTentative = await owner.call("/api/catalog");
const inchangee = (apresTentative.body?.items ?? []).find((i) => i.id === idForfait);
verifier(
  "un espace étranger ne modifie pas une prestation qui ne lui appartient pas",
  inchangee?.unit_price === 950,
  `HTTP ${modificationEtrangere.status} → prix ${inchangee?.unit_price}`
);

const suppressionMembre = await member.call(`/api/catalog/${creationMembre.body?.item?.id}`, { method: "DELETE" });
verifier(
  "un membre d'équipe supprime une prestation de l'espace",
  suppressionMembre.status === 200,
  `HTTP ${suppressionMembre.status} ${doc(suppressionMembre.body).slice(0, 200)}`
);

for (const id of [idForfait, horaire.body?.item?.id, typeInconnu.body?.item?.id]) {
  if (id) await owner.call(`/api/catalog/${id}`, { method: "DELETE" });
}
const apresMenage = await owner.call("/api/catalog");
verifier(
  "les prestations de test sont bien supprimées",
  !(apresMenage.body?.items ?? []).some((i) => i.name?.includes("de traversée")),
  "des prestations de test subsistent"
);

// ── Modèles de devis ─────────────────────────────────────────────────────────
console.log("");
console.log("── Modèles de devis ──────────────────────────────────────────");

const modelesAnonyme = await anonymous.call("/api/templates");
verifier("un anonyme ne lit pas les modèles", modelesAnonyme.status === 401, `HTTP ${modelesAnonyme.status}`);

const modeles = await owner.call("/api/templates");
verifier(
  "le propriétaire lit ses modèles",
  modeles.status === 200 && Array.isArray(modeles.body?.templates),
  `HTTP ${modeles.status}`
);

const modelesMembre = await member.call("/api/templates");
verifier(
  "un membre lit les modèles de l'espace",
  modelesMembre.status === 200 && (modelesMembre.body?.templates ?? []).length > 0,
  `HTTP ${modelesMembre.status} — ${(modelesMembre.body?.templates ?? []).length} modèle(s)`
);

const modeleSansNom = await owner.call("/api/templates", { method: "POST", body: doc({ items: [] }) });
verifier("un modèle sans nom est refusé", modeleSansNom.status === 400, `HTTP ${modeleSansNom.status}`);

const modele = await owner.call("/api/templates", {
  method: "POST",
  body: doc({
    name: "Modèle de traversée",
    description: "Créé par la suite e2e",
    items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
    tva_rate: 20, payment_terms: "30 jours net",
  }),
});
verifier(
  "le propriétaire crée un modèle",
  modele.status === 201 && modele.body?.template?.name === "Modèle de traversée",
  `HTTP ${modele.status} ${doc(modele.body).slice(0, 140)}`
);

const modeleMembre = await member.call("/api/templates", {
  method: "POST",
  body: doc({ name: "Modèle créé par un membre", items: [], tva_rate: 0 }),
});
verifier(
  "un membre d'équipe crée un modèle partagé",
  modeleMembre.status === 201,
  `HTTP ${modeleMembre.status} ${doc(modeleMembre.body).slice(0, 140)}`
);

// Asymétrie voulue, à la différence du catalogue : supprimer un modèle est
// réservé au propriétaire. Un modèle est une décision commerciale de l'espace ;
// un collaborateur qui en supprime un le retire à toute l'équipe.
const suppressionModeleMembre = await member.call(`/api/templates/${modele.body?.template?.id}`, { method: "DELETE" });
verifier(
  "un membre ne supprime PAS un modèle : c'est réservé au propriétaire",
  suppressionModeleMembre.status === 403,
  `HTTP ${suppressionModeleMembre.status} ${doc(suppressionModeleMembre.body).slice(0, 140)}`
);

for (const id of [modele.body?.template?.id, modeleMembre.body?.template?.id]) {
  if (id) await owner.call(`/api/templates/${id}`, { method: "DELETE" });
}
const modelesApres = await owner.call("/api/templates");
verifier(
  "le propriétaire supprime les modèles de test",
  !(modelesApres.body?.templates ?? []).some((t) => t.name?.includes("de traversée") || t.name?.includes("par un membre")),
  "des modèles de test subsistent"
);

// ── Ce que ce script ne prouve pas ───────────────────────────────────────────
aVerifierAutrement(
  "Le refus du catalogue aux plans Free et Solo",
  "la création exige le plan Pro ; les comptes de démonstration sont tous en Pro, donc la branche PLAN_REQUIRED n'est pas atteignable ici."
);
aVerifierAutrement(
  "Le refus des modèles au plan Free",
  "même raison : les modèles exigent Solo ou Pro, et les comptes de test sont en Pro."
);
aVerifierAutrement(
  "L'usage d'un modèle pour pré-remplir un devis",
  "câblage d'interface, hors d'atteinte d'un script qui n'interroge que l'API."
);

console.log("");
console.log("── Non couvert par ce script ─────────────────────────────────");
for (const n of nonCouvert) console.log(`  ? ${n.quoi}\n      ${n.pourquoi}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
