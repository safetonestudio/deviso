/**
 * Une facture ne part qu'une fois, meme si on la transmet deux fois d'un coup.
 *
 * Pourquoi cette traversee existe. La route d'emission se gardait du doublon en
 * LISANT `superpdp_invoice_id`, en le trouvant vide, puis en transmettant.
 * Entre la lecture et l'ecriture il s'ecoule plusieurs secondes — generation du
 * XML, validation officielle, POST. Deux appels lances dans cet intervalle
 * lisent tous deux une valeur vide et transmettent tous deux.
 *
 * Consequence chez le client : la meme facture deux fois. Il la refuse pour
 * « DOUBLON » — un motif de la nomenclature, donc un cas prevu — et le
 * fournisseur doit passer un avoir. Le refus etant terminal, la facture
 * d'origine est morte avec.
 *
 * L'interface desactive le bouton pendant l'envoi. Ca ne protege de rien : un
 * second onglet, un reessai reseau, ou un appel direct a l'API suffisent. Une
 * regle qui ne vit que dans le navigateur n'est pas une regle.
 *
 * On teste donc ce que la base arbitre, pas ce que l'ecran empeche : deux POST
 * simultanes, et on compte combien ont reellement transmis.
 */

import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

const COMPTE = {
  email: "superpdp-test@getdeviso.fr",
  password: secret("E2E_SUPERPDP_PASSWORD"),
};

const SIREN_PARTAGE = "315143296";
const ADRESSE_TRICATEL = "0225:315143296_57700";

function cookieFor(t) {
  const session = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  return `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
}

const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  body: JSON.stringify(COMPTE),
});
if (!r.ok) throw new Error(`Connexion impossible : HTTP ${r.status}`);
const cookie = cookieFor(await r.json());

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
  let body;
  try {
    body = JSON.parse(texte);
  } catch {
    body = texte.slice(0, 300);
  }
  return { status: res.status, body };
}

const jour = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

console.log("");
console.log("── Émission concurrente : une facture, deux clics ─────────────");
console.log(`   base : ${BASE}`);
console.log("");

// ── Une facture parfaitement transmissible ─────────────────────────────────
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
    items: [{ description: "Test d'émission concurrente", quantity: 1, unit: "forfait", unit_price: 300, total: 300 }],
    total_ht: 300,
    tva_rate: 20,
    total_ttc: 360,
    issue_date: jour(-1),
    due_date: jour(29),
    type_code: "380",
    invoice_type: "standard",
    payment_terms: "30 jours net",
    status: "sent",
  }),
});

const id = creee.body?.invoice?.id;
verifier("une facture transmissible est créée", Boolean(id), `HTTP ${creee.status} ${JSON.stringify(creee.body).slice(0, 200)}`);
if (!id) process.exit(bilan());

await appel(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });

// ── Deux transmissions lancées ensemble ────────────────────────────────────
//
// `Promise.all` les part vraiment en parallèle : aucune n'attend la réponse de
// l'autre, ce qui reproduit le double-clic et le réessai réseau.
const [a, b] = await Promise.all([
  appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" }),
  appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" }),
]);

const reponses = [a, b];
const transmises = reponses.filter((x) => x.status === 200 && x.body?.emise === true && !x.body?.dejaEmise);
const refusees = reponses.filter((x) => x.status === 409);
const dejaEmises = reponses.filter((x) => x.body?.dejaEmise === true);

console.log(`   réponse 1 : HTTP ${a.status} ${JSON.stringify(a.body).slice(0, 130)}`);
console.log(`   réponse 2 : HTTP ${b.status} ${JSON.stringify(b.body).slice(0, 130)}`);
console.log("");

verifier(
  "une seule des deux transmissions aboutit",
  transmises.length === 1,
  `${transmises.length} transmission(s) aboutie(s) — deux signifierait une facture en double chez le client`,
);

verifier(
  "l'autre est arrêtée proprement, pas par une erreur serveur",
  refusees.length === 1 || dejaEmises.length === 1,
  `409 : ${refusees.length}, déjà émise : ${dejaEmises.length}`,
);

verifier(
  "aucune des deux ne renvoie une erreur 500",
  reponses.every((x) => x.status !== 500),
  reponses.map((x) => x.status).join(" / "),
);

// ── La base ne garde qu'un seul identifiant ────────────────────────────────
const relue = await appel(`/api/invoices/${id}`);
const idPdp = relue.body?.invoice?.superpdp_invoice_id;
verifier(
  "la facture porte exactement un identifiant Plateforme Agréée",
  Boolean(idPdp),
  `superpdp_invoice_id = ${idPdp ?? "aucun"}`,
);

// ── Le verrou est rendu, la facture n'est pas coincée ──────────────────────
verifier(
  "le verrou d'émission est relâché après succès",
  !relue.body?.invoice?.superpdp_emission_debutee_at,
  `superpdp_emission_debutee_at = ${relue.body?.invoice?.superpdp_emission_debutee_at ?? "null"}`,
);

// ── Un troisième appel, plus tard, ne réémet pas ───────────────────────────
const troisieme = await appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" });
verifier(
  "un appel ultérieur répond « déjà émise » sans rien renvoyer",
  troisieme.status === 200 && troisieme.body?.dejaEmise === true,
  `HTTP ${troisieme.status} ${JSON.stringify(troisieme.body).slice(0, 160)}`,
);
verifier(
  "et il rend le même identifiant, pas un nouveau",
  String(troisieme.body?.superpdpId ?? "") === String(idPdp ?? ""),
  `${troisieme.body?.superpdpId} contre ${idPdp}`,
);

// ── Le verrou ne bloque pas une facture qui a échoué ───────────────────────
//
// Une facture refusée avant l'envoi (ici : biens ET services mélangés, que
// l'e-reporting ne gère pas) doit pouvoir être retentée immédiatement après
// correction. Si le verrou restait posé, l'utilisateur corrigerait sa facture
// pour s'entendre répondre « transmission déjà en cours » pendant dix minutes.
const mixte = await appel("/api/invoices", {
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
    operation_category: "mixed",
    items: [{ description: "Biens et services", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
    total_ht: 100,
    tva_rate: 20,
    total_ttc: 120,
    issue_date: jour(-1),
    due_date: jour(29),
    type_code: "380",
    invoice_type: "standard",
    status: "sent",
  }),
});
const idMixte = mixte.body?.invoice?.id;
if (idMixte) {
  await appel(`/api/invoices/${idMixte}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
  const premier = await appel(`/api/superpdp/invoices/${idMixte}/emettre`, { method: "POST" });
  const second = await appel(`/api/superpdp/invoices/${idMixte}/emettre`, { method: "POST" });
  verifier(
    "une facture refusée avant envoi est refusée pour la BONNE raison, deux fois de suite",
    premier.status === 400 && second.status === 400,
    `1er : HTTP ${premier.status} · 2e : HTTP ${second.status} ${JSON.stringify(second.body).slice(0, 160)}`,
  );
  await appel(`/api/invoices/${idMixte}`, { method: "DELETE" });
}

console.log("");
console.log(`   Facture de test conservée (elle est réellement transmise) : ${id}`);

process.exit(bilan());
