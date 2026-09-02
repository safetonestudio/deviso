/**
 * La date saisie est-elle bien celle que l'administration recoit ?
 *
 * Pourquoi cette traversee existe. La TVA sur les prestations de services est
 * exigible A L'ENCAISSEMENT. Quelqu'un qui pointe le 29 un virement recu le 12
 * declarait, jusqu'ici, une date fausse de dix-sept jours — et pas sur un
 * detail d'affichage : sur la donnee qui determine la periode de declaration.
 *
 * La chaine complete compte cinq maillons, et un seul suffit a la casser :
 *
 *   ecran → PATCH /api/invoices/{id} → colonne paid_at →
 *   envoyerEncaissementPdp → bloc MDG-43 du message fr:212
 *
 * Verifier la colonne ne prouve rien : elle peut etre juste pendant que le
 * message part avec la date du jour. On relit donc l'evenement CHEZ LA
 * PLATEFORME, ce qui est le seul endroit ou la question se tranche.
 *
 * Contre-epreuve indispensable : sans le bloc MEN complet, la plateforme
 * REFUSE le message (BR-FR-CDV-14). Une traversee qui ne verifierait que « la
 * facture est encaissee » passerait au vert sur un repli silencieux vers la
 * date du jour.
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

const AUJOURDHUI = jour(0);
/** Volontairement loin du jour de l'appel : un repli sur « aujourd'hui » se voit. */
const PAYEE_LE = jour(-17);

console.log("");
console.log("── Date d'encaissement : de l'écran jusqu'au fisc ─────────────");
console.log(`   base : ${BASE}`);
console.log(`   payée le ${PAYEE_LE}, pointée le ${AUJOURDHUI}`);
console.log("");
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
    items: [{ description: "Prestation payée il y a deux semaines", quantity: 1, unit: "forfait", unit_price: 400, total: 400 }],
    total_ht: 400,
    tva_rate: 20,
    total_ttc: 480,
    issue_date: jour(-25),
    due_date: jour(5),
    type_code: "380",
    invoice_type: "standard",
    payment_terms: "30 jours net",
    status: "sent",
  }),
});
const id = creee.body?.invoice?.id;
verifier("une facture de services est créée", Boolean(id), `HTTP ${creee.status}`);
if (!id) process.exit(bilan());

