/**
 * Le Factur-X que Deviso produit, jugé par le validateur officiel.
 *
 * Pourquoi cette traversee existe. Tout le reste de nos tests verifie que
 * *notre* code fait ce que *nous* avons decide. Celui-ci verifie que le
 * document que nous fabriquons est conforme a la norme — et c'est la seule
 * question qui compte au moment ou une facture part chez un client.
 *
 * Le juge n'est pas nous : `POST /validation_reports` est le validateur de la
 * Plateforme Agreee, qui applique « les derniers jeux de regles de validation
 * en vigueur, les schematrons » (documentation Super PDP, article 6). Il est
 * public — `security: []` dans la specification — donc utilisable sans jeton et
 * sans rien emettre.
 *
 * On passe par les routes de l'application (`/api/invoices` puis
 * `/api/superpdp/invoices/{id}/valider`) plutot que d'appeler la generation
 * XML directement : c'est exactement le chemin qu'empruntera une vraie facture,
 * profil du vendeur et resolution d'adresse compris. Un test qui court-circuite
 * ce chemin validerait un document que personne n'enverra jamais.
 *
 * Chaque cas est une situation reelle de freelance, pas une variation
 * syntaxique. Un echec ici veut dire qu'un utilisateur dans cette situation
 * verrait sa facture rejetee.
 */

import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

const COMPTE = {
  email: "superpdp-test@getdeviso.fr",
  password: secret("E2E_SUPERPDP_PASSWORD"),
};

/** SIREN reel, partage par les deux societes fictives du bac a sable. */
const SIREN_PARTAGE = "315143296";
/** Adresse d'acheminement de Tricatel : evite l'ambiguite du SIREN nu. */
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

async function session() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(COMPTE),
  });
  if (!r.ok) throw new Error(`Connexion impossible : HTTP ${r.status}`);
  const cookie = cookieFor(await r.json());
  return async (path, init = {}) => {
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
  };
}

const jour = (decalage) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return d.toISOString().slice(0, 10);
};

/** Socle commun : un vendeur complet, puisque c'est le profil qui le fournit. */
const VENDEUR = {
  seller_company: "Burger Queen",
  seller_siren: SIREN_PARTAGE,
  seller_street: "809 avenue du Languedoc",
  seller_postcode: "12100",
  seller_city: "Millau",
};

const CLIENT_PRO = {
  client_directory_address: ADRESSE_TRICATEL,
  client_name: "Tricatel",
  client_company: "Tricatel",
  client_siren: SIREN_PARTAGE,
  client_street: "Avenue de la République",
  client_postcode: "37170",
  client_city: "Chambray-lès-Tours",
  client_country: "FR",
};

function ligne(description, pu, q = 1) {
  const total = Math.round(pu * q * 100) / 100;
  return { description, quantity: q, unit: "unité", unit_price: pu, total };
}

function facture(nom, extra) {
  const items = extra.items ?? [ligne("Prestation de conseil", 500)];
  const ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
  const taux = extra.tva_rate ?? 20;
  const ttc = Math.round(ht * (1 + taux / 100) * 100) / 100;
  return {
    nom,
    corps: {
      ...VENDEUR,
      ...CLIENT_PRO,
      operation_category: "services",
      type_code: "380",
      invoice_type: "standard",
      payment_terms: "30 jours net",
      issue_date: jour(-3),
      due_date: jour(27),
      ...extra,
      items,
      total_ht: ht,
      tva_rate: taux,
      total_ttc: ttc,
    },
  };
}

/**
 * La matrice. Chaque entree est une situation qu'un utilisateur rencontrera.
 */
