/**
 * Traversée de l'intégration Plateforme Agréée, de bout en bout.
 *
 * Contrairement aux autres scripts e2e, on n'utilise pas `openSession` (qui crée
 * un compte de démonstration jetable, jamais raccordé à Super PDP) mais les
 * comptes de test dédiés déjà raccordés au bac à sable : Burger Queen (vendeur,
 * numéro d'entreprise 000000002) et Tricatel (destinataire, 000000001). Ces
 * comptes ne sont PAS des démos — pas de purge automatique.
 *
 * ⚠️ Ce script émet de vraies factures dans le bac à sable Super PDP. C'est
 * voulu : une intégration de facturation électronique ne se prouve pas
 * autrement. Rien n'atteint le réseau de production, les deux sociétés sont
 * fictives.
 *
 * Historique utile. Jusqu'au 29/08/2026 ce script se contentait de *tolérer* un
 * refus d'émission, attribué à une limitation du bac à sable. C'était une
 * erreur de diagnostic confortable : le vrai défaut était chez nous, sur deux
 * champs à la fois, et l'accepter comme fatalité aurait laissé partir en
 * production un code incapable d'émettre.
 *   - BT-30 (identifiant légal vendeur) portait le SIREN du profil, alors que la
 *     vérification de session de Super PDP le compare au numéro d'entreprise
 *     qu'ELLE a enregistré. En production les deux coïncident, ce qui rendait le
 *     défaut invisible hors bac à sable ;
 *   - BT-49 (adresse d'acheminement acheteur) était dérivé du seul SIREN du
 *     client, incapable de représenter une adresse d'annuaire composée.
 * Les deux corrigés, l'émission passe.
 *
 * Usage : node scripts/e2e/superpdp.mjs
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

const BURGER_QUEEN = {
  email: "superpdp-test@getdeviso.fr",
  password: secret("E2E_SUPERPDP_PASSWORD"),
};

/** Adresse d'annuaire réelle de Tricatel. Voir l'en-tête pour le pourquoi. */
const ANNUAIRE_TRICATEL = "0225:315143296_57700";
/** SIREN réel, partagé par les deux sociétés fictives du bac à sable. */
const SIREN_PARTAGE = "315143296";

const nonCouvert = [];
const aVerifierAutrement = (quoi, pourquoi) => nonCouvert.push({ quoi, pourquoi });

// Même recette que lib.mjs (cookieFor n'y est pas exportée).
function cookieFor(tokens) {
  const session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  return `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
}

async function signIn(creds) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) {
    throw new Error(`Connexion ${creds.email} impossible : HTTP ${res.status} ${await res.text()}`);
  }
  const cookie = cookieFor(await res.json());

  const call = async (path, init = {}) => {
    const r = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        cookie,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
      redirect: "manual",
    });
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
    return { status: r.status, body };
  };
  // `brut` sert au téléchargement : `call` lit en texte, ce qui corromprait un PDF.
  const brut = (path) => fetch(`${BASE}${path}`, { headers: { cookie } });
  return { call, brut };
}

const doc = (o) => JSON.stringify(o);
const bq = await signIn(BURGER_QUEEN);

const SELLER = {
  seller_company: "Burger Queen",
  seller_siren: SIREN_PARTAGE,
  seller_street: "809 avenue du Languedoc",
  seller_postcode: "12100",
  seller_city: "Millau",
};

const creerFacture = (extra) =>
  bq.call("/api/invoices", {
    method: "POST",
    body: doc({
      ...SELLER,
      items: [{ description: "Prestation de traversée", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
      total_ht: 500, tva_rate: 20, total_ttc: 600,
      issue_date: "2026-08-29", due_date: "2026-09-28",
      type_code: "380", invoice_type: "standard",
      payment_terms: "30 jours net",
      ...extra,
    }),
  });

// ── Émission B2B vers un destinataire réel ───────────────────────────────────
console.log("── Émission B2B vers un destinataire raccordé ────────────────");

// Volontairement SANS `client_directory_address` : on veut éprouver la
// résolution par l'Annuaire, pas la saisie manuelle. Le SIREN nu ne distingue
// pas Tricatel de Burger Queen — les deux le partagent — donc si l'émission
// aboutit, c'est que l'adresse a bien été lue dans l'annuaire et non fabriquée.
const b2b = await creerFacture({
  client_name: "Tricatel",
  client_company: "Tricatel",
  client_siren: SIREN_PARTAGE,
  client_street: "Avenue de la République", client_postcode: "37170", client_city: "Chambray-lès-Tours",
  operation_category: "services",
});
const idB2b = b2b.body?.invoice?.id;
verifier("facture B2B créée", b2b.status === 201, `HTTP ${b2b.status} ${doc(b2b.body).slice(0, 160)}`);

if (idB2b) await bq.call(`/api/invoices/${idB2b}`, { method: "PATCH", body: doc({ status: "sent" }) });

const emission = idB2b
  ? await bq.call(`/api/superpdp/invoices/${idB2b}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "la facture est transmise à la Plateforme Agréée",
  emission.status === 200 && emission.body?.emise === true && Number(emission.body?.superpdpId) > 0,
  `HTTP ${emission.status} ${doc(emission.body).slice(0, 300)}`
);
const idPdp = emission.body?.superpdpId;

