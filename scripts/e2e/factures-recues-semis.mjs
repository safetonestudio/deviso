/**
 * Fait arriver de vraies factures dans la boîte de réception d'un compte.
 *
 * Pourquoi ce script existe. Pour juger l'écran « Factures reçues » — et pour
 * savoir si la chaîne de transmission fonctionne encore après un changement —
 * il faut des factures dedans. La tentation est d'insérer des lignes en base :
 * ça remplit l'écran et ça ne prouve rien. Une ligne fabriquée à la main ne dit
 * ni que l'émission passe, ni que l'Annuaire répond, ni que la synchronisation
 * ramène ce qu'elle doit ramener.
 *
 * Ici, chaque facture est réellement créée dans Deviso par un compte
 * fournisseur, réellement transmise à la Plateforme Agréée, et réellement
 * relue par la synchronisation du destinataire. Si une seule maille de la
 * chaîne casse, le script le dit — c'est donc aussi un test de non-régression.
 *
 * Toutes passent par les routes de l'application. Aucun appel direct à
 * Super PDP : un script qui rafraîchit un jeton sans le persister invalide le
 * raccordement (arrivé trois fois le 29/08/2026).
 *
 * Usage : node scripts/e2e/factures-recues-semis.mjs [nombre]
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

const FOURNISSEUR = {
  email: "superpdp-test@getdeviso.fr",
  password: secret("E2E_SUPERPDP_PASSWORD"),
};

/** SIREN réel, partagé par les deux sociétés fictives du bac à sable. */
const SIREN_PARTAGE = "315143296";

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
  if (!res.ok) throw new Error(`Connexion ${creds.email} impossible : HTTP ${res.status}`);
  const cookie = cookieFor(await res.json());
  return async (path, init = {}) => {
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
}

const doc = (o) => JSON.stringify(o);
const jour = (decalage) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return d.toISOString().slice(0, 10);
};

/**
 * Des factures qui ne se ressemblent pas.
 *
 * Un écran rempli de dix lignes identiques ne se juge pas : on ne voit ni si le
 * tri fonctionne, ni si les montants s'alignent, ni si une échéance dépassée
 * ressort. Les échéances sont réparties de part et d'autre d'aujourd'hui pour
 * que le retard s'affiche vraiment, et les libellés sont ceux d'un fournisseur
 * plausible plutôt que « Prestation de test ».
 */
const MODELES = [
  { libelle: "Approvisionnement pains briochés — semaine 34", pu: 412.5, q: 1, echeance: -22 },
  { libelle: "Steaks surgelés, carton de 120", pu: 189.9, q: 6, echeance: -9 },
  { libelle: "Nettoyage des hottes et conduits", pu: 780, q: 1, echeance: -3 },
  { libelle: "Emballages compostables, palette", pu: 1245, q: 1, echeance: 6 },
  { libelle: "Maintenance friteuses — contrat trimestriel", pu: 340, q: 1, echeance: 14 },
  { libelle: "Boissons, réassort mensuel", pu: 97.4, q: 12, echeance: 21 },
  { libelle: "Formation hygiène HACCP, 2 sessions", pu: 650, q: 2, echeance: 30 },
  { libelle: "Sauces et condiments — commande 4408", pu: 233.15, q: 3, echeance: 38 },
];

const combien = Math.min(Number(process.argv[2] || 6), MODELES.length);
// La catégorie d'opération est un paramètre parce qu'elle s'est révélée
// discriminante : voir le journal du 29/08/2026 dans CLAUDE.md.
const CATEGORIE = process.argv[3] || "services";
const appel = await signIn(FOURNISSEUR);

console.log("");
console.log("── Semis de factures reçues ──────────────────────────────────");
console.log(`   base : ${BASE}`);
console.log(`   ${combien} facture(s) émise(s) par Burger Queen vers Tricatel (${CATEGORIE})`);
console.log("");

const emises = [];