await appel(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
const emise = await appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" });
verifier(
  "elle est transmise à la Plateforme Agréée",
  emise.status === 200 && Boolean(emise.body?.superpdpId),
  `HTTP ${emise.status} ${JSON.stringify(emise.body).slice(0, 200)}`,
);
if (!emise.body?.superpdpId) process.exit(bilan());

// ── Le geste réel de l'écran : « payée », avec sa date ─────────────────────
const marquee = await appel(`/api/invoices/${id}`, {
  method: "PATCH",
  body: JSON.stringify({ status: "paid", paid_at: PAYEE_LE }),
});
verifier(
  "« Marquer comme payée » avec une date est acceptée",
  marquee.status === 200 && marquee.body?.invoice?.status === "paid",
  `HTTP ${marquee.status} ${JSON.stringify(marquee.body?.error ?? "").slice(0, 200)}`,
);

verifier(
  "la date de paiement est conservée telle quelle",
  marquee.body?.invoice?.paid_at === PAYEE_LE,
  `paid_at = ${marquee.body?.invoice?.paid_at} attendu ${PAYEE_LE}`,
);

// L'encaissement doit avoir été déclaré dans la foulée, sans second geste :
// c'est la route PATCH qui porte l'obligation, pas le navigateur.
const encaisseAt = marquee.body?.invoice?.superpdp_encaisse_at;
verifier(
  "l'encaissement est déclaré sans avoir à le demander",
  Boolean(encaisseAt),
  `superpdp_encaisse_at = ${encaisseAt ?? "null"} — un fr:212 refusé laisserait ce champ vide`,
);

verifier(
  "et il est daté du paiement, pas du pointage",
  String(encaisseAt ?? "").slice(0, 10) === PAYEE_LE,
  `${String(encaisseAt).slice(0, 10)} contre ${PAYEE_LE} (aujourd'hui : ${AUJOURDHUI})`,
);

// ── Le seul juge qui compte : ce que la plateforme a enregistré ────────────
//
// Notre colonne peut être juste pendant que le message part avec la date du
// jour. On relit donc l'événement chez elle.
await new Promise((r) => setTimeout(r, 3000));
const declaration = await appel(`/api/superpdp/invoices/${id}/declaration`);
const evenements = declaration.body?.evenements ?? [];
const encaissement = evenements.find((e) => e.code === "fr:212");

verifier(
  "la Plateforme Agréée a bien enregistré un événement « Encaissée »",
  Boolean(encaissement),
  `événements : ${evenements.map((e) => e.code).join(", ") || "aucun"}`,
);

const blocs = (encaissement?.details ?? []).flatMap((d) => d.reported_data ?? []);
const men = blocs.find((b) => b.type_code === "MEN");

verifier(
  "l'événement porte un bloc MEN, exigé par BR-FR-CDV-14",
  Boolean(men),
  `blocs : ${JSON.stringify(blocs).slice(0, 300)}`,
);

verifier(
  "et ce bloc porte la date du paiement réel",
  men?.date === PAYEE_LE,
  `date déclarée = ${men?.date ?? "aucune"} attendu ${PAYEE_LE}`,
);

// Le montant encaissé net est le TTC, pas le HT — vérifié le 02/09/2026 sur un
// bloc que la plateforme avait construit elle-même. On le réaffirme ici, parce
// que c'est contre-intuitif et que personne ne le redécouvrira à la lecture.
verifier(
  "le montant déclaré est le TTC encaissé",
  Number(men?.amount) === 480,
  `amount = ${men?.amount} attendu 480 (400 HT + 20 %)`,
);

verifier(
  "avec le taux de TVA applicable",
  Number(men?.value_percent) === 20,
  `value_percent = ${men?.value_percent}`,
);

// ── Contre-épreuve : sans date, rien n'est inventé ─────────────────────────
//
// Une facture pointée sans date connue doit laisser la plateforme dater
// elle-même. Si Deviso inscrivait une date arbitraire, ce serait pire que de
// ne rien dire : une déclaration fausse a l'air d'une déclaration juste.
const sansDate = await appel("/api/invoices", {
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
    items: [{ description: "Pointée sans date", quantity: 1, unit: "forfait", unit_price: 100, total: 100 }],
    total_ht: 100,
    tva_rate: 20,
    total_ttc: 120,
    issue_date: jour(-3),
    due_date: jour(27),
    type_code: "380",
    invoice_type: "standard",
    status: "sent",
  }),
});
const idSansDate = sansDate.body?.invoice?.id;
if (idSansDate) {
  await appel(`/api/invoices/${idSansDate}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
  const em = await appel(`/api/superpdp/invoices/${idSansDate}/emettre`, { method: "POST" });
  if (em.status === 200) {
    const m = await appel(`/api/invoices/${idSansDate}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "paid" }),
    });
    verifier(
      "sans date saisie, l'encaissement part quand même",
      Boolean(m.body?.invoice?.superpdp_encaisse_at),
      `superpdp_encaisse_at = ${m.body?.invoice?.superpdp_encaisse_at ?? "null"}`,
    );
    verifier(
      "et il est daté du jour, sans qu'aucune date ait été inventée",
      !m.body?.invoice?.paid_at &&
        String(m.body?.invoice?.superpdp_encaisse_at ?? "").slice(0, 10) === AUJOURDHUI,
      `paid_at = ${m.body?.invoice?.paid_at ?? "null"}, encaissé le ${String(m.body?.invoice?.superpdp_encaisse_at).slice(0, 10)}`,
    );
    console.log(`   Facture de test conservée (transmise) : ${idSansDate}`);
  }
}

console.log("");
console.log(`   Facture de test conservée (transmise et encaissée) : ${id}`);

process.exit(bilan());
