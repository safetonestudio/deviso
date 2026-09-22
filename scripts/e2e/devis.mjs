/**
 * Cycle de vie complet d'un devis.
 *
 * Ce que couvrait déjà la suite : la création, la vue publique et la signature
 * (promesses.mjs), plus les droits de lecture des deux rôles (two-roles.mjs).
 *
 * Ce que personne ne testait, et que ce script ajoute : le refus par le client
 * et surtout **les garde-fous** — ce qui se passe quand un devis est traité
 * deux fois. C'est là que se logent les défauts coûteux, comme un devis signé
 * qu'on peut re-signer. (Les autorisations des membres — qui a le droit
 * d'envoyer — sont couvertes par permissions.mjs.)
 *
 * Choix assumé : ce script n'exerce **aucun envoi d'email réel**. Les routes de
 * signature et de refus notifient toutes le propriétaire par
 * Resend, à l'adresse de son profil — sur un compte de démonstration, c'est une
 * adresse fictive, donc un rejet dur qui abîme la réputation d'envoi du domaine
 * pour les vrais clients. On s'arrête donc aux contrôles qui répondent AVANT
 * l'envoi, ce qui couvre l'essentiel de la logique. Voir la section « non
 * couvert » en fin de script.
 *
 * Usage : node scripts/e2e/devis.mjs
 */

import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const nonCouvert = [];
const aVerifierAutrement = (quoi, pourquoi) => nonCouvert.push({ quoi, pourquoi });

console.log("── Mise en place ─────────────────────────────────────────────");
// Mêmes étiquettes que two-roles.mjs : on réutilise les mêmes comptes de
// démonstration et le même rattachement, plutôt que d'en consommer deux de plus
// sur le quota horaire.
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);
console.log(`  propriétaire : ${owner.email}`);
console.log(`  membre       : ${member.email} (rattaché)`);
console.log("");

const creerDevis = (session, titre, extra = {}) =>
  session.call("/api/proposals", {
    method: "POST",
    body: doc({
      title: titre,
      client_name: "Client Cycle",
      client_email: "cycle@example.fr",
      client_company: "Cycle SARL",
      client_street: "7 rue des Étapes",
      client_postcode: "33000",
      client_city: "Bordeaux",
      client_siren: "552100554",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
      total_ht: 1000, tva_rate: 0, total_ttc: 1000,
      valid_until: "2026-12-31", payment_terms: "30 jours net",
      ...extra,
    }),
  });

// ── Vue publique par jeton de partage ────────────────────────────────────────
console.log("── Vue publique par jeton de partage ─────────────────────────");

const devisPublic = await creerDevis(owner, "Devis — vue publique");
const jeton = devisPublic.body?.proposal?.share_token;
verifier("un devis créé porte un jeton de partage", Boolean(jeton), `HTTP ${devisPublic.status}`);

const vue = await anonymous.call(`/api/public/proposals/${jeton}`);
verifier(
  "un anonyme consulte le devis par son jeton, sans session",
  vue.status === 200 && Boolean(vue.body?.proposal),
  `HTTP ${vue.status}`
);
// Le devis public doit livrer de quoi s'afficher aux couleurs de l'émetteur :
// sans profil, la page publique tombe sur un rendu générique.
verifier(
  "la vue publique livre aussi le profil émetteur et son hôte canonique",
  Boolean(vue.body?.profile) && Boolean(vue.body?.canonicalHost),
  `profil ${Boolean(vue.body?.profile)} / hôte ${vue.body?.canonicalHost}`
);

const jetonInconnu = await anonymous.call("/api/public/proposals/00000000-0000-0000-0000-000000000000");
verifier("un jeton inconnu renvoie 404, pas une erreur serveur", jetonInconnu.status === 404, `HTTP ${jetonInconnu.status}`);

// ── Passage automatique en « vu » ────────────────────────────────────────────
console.log("");
console.log("── Passage automatique en « vu » ─────────────────────────────");

