/**
 * Traversée du tunnel d'invitation d'équipe.
 *
 * Le multi-utilisateurs est ce qui justifie l'écart de prix entre Solo et Pro
 * (34 €/mois, 3 sièges inclus puis 5 €/siège). Jusqu'ici, la seule chose qu'on
 * en testait était la lecture : `two-roles.mjs` emprunte bien le vrai tunnel
 * d'invitation, mais en **préalable** — si l'invitation casse, le script lève
 * une exception au lieu de rendre un échec de vérification, et personne ne teste
 * ce qui l'entoure : la page d'accueil de l'invitation, la ré-invitation, la
 * limite de sièges, le retrait d'un membre.
 *
 * Toutes les invitations de ce script visent des adresses en `@deviso.internal`.
 * Ce n'est pas cosmétique : la route d'invitation ne coupe l'envoi d'email que
 * pour ce domaine, et écrire à une adresse fictive produit un rejet dur qui
 * dégrade la réputation d'envoi du domaine pour les vrais clients. Le script
 * vérifie d'ailleurs que cette coupure a bien lieu.
 *
 * Usage : node scripts/e2e/equipe.mjs
 */

import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const nonCouvert = [];
const aVerifierAutrement = (quoi, pourquoi) => nonCouvert.push({ quoi, pourquoi });

// Adresse fictive unique par exécution : sans unicité, une deuxième exécution
// retomberait sur la branche « ré-invitation » dès la première invitation.
const fictive = (suffixe) => `equipe-${Date.now().toString(36)}-${suffixe}@deviso.internal`;

console.log("── Mise en place ─────────────────────────────────────────────");
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);
console.log(`  propriétaire : ${owner.email}`);
console.log("");

// Tout ce que ce script crée est retiré à la fin de sa section, pour que les
// comptes de démonstration partagés avec les autres scripts restent dans l'état
// où on les a trouvés — en particulier le décompte de sièges.
const aRetirer = [];

// ── Lecture de l'équipe ──────────────────────────────────────────────────────
console.log("── Lecture de l'équipe ───────────────────────────────────────");

const equipeAnonyme = await anonymous.call("/api/team");
verifier("un anonyme ne lit pas l'équipe", equipeAnonyme.status === 401, `HTTP ${equipeAnonyme.status}`);

const equipe = await owner.call("/api/team");
verifier(
  "le propriétaire lit la liste des membres",
  equipe.status === 200 && Array.isArray(equipe.body?.members),
  `HTTP ${equipe.status}`
);

// Le membre doit voir l'équipe de son espace, pas la sienne (qui est vide).
// C'est exactement la panne corrigée sur `pipeline` : plan lu sur le mauvais
// profil, listes filtrées sur un identifiant qui n'existe pas pour un membre.
const equipeMembre = await member.call("/api/team");
verifier(
  "un membre voit l'équipe de l'espace de travail, pas une liste vide",
  equipeMembre.status === 200 && (equipeMembre.body?.members ?? []).length > 0,
  `HTTP ${equipeMembre.status} — ${(equipeMembre.body?.members ?? []).length} membre(s)`
);

// ── Invitation ───────────────────────────────────────────────────────────────
console.log("");
console.log("── Invitation ────────────────────────────────────────────────");

const emailInvalide = await owner.call("/api/team", { method: "POST", body: doc({ email: "pas-une-adresse" }) });
verifier("une adresse invalide est refusée", emailInvalide.status === 400, `HTTP ${emailInvalide.status}`);

const inviteAnonyme = await anonymous.call("/api/team", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: doc({ email: fictive("anon") }),
});
verifier("un anonyme ne peut pas inviter", inviteAnonyme.status === 401, `HTTP ${inviteAnonyme.status}`);

const adresseInvitee = fictive("principal");
const invitation = await owner.call("/api/team", { method: "POST", body: doc({ email: adresseInvitee }) });
verifier(
  "le propriétaire invite un collaborateur",
  invitation.status === 200 && Boolean(invitation.body?.inviteUrl),
  `HTTP ${invitation.status} ${doc(invitation.body).slice(0, 140)}`
);

// Le lien est renvoyé dans la réponse précisément pour que le propriétaire
// puisse le transmettre lui-même quand l'email se perd. S'il disparaît, une
// invitation tombée en indésirables devient irrécupérable.
verifier(
  "aucun email n'est envoyé à une adresse fictive",
  invitation.body?.emailEnvoye === false,
  `emailEnvoye = ${invitation.body?.emailEnvoye}`
);

const jetonInvitation = invitation.body?.inviteUrl?.split("/join/")[1];
verifier("le lien d'invitation porte un jeton exploitable", Boolean(jetonInvitation), invitation.body?.inviteUrl);

// ── Page d'accueil de l'invitation ───────────────────────────────────────────
console.log("");
console.log("── Page d'accueil de l'invitation ────────────────────────────");

