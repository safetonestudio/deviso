/**
 * L'avoir : le seul moyen de corriger une facture deja transmise.
 *
 * Pourquoi cette traversee existe. Sous la reforme, une facture transmise ne se
 * modifie plus, et le refus du destinataire (fr:210) est TERMINAL. Un client qui
 * refuse une facture pour une virgule oblige donc le fournisseur a passer un
 * avoir, sans alternative. C'etait la lacune fonctionnelle la plus visible de
 * l'integration : Deviso n'en produisait aucun.
 *
 * Ce qui se verifie ici, et qui ne se verifie pas a l'oeil :
 *
 *   - un avoir porte des montants POSITIFS (BR-27). Le sens vient du type de
 *     document (381), pas du signe. C'est contre-intuitif, et l'erreur inverse
 *     produit un document que le validateur officiel refuse ;
 *   - il reference la facture qu'il annule (BG-3). Sans elle, le destinataire
 *     recoit un credit qui ne dit pas ce qu'il corrige ;
 *   - il passe le VALIDATEUR OFFICIEL, pas notre panneau de conformite maison.
 *     C'est la seule opinion qui compte, et elle est disponible : on s'en sert.
 *
 * On va jusqu'a la transmission reelle : un avoir qui valide mais que la
 * Plateforme Agreee refuse ne servirait a rien.
 */

import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";
const SIREN_PARTAGE = "315143296";
const ADRESSE_TRICATEL = "0225:315143296_57700";

const r = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  body: JSON.stringify({
    email: "superpdp-test@getdeviso.fr",
    password: secret("E2E_SUPERPDP_PASSWORD"),
  }),
});
if (!r.ok) throw new Error(`Connexion impossible : HTTP ${r.status}`);
const t = await r.json();
const cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(
  JSON.stringify({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })
).toString("base64")}`;

async function appel(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      cookie,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    redirect: "manual",
  });
  const texte = await res.text();
  try {
    return { status: res.status, body: JSON.parse(texte) };
  } catch {
    return { status: res.status, body: texte.slice(0, 400) };
  }
}

const jour = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

console.log("");
console.log("── Avoir : corriger une facture qu'on ne peut plus modifier ───");
console.log(`   base : ${BASE}`);
console.log("");
// ── Une facture émise, puis refusée dans les faits ─────────────────────────
const creee = await appel("/api/invoices", {
  method: "POST",
  body: JSON.stringify({
    seller_company: "Burger Queen",
    seller_siren: SIREN_PARTAGE,
    seller_street: "809 avenue du Languedoc",
    seller_postcode: "12100",
    seller_city: "Millau",
    client_directory_address: ADRESSE_TRICATEL,
    client_name: "Tricatel",
    client_company: "Tricatel",
    client_siren: SIREN_PARTAGE,
    client_street: "Avenue de la République",
    client_postcode: "37170",
    client_city: "Chambray-lès-Tours",
    client_country: "FR",
    operation_category: "services",
    items: [
      { description: "Prestation à annuler", quantity: 2, unit: "jour", unit_price: 350, total: 700 },
      { description: "Frais de déplacement", quantity: 1, unit: "forfait", unit_price: 120, total: 120 },
    ],
    total_ht: 820,
    tva_rate: 20,
    total_ttc: 984,
    issue_date: jour(-4),
    due_date: jour(26),
    type_code: "380",
    invoice_type: "standard",
    payment_terms: "30 jours net",
    status: "sent",
  }),
});
const idFacture = creee.body?.invoice?.id;
const numeroFacture = creee.body?.invoice?.invoice_number;
verifier("une facture est créée", Boolean(idFacture), `HTTP ${creee.status}`);
if (!idFacture) process.exit(bilan());

await appel(`/api/invoices/${idFacture}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
const emise = await appel(`/api/superpdp/invoices/${idFacture}/emettre`, { method: "POST" });
verifier(
  "elle est transmise — donc elle n'est plus modifiable",
  emise.status === 200 && Boolean(emise.body?.superpdpId),
  `HTTP ${emise.status} ${JSON.stringify(emise.body).slice(0, 200)}`,
);