const devisVu = await creerDevis(owner, "Devis — passage en vu");
const idVu = devisVu.body?.proposal?.id;
const jetonVu = devisVu.body?.proposal?.share_token;
await owner.call(`/api/proposals/${idVu}`, { method: "PATCH", body: doc({ status: "sent" }) });

// C'est ce basculement qui alimente l'indicateur « votre client a ouvert le
// devis » : s'il ne se fait pas, le propriétaire relance quelqu'un qui a déjà lu.
await anonymous.call(`/api/public/proposals/${jetonVu}`);
const apresVue = await owner.call(`/api/proposals/${idVu}`);
verifier(
  "consulter un devis envoyé le fait passer en « vu »",
  apresVue.body?.proposal?.status === "viewed",
  `statut ${apresVue.body?.proposal?.status}`
);

// ── Actions publiques mal formées ────────────────────────────────────────────
console.log("");
console.log("── Actions publiques mal formées ─────────────────────────────");

const sansAction = await anonymous.call(`/api/public/proposals/${jeton}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: doc({}),
});
verifier("une action manquante est refusée", sansAction.status === 400, `HTTP ${sansAction.status}`);

const actionInconnue = await anonymous.call(`/api/public/proposals/${jeton}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: doc({ action: "supprimer" }),
});
verifier("une action inconnue est refusée", actionInconnue.status === 400, `HTTP ${actionInconnue.status}`);

// ── Un devis déjà traité ne se retraite pas ──────────────────────────────────
console.log("");
console.log("── Un devis déjà traité ne se retraite pas ───────────────────");

// On s'appuie sur les devis signés du jeu de démonstration plutôt que d'en
// signer un ici : la signature déclenche une notification par email, et le
// refus (409) est rendu AVANT tout envoi. Même preuve, sans effet de bord.
const tousDevis = await owner.call("/api/proposals");
const dejaSigne = (tousDevis.body?.proposals ?? []).find(
  (p) => p.status === "signed" && p.share_token
);
verifier("le jeu de démonstration fournit un devis déjà signé", Boolean(dejaSigne));

if (dejaSigne) {
  const resignature = await anonymous.call(`/api/public/proposals/${dejaSigne.share_token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: doc({ action: "sign", signer_name: "Second Signataire" }),
  });
  verifier(
    "un devis déjà signé ne peut pas être re-signé",
    resignature.status === 409,
    `HTTP ${resignature.status} ${doc(resignature.body).slice(0, 120)}`
  );

  const refusApresSignature = await anonymous.call(`/api/public/proposals/${dejaSigne.share_token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: doc({ action: "decline" }),
  });
  verifier(
    "un devis déjà signé ne peut pas être refusé après coup",
    refusApresSignature.status === 409,
    `HTTP ${refusApresSignature.status}`
  );

  // « view » reste permis sur un devis traité : c'est une consultation, pas une
  // décision. L'interdire empêcherait le client de rouvrir son propre devis.
  const revoir = await anonymous.call(`/api/public/proposals/${dejaSigne.share_token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: doc({ action: "view" }),
  });
  verifier("relire un devis déjà signé reste possible", revoir.status === 200, `HTTP ${revoir.status}`);
}

// ── Ce que ce script ne prouve pas ───────────────────────────────────────────
aVerifierAutrement(
  "La signature elle-même (action « sign » aboutie)",
  "couverte par promesses.mjs, qui vérifie statut, horodatage, empreinte et nom du signataire."
);
aVerifierAutrement(
  "Le refus client abouti (action « decline »)",
  "la route notifie le propriétaire par email avant de répondre ; sur un compte de démonstration l'adresse est fictive, donc un rejet dur. À couvrir dès qu'un garde-fou d'envoi existera (voir CLAUDE.md)."
);
aVerifierAutrement(
  "Le rendu de la page publique du devis",
  "ce script interroge l'API ; l'affichage aux couleurs de l'émetteur reste à juger à l'œil."
);

console.log("");
console.log("── Non couvert par ce script ─────────────────────────────────");
for (const n of nonCouvert) console.log(`  ? ${n.quoi}\n      ${n.pourquoi}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