// Cette route est appelée sans session : l'invité arrive par un lien, souvent
// avant même d'avoir un compte. Si elle exige une authentification, le tunnel
// se referme sur lui.
const infos = await anonymous.call(`/api/team/invite-info/${jetonInvitation}`);
verifier(
  "l'invité consulte son invitation sans être connecté",
  infos.status === 200 && infos.body?.invitee_email === adresseInvitee,
  `HTTP ${infos.status} ${doc(infos.body).slice(0, 140)}`
);
verifier(
  "l'invitation nomme celui qui invite",
  Boolean(infos.body?.owner_name),
  `owner_name = ${infos.body?.owner_name}`
);

const infosInconnues = await anonymous.call("/api/team/invite-info/00000000-0000-0000-0000-000000000000");
verifier("un jeton d'invitation inconnu renvoie 404", infosInconnues.status === 404, `HTTP ${infosInconnues.status}`);

// ── Ré-invitation ────────────────────────────────────────────────────────────
console.log("");
console.log("── Ré-invitation ─────────────────────────────────────────────");

// Ré-inviter la même adresse doit régénérer le jeton, sans créer de second
// siège. Deux lignes pour une personne fausseraient le décompte facturé.
const reInvitation = await owner.call("/api/team", { method: "POST", body: doc({ email: adresseInvitee }) });
const nouveauJeton = reInvitation.body?.inviteUrl?.split("/join/")[1];
verifier("ré-inviter la même adresse aboutit", reInvitation.status === 200, `HTTP ${reInvitation.status}`);
verifier(
  "la ré-invitation régénère le jeton",
  Boolean(nouveauJeton) && nouveauJeton !== jetonInvitation,
  `${jetonInvitation} → ${nouveauJeton}`
);

// Corollaire indispensable : un lien d'invitation périmé ne doit plus ouvrir
// l'espace. Sans cela, révoquer une invitation ne servirait à rien.
const ancienJeton = await anonymous.call(`/api/team/invite-info/${jetonInvitation}`);
verifier(
  "l'ancien lien d'invitation ne fonctionne plus",
  ancienJeton.status === 404,
  `HTTP ${ancienJeton.status}`
);

const apresReInvitation = await owner.call("/api/team");
const occurrences = (apresReInvitation.body?.members ?? []).filter((m) => m.email === adresseInvitee).length;
verifier("la ré-invitation ne crée pas de second siège", occurrences === 1, `${occurrences} ligne(s)`);

const membreCree = (apresReInvitation.body?.members ?? []).find((m) => m.email === adresseInvitee);
if (membreCree) aRetirer.push(membreCree.id);

// ── Vue manager (pipeline) ───────────────────────────────────────────────────
console.log("");
console.log("── Vue manager (pipeline) ────────────────────────────────────");

const pipelineAnonyme = await anonymous.call("/api/team/pipeline");
verifier("un anonyme ne lit pas le pipeline", pipelineAnonyme.status === 401, `HTTP ${pipelineAnonyme.status}`);

const pipeline = await owner.call("/api/team/pipeline");
verifier(
  "le propriétaire lit le pipeline de son équipe",
  pipeline.status === 200 && Array.isArray(pipeline.body?.team) && Boolean(pipeline.body?.global),
  `HTTP ${pipeline.status}`
);

// La panne corrigée le 12/08 : pour un membre, le plan était lu sur son propre
// profil (jamais « pro ») et les listes filtrées sur un owner_id inexistant.
// Résultat : un écran vide, sans message d'erreur. Un 200 ne suffit donc pas —
// on exige des données.
const pipelineMembre = await member.call("/api/team/pipeline");
verifier(
  "un membre lit le pipeline de l'espace, avec des données",
  pipelineMembre.status === 200 && (pipelineMembre.body?.team ?? []).length > 0,
  `HTTP ${pipelineMembre.status} — ${(pipelineMembre.body?.team ?? []).length} entrée(s)`
);

verifier(
  "le pipeline compte le propriétaire parmi les membres",
  (pipeline.body?.team ?? []).some((m) => m.is_owner === true),
  `aucune entrée is_owner dans ${(pipeline.body?.team ?? []).length} entrée(s)`
);

// ── Limite de sièges ─────────────────────────────────────────────────────────
console.log("");
console.log("── Limite de sièges (10 pour l'offre Pro) ────────────────────");

const sortantes = [];
let refusSiege = null;
let siegesAvantRefus = null;

// On invite jusqu'au refus, borné pour ne jamais tourner en boucle si la limite
// venait à disparaître — auquel cas le test doit échouer, pas s'emballer.
for (let i = 0; i < 14 && !refusSiege; i++) {
  const depart = (await owner.call("/api/team")).body?.members?.length ?? 0;
  const r = await owner.call("/api/team", { method: "POST", body: doc({ email: fictive(`siege-${i}`) }) });
  if (r.status === 403) {
    refusSiege = r;
    siegesAvantRefus = depart;
  } else {
    sortantes.push(r.body?.inviteUrl);
  }
}

