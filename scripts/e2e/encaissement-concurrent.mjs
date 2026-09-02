/**
 * Un encaissement ne se declare qu'une fois, meme declenche deux fois d'un coup.
 *
 * Pourquoi cette traversee existe. `envoyerEncaissementPdp` a QUATRE appelants :
 * le bouton « Marquer comme payee », la mise a jour de statut de la facture, la
 * route d'encaissement, et le webhook Stripe. Les deux derniers se declenchent
 * naturellement au meme instant : quelqu'un qui pointe le paiement a la seconde
 * ou Stripe confirme le lien de paiement.
 *
 * La garde d'idempotence LISAIT `superpdp_encaisse_at`, le trouvait vide, puis
 * postait, puis l'ecrivait. Entre la lecture et l'ecriture il y a un aller-retour
 * HTTP vers la Plateforme Agreee. Deux appels dans cet intervalle postent tous
 * deux `fr:212`.
 *
 * Consequence : `fr:212` est le message a partir duquel est construit
 * l'e-reporting de paiement. Deux messages pour un seul encaissement, c'est une
 * declaration de TVA en double aupres de l'administration — sur la donnee meme
 * qui determine l'exigibilite. Aucun ecran ne rattrape ca.
 *
 * On teste donc ce que la base arbitre : deux appels simultanes, et on compte
 * combien ont reellement declare.
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

function corpsFacture(libelle, extra = {}) {
  return {
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
    items: [{ description: libelle, quantity: 1, unit: "forfait", unit_price: 250, total: 250 }],
    total_ht: 250,
    tva_rate: 20,
    total_ttc: 300,
    issue_date: jour(-2),
    due_date: jour(28),
    type_code: "380",
    invoice_type: "standard",
    payment_terms: "30 jours net",
    status: "sent",
    ...extra,
  };
}

console.log("");
console.log("── Encaissement concurrent : un paiement, deux déclencheurs ───");
console.log(`   base : ${BASE}`);
console.log("");
// ── Une facture réellement transmise ───────────────────────────────────────
//
// L'encaissement n'a de sens que sur une facture que la Plateforme Agréée
// connaît : c'est la condition même du `fr:212`.
const creee = await appel("/api/invoices", {
  method: "POST",
  body: JSON.stringify(corpsFacture("Test d'encaissement concurrent")),
});

const id = creee.body?.invoice?.id;
verifier(
  "une facture transmissible est créée",
  Boolean(id),
  `HTTP ${creee.status} ${JSON.stringify(creee.body).slice(0, 200)}`,
);
if (!id) process.exit(bilan());

await appel(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });

const emission = await appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" });
const idPdp = emission.body?.superpdpId;
verifier(
  "elle est transmise à la Plateforme Agréée",
  emission.status === 200 && Boolean(idPdp),
  `HTTP ${emission.status} ${JSON.stringify(emission.body).slice(0, 200)}`,
);
if (!idPdp) process.exit(bilan());

// ── Deux déclarations d'encaissement lancées ensemble ──────────────────────
//
// Reproduit exactement le croisement « clic sur payée » / « webhook Stripe » :
// aucune n'attend l'autre.
const date = jour(-1);
const [a, b] = await Promise.all([
  appel(`/api/superpdp/invoices/${id}/encaisser`, { method: "POST", body: JSON.stringify({ date }) }),
  appel(`/api/superpdp/invoices/${id}/encaisser`, { method: "POST", body: JSON.stringify({ date }) }),
]);

console.log(`   réponse 1 : HTTP ${a.status} ${JSON.stringify(a.body).slice(0, 130)}`);
console.log(`   réponse 2 : HTTP ${b.status} ${JSON.stringify(b.body).slice(0, 130)}`);
console.log("");

const reponses = [a, b];
const declarees = reponses.filter(
  (x) => x.status === 200 && x.body?.encaissee === true && x.body?.dejaEncaissee !== true,
);
const doublons = reponses.filter((x) => x.body?.dejaEncaissee === true);

verifier(
  "une seule des deux déclare l'encaissement",
  declarees.length === 1,
  `${declarees.length} déclaration(s) — deux signifierait un e-reporting de paiement en double au PPF`,
);

verifier(
  "l'autre se sait doublée et ne renvoie rien",
  doublons.length === 1,
  `déjà encaissée : ${doublons.length}`,
);

verifier(
  "aucune des deux ne renvoie une erreur serveur",
  reponses.every((x) => x.status !== 500),
  reponses.map((x) => x.status).join(" / "),
);

// ── La base porte une date d'encaissement, et une seule ────────────────────
const relue = await appel(`/api/invoices/${id}`);
const encaisseAt = relue.body?.invoice?.superpdp_encaisse_at;
verifier(
  "la facture porte une date d'encaissement",
  Boolean(encaisseAt),
  `superpdp_encaisse_at = ${encaisseAt ?? "null"}`,
);

verifier(
  "et c'est la date réelle du paiement, pas celle du clic",
  typeof encaisseAt === "string" && encaisseAt.slice(0, 10) === date,
  `${String(encaisseAt).slice(0, 10)} attendu ${date} — c'est cette date qui détermine l'exigibilité de la TVA`,
);

// ── Un troisième appel, plus tard, ne redéclare pas ────────────────────────
const troisieme = await appel(`/api/superpdp/invoices/${id}/encaisser`, {
  method: "POST",
  body: JSON.stringify({ date }),
});
verifier(
  "un appel ultérieur répond « déjà encaissée » sans rien renvoyer",
  troisieme.status === 200 && troisieme.body?.dejaEncaissee === true,
  `HTTP ${troisieme.status} ${JSON.stringify(troisieme.body).slice(0, 900)}`,
);

const apres = await appel(`/api/invoices/${id}`);
verifier(
  "et il ne déplace pas la date déjà enregistrée",
  apres.body?.invoice?.superpdp_encaisse_at === encaisseAt,
  `${apres.body?.invoice?.superpdp_encaisse_at} contre ${encaisseAt}`,
);

// ── Contre-épreuve : rien à déclarer, donc rien à réserver ─────────────────
//
// Une facture jamais transmise n'a pas d'événement d'encaissement possible. La
// réservation ne doit PAS être posée : sinon la facture porterait une date
// d'encaissement que rien n'a jamais déclaré, et le jour où elle serait enfin
// transmise, le `fr:212` ne partirait plus.
const jamais = await appel("/api/invoices", {
  method: "POST",
  body: JSON.stringify(corpsFacture("Jamais transmise")),
});
const idJamais = jamais.body?.invoice?.id;
if (idJamais) {
  const rep = await appel(`/api/superpdp/invoices/${idJamais}/encaisser`, {
    method: "POST",
    body: JSON.stringify({ date }),
  });
  verifier(
    "une facture jamais transmise répond « non transmise », calmement",
    rep.status === 200 && rep.body?.raison === "non_transmise",
    `HTTP ${rep.status} ${JSON.stringify(rep.body).slice(0, 160)}`,
  );

  const relueJamais = await appel(`/api/invoices/${idJamais}`);
  verifier(
    "et elle ne porte AUCUNE date d'encaissement",
    !relueJamais.body?.invoice?.superpdp_encaisse_at,
    `superpdp_encaisse_at = ${relueJamais.body?.invoice?.superpdp_encaisse_at ?? "null"} — une réservation posée ici empêcherait le fr:212 le jour de la transmission`,
  );

  await appel(`/api/invoices/${idJamais}`, { method: "DELETE" });
}

// ── Une date future est refusée, pas propagée ──────────────────────────────
//
// L'exigibilité se déclare à la date du paiement. Accepter une date à venir
// ferait déclarer un encaissement qui n'a pas eu lieu.
const future = await appel("/api/invoices", {
  method: "POST",
  body: JSON.stringify(corpsFacture("Date d'encaissement future")),
});
const idFuture = future.body?.invoice?.id;
if (idFuture) {
  await appel(`/api/invoices/${idFuture}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
  const emise = await appel(`/api/superpdp/invoices/${idFuture}/emettre`, { method: "POST" });
  if (emise.status === 200) {
    await appel(`/api/superpdp/invoices/${idFuture}/encaisser`, {
      method: "POST",
      body: JSON.stringify({ date: jour(30) }),
    });
    const rl = await appel(`/api/invoices/${idFuture}`);
    const d = rl.body?.invoice?.superpdp_encaisse_at;
    verifier(
      "une date d'encaissement future est ignorée au profit d'aujourd'hui",
      typeof d === "string" && d.slice(0, 10) <= jour(0),
      `superpdp_encaisse_at = ${d ?? "null"}`,
    );
  }
  console.log(`   Facture de test conservée (réellement transmise) : ${idFuture}`);
}

console.log("");
console.log(`   Facture de test conservée (réellement transmise et encaissée) : ${id}`);

process.exit(bilan());
