import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client Super PDP — notre Plateforme Agréée pour la facturation électronique.
 *
 * L'hôte est **le même** en bac à sable et en production : c'est le type de
 * compte, côté Super PDP, qui détermine l'environnement. `SUPERPDP_SANDBOX`
 * ne change donc pas l'URL, mais le schéma d'identifiant d'entreprise et les
 * garde-fous qui empêchent d'émettre de vraies factures depuis un compte test.
 */
export const SUPERPDP_HOST = "https://api.superpdp.tech";
export const SUPERPDP_API = `${SUPERPDP_HOST}/v1.beta`;

export const isSandbox = () => process.env.SUPERPDP_SANDBOX === "true";

/** `sandbox` en bac à sable, `fr_siren` en réel. */
export const companyNumberScheme = () => (isSandbox() ? "sandbox" : "fr_siren");

export function superpdpConfig() {
  const clientId = process.env.SUPERPDP_CLIENT_ID;
  const clientSecret = process.env.SUPERPDP_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/superpdp/callback`,
  };
}

// ─────────────────────────── PKCE ───────────────────────────

const b64url = (buf: Buffer) => buf.toString("base64url");

export function createPkcePair() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export const createState = () => b64url(randomBytes(16));

// ──────────────────────── Jetons OAuth ────────────────────────

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Appelle /oauth2/token.
 *
 * On authentifie le client par en-tête Basic (méthode recommandée par la RFC
 * 6749 §2.3.1), avec repli sur les identifiants dans le corps : certaines
 * implémentations n'acceptent que l'une des deux, et rien dans la doc de
 * Super PDP ne tranche.
 */
async function tokenRequest(params: Record<string, string>): Promise<TokenSet> {
  const cfg = superpdpConfig();
  if (!cfg) throw new Error("Super PDP n'est pas configuré (client_id/secret manquants).");

  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");

  const attempt = async (useBasic: boolean) => {
    const body = new URLSearchParams(params);
    if (!useBasic) {
      body.set("client_id", cfg.clientId);
      body.set("client_secret", cfg.clientSecret);
    }
    return fetch(`${SUPERPDP_HOST}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(useBasic ? { Authorization: `Basic ${basic}` } : {}),
      },
      body,
      cache: "no-store",
    });
  };

  let res = await attempt(true);
  if (res.status === 401) res = await attempt(false);

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Super PDP /oauth2/token ${res.status} : ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as TokenSet;
}

export const exchangeCode = (code: string, codeVerifier: string) =>
  tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: superpdpConfig()!.redirectUri,
    code_verifier: codeVerifier,
  });

export const refreshTokens = (refreshToken: string) =>
  tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });

// ────────────────────── Stockage du raccordement ──────────────────────

export interface SuperPdpConnection {
  user_id: string;
  refresh_token: string;
  company_id: string | null;
  directory_id: string | null;
  session_status: "pending" | "verified" | "error";
  last_error: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
  directory_address: string | null;
  last_invoice_id: number | null;
  last_event_id: number | null;
  last_sync_at: string | null;
}

/** Révoque un jeton (RFC 7009). Utilisé au débranchement. */
export async function revokeToken(token: string): Promise<void> {
  const cfg = superpdpConfig();
  if (!cfg) return;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  try {
    await fetch(`${SUPERPDP_HOST}/oauth2/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({ token, token_type_hint: "refresh_token" }),
      cache: "no-store",
    });
  } catch {
    // La révocation est un nettoyage courtois côté Super PDP. Si elle échoue,
    // on efface quand même le raccordement de notre côté : laisser l'utilisateur
    // bloqué sur un débranchement raté serait pire que laisser un jeton orphelin
    // qui expirera de lui-même.
  }
}

export async function getConnection(userId: string): Promise<SuperPdpConnection | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("superpdp_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as SuperPdpConnection) ?? null;
}

export async function saveConnection(
  userId: string,
  patch: Partial<Omit<SuperPdpConnection, "user_id">> & { connected_at?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("superpdp_connections")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw new Error(`Enregistrement du raccordement impossible : ${error.message}`);
}

// ─────────────────────── Appels API authentifiés ───────────────────────

export class SuperPdpNotConnected extends Error {}
/** Super PDP vérifie le rattachement utilisateur/entreprise en différé. */
export class SuperPdpSessionPending extends Error {}

/** Marge avant expiration : on rafraîchit un peu en avance plutôt qu'au ras. */
const MARGE_EXPIRATION_MS = 60_000;

/**
 * Renvoie un jeton d'accès valide, en rafraîchissant seulement si nécessaire.
 *
 * ⚠️ Ne pas revenir à « rafraîchir à chaque appel ». OAuth 2.1 **impose la
 * rotation du refresh token** : l'ancien meurt dès qu'on s'en sert. Rafraîchir
 * systématiquement multiplie donc les occasions de perdre le raccordement pour
 * de bon — deux appels simultanés, ou une coupure entre la réponse de Super PDP
 * et notre écriture en base, et l'utilisateur doit refaire tout le tunnel
 * d'autorisation. Le jeton d'accès vit 30 minutes : on s'en sert.
 */
async function accessTokenValide(conn: SuperPdpConnection): Promise<string> {
  const expiration = conn.access_token_expires_at
    ? new Date(conn.access_token_expires_at).getTime()
    : 0;

  if (conn.access_token && expiration - MARGE_EXPIRATION_MS > Date.now()) {
    return conn.access_token;
  }

  const tokens = await refreshTokens(conn.refresh_token);
  const dureeMs = (tokens.expires_in ?? 1800) * 1000;

  await saveConnection(conn.user_id, {
    // Rotation : on enregistre le nouveau refresh token s'il y en a un. S'il
    // n'y en a pas, on garde l'ancien — l'écraser avec `undefined` couperait
    // le raccordement.
    ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + dureeMs).toISOString(),
  });

  return tokens.access_token;
}

/** Appelle l'API pour le compte d'un utilisateur. */
export async function superpdpFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const conn = await getConnection(userId);
  if (!conn) throw new SuperPdpNotConnected("Compte non raccordé à Super PDP.");

  const accessToken = await accessTokenValide(conn);

  const res = await fetch(`${SUPERPDP_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (res.status === 403) {
    await saveConnection(userId, { session_status: "pending" });
    throw new SuperPdpSessionPending(
      "Super PDP n'a pas encore validé le rattachement de votre compte à votre entreprise. " +
        "Cette vérification est faite par leurs équipes, généralement sous 24 h."
    );
  }

  return res;
}
