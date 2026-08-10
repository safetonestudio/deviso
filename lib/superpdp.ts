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

/**
 * Appelle l'API pour le compte d'un utilisateur.
 *
 * On rafraîchit le jeton à chaque appel plutôt que de mettre en cache un access
 * token : les routes sont rares (quelques appels par facture) et cela évite de
 * stocker un second secret. Le refresh token, lui, est valable environ un an.
 */
export async function superpdpFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const conn = await getConnection(userId);
  if (!conn) throw new SuperPdpNotConnected("Compte non raccordé à Super PDP.");

  const tokens = await refreshTokens(conn.refresh_token);

  // Le serveur peut faire tourner le refresh token : on le conserve.
  if (tokens.refresh_token && tokens.refresh_token !== conn.refresh_token) {
    await saveConnection(userId, { refresh_token: tokens.refresh_token });
  }

  const res = await fetch(`${SUPERPDP_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${tokens.access_token}`,
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
