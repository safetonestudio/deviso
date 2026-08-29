/**
 * Le refus d'une facture reçue (fr:210), de bout en bout.
 *
 * Pourquoi ce fichier est séparé de superpdp.mjs. Refuser exige d'être le
 * DESTINATAIRE, et la traversée principale n'a de session que sur le compte
 * émetteur. J'avais donc classé ce cas « non couvert », en invoquant le
 * caractère définitif de l'acte. Selim a eu raison de refuser cette réponse :
 * on est sur un bac à sable, et un statut que la DGFiP classe **obligatoire**
 * (tableau 8 du dossier de spécifications externes, v3.2) ne peut pas rester
 * non testé parce que le tester demande un montage.
 *
 * Le montage, justement : Burger Queen s'adresse une facture à elle-même, en
 * visant sa propre adresse d'annuaire. La Plateforme Agréée la lui remet comme
 * une entrante ordinaire ; le même compte peut alors la refuser. On tient les
 * deux bouts avec une seule session.
 *
 * Usage : node scripts/e2e/superpdp-refus.mjs
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

const BURGER_QUEEN = {
  email: "superpdp-test@getdeviso.fr",
  password: secret("E2E_SUPERPDP_PASSWORD"),
};
const SIREN_PARTAGE = "315143296";
/** Adresse d'annuaire de Burger Queen elle-même : l'expéditeur est le destinataire. */
const ADRESSE_SOI_MEME = "0225:315143296_57701";

