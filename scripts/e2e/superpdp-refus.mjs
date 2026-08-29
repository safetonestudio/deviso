/**
 * Le refus d'une facture reçue (fr:210), de bout en bout.
 *
 * Pourquoi ce fichier est séparé de superpdp.mjs. Refuser exige d'être le
 * DESTINATAIRE, et la traversée principale n'a de session que sur le compte
 * émetteur. J'avais classé ce cas « non couvert » en invoquant le caractère
 * définitif de l'acte. Selim a eu raison de refuser cette réponse : on est sur
 * un bac à sable, et un statut que la DGFiP classe **obligatoire** (tableau 8
 * du dossier de spécifications externes, v3.2) ne peut pas rester non testé
 * parce que le tester demande un montage.
 *
 * Montage essayé et écarté : faire qu'une entreprise s'adresse une facture à
 * elle-même, pour tenir les deux bouts avec une seule session. La Plateforme
 * Agréée la **rejette** (`fr:213`) — vérifié le 29/08/2026 sur la facture
 * 375540. Une facture dont l'émetteur est le destinataire n'existe pas pour
 * elle, et c'est cohérent.
 *
 * Ce script travaille donc sur une facture **réellement reçue** par le compte
 * dont il ouvre la session. Les garde-fous (motif hors nomenclature, refus
 * d'une sortante, facture d'autrui) se vérifient dans tous les cas ; le refus
 * abouti n'a lieu que si le compte a une entrante refusable, et le script le
 * dit franchement plutôt que d'échouer sur une condition qu'il ne maîtrise pas.
 *
 * Usage : node scripts/e2e/superpdp-refus.mjs
 */
import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";

/**
 * Sur quel compte ouvrir la session.
 *
 * Par défaut Burger Queen, qui n'émet que : les garde-fous s'y vérifient, pas
 * le refus abouti. Pour éprouver le refus il faut un compte DESTINATAIRE, donc
 * un compte qui a reçu au moins une facture.
 *
 * `E2E_REFUS_EMAIL` / `E2E_REFUS_PASSWORD` dans .env.local (ignoré par git)
 * suffisent à fermer la boucle définitivement, y compris dans `npm run verify`.
 * Rien n'oblige à les renseigner : sans eux le script fait ce qu'il peut et
 * dit clairement ce qu'il n'a pas pu faire.
 */
const COMPTE = process.env.E2E_REFUS_EMAIL
  ? { email: process.env.E2E_REFUS_EMAIL, password: secret("E2E_REFUS_PASSWORD") }
  : (() => {
      try {
        return { email: secret("E2E_REFUS_EMAIL"), password: secret("E2E_REFUS_PASSWORD") };
      } catch {
        return { email: "superpdp-test@getdeviso.fr", password: secret("E2E_SUPERPDP_PASSWORD") };
      }
    })();
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
const appel = await signIn(COMPTE);

console.log("");
console.log("── Refus d'une facture reçue (fr:210) ────────────────────────");
console.log(`   base : ${BASE}`);
console.log(`   compte : ${COMPTE.email}`);
console.log("");

// On synchronise d'abord : le refus porte sur ce que la plateforme nous a remis.
await appel("/api/superpdp/sync", { method: "POST", body: doc({ explicite: true }) });

const inventaire = await appel("/api/superpdp/factures-recues");
verifier(
  "les factures reçues sont lisibles par programme",
  inventaire.status === 200 && Array.isArray(inventaire.body?.factures),
  `HTTP ${inventaire.status} ${doc(inventaire.body).slice(0, 200)}`
);

const entrantes = inventaire.body?.factures ?? [];
const cible = entrantes.find((f) => f.last_status_code !== "fr:210");

// ── Garde-fous ───────────────────────────────────────────────────────────────
// Ils ne dépendent pas d'une entrante disponible : ils protègent la route
// elle-même, et c'est justement quand ils cèdent qu'on refuse la facture d'un
// autre. On les éprouve donc systématiquement.
const idSortante = await (async () => {
  const r = await appel("/api/invoices");
  const f = (r.body?.invoices ?? []).find((x) => x.superpdp_invoice_id);
  return f?.superpdp_invoice_id ?? null;
})();

if (idSortante) {
  const surSortante = await appel(`/api/superpdp/invoices/${idSortante}/refuser`, {
    method: "POST", body: doc({ motif: "DOUBLON" }),
  });
  verifier(
    "on ne peut pas refuser une facture qu'on a soi-même émise",
    surSortante.status === 400 && /Sens invalide/.test(doc(surSortante.body)),
    `HTTP ${surSortante.status} ${doc(surSortante.body).slice(0, 200)}`
  );

  const motifInvalide = await appel(`/api/superpdp/invoices/${idSortante}/refuser`, {
    method: "POST", body: doc({ motif: "PARCE_QUE" }),
  });
  verifier(
    "un motif hors nomenclature est refusé avant tout appel à la plateforme",
    motifInvalide.status === 400 && /Motif invalide/.test(doc(motifInvalide.body)),
    `HTTP ${motifInvalide.status} ${doc(motifInvalide.body).slice(0, 160)}`
  );
}

const inconnue = await appel("/api/superpdp/invoices/999999999/refuser", {
  method: "POST", body: doc({ motif: "DOUBLON" }),
});
verifier(
  "refuser la facture d'un autre espace renvoie introuvable, pas une fuite",
  inconnue.status === 404,
  `HTTP ${inconnue.status} ${doc(inconnue.body).slice(0, 160)}`
);

// ── Le refus lui-même ────────────────────────────────────────────────────────
if (!cible) {
  console.log("");
  console.log("   Aucune facture reçue refusable sur ce compte : le refus abouti");
  console.log("   n'est pas éprouvé ici. Lancez ce script depuis un compte qui a");
  console.log("   reçu au moins une facture — les garde-fous ci-dessus, eux, le sont.");
  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
}

const refus = await appel(`/api/superpdp/invoices/${cible.id}/refuser`, {
  method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }),
});
verifier(
  "la facture reçue est refusée auprès de la Plateforme Agréée (fr:210)",
  refus.status === 200 && refus.body?.refusee === true,
  `HTTP ${refus.status} ${doc(refus.body).slice(0, 250)}`
);

// Un second refus ne doit pas produire un second événement : le cycle de vie
// n'accepte pas deux fois le même statut, et rien ne prévoit d'annuler un refus.
const refusBis = await appel(`/api/superpdp/invoices/${cible.id}/refuser`, {
  method: "POST", body: doc({ motif: "MONTANTTOTAL_ERR" }),
});
verifier(
  "un second refus est reconnu comme déjà fait, sans nouvel événement",
  refusBis.status === 200 && refusBis.body?.dejaRefusee === true,
  `HTTP ${refusBis.status} ${doc(refusBis.body).slice(0, 200)}`
);

// Et il doit se voir : c'est la seule preuve que l'utilisateur en aura.
const apres = await appel("/api/superpdp/factures-recues");
const ligne = (apres.body?.factures ?? []).find((f) => f.id === cible.id);
verifier(
  "le refus est visible sur la facture reçue",
  ligne?.last_status_code === "fr:210",
  `statut affiché : ${ligne?.last_status_code}`
);

console.log("");
console.log(`   facture refusée : ${cible.number ?? cible.id} de ${cible.seller_name ?? "?"} (Super PDP ${cible.id})`);
console.log("");
process.exit(bilan() > 0 ? 1 : 0);