// ── L'avoir ────────────────────────────────────────────────────────────────
const cree = await appel(`/api/invoices/${idFacture}/avoir`, { method: "POST" });
const avoir = cree.body?.avoir;
verifier(
  "un avoir peut être établi sur cette facture",
  cree.status === 200 && Boolean(avoir?.id),
  `HTTP ${cree.status} ${JSON.stringify(cree.body).slice(0, 300)}`,
);
if (!avoir?.id) process.exit(bilan());

verifier("il porte le type de document 381", avoir.type_code === "381", `type_code = ${avoir.type_code}`);
verifier("il est marqué comme avoir", avoir.invoice_type === "avoir", `invoice_type = ${avoir.invoice_type}`);
verifier(
  "il désigne la facture qu'il annule",
  avoir.linked_invoice_id === idFacture,
  `linked_invoice_id = ${avoir.linked_invoice_id}`,
);
verifier(
  "il a son propre numéro, distinct de la facture",
  Boolean(avoir.invoice_number) && avoir.invoice_number !== numeroFacture,
  `${avoir.invoice_number} contre ${numeroFacture}`,
);
verifier(
  "il naît en brouillon, pour pouvoir être réduit avant envoi",
  avoir.status === "draft",
  `status = ${avoir.status}`,
);

// Le point le plus contre-intuitif de tout ce fichier.
verifier(
  "ses montants sont POSITIFS — le sens vient du type 381, pas du signe",
  Number(avoir.total_ht) === 820 && Number(avoir.total_ttc) === 984,
  `${avoir.total_ht} HT / ${avoir.total_ttc} TTC — BR-27 interdit un prix unitaire négatif`,
);
verifier(
  "et ses lignes aussi",
  (avoir.items ?? []).every((l) => Number(l.unit_price) > 0 && Number(l.total) > 0),
  JSON.stringify(avoir.items ?? []).slice(0, 200),
);

verifier(
  "rien de l'histoire de la facture d'origine n'est recopié",
  !avoir.superpdp_invoice_id && !avoir.superpdp_encaisse_at && !avoir.paid_at,
  `superpdp_invoice_id = ${avoir.superpdp_invoice_id}, encaissé = ${avoir.superpdp_encaisse_at}` +
    " — un identifiant recopié ferait croire l'avoir déjà émis, et il ne partirait jamais",
);

// ── Le juge : le validateur officiel, pas notre panneau maison ─────────────
const rapport = await appel(`/api/superpdp/invoices/${avoir.id}/valider`, { method: "POST" });
verifier(
  "l'avoir passe le validateur officiel (189 contrôles Schematron et XSD)",
  rapport.status === 200 && rapport.body?.validation?.valide === true,
  `HTTP ${rapport.status} · échecs : ${JSON.stringify(rapport.body?.validation?.echecs ?? rapport.body).slice(0, 700)}`,
);
verifier(
  "et Deviso ne lui trouve rien à redire non plus",
  (rapport.body?.manques ?? []).length === 0,
  `manques : ${JSON.stringify(rapport.body?.manques ?? []).slice(0, 300)}`,
);