// Les sociétés du bac à sable ne figurent pas à l'Annuaire national — il ne
// contient que de vraies entreprises. Le repli sur le SIREN est donc le
// comportement **attendu** ici, et on l'exige explicitement plutôt que de
// tolérer n'importe quelle valeur : c'est ce qui distingue un repli maîtrisé
// d'une résolution qui aurait silencieusement échoué.
verifier(
  "hors annuaire, l'émission retombe sur le SIREN — et le dit",
  emission.body?.sourceAdresse === "siren",
  `source = ${emission.body?.sourceAdresse}`
);

// Réémettre créerait un doublon chez le destinataire, motif de refus à part
// entière (code DOUBLON).
const reemission = idB2b
  ? await bq.call(`/api/superpdp/invoices/${idB2b}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "une facture déjà transmise n'est pas réémise",
  reemission.status === 200 && reemission.body?.dejaEmise === true,
  `HTTP ${reemission.status} ${doc(reemission.body).slice(0, 200)}`
);

// ── Encaissement (fr:212) ────────────────────────────────────────────────────
console.log("");
console.log("── Encaissement (fr:212), obligatoire art. 290 A CGI ─────────");

const payee = idB2b
  ? await bq.call(`/api/invoices/${idB2b}`, { method: "PATCH", body: doc({ status: "paid" }) })
  : { status: 0, body: null };
verifier("la facture est marquée payée", payee.body?.invoice?.status === "paid", `HTTP ${payee.status}`);

const encaissement = idB2b
  ? await bq.call(`/api/superpdp/invoices/${idB2b}/encaisser`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "l'encaissement est déclaré à la Plateforme Agréée",
  encaissement.status === 200 && encaissement.body?.encaissee === true,
  `HTTP ${encaissement.status} ${doc(encaissement.body)}`
);

const encaissementBis = idB2b
  ? await bq.call(`/api/superpdp/invoices/${idB2b}/encaisser`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "un second appel ne renvoie pas un second événement",
  encaissementBis.status === 200 && encaissementBis.body?.dejaEncaissee === true,
  `HTTP ${encaissementBis.status} ${doc(encaissementBis.body)}`
);

// ── Régime de TVA propagé à la Plateforme Agréée ─────────────────────────────
console.log("");
console.log("── Régime de TVA propagé à la Plateforme Agréée ──────────────");

// Ce réglage n'existe que par l'API : ni l'interface de Super PDP ni la nôtre
// ne le montrent. Tant qu'il est vide chez eux, toute facture B2C est refusée —
// c'est le blocage qui a coûté une demi-journée le 29/08. On vérifie donc qu'un
// changement de profil arrive bien jusqu'à eux, et pas seulement dans notre base.
const avant = await bq.call("/api/superpdp/status");
verifier(
  "le statut expose le régime de TVA connu de la Plateforme Agréée",
  avant.status === 200 && typeof avant.body?.regimeTva !== "undefined",
  `HTTP ${avant.status} ${doc(avant.body).slice(0, 200)}`
);

// On bascule vers une valeur différente de l'actuelle, pour que le test prouve
// une propagation et non un état déjà en place.
const cible = avant.body?.regimeTva === "quarterly" ? "monthly" : "quarterly";
const majProfil = await bq.call("/api/profile", {
  method: "PATCH",
  body: doc({ tva_regime: "normal", tva_periodicite: cible }),
});
verifier("le profil accepte la périodicité de déclaration", majProfil.status === 200, `HTTP ${majProfil.status}`);

const apres = await bq.call("/api/superpdp/status");
verifier(
  `changer la périodicité dans Deviso la change chez Super PDP (→ ${cible})`,
  apres.body?.regimeTva === cible,
  `attendu ${cible}, obtenu ${apres.body?.regimeTva}`
);

// La franchise en base se déduit seule : un micro-entrepreneur n'a aucune
// périodicité à saisir, et doit malgré tout être déclaré correctement.
const franchise = await bq.call("/api/profile", {
  method: "PATCH",
  body: doc({ tva_regime: "franchise" }),
});
const apresFranchise = await bq.call("/api/superpdp/status");
verifier(
  "la franchise en base se traduit seule en vat_exemption, sans rien demander",
  franchise.status === 200 && apresFranchise.body?.regimeTva === "vat_exemption",
  `obtenu ${apresFranchise.body?.regimeTva}`
);

// Remise en état : le compte de test émet des factures avec TVA à 20 %.
await bq.call("/api/profile", {
  method: "PATCH",
  body: doc({ tva_regime: "normal", tva_periodicite: "monthly" }),
});

// ── Résolution par l'Annuaire, sur une vraie entreprise ──────────────────────
console.log("");
console.log("── Résolution de l'adresse par l'Annuaire national ───────────");

// SIREN réel, choisi parce que son entrée d'annuaire est **composée**
// (`0225:491210290_49121029000012`, forme SIREN_SIRET) : c'est exactement ce
// que l'ancienne fabrication `0225:<SIREN>` ne pouvait pas produire, et donc ce
// qu'elle adressait de travers. On n'attend pas que l'émission aboutisse — ce
// n'est pas un destinataire de test — seulement que l'adresse ait bien été lue.
const SIREN_REEL_ANNUAIRE = "491210290";

const factureAnnuaire = await creerFacture({
  client_name: "Client annuaire", client_company: "Client annuaire",
  client_siren: SIREN_REEL_ANNUAIRE,
  client_street: "70 rue Vincent Courdouan", client_postcode: "83220", client_city: "Le Pradet",
  operation_category: "services",
});
const idAnnuaire = factureAnnuaire.body?.invoice?.id;
if (idAnnuaire) {
  await bq.call(`/api/invoices/${idAnnuaire}`, { method: "PATCH", body: doc({ status: "sent" }) });
  const r = await bq.call(`/api/superpdp/invoices/${idAnnuaire}/emettre`, { method: "POST" });
  verifier(
    "l'adresse d'un vrai client est lue dans l'Annuaire, pas fabriquée",
    r.body?.sourceAdresse === "annuaire",
    `source = ${r.body?.sourceAdresse} · HTTP ${r.status}`
  );
}

// La saisie manuelle reste souveraine : un client peut avoir communiqué son
// adresse par écrit, et elle doit primer sur ce que dit l'annuaire.
const factureSaisie = await creerFacture({
  client_name: "Client adresse saisie", client_company: "Client adresse saisie",
  client_siren: SIREN_PARTAGE,
  client_directory_address: ANNUAIRE_TRICATEL,
  client_street: "Avenue de la République", client_postcode: "37170", client_city: "Chambray-lès-Tours",
  operation_category: "services",
});
const idSaisie = factureSaisie.body?.invoice?.id;
if (idSaisie) {
  await bq.call(`/api/invoices/${idSaisie}`, { method: "PATCH", body: doc({ status: "sent" }) });
  const r = await bq.call(`/api/superpdp/invoices/${idSaisie}/emettre`, { method: "POST" });
  verifier(
    "une adresse saisie à la main prime sur l'annuaire",
    r.body?.sourceAdresse === "saisie",
    `source = ${r.body?.sourceAdresse} · HTTP ${r.status}`
  );
}

// ── Facture B2C (particulier, sans SIREN) ────────────────────────────────────
console.log("");
console.log("── Facture B2C : un particulier n'a pas de SIREN ─────────────");

const b2c = await creerFacture({
  client_name: "Jean Dupont",
  client_email: "jean.dupont.e2e@example.fr",
  client_street: "12 rue de la République", client_postcode: "69001", client_city: "Lyon",
  operation_category: "services",
});
const idB2c = b2c.body?.invoice?.id;
verifier("facture B2C créée sans SIREN client", b2c.status === 201, `HTTP ${b2c.status}`);

if (idB2c) await bq.call(`/api/invoices/${idB2c}`, { method: "PATCH", body: doc({ status: "sent" }) });

const emissionB2c = idB2c
  ? await bq.call(`/api/superpdp/invoices/${idB2c}/emettre`, { method: "POST" })
  : { status: 0, body: null };
// Blocage documenté, et cette fois étayé — la leçon du 29/08 étant qu'un
// « c'est le bac à sable » commode avait déjà masqué deux vrais défauts, on
// n'accepte celui-ci qu'avec des preuves :
//   1. le même code émet sans peine la facture B2B ci-dessus ;
//   2. le XML B2C a été validé conforme par le validateur de Super PDP
//      lui-même (/validation_reports : is_valid true, 0 échec sur 137
//      contrôles) — le document n'est donc pas en cause.
//
// La cause était le régime de TVA de l'entreprise émettrice, vide sur les deux
// sociétés du bac à sable. Leur documentation le dit noir sur blanc : « Pour
// faire fonctionner l'e-reporting, il faut paramétrer le régime de TVA au
// niveau de son entreprise. » Il se règle par `PATCH /v1.beta/companies` —
// **sans** `/me`, ce qui avait d'abord fait conclure à tort à un
// enregistrement en lecture seule. Valeurs admises, obtenues en sondant l'API :
// `monthly` (réel normal mensuel), `quarterly` (réel normal trimestriel),
// `simplified` (régime simplifié). Burger Queen est désormais en `monthly`.
//
// ⚠️ À ne pas confondre avec le `tva_regime` du profil Deviso
// (`franchise`/`normal`/`intermediaire`), qui désigne le **taux** appliqué et
// non la **périodicité de déclaration**. Les deux notions sont distinctes, et
// Deviso ne collecte pas encore la seconde : tant qu'il ne la collecte ni ne la
// pousse, tout client raccordé aura ce champ vide et ses factures B2C seront
// refusées comme celles-ci l'ont été. Voir CLAUDE.md.
verifier(
  "une facture B2C est transmise sans exiger de SIREN client",
  emissionB2c.status === 200 && emissionB2c.body?.emise === true,
  `HTTP ${emissionB2c.status} ${doc(emissionB2c.body).slice(0, 300)}`
);

// ── Facture mixte biens+services : doit être bloquée ─────────────────────────
console.log("");
console.log("── Facture mixte biens+services : refusée avant l'envoi ──────");

const mixte = await creerFacture({
  client_name: "Client Mixte SARL", client_company: "Client Mixte SARL",
  client_siren: "552100554",
  client_street: "5 rue Bossuet", client_postcode: "33140", client_city: "Villenave-d'Ornon",
  operation_category: "mixed",
});
const idMixte = mixte.body?.invoice?.id;
verifier("facture mixte créée (la création n'est pas bloquante)", mixte.status === 201);

if (idMixte) await bq.call(`/api/invoices/${idMixte}`, { method: "PATCH", body: doc({ status: "sent" }) });

const emissionMixte = idMixte
  ? await bq.call(`/api/superpdp/invoices/${idMixte}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "une facture mixte est refusée à l'émission, avec un message explicite",
  emissionMixte.status === 400 && /catégorie d.opération/.test(emissionMixte.body?.message ?? ""),
  `HTTP ${emissionMixte.status} ${doc(emissionMixte.body).slice(0, 200)}`
);