const CAS = [
  facture("B2B France, services, TVA 20 %", {}),

  facture("B2B France, vente de biens", {
    operation_category: "goods",
    items: [ligne("Cartons d'emballage compostables", 24.9, 40)],
  }),

  facture("B2B, TVA sur les débits", { payment_on_debit: true }),

  facture("B2B, franchise de TVA (taux 0)", { tva_rate: 0 }),

  facture("B2B, TVA réduite 10 %", { tva_rate: 10 }),

  facture("B2B, TVA super-réduite 5,5 %", { tva_rate: 5.5 }),

  facture("B2B, plusieurs lignes et centimes", {
    items: [
      ligne("Audit technique", 1187.33),
      ligne("Atelier de restitution", 412.5, 2),
      ligne("Frais de déplacement", 87.16, 3),
    ],
  }),

  facture("B2B, quantité fractionnaire", {
    items: [ligne("Développement au forfait jour", 640, 3.5)],
  }),

  facture("B2B, échéance dépassée", { issue_date: jour(-60), due_date: jour(-30) }),

  facture("B2B, émise et échue le même jour", { issue_date: jour(0), due_date: jour(0) }),

  facture("B2C, client particulier", {
    client_directory_address: null,
    client_name: "Camille Berger",
    client_company: null,
    client_siren: null,
    client_email: "camille.berger@example.org",
    client_street: "12 rue des Lilas",
    client_postcode: "33000",
    client_city: "Bordeaux",
    client_country: "FR",
  }),

  // Le client etranger fournit son adresse de facturation electronique : hors
  // de France elle ne se deduit de rien, et BT-49 est obligatoire (BR-FR-12).
  // `0208` est le schema du numero d'entreprise belge.
  facture("B2BInt, client belge", {
    client_directory_address: "0208:0403170701",
    client_name: "Tricatel Belgium",
    client_company: "Tricatel Belgium",
    client_siren: null,
    client_street: "Rue de la Loi 16",
    client_postcode: "1000",
    client_city: "Bruxelles",
    client_country: "BE",
  }),

  facture("B2BInt sans adresse électronique — doit être bloqué en amont", {
    client_directory_address: null,
    client_name: "Tricatel Deutschland",
    client_company: "Tricatel Deutschland",
    client_siren: null,
    client_street: "Unter den Linden 1",
    client_postcode: "10117",
    client_city: "Berlin",
    client_country: "DE",
    attendu: "manque",
  }),

  facture("Facture d'acompte (30 %)", {
    invoice_type: "acompte",
    deposit_percentage: 30,
    items: [ligne("Acompte sur prestation de conseil", 300)],
  }),

  // Pas de cas « avoir » ici, et c'est un constat, pas un oubli.
  //
  // Un premier essai envoyait un type 381 avec des montants negatifs. Le
  // validateur l'a refuse — [BR-27] « The Item net price (BT-146) shall NOT be
  // negative » : dans la norme, un avoir porte des montants POSITIFS, c'est le
  // type de document qui en dit le sens.
  //
  // Mais ce cas n'existe pas dans Deviso : `type_code` vaut 380 pour toutes
  // les factures de la base, aucun ecran ne permet d'en produire un autre, et
  // `invoice_type` ne connait que standard / acompte / solde. Tester un
  // document qu'aucun utilisateur ne peut creer aurait mesure une fiction.
  //
  // L'absence d'avoir est une lacune fonctionnelle reelle — sous la reforme,
  // une facture transmise ne se modifie plus, et l'avoir est le seul moyen de
  // la corriger — mais elle se traite en construisant la fonctionnalite, pas
  // en l'affirmant ici.
];

console.log("");
console.log("── Conformité du Factur-X, jugée par le validateur officiel ───");
console.log(`   base : ${BASE}`);
console.log(`   ${CAS.length} situations`);
console.log("");

const appel = await session();
const aNettoyer = [];