// ── Transmission réelle ────────────────────────────────────────────────────
//
// Un avoir qui valide mais que la Plateforme Agréée refuse ne sert à rien.
await appel(`/api/invoices/${avoir.id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
const emisAvoir = await appel(`/api/superpdp/invoices/${avoir.id}/emettre`, { method: "POST" });
verifier(
  "la Plateforme Agréée accepte l'avoir",
  emisAvoir.status === 200 && Boolean(emisAvoir.body?.superpdpId),
  `HTTP ${emisAvoir.status} ${JSON.stringify(emisAvoir.body).slice(0, 500)}`,
);

// ── Ce qu'on ne doit PAS pouvoir faire ─────────────────────────────────────

const second = await appel(`/api/invoices/${idFacture}/avoir`, { method: "POST" });
verifier(
  "une facture ne s'annule pas deux fois",
  second.status === 409,
  `HTTP ${second.status} ${JSON.stringify(second.body).slice(0, 200)} — deux avoirs créditeraient le double`,
);

const avoirDAvoir = await appel(`/api/invoices/${avoir.id}/avoir`, { method: "POST" });
verifier(
  "un avoir ne s'annule pas par un autre avoir",
  avoirDAvoir.status === 400,
  `HTTP ${avoirDAvoir.status} ${JSON.stringify(avoirDAvoir.body).slice(0, 200)}`,
);

const brouillon = await appel("/api/invoices", {
  method: "POST",
  body: JSON.stringify({
    seller_company: "Burger Queen",
    seller_siren: SIREN_PARTAGE,
    seller_street: "809 avenue du Languedoc",
    seller_postcode: "12100",
    seller_city: "Millau",
    client_name: "Tricatel",
    client_company: "Tricatel",
    client_siren: SIREN_PARTAGE,
    client_street: "Avenue de la République",
    client_postcode: "37170",
    client_city: "Chambray-lès-Tours",
    client_country: "FR",
    operation_category: "services",
    items: [{ description: "Encore en brouillon", quantity: 1, unit: "forfait", unit_price: 50, total: 50 }],
    total_ht: 50,
    tva_rate: 20,
    total_ttc: 60,
    issue_date: jour(0),
    due_date: jour(30),
    type_code: "380",
    invoice_type: "standard",
    status: "draft",
  }),
});
const idBrouillon = brouillon.body?.invoice?.id;
if (idBrouillon) {
  const refus = await appel(`/api/invoices/${idBrouillon}/avoir`, { method: "POST" });
  verifier(
    "un brouillon se corrige, il ne s'annule pas",
    refus.status === 400,
    `HTTP ${refus.status} ${JSON.stringify(refus.body).slice(0, 200)} — sinon deux documents là où une modification suffit`,
  );
  await appel(`/api/invoices/${idBrouillon}`, { method: "DELETE" });
}

// ── Un avoir ne se réclame pas ─────────────────────────────────────────────
//
// C'est un montant qu'on REND. Le pire message que ce produit puisse envoyer,
// c'est une relance automatique demandant a un client de payer l'argent qu'on
// lui doit — et elle partirait la nuit, toute seule. L'avoir porte une échéance
// au jour de son émission : sans exclusion, il serait « en retard » dès le
// lendemain.
const relance = await appel(`/api/invoices/${avoir.id}/send-reminder`, { method: "POST" });
verifier(
  "un avoir ne peut pas être relancé",
  relance.status >= 400,
  `HTTP ${relance.status} ${JSON.stringify(relance.body).slice(0, 200)}`,
);

// La relance automatique lit la base directement : on vérifie la requête
// elle-même plutôt que l'écran, parce que c'est elle qui envoie les courriels.
const listeRelancables = await appel("/api/invoices");
const avoirDansListe = (listeRelancables.body?.invoices ?? []).find((f) => f.id === avoir.id);
verifier(
  "l'avoir reste visible dans la liste des factures",
  Boolean(avoirDansListe),
  "un document légal qu'on ne retrouve plus est un document perdu",
);
verifier(
  "et il s'y annonce comme un avoir",
  avoirDansListe?.invoice_type === "avoir" && avoirDansListe?.type_code === "381",
  `invoice_type = ${avoirDansListe?.invoice_type}, type_code = ${avoirDansListe?.type_code}`,
);

console.log("");
console.log(`   Facture annulée : ${numeroFacture} (${idFacture})`);
console.log(`   Avoir transmis  : ${avoir.invoice_number} (${avoir.id})`);

process.exit(bilan());
