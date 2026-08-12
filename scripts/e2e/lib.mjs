/**
 * Socle des traversées de bout en bout.
 *
 * Pourquoi ce fichier existe. Les audits précédents lisaient du code et
 * concluaient « 46 routes protégées » — ce qui voulait dire qu'elles refusent un
 * anonyme, jamais qu'elles acceptent le bon utilisateur. Onze routes renvoyaient
 * 404 à tout membre d'équipe et aucun audit ne l'a vu, parce qu'aucun audit
 * n'avait jamais ouvert une session de membre d'équipe.
 *
 * Ce socle rend cette session triviale à obtenir, pour qu'il n'y ait plus
 * d'excuse à ne pas la tester.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

export const BASE = process.env.E2E_BASE_URL || "https://getdeviso.fr";
const PROJECT_REF = "mjhsafxzbufpughtxhnw";

/**
 * Les comptes de démonstration sont limités à dix par heure et par adresse IP —
 * garde-fou légitime contre l'abus. La suite en consomme deux par exécution et
 * se retrouvait bloquée au bout de cinq lancements. On réutilise donc les
 * sessions tant qu'elles vivent, ce qui rend aussi la suite nettement plus rapide.
 */
const CACHE = new URL("./.sessions.json", import.meta.url);
const lireCache = () => (existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {});
const ecrireCache = (o) => writeFileSync(CACHE, JSON.stringify(o, null, 2));

/**
 * Le cookie de session attendu par @supabase/ssr : `base64-` suivi du JSON de
 * session encodé. C'est la clé qui permet d'appeler n'importe quelle route
 * authentifiée depuis un script — la recette a coûté du temps à retrouver.
 */
function cookieFor(tokens) {
  const session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  return `sb-${PROJECT_REF}-auth-token=${value}`;
}

/** Ouvre une session de démonstration (plan Pro) et renvoie un client HTTP. */
export async function openSession(label) {
  const cache = lireCache();
  let tokens = cache[label];

  if (!tokens) {
    const res = await fetch(`${BASE}/api/demo/start`, { method: "POST" });
    if (res.status === 429) {
      throw new Error(
        `Limite de comptes de démonstration atteinte (10/h par IP). ` +
          `Attendez, ou supprimez scripts/e2e/.sessions.json pour repartir de zéro.`
      );
    }
    if (!res.ok) throw new Error(`Création de session « ${label} » impossible : HTTP ${res.status}`);
    tokens = await res.json();
    cache[label] = tokens;
    ecrireCache(cache);
  }

  const cookie = cookieFor(tokens);

  const call = async (path, init = {}) => {
    const r = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        cookie,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
      redirect: "manual",
    });
    let body = null;
    const text = await r.text();
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return { status: r.status, body };
  };

  const me = await call("/api/profile");
  if (me.status !== 200) {
    // Le compte a expiré (purge à 2 h) : on vide le cache et on recommence.
    const c = lireCache();
    delete c[label];
    ecrireCache(c);
    return openSession(label);
  }

  // `cookie` est exposé pour les téléchargements binaires : `call` lit la réponse
  // en texte, ce qui corromprait un PDF.
  return { label, call, cookie, userId: me.body.profile.id, email: me.body.profile.email };
}

/** Session anonyme, pour vérifier que les routes refusent bien ce qu'elles doivent refuser. */
export const anonymous = {
  label: "anonyme",
  call: async (path, init = {}) => {
    const r = await fetch(`${BASE}${path}`, { ...init, redirect: "manual" });
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 120); }
    return { status: r.status, body };
  },
};

/**
 * Rattache `member` à l'espace de `owner` en empruntant le **vrai** tunnel
 * d'invitation, pas un raccourci en base.
 *
 * C'est délibéré : écrire directement dans `team_members` aurait testé une
 * situation que le produit ne sait peut-être pas créer. Ici, si l'invitation ou
 * son acceptation est cassée, la suite le dit.
 */
export async function linkAsTeamMember(owner, member) {
  // Les sessions étant réutilisées d'une exécution à l'autre, le rattachement
  // peut déjà exister. On ne le refait pas : réinviter réinitialiserait le jeton.
  const equipe = await owner.call("/api/team");
  const deja = (equipe.body?.members ?? []).some(
    (m) => m.member_id === member.userId && m.status === "active"
  );
  if (deja) return { deja: true };

  const invite = await owner.call("/api/team", {
    method: "POST",
    body: JSON.stringify({ email: member.email }),
  });
  if (invite.status !== 200 || !invite.body?.inviteUrl) {
    throw new Error(`Invitation impossible : HTTP ${invite.status} ${JSON.stringify(invite.body)}`);
  }

  const token = invite.body.inviteUrl.split("/join/")[1];
  const accept = await member.call(`/api/team/accept/${token}`);
  // La route d'acceptation redirige vers le tableau de bord ; tout sauf une
  // redirection signale un échec.
  if (accept.status !== 307 && accept.status !== 302) {
    throw new Error(`Acceptation impossible : HTTP ${accept.status}`);
  }
  return invite.body;
}

// ── Restitution ──────────────────────────────────────────────────────────────

const resultats = [];

export function verifier(intitule, condition, detail = "") {
  resultats.push({ intitule, ok: Boolean(condition), detail });
  const marque = condition ? "  ok  " : "ÉCHEC ";
  console.log(`${marque} ${intitule}${detail && !condition ? ` — ${detail}` : ""}`);
}

export function bilan() {
  const echecs = resultats.filter((r) => !r.ok);
  console.log("");
  console.log(`${resultats.length - echecs.length}/${resultats.length} vérifications passées`);
  if (echecs.length) {
    console.log("");
    console.log("Échecs :");
    for (const e of echecs) console.log(`  · ${e.intitule}${e.detail ? ` — ${e.detail}` : ""}`);
  }
  return echecs.length;
}