for (const cas of CAS) {
  const creee = await appel("/api/invoices", {
    method: "POST",
    body: JSON.stringify(cas.corps),
  });
  const id = creee.body?.invoice?.id;
  if (!id) {
    verifier(`${cas.nom} — facture créée`, false, `HTTP ${creee.status} ${JSON.stringify(creee.body).slice(0, 220)}`);
    continue;
  }
  aNettoyer.push(id);

  const r = await appel(`/api/superpdp/invoices/${id}/valider`, { method: "POST" });
  if (r.status !== 200) {
    verifier(`${cas.nom} — validation obtenue`, false, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 220)}`);
    continue;
  }

  const v = r.body?.validation ?? {};
  const manques = r.body?.manques ?? [];

  // Certains cas ne doivent PAS produire un document conforme : ils doivent
  // etre arretes par le pre-controle, avant qu'un XML ne parte. Verifier leur
  // conformite n'aurait pas de sens — c'est leur blocage qu'on verifie.
  if (cas.corps.attendu === "manque") {
    verifier(
      `${cas.nom} — arrêtée par le pré-contrôle`,
      manques.length > 0 && r.body?.conforme === false,
      `manques = ${JSON.stringify(manques)}`,
    );
    if (manques.length) console.log(`       ${manques.join(" · ")}`);
    continue;
  }

  // Le validateur peut être momentanément indisponible : ne pas confondre
  // « la facture est mauvaise » avec « le juge n'a pas répondu ».
  if (v.indisponible) {
    verifier(`${cas.nom} — validateur joignable`, false, v.indisponible);
    continue;
  }

  const echecs = v.echecs ?? [];
  verifier(
    `${cas.nom} — Factur-X conforme`,
    v.valide === true && echecs.length === 0,
    echecs.slice(0, 4).join(" · ") || JSON.stringify(v).slice(0, 200),
  );

  // Les manques du pré-contrôle sont une information distincte : une facture
  // peut être syntaxiquement conforme et néanmoins impossible à acheminer.
  if (manques.length) {
    console.log(`       pré-contrôle : ${manques.join(" · ")}`);
  }
  if (r.body?.nature) {
    console.log(`       nature ${r.body.nature} · exigibilité BT-8 = ${r.body.exigibilite ?? "absente"}`);
  }
}

// ── Contre-épreuve : le validateur sait-il dire non ? ───────────────────────
//
// Sans elle, une suite entièrement verte pourrait signifier « tout est bon »
// aussi bien que « le validateur accepte n'importe quoi ». On lui soumet donc
// un document délibérément invalide.
{
  const r = await fetch("https://api.superpdp.tech/v1.beta/validation_reports", {
    method: "POST",
    body: (() => {
      const fd = new FormData();
      fd.append("file", new Blob(["<pas-une-facture/>"], { type: "application/xml" }), "faux.xml");
      return fd;
    })(),
  });
  const d = await r.json().catch(() => ({}));
  // Le verdict est dans `data[0].is_valid`, pas a la racine : le validateur
  // repond HTTP 200 meme pour un document illisible, et range son refus dans
  // le rapport. La premiere version de cette contre-epreuve regardait la
  // racine et concluait a tort que le validateur acceptait n'importe quoi.
  const rapport = d?.data?.[0];
  verifier(
    "Contre-épreuve : le validateur refuse un document invalide",
    rapport?.is_valid === false,
    `HTTP ${r.status} ${JSON.stringify(d).slice(0, 200)}`,
  );
  verifier(
    "Contre-épreuve : le refus est motivé",
    Boolean(rapport?.error || (rapport?.subreports ?? []).length),
    JSON.stringify(rapport ?? {}).slice(0, 200),
  );
}

// ── Ménage ─────────────────────────────────────────────────────────────────
// Ces factures ne sont jamais transmises : elles n'existent que le temps du
// jugement. Les laisser polluerait le compte de test, ce que Selim a demandé
// d'éviter le 31/08/2026.
let effacees = 0;
for (const id of aNettoyer) {
  const d = await appel(`/api/invoices/${id}`, { method: "DELETE" });
  if (d.status === 200) effacees++;
}
console.log("");
console.log(`   ${effacees}/${aNettoyer.length} facture(s) de test supprimée(s).`);

process.exit(bilan());