verifier(
  "la limite de sièges finit par refuser une invitation de plus",
  refusSiege?.status === 403 && refusSiege?.body?.error === "SEAT_LIMIT_REACHED",
  refusSiege ? doc(refusSiege.body).slice(0, 140) : "aucun refus après 14 invitations"
);
verifier(
  "le refus intervient bien à 10 sièges, pas avant",
  siegesAvantRefus === 10,
  `refus alors que l'équipe comptait ${siegesAvantRefus} siège(s)`
);

// ── Retrait d'un membre ──────────────────────────────────────────────────────
console.log("");
console.log("── Retrait d'un membre ───────────────────────────────────────");

const avantRetrait = await owner.call("/api/team");
const cible = (avantRetrait.body?.members ?? []).find((m) => m.email.endsWith("@deviso.internal") && m.status !== "active");
verifier("un membre fictif est disponible pour le retrait", Boolean(cible));

const retraitAnonyme = await anonymous.call(`/api/team/${cible?.id}`, { method: "DELETE" });
verifier("un anonyme ne peut pas retirer un membre", retraitAnonyme.status === 401, `HTTP ${retraitAnonyme.status}`);

if (cible) {
  const retrait = await owner.call(`/api/team/${cible.id}`, { method: "DELETE" });
  verifier("le propriétaire retire un membre", retrait.status === 200, `HTTP ${retrait.status}`);

  const apresRetrait = await owner.call("/api/team");
  verifier(
    "le membre retiré disparaît vraiment de la liste",
    !(apresRetrait.body?.members ?? []).some((m) => m.id === cible.id),
    "le membre figure encore dans la liste"
  );

  // Le siège doit être rendu : sinon une équipe qui fait tourner ses
  // collaborateurs se retrouve bloquée à 10 alors qu'elle en a moins.
  const reInvitationApresRetrait = await owner.call("/api/team", {
    method: "POST",
    body: doc({ email: fictive("apres-retrait") }),
  });
  verifier(
    "retirer un membre libère bien son siège",
    reInvitationApresRetrait.status === 200,
    `HTTP ${reInvitationApresRetrait.status} ${doc(reInvitationApresRetrait.body).slice(0, 120)}`
  );
}

// ── Remise en état ───────────────────────────────────────────────────────────
// Les comptes de démonstration sont partagés avec les autres scripts de la
// suite : laisser une équipe pleine ferait échouer leur mise en place.
const finale = await owner.call("/api/team");
let retires = 0;
for (const m of finale.body?.members ?? []) {
  if (m.email.endsWith("@deviso.internal")) {
    const r = await owner.call(`/api/team/${m.id}`, { method: "DELETE" });
    if (r.status === 200) retires++;
  }
}
const apresMenage = await owner.call("/api/team");
const restants = (apresMenage.body?.members ?? []).filter((m) => m.email.endsWith("@deviso.internal")).length;
verifier(
  "le script rend l'équipe dans l'état où il l'a trouvée",
  restants === 0,
  `${restants} invitation(s) de test encore en place`
);
console.log(`  (${retires} invitation(s) de test retirée(s))`);

// ── Ce que ce script ne prouve pas ───────────────────────────────────────────
aVerifierAutrement(
  "L'acceptation d'une invitation",
  "couverte par linkAsTeamMember, empruntée par two-roles.mjs et par ce script en préalable."
);
aVerifierAutrement(
  "L'inscription depuis une invitation (/api/team/invite-signup)",
  "crée un compte réel, non purgé par le ménage des démonstrations. À traverser à la main."
);
aVerifierAutrement(
  "Le refus de s'inviter soi-même",
  "le contrôle porte sur l'adresse d'authentification du compte, qu'aucune route ne renvoie — donc inatteignable depuis un script."
);
aVerifierAutrement(
  "L'invitation d'une invitation déjà acceptée (409 already_accepted)",
  "exigerait le jeton d'un membre actif, que GET /api/team ne renvoie pas."
);
aVerifierAutrement(
  "La facturation du siège chez Stripe",
  "retirer un membre actif appelle removeSeatFromSubscription ; les comptes de démonstration en sont exclus par construction (check:stripe)."
);
aVerifierAutrement(
  "L'email d'invitation lui-même",
  "volontairement coupé ici : toutes les adresses de test sont fictives. Son rendu se vérifie par scripts/e2e/emails.mjs, hors verify."
);

console.log("");
console.log("── Non couvert par ce script ─────────────────────────────────");
for (const n of nonCouvert) console.log(`  ? ${n.quoi}\n      ${n.pourquoi}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