for (let i = 0; i < combien; i++) {
  const m = MODELES[i];
  const ht = Math.round(m.pu * m.q * 100) / 100;
  const ttc = Math.round(ht * 1.2 * 100) / 100;
  // BT-2 : la Plateforme Agréée refuse une date de facture postérieure à
  // aujourd'hui. Une échéance lointaine ne doit donc pas repousser l'émission
  // dans le futur — on la ramène à aujourd'hui au plus tard.
  const emission = jour(Math.min(m.echeance - 30, 0));

  const creee = await appel("/api/invoices", {
    method: "POST",
    body: doc({
      seller_company: "Burger Queen",
      seller_siren: SIREN_PARTAGE,
      seller_street: "809 avenue du Languedoc",
      seller_postcode: "12100",
      seller_city: "Millau",
      // L'adresse d'acheminement est donnée explicitement, et c'est
      // indispensable ici. Les sociétés du bac à sable ne figurent pas à
      // l'Annuaire national : la résolution retombe alors sur le SIREN nu,
      // `0225:315143296` — que Tricatel ET Burger Queen partagent. La
      // Plateforme Agréée accepte la facture, ne sait pas à qui la remettre, et
      // la laisse à `api:uploaded` sans le dire. Six heures d'enquête le
      // 29/08/2026 pour ça. Voir CLAUDE.md.
      client_directory_address: "0225:315143296_57700",
      client_name: "Tricatel",
      client_company: "Tricatel",
      client_siren: SIREN_PARTAGE,
      client_street: "Avenue de la République",
      client_postcode: "37170",
      client_city: "Chambray-lès-Tours",
      operation_category: CATEGORIE,
      items: [{ description: m.libelle, quantity: m.q, unit: "unité", unit_price: m.pu, total: ht }],
      total_ht: ht,
      tva_rate: 20,
      total_ttc: ttc,
      issue_date: emission,
      due_date: jour(m.echeance),
      type_code: "380",
      invoice_type: "standard",
      payment_terms: "30 jours net",
    }),
  });

  const id = creee.body?.invoice?.id;
  const numero = creee.body?.invoice?.invoice_number;
  if (!id) {
    verifier(`facture ${i + 1} créée`, false, `HTTP ${creee.status} ${doc(creee.body).slice(0, 200)}`);
    continue;
  }

  await appel(`/api/invoices/${id}`, { method: "PATCH", body: doc({ status: "sent" }) });
  const envoi = await appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" });

  const ok = envoi.status === 200 && envoi.body?.emise === true && Number(envoi.body?.superpdpId) > 0;
  verifier(
    `${numero} — ${m.libelle.slice(0, 38)} — transmise`,
    ok,
    `HTTP ${envoi.status} ${doc(envoi.body).slice(0, 220)}`
  );
  if (ok) emises.push({ numero, ttc, superpdpId: envoi.body.superpdpId, echeance: jour(m.echeance) });
}

// ── La réception, vue du destinataire ────────────────────────────────────────
//
// C'est la maille qu'on ne peut pas supposer : une facture partie n'est pas une
// facture arrivée.
//
// Ce qui dépend de nous s'arrête à l'acceptation par la Plateforme Agréée. Le
// reste est à leur main : le 29/08/2026, six factures acceptées sont restées
// `api:uploaded` plus de trente minutes, puis tout un lot est passé d'un coup —
// leur bac à sable traite par vagues, pas au fil de l'eau. Un script qui
// exigeait l'arrivée en quinze secondes déclarait donc en panne une chaîne qui
// fonctionnait, et aurait fait chercher un bug côté Deviso.
//
// D'où la règle ici : on ASSERTE ce qu'on maîtrise (l'émission), et on RAPPORTE
// l'acheminement, en nommant ce qui est encore en vol. La tâche horaire les
// ramènera sans intervention.
console.log("");
console.log("── Acheminement jusqu'à la boîte du destinataire ─────────────");

const secretCron = process.env.CRON_SECRET || secret("CRON_SECRET");
const budgetMs = Number(process.env.SEMIS_ATTENTE_MS || 240000);
const debut = Date.now();
let entrantes = 0;
let echecsSync = 0;

while (entrantes < emises.length && Date.now() - debut < budgetMs) {
  const r = await fetch(`${BASE}/api/cron/superpdp-sync`, {
    headers: { authorization: `Bearer ${secretCron}` },
  });
  const b = await r.json().catch(() => ({}));
  entrantes += b.entrantes ?? 0;
  echecsSync += b.echecs ?? 0;
  const ecoule = Math.round((Date.now() - debut) / 1000);
  console.log(`   +${ecoule}s : ${b.entrantes ?? 0} entrante(s), ${b.echecs ?? 0} échec(s) — cumul ${entrantes}/${emises.length}`);
  if (entrantes >= emises.length) break;
  await new Promise((r) => setTimeout(r, 30000));
}

// La synchronisation, elle, doit répondre : c'est notre code. Une panne de
// synchronisation ne se distinguerait pas d'un lot en retard sans cette
// vérification distincte.
verifier(
  "la synchronisation du destinataire tourne sans échec",
  echecsSync === 0,
  `${echecsSync} échec(s) remontés par la tâche de synchronisation`
);

if (entrantes >= emises.length) {
  console.log(`   toutes arrivées (${entrantes}/${emises.length}).`);
} else {
  console.log("");
  console.log(`   ${emises.length - entrantes} facture(s) encore en vol chez la Plateforme Agréée.`);
  console.log("   Ce n'est pas une panne : elles sont acceptées, avec un identifiant");
  console.log("   Super PDP, et attendent son prochain traitement. La tâche horaire");
  console.log("   /api/cron/superpdp-sync les ramènera sans rien faire de plus.");
}

console.log("");
console.log("── Récapitulatif ─────────────────────────────────────────────");
for (const e of emises) {
  console.log(`   ${e.numero} · ${e.ttc.toFixed(2)} € TTC · échéance ${e.echeance} · Super PDP ${e.superpdpId}`);
}
console.log("");
console.log("   Toutes portent Burger Queen comme fournisseur : c'est la seule");
console.log("   entreprise du bac à sable qui puisse émettre vers ce compte.");
console.log("");

process.exit(bilan() > 0 ? 1 : 0);
