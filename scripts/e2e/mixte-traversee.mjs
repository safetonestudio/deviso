/**
 * Facture mixte, traversée par les VRAIES routes du serveur local, au bac à
 * sable Super PDP, compte de test superpdp-test@getdeviso.fr uniquement.
 *
 *   création → /emettre → Super PDP → « payée » avec sa date → fr:212 relu
 *   CHEZ LA PLATEFORME : le montant encaissé doit être la part prestations.
 *
 * Plus le refus, avant envoi, d'une facture mixte à un particulier.
 * Contexte : docs/superpdp/factures-mixtes.md.
 *
 * Lancer : E2E_BASE_URL=http://localhost:3107 node scripts/e2e/mixte-traversee.mjs
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";

if (!/localhost|127\.0\.0\.1/.test(BASE)) {
  console.error("Refus : ce test vise le serveur LOCAL raccordé au bac à sable.");
  process.exit(1);
}

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";
const SIREN_PARTAGE = "315143296";
const ADRESSE_TRICATEL = "0225:315143296_57700";

const r = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  body: JSON.stringify({ email: "superpdp-test@getdeviso.fr", password: secret("E2E_SUPERPDP_PASSWORD") }),
});
if (!r.ok) throw new Error(`Connexion impossible : HTTP ${r.status}`);
const t = await r.json();
const cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify({
  access_token: t.access_token, refresh_token: t.refresh_token, token_type: "bearer",
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
})).toString("base64")}`;

async function appel(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
    redirect: "manual",
  });
  const texte = await res.text();
  try { return { status: res.status, body: JSON.parse(texte) }; } catch { return { status: res.status, body: texte.slice(0, 400) }; }
}
const jour = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const PAYEE_LE = jour(-3);

const lignes = [
  { description: "Tirage d'art 60x90 encadré", quantity: 2, unit: "unité", unit_price: 300, total: 600, nature: "goods" },
  { description: "Prise de vue en studio (demi-journée)", quantity: 1, unit: "forfait", unit_price: 400, total: 400, nature: "services" },
];
const vendeur = {
  seller_company: "Atelier Lumière", seller_siren: SIREN_PARTAGE,
  seller_street: "12 rue des Arts", seller_postcode: "33000", seller_city: "Bordeaux",
};
const corps = (client) => ({
  ...vendeur, ...client, operation_category: "mixed", items: lignes,
  total_ht: 1000, tva_rate: 20, total_ttc: 1200,
  issue_date: jour(-5), due_date: jour(25), type_code: "380", invoice_type: "standard",
  payment_terms: "30 jours net", status: "sent",
});

console.log("\n── Facture mixte entre entreprises : transmise, encaissement = prestations");
const creee = await appel("/api/invoices", { method: "POST", body: JSON.stringify(corps({
  client_directory_address: ADRESSE_TRICATEL, client_name: "Tricatel", client_company: "Tricatel",
  client_siren: SIREN_PARTAGE, client_street: "Avenue de la République", client_postcode: "37170",
  client_city: "Chambray-lès-Tours", client_country: "FR",
})) });
const id = creee.body?.invoice?.id;
verifier("créée, catégorie déduite « mixed »", Boolean(id) && creee.body?.invoice?.operation_category === "mixed", `HTTP ${creee.status} ${creee.body?.invoice?.operation_category}`);
if (!id) process.exit(bilan());
await appel(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });

const emise = await appel(`/api/superpdp/invoices/${id}/emettre`, { method: "POST" });
verifier("transmise par /emettre (le pré-contrôle la laisse partir)", emise.status === 200 && Boolean(emise.body?.superpdpId), `HTTP ${emise.status} ${JSON.stringify(emise.body).slice(0, 300)}`);
if (!emise.body?.superpdpId) process.exit(bilan());

// Fin de l'ingestion avant de pointer le paiement (CLAUDE.md : la plateforme
// refuse tout événement tant qu'elle n'a posé que api:uploaded).
const codesDe = async () => ((await appel(`/api/superpdp/invoices/${id}/declaration`)).body?.evenements ?? []).map((e) => e.code);
let codes = [];
for (let i = 0; i < 15; i++) {
  codes = await codesDe();
  if (codes.some((c) => c !== "api:uploaded")) break;
  await new Promise((r) => setTimeout(r, 8000));
}
verifier("acceptée par la plateforme : « Déposée » (fr:200)", codes.includes("fr:200"), codes.join(", "));

const payee = await appel(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "paid", paid_at: PAYEE_LE }) });
verifier("« Marquer comme payée » avec sa date", payee.status === 200 && Boolean(payee.body?.invoice?.superpdp_encaisse_at), `HTTP ${payee.status} encaisse_at=${payee.body?.invoice?.superpdp_encaisse_at}`);

await new Promise((r) => setTimeout(r, 3000));
const decl = await appel(`/api/superpdp/invoices/${id}/declaration`);
const enc = (decl.body?.evenements ?? []).find((e) => e.code === "fr:212");
const men = (enc?.details ?? []).flatMap((d) => d.reported_data ?? []).filter((b) => b.type_code === "MEN");
const total = men.reduce((s, b) => s + Number(b.amount), 0);
verifier("relu chez Super PDP : fr:212 de 480 € (prestations), pas 1 200 €", men.length === 1 && Math.abs(total - 480) < 0.005, JSON.stringify(men));
verifier("daté du paiement réel", men[0]?.date === PAYEE_LE, `${men[0]?.date} attendu ${PAYEE_LE}`);

// L'acheminement (fr:203 « Mise à disposition ») arrive en général en une
// seconde, mais le bac à sable l'a déjà fait attendre plusieurs minutes
// (26/11/2026) : on le juge en dernier, avec cinq minutes de patience.
for (let i = 0; i < 30 && !codes.includes("fr:203"); i++) {
  codes = await codesDe();
  if (!codes.includes("fr:203")) await new Promise((r) => setTimeout(r, 10000));
}
verifier("acheminée : « Mise à disposition » (fr:203) posée par la plateforme", codes.includes("fr:203"), codes.join(", "));

console.log("\n── Facture mixte à un particulier : refusée avant l'envoi");
const b2c = await appel("/api/invoices", { method: "POST", body: JSON.stringify(corps({
  client_name: "Jeanne Martin", client_email: "jeanne.martin.e2e@example.fr",
  client_street: "8 cours de l'Intendance", client_postcode: "33000", client_city: "Bordeaux", client_country: "FR",
})) });
const idB2c = b2c.body?.invoice?.id;
if (idB2c) {
  await appel(`/api/invoices/${idB2c}`, { method: "PATCH", body: JSON.stringify({ status: "sent" }) });
  const refus = await appel(`/api/superpdp/invoices/${idB2c}/emettre`, { method: "POST" });
  verifier("refus 400 « une facture par nature », rien n'est parti", refus.status === 400 && /facture par nature/.test(refus.body?.message ?? "") && /particulier/.test(refus.body?.message ?? ""), `HTTP ${refus.status} ${refus.body?.message}`);
  await appel(`/api/invoices/${idB2c}`, { method: "DELETE" });
} else {
  verifier("facture B2C mixte créée", false, `HTTP ${b2c.status}`);
}

console.log(`\n   Facture mixte transmise au bac à sable (conservée) : ${id}`);
process.exit(bilan());