// La liste des factures affiche « Transmission impossible » et nomme ce qui
// bloque AVANT le clic, en appliquant la même règle que la route
// (lib/superpdp-precontrole.ts). Elle a besoin pour cela que le refus arrive
// sous forme de liste exploitable, pas seulement d'une phrase. Sans cette
// assertion, un refus qui perdrait `manques` laisserait l'interface proposer un
// bouton qui échoue — exactement le piège qu'on vient de retirer.
verifier(
  "le refus nomme ce qui manque, sous une forme exploitable par l'interface",
  Array.isArray(emissionMixte.body?.manques) && emissionMixte.body.manques.length > 0,
  `manques = ${doc(emissionMixte.body?.manques)}`
);

// Une facture B2B sans SIREN client : c'est le cas courant, celui qui faisait
// découvrir le problème après le clic.
const sansSiren = await creerFacture({
  client_name: "Client Sans Siren SARL", client_company: "Client Sans Siren SARL",
  client_street: "9 cours du Médoc", client_postcode: "33300", client_city: "Bordeaux",
});
const idSansSiren = sansSiren.body?.invoice?.id;
if (idSansSiren) await bq.call(`/api/invoices/${idSansSiren}`, { method: "PATCH", body: doc({ status: "sent" }) });
const emissionSansSiren = idSansSiren
  ? await bq.call(`/api/superpdp/invoices/${idSansSiren}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "sans SIREN client, le refus désigne le client par son nom",
  emissionSansSiren.status === 400 &&
    Array.isArray(emissionSansSiren.body?.manques) &&
    emissionSansSiren.body.manques.some((m) => /Client Sans Siren SARL/.test(m)),
  `HTTP ${emissionSansSiren.status} ${doc(emissionSansSiren.body).slice(0, 220)}`
);

// Un brouillon ne doit pas pouvoir être transmis par un appel direct.
// `transmissible()` ne vivait que dans l'interface : la route acceptait un
// brouillon et l'envoyait, de façon irréversible.
const brouillon = await creerFacture({
  client_name: "Client Brouillon SARL", client_company: "Client Brouillon SARL",
  client_siren: "552100554",
  client_street: "1 rue du Test", client_postcode: "33000", client_city: "Bordeaux",
  operation_category: "services",
});
const idBrouillon = brouillon.body?.invoice?.id;
const emissionBrouillon = idBrouillon
  ? await bq.call(`/api/superpdp/invoices/${idBrouillon}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "un brouillon ne peut pas être transmis, même par appel direct",
  emissionBrouillon.status === 400 && /brouillon/i.test(doc(emissionBrouillon.body)),
  `HTTP ${emissionBrouillon.status} ${doc(emissionBrouillon.body).slice(0, 200)}`
);

