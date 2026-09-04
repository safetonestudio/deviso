/**
 * Fermer une ligne d'annuaire, pour de vrai.
 *
 * Pourquoi cette traversee existe. `DELETE /directory_entries/{id}` etait le
 * seul appel destructeur de toute l'integration, et le seul qu'aucune traversee
 * ne jouait : l'eprouver sur la ligne principale aurait rendu le compte de test
 * INJOIGNABLE, casse toutes les autres traversees, et — en bac a sable — ne
 * l'aurait meme pas restitue a l'identique, puisque la reouverture reconstruit
 * `0225:SIREN` alors que les deux societes de test se distinguent par un
 * suffixe. Le garde-fou etait eprouve, l'appel ne l'etait pas.
 *
 * On ouvre donc une ligne SECONDAIRE — l'annuaire l'autorise explicitement,
 * « toutes les entreprises sont libres de creer autant de lignes qu'elles le
 * souhaitent » — on la ferme, et on verifie que la principale n'a pas bouge.
 *
 * La derniere verification est la plus importante du fichier : si la ligne
 * principale disparaissait, ce test aurait rendu le compte injoignable en
 * pretendant le contraire.
 */

import { verifier, bilan, BASE, secret } from "./lib.mjs";

const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";
const SUFFIXE = "e2efermeture";

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
  const txt = await res.text();
  try { return { status: res.status, body: JSON.parse(txt) }; }
  catch { return { status: res.status, body: txt.slice(0, 300) }; }
}

const listerLignes = async () => (await appel("/api/superpdp/ligne-annuaire")).body?.lignes ?? [];

console.log("");
console.log("── Fermeture d'une ligne d'annuaire, en vrai ──────────────────");
console.log(`   base : ${BASE}`);
console.log("");

// ── L'état de départ, qu'il faudra retrouver intact ────────────────────────
const avant = await listerLignes();
verifier(
  "le compte a au moins une ligne de réception",
  avant.length >= 1,
  `lignes : ${JSON.stringify(avant.map((l) => l.adresse))}`,
);
const principales = avant.filter((l) => !String(l.adresse).endsWith(`_${SUFFIXE}`));
const adressesPrincipales = principales.map((l) => l.adresse).sort();
console.log(`   adresse(s) principale(s) : ${adressesPrincipales.join(", ")}`);

// Ménage d'un passage précédent interrompu, pour que la traversée soit rejouable.
for (const restante of avant.filter((l) => String(l.adresse).endsWith(`_${SUFFIXE}`))) {
  await appel("/api/superpdp/ligne-annuaire", {
    method: "DELETE",
    body: JSON.stringify({ id: restante.id }),
  });
}

// ── Ouverture d'une ligne secondaire ───────────────────────────────────────
const ouverte = await appel("/api/superpdp/ligne-annuaire", {
  method: "POST",
  body: JSON.stringify({ suffixe: SUFFIXE }),
});
verifier(
  "une ligne secondaire peut être ouverte",
  ouverte.status === 200 && ouverte.body?.ouverte === true && !ouverte.body?.dejaOuverte,
  `HTTP ${ouverte.status} ${JSON.stringify(ouverte.body).slice(0, 300)}`,
);

const apresOuverture = await listerLignes();
const secondaire = apresOuverture.find((l) => String(l.adresse).endsWith(`_${SUFFIXE}`));
verifier(
  "elle apparaît dans l'annuaire, avec son suffixe",
  Boolean(secondaire),
  `lignes : ${JSON.stringify(apresOuverture.map((l) => l.adresse))}`,
);
verifier(
  "et l'adresse principale est toujours là",
  principales.every((p) => apresOuverture.some((l) => l.adresse === p.adresse)),
  `avant : ${adressesPrincipales.join(", ")} · après : ${apresOuverture.map((l) => l.adresse).join(", ")}`,
);

if (!secondaire?.id) {
  console.log("   Pas de ligne secondaire : on n'ira pas plus loin.");
  process.exit(bilan());
}

// ── La fermeture, enfin jouée ──────────────────────────────────────────────
const fermee = await appel("/api/superpdp/ligne-annuaire", {
  method: "DELETE",
  body: JSON.stringify({ id: secondaire.id }),
});
verifier(
  "la Plateforme Agréée accepte la fermeture (DELETE /directory_entries/{id})",
  fermee.status === 200 && fermee.body?.fermee === true,
  `HTTP ${fermee.status} ${JSON.stringify(fermee.body).slice(0, 400)}`,
);
verifier(
  "et elle rend l'adresse fermée, pas une autre",
  fermee.body?.adresse === secondaire.adresse,
  `${fermee.body?.adresse} contre ${secondaire.adresse}`,
);

const apresFermeture = await listerLignes();
verifier(
  "la ligne secondaire a réellement disparu de l'annuaire",
  !apresFermeture.some((l) => l.id === secondaire.id),
  `lignes : ${JSON.stringify(apresFermeture.map((l) => l.adresse))}`,
);

// ── LA vérification qui compte ─────────────────────────────────────────────
//
// Si elle échoue, cette traversée vient de rendre le compte injoignable.
verifier(
  "l'adresse principale est INTACTE — le compte reste joignable",
  principales.every((p) => apresFermeture.some((l) => l.adresse === p.adresse)),
  `avant : ${adressesPrincipales.join(", ")} · après : ${apresFermeture.map((l) => l.adresse).join(", ")}`,
);

// ── Ce qu'on ne doit pas pouvoir faire ─────────────────────────────────────
const reFermeture = await appel("/api/superpdp/ligne-annuaire", {
  method: "DELETE",
  body: JSON.stringify({ id: secondaire.id }),
});
verifier(
  "refermer une ligne déjà fermée répond « aucune ligne », pas une erreur serveur",
  reFermeture.status === 404,
  `HTTP ${reFermeture.status} ${JSON.stringify(reFermeture.body).slice(0, 200)}`,
);

const suffixeInterdit = await appel("/api/superpdp/ligne-annuaire", {
  method: "POST",
  body: JSON.stringify({ suffixe: "avec-tiret-et-accentué" }),
});
verifier(
  "un suffixe hors des règles DGFiP/Peppol est refusé avant tout appel",
  suffixeInterdit.status === 400,
  `HTTP ${suffixeInterdit.status} ${JSON.stringify(suffixeInterdit.body).slice(0, 250)}`,
);

console.log("");
console.log("── Non couvert par ce script ────────────────────────────────");
console.log("  · le refus de fermer pendant une portabilité : reproduire une");
console.log("    migration depuis une autre Plateforme Agréée n'est pas a notre");
console.log("    portee. La regle est eprouvee separement, sans reseau, par");
console.log("    npm run test:fermeture-ligne.");

process.exit(bilan());