function cookieFor(t) {
  const session = {
    access_token: t.access_token, refresh_token: t.refresh_token,
    token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  return `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
}

async function signIn(creds) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(creds),
  });
  if (!res.ok) throw new Error(`Connexion impossible : HTTP ${res.status}`);
  const cookie = cookieFor(await res.json());
  return async (path, init = {}) => {
    const r = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { cookie, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
      redirect: "manual",
    });
    const texte = await r.text();
    let body; try { body = JSON.parse(texte); } catch { body = texte.slice(0, 300); }
    return { status: r.status, body };
  };
}

const doc = (o) => JSON.stringify(o);
const jour = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const appel = await signIn(BURGER_QUEEN);

console.log("");
console.log("── Refus d'une facture reçue (fr:210) ────────────────────────");
console.log(`   base : ${BASE}`);
console.log("");

// ── 1. Se faire adresser une facture ─────────────────────────────────────────
const creee = await appel("/api/invoices", {
  method: "POST",
  body: doc({
    seller_company: "Burger Queen", seller_siren: SIREN_PARTAGE,
    seller_street: "809 avenue du Languedoc", seller_postcode: "12100", seller_city: "Millau",
    client_name: "Burger Queen", client_company: "Burger Queen",
    client_siren: SIREN_PARTAGE,
    client_directory_address: ADRESSE_SOI_MEME,
    client_street: "809 avenue du Languedoc", client_postcode: "12100", client_city: "Millau",
    operation_category: "services",
    items: [{ description: "Facture destinée à être refusée", quantity: 1, unit: "forfait", unit_price: 250, total: 250 }],
    total_ht: 250, tva_rate: 20, total_ttc: 300,
    issue_date: jour(0), due_date: jour(30),
    type_code: "380", invoice_type: "standard", payment_terms: "30 jours net",
  }),
});
const idDeviso = creee.body?.invoice?.id;
verifier("facture créée", creee.status === 201, `HTTP ${creee.status} ${doc(creee.body).slice(0, 200)}`);
if (idDeviso) await appel(`/api/invoices/${idDeviso}`, { method: "PATCH", body: doc({ status: "sent" }) });

const emission = idDeviso
  ? await appel(`/api/superpdp/invoices/${idDeviso}/emettre`, { method: "POST" })
  : { status: 0, body: null };
verifier(
  "facture transmise à sa propre adresse d'annuaire",
  emission.status === 200 && Number(emission.body?.superpdpId) > 0,
  `HTTP ${emission.status} ${doc(emission.body).slice(0, 250)}`
);
const idEmise = Number(emission.body?.superpdpId);

// ── 2. La recevoir ───────────────────────────────────────────────────────────
// L'entrante porte un identifiant DIFFÉRENT de la sortante : ce sont deux faces
// du même échange, et c'est celui de l'entrante qu'il faut refuser. Confondre
// les deux donnerait un « Sens invalide » parfaitement mérité.
let idRecue = null;
for (let essai = 1; essai <= 8 && !idRecue; essai++) {
  if (essai > 1) await new Promise((r) => setTimeout(r, 5000));
  await appel("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });
  const liste = await appel("/api/superpdp/factures-recues");
  if (liste.status === 200 && Array.isArray(liste.body?.factures)) {
    // L'entrante est postérieure à la sortante et porte un identifiant distinct.
    idRecue = liste.body.factures.find((f) => f.id > idEmise)?.id ?? null;
  }
}

verifier(
  "la facture émise vers soi-même revient bien comme facture reçue",
  Number.isFinite(idRecue) && idRecue > idEmise,
  `entrante trouvée : ${idRecue} (émise ${idEmise})`
);

// ── 3. Les garde-fous ────────────────────────────────────────────────────────
const motifInvalide = await appel(`/api/superpdp/invoices/${idEmise}/refuser`, {
  method: "POST", body: doc({ motif: "PARCE_QUE" }),
});
verifier(
  "un motif hors nomenclature est refusé",
  motifInvalide.status === 400 && /Motif invalide/.test(doc(motifInvalide.body)),
  `HTTP ${motifInvalide.status} ${doc(motifInvalide.body).slice(0, 160)}`
);

const surSortante = await appel(`/api/superpdp/invoices/${idEmise}/refuser`, {
  method: "POST", body: doc({ motif: "DOUBLON" }),
});
verifier(
  "on ne peut pas refuser une facture qu'on a soi-même émise",
  surSortante.status === 400 && /Sens invalide/.test(doc(surSortante.body)),
  `HTTP ${surSortante.status} ${doc(surSortante.body).slice(0, 200)}`
);

const inconnue = await appel(`/api/superpdp/invoices/999999999/refuser`, {
  method: "POST", body: doc({ motif: "DOUBLON" }),
});
verifier(
  "refuser la facture d'un autre renvoie introuvable, pas une fuite",
  inconnue.status === 404,
  `HTTP ${inconnue.status} ${doc(inconnue.body).slice(0, 160)}`
);

// ── 4. Le refus lui-même ─────────────────────────────────────────────────────
const refus = idRecue
  ? await appel(`/api/superpdp/invoices/${idRecue}/refuser`, { method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }) })
  : { status: 0, body: null };
verifier(
  "la facture reçue est refusée auprès de la Plateforme Agréée (fr:210)",
  refus.status === 200 && refus.body?.refusee === true,
  `HTTP ${refus.status} ${doc(refus.body).slice(0, 250)}`
);

// Un second refus ne doit pas produire un second événement : le cycle de vie
// n'accepte pas deux fois le même statut, et la DGFiP ne prévoit pas de refus
// « annulable ».
const refusBis = idRecue
  ? await appel(`/api/superpdp/invoices/${idRecue}/refuser`, { method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }) })
  : { status: 0, body: null };
verifier(
  "un second refus est reconnu comme déjà fait, sans nouvel événement",
  refusBis.status === 200 && refusBis.body?.dejaRefusee === true,
  `HTTP ${refusBis.status} ${doc(refusBis.body).slice(0, 200)}`
);

// Et le refus doit se voir : c'est la seule preuve que l'utilisateur en aura.
const apres = await appel("/api/superpdp/factures-recues");
const ligne = apres.body?.factures?.find((f) => f.id === idRecue);
verifier(
  "le refus est visible sur la facture reçue",
  ligne?.last_status_code === "fr:210",
  `statut affiché : ${ligne?.last_status_code}`
);

console.log("");
console.log(`   facture Deviso ${idDeviso} · Super PDP émise ${idEmise} · entrante ${idRecue ?? "introuvable"}`);
console.log("");
process.exit(bilan() > 0 ? 1 : 0);