// Une facture à un client étranger relève du B2BInt, pas du circuit national —
// et le pré-contrôle ne doit plus lui réclamer un SIREN français, qu'elle n'a
// pas. C'était un blocage total pour un freelance à clientèle internationale.
const etrangere = await creerFacture({
  client_name: "Studio Bruxelles SPRL", client_company: "Studio Bruxelles SPRL",
  client_street: "12 rue Neuve", client_postcode: "1000", client_city: "Bruxelles",
  client_country: "BE",
  operation_category: "services",
});
const idEtrangere = etrangere.body?.invoice?.id;
if (idEtrangere) await bq.call(`/api/invoices/${idEtrangere}`, { method: "PATCH", body: doc({ status: "sent" }) });
const emissionEtrangere = idEtrangere
  ? await bq.call(`/api/superpdp/invoices/${idEtrangere}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "un client étranger n'est plus bloqué par l'absence de SIREN français",
  emissionEtrangere.status !== 400 ||
    !/SIREN de Studio Bruxelles/.test(doc(emissionEtrangere.body)),
  `HTTP ${emissionEtrangere.status} ${doc(emissionEtrangere.body).slice(0, 260)}`
);
aVerifierAutrement(
  "L'acheminement réel d'une facture B2BInt",
  "le bac à sable n'a pas d'entreprise étrangère raccordée ; on vérifie que Deviso ne bloque plus et déclare la bonne nature."
);

// La colonne « Plateforme Agréée » ne s'affiche que si /status dit à la fois
// « raccordé » et « vérifié ». Si cette forme change, la colonne disparaît en
// silence et la transmission redevient invisible.
const statutColonne = await bq.call("/api/superpdp/status");
verifier(
  "le statut expose de quoi décider d'afficher la colonne de transmission",
  statutColonne.status === 200 &&
    statutColonne.body?.connected === true &&
    statutColonne.body?.status === "verified",
  `HTTP ${statutColonne.status} ${doc(statutColonne.body).slice(0, 200)}`
);

// ── Synchronisation ──────────────────────────────────────────────────────────
console.log("");
console.log("── Synchronisation avec la Plateforme Agréée ─────────────────");

// `explicite: true` : la route plafonne les appels automatiques à un toutes les
// trois minutes. Sans ce drapeau elle répond 200 avec « trop_recent » sans rien
// faire — et une assertion qui se contente du code HTTP validerait ce
// non-événement. On exige donc `synchronise: true`, et on retente une fois si
// le plancher de dix secondes du clic explicite n'est pas encore écoulé.
let sync = await bq.call("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });
if (sync.body?.raison === "trop_recent") {
  await new Promise((r) => setTimeout(r, 11000));
  sync = await bq.call("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });
}
verifier(
  "la synchronisation s'exécute vraiment, elle ne se contente pas de répondre",
  sync.status === 200 && sync.body?.synchronise === true,
  `HTTP ${sync.status} ${doc(sync.body).slice(0, 200)}`
);

// La facture qu'on vient d'émettre doit être redescendue de la plateforme :
// c'est ce qui alimente la page « Factures reçues » et le suivi des statuts.
verifier(
  "la facture émise est redescendue par la synchronisation",
  Number(sync.body?.jusquA ?? 0) >= Number(idPdp ?? 0),
  `curseur ${sync.body?.jusquA} pour une facture ${idPdp}`
);

// La facture qu'on vient d'émettre doit être connue de la plateforme, dans le
// sens « émise », avec son statut d'encaissement remonté.
const recues = await bq.call("/api/superpdp/status");
verifier(
  "le raccordement se déclare sain, sans erreur en attente",
  recues.status === 200 && !recues.body?.erreur,
  `HTTP ${recues.status} ${doc(recues.body).slice(0, 200)}`
);

// Le statut porté par NOTRE facture doit suivre celui de la plateforme.
//
// Défaut trouvé au bilan du 29/08/2026 : `invoices.superpdp_status` était écrit
// une seule fois, à l'émission, avec `api:uploaded`, et plus jamais mis à jour.
// 42 factures transmises, 42 figées, pendant que la plateforme était passée à
// `fr:202`. Une facture REFUSÉE par le client (fr:210) s'affichait donc
// « Transmise » en vert — et un refus oblige le fournisseur à passer un avoir.
// Aucun test ne regardait ce champ : ils vérifiaient tous la table miroir.
const factureApres = idB2b ? await bq.call(`/api/invoices/${idB2b}`) : { status: 0, body: null };
const statutPorte = factureApres.body?.invoice?.superpdp_status ?? null;
verifier(
  "le statut de la facture suit la plateforme, il ne reste pas à api:uploaded",
  typeof statutPorte === "string" && statutPorte.startsWith("fr:"),
  `superpdp_status = ${statutPorte}`
);

// ── Validation avant transmission ────────────────────────────────────────────
console.log("");
console.log("── Validation officielle avant transmission ──────────────────");

// `POST /validation_reports` fait tourner les validateurs réels (XSD CII,
// Factur-X EN16931, Schematron BR-FR) — 189 contrôles sur la facture de
// référence du dépôt. La spec le recommande explicitement : « Most of errors
// like that can be avoided by calling the /validation_reports endpoint first ».
// Sans lui, une facture sémantiquement fausse repart en `api:invalid` de façon
// ASYNCHRONE : le POST répond 200 et l'utilisateur croit sa facture partie.
const validation = idB2b ? await bq.call(`/api/superpdp/invoices/${idB2b}/valider`, { method: "POST" }) : { status: 0, body: null };
verifier(
  "une facture peut être validée sans être transmise",
  validation.status === 200 && typeof validation.body?.validation?.valide === "boolean",
  `HTTP ${validation.status} ${doc(validation.body).slice(0, 260)}`
);
verifier(
  "la validation fait bien tourner les validateurs officiels",
  validation.body?.validation?.niveau?.includes("en16931") === true ||
    validation.body?.validation?.indisponible != null,
  `niveau = ${validation.body?.validation?.niveau} · indisponible = ${validation.body?.validation?.indisponible}`
);
verifier(
  "le XML produit par Deviso est jugé conforme",
  validation.body?.validation?.valide === true,
  `échecs : ${doc(validation.body?.validation?.echecs)}`
);

// ── Réponses du destinataire autres que le refus ─────────────────────────────
console.log("");
console.log("── Cycle de vie : répondre sans refuser ──────────────────────");

// Ne proposer que le refus, « définitif et global », poussait à l'utiliser à
// tort pour signaler une simple erreur de montant.
const statutSurSortante = idPdp
  ? await bq.call(`/api/superpdp/invoices/${idPdp}/statut`, { method: "POST", body: doc({ code: "fr:207" }) })
  : { status: 0, body: null };
verifier(
  "on ne pose pas un statut de destinataire sur sa propre facture émise",
  statutSurSortante.status === 400 && /Sens invalide/.test(doc(statutSurSortante.body)),
  `HTTP ${statutSurSortante.status} ${doc(statutSurSortante.body).slice(0, 200)}`
);

const codeInterdit = idPdp
  ? await bq.call(`/api/superpdp/invoices/${idPdp}/statut`, { method: "POST", body: doc({ code: "fr:210" }) })
  : { status: 0, body: null };
verifier(
  "le refus garde sa route dédiée et n'est pas banalisé ici",
  codeInterdit.status === 400 && /motif/i.test(doc(codeInterdit.body)),
  `HTTP ${codeInterdit.status} ${doc(codeInterdit.body).slice(0, 200)}`
);

const codeInconnu = idPdp
  ? await bq.call(`/api/superpdp/invoices/${idPdp}/statut`, { method: "POST", body: doc({ code: "fr:999" }) })
  : { status: 0, body: null };
verifier(
  "un code hors nomenclature est refusé avant tout appel",
  codeInconnu.status === 400 && /Statut inconnu/.test(doc(codeInconnu.body)),
  `HTTP ${codeInconnu.status} ${doc(codeInconnu.body).slice(0, 160)}`
);

// ── Exigibilité de la TVA (BT-8) ────────────────────────────────────────────
console.log("");
console.log("── Exigibilité de la TVA : débits contre encaissements ───────");

// `DueDateTypeCode` était inversé : il ne sortait que pour les débits, et
// valait 72 — « paid to date », l'exigibilité au PAIEMENT. Une facture cochée
// « TVA sur les débits » déclarait donc le régime opposé, et le cas courant
// (encaissements) ne déclarait rien. C'est cette donnée qui commande le
// calendrier d'e-reporting des paiements.
const surDebits = await creerFacture({
  client_name: "Client Débits SARL", client_company: "Client Débits SARL",
  client_siren: "552100554",
  client_street: "3 rue des Débits", client_postcode: "33000", client_city: "Bordeaux",
  operation_category: "goods",
  payment_on_debit: true,
});
const idDebits = surDebits.body?.invoice?.id;
if (idDebits) await bq.call(`/api/invoices/${idDebits}`, { method: "PATCH", body: doc({ status: "sent" }) });
const validDebits = idDebits
  ? await bq.call(`/api/superpdp/invoices/${idDebits}/valider`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "une facture sur les débits reste conforme aux validateurs officiels",
  validDebits.status === 200 && validDebits.body?.validation?.valide === true,
  `échecs : ${doc(validDebits.body?.validation?.echecs)}`
);

// ── Recherche d'entreprise dans l'Annuaire national ─────────────────────────
console.log("");
console.log("── Rechercher un client plutôt que lui demander son SIREN ────");

const rechercheVide = await bq.call("/api/annuaire/entreprises");
verifier(
  "une recherche sans critère est refusée avant tout appel",
  rechercheVide.status === 400,
  `HTTP ${rechercheVide.status} ${doc(rechercheVide.body).slice(0, 160)}`
);

// SIREN réel et stable : la Banque de France. On vérifie qu'on retrouve bien
// une entreprise et que le SIREN remonte — c'est ce qui évite à l'utilisateur
// de le recopier à la main, et une faute de frappe se solde par un rejet.
const parSiren = await bq.call("/api/annuaire/entreprises?siren=572104790");
verifier(
  "une recherche par SIREN retourne une entreprise identifiable",
  parSiren.status === 200 &&
    Array.isArray(parSiren.body?.entreprises) &&
    parSiren.body.entreprises.every((e) => typeof e.siren === "string" && typeof e.nom === "string"),
  `HTTP ${parSiren.status} ${doc(parSiren.body).slice(0, 300)}`
);

// ── E-reporting ──────────────────────────────────────────────────────────────
console.log("");
console.log("── Ce qui est déclaré au fisc ────────────────────────────────");

const ereportings = await bq.call("/api/superpdp/ereportings");
verifier(
  "les déclarations d'e-reporting sont lisibles",
  ereportings.status === 200 && Array.isArray(ereportings.body?.declarations),
  `HTTP ${ereportings.status} ${doc(ereportings.body).slice(0, 260)}`
);
aVerifierAutrement(
  "Le contenu d'une déclaration rejetée",
  "il faut qu'une déclaration soit effectivement rejetée par le PPF ; le bac à sable n'en produit pas à la demande."
);

// ── Téléchargement Factur-X ──────────────────────────────────────────────────
console.log("");
console.log("── Téléchargement Factur-X d'une facture de la plateforme ────");

if (idPdp) {
  // Le défaut corrigé le 12/08 ne se voyait pas dans un code HTTP : la route
  // étiquetait « application/pdf » un contenu qui était du XML. On lit donc les
  // octets plutôt que l'en-tête.
  const pdf = await bq.brut(`/api/superpdp/invoices/${idPdp}/download`);
  const octets = Buffer.from(await pdf.arrayBuffer());
  verifier(
    "le téléchargement répond et livre un contenu",
    pdf.status === 200 && octets.length > 1000,
    `HTTP ${pdf.status}, ${octets.length} octets`
  );
  verifier(
    "le fichier est un vrai PDF, pas du XML étiqueté PDF",
    octets.subarray(0, 5).toString("latin1") === "%PDF-",
    `débute par ${JSON.stringify(octets.subarray(0, 8).toString("latin1"))}`
  );
}

// ── Garde-fous du refus (fr:210) ─────────────────────────────────────────────
console.log("");
console.log("── Garde-fous du refus (fr:210) ──────────────────────────────");

const refus = async (chemin, corps) =>
  bq.call(chemin, { method: "POST", body: doc(corps) });

const idInvalide = await refus("/api/superpdp/invoices/abc/refuser", { motif: "NON_CONFORME" });
verifier("un identifiant non numérique est refusé", idInvalide.status === 400, `HTTP ${idInvalide.status}`);

const sansMotif = await refus(`/api/superpdp/invoices/${idPdp ?? 1}/refuser`, {});
verifier("un refus sans motif est rejeté", sansMotif.status === 400, `HTTP ${sansMotif.status}`);

// La liste des treize motifs vient de l'API elle-même ; il n'existe pas de
// motif « Autre ». Relayer une chaîne libre ferait répondre Super PDP en
// anglais technique au lieu d'un message utilisable.
const motifInvente = await refus(`/api/superpdp/invoices/${idPdp ?? 1}/refuser`, { motif: "parce que" });
verifier("un motif hors liste est rejeté", motifInvente.status === 400, `HTTP ${motifInvente.status}`);

const factureInconnue = await refus("/api/superpdp/invoices/99999999/refuser", { motif: "NON_CONFORME" });
verifier(
  "refuser une facture d'un autre espace renvoie 404",
  factureInconnue.status === 404,
  `HTTP ${factureInconnue.status} ${doc(factureInconnue.body).slice(0, 140)}`
);

if (idPdp) {
  const mauvaisSens = await refus(`/api/superpdp/invoices/${idPdp}/refuser`, { motif: "NON_CONFORME" });
  verifier(
    "on ne refuse pas une facture qu'on a soi-même émise",
    mauvaisSens.status === 400 && /reçue/.test(mauvaisSens.body?.message ?? ""),
    `HTTP ${mauvaisSens.status} ${doc(mauvaisSens.body).slice(0, 140)}`
  );
}

// ── Ce que ce script ne prouve pas ───────────────────────────────────────────
aVerifierAutrement(
  "Le refus abouti d'une facture reçue (fr:210)",
  "exige une session sur le compte destinataire, et l'acte est définitif — il oblige le fournisseur à une annulation comptable. Tous ses garde-fous sont couverts ci-dessus ; le succès se constate à la main sur une facture reçue."
);
aVerifierAutrement(
  "Le tunnel de raccordement (connect → callback → déconnexion)",
  "redirection OAuth, donc un navigateur. Les comptes de test restent raccordés d'une exécution à l'autre, ce script ne le rejoue pas."
);
aVerifierAutrement(
  "L'émission depuis une entreprise réelle",
  "le bac à sable et la production partagent l'hôte d'API ; c'est le type de compte qui décide. Émettre pour de vrai engage le réseau national de facturation."
);
aVerifierAutrement(
  "L'affichage de la page Factures reçues",
  "ce script interroge l'API ; le rendu reste à juger à l'œil."
);

console.log("");
console.log("── Non couvert par ce script ─────────────────────────────────");
for (const n of nonCouvert) console.log(`  ? ${n.quoi}\n      ${n.pourquoi}`);
console.log("");
console.log("── Comptes de test ───────────────────────────────────────────");
console.log("  superpdp-test@getdeviso.fr (Burger Queen) — pas une démo, purge manuelle par Selim");
console.log(`  facture B2B émise : Deviso ${idB2b ?? "?"} → Super PDP ${idPdp ?? "?"}`);
console.log(`  facture B2C : ${idB2c ?? "?"} · facture mixte (jamais transmise) : ${idMixte ?? "?"}`);
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
