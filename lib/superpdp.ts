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

  // Repli sur l'authentification par corps — mais JAMAIS sur un
  // `refresh_token`.
  //
  // Sur un échange de code, un 401 signifie « mauvaise méthode
  // d'authentification » et le second essai est sans risque : le code
  // d'autorisation n'a pas encore été consommé.
  //
  // Sur un rafraîchissement, un 401 signifie le plus souvent « ce jeton est
  // mort ». Rejouer le MÊME refresh token est précisément le geste qui, sous
  // rotation OAuth 2.1, peut faire révoquer toute la famille de jetons — donc
  // transformer une erreur passagère en raccordement définitivement perdu.
  if (res.status === 401 && params.grant_type !== "refresh_token") {
    res = await attempt(false);
  }

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
  /**
   * Numéro d'entreprise **tel que Super PDP l'a enregistré**, et non le SIREN
   * saisi dans le profil. C'est lui que leur vérification de session compare à
   * l'identifiant légal du vendeur (BT-30) au moment de l'émission : un écart
   * fait refuser la facture avec « L'entreprise (X) liée à cette session ne
   * correspond pas au vendeur de la facture (Y) ».
   *
   * En production le schéma est `fr_siren` et ce numéro **est** le SIREN, si
   * bien que s'y fier plutôt qu'au profil est simplement plus juste : c'est ce
   * que la Plateforme Agréée connaît de nous, pas ce que l'utilisateur a tapé.
   */
  company_number: string | null;
  /** `fr_siren` en production, `sandbox` en bac à sable. */
  company_number_scheme: string | null;
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

/**
 * Écrit sur le raccordement.
 *
 * ⚠️ Ne pas remplacer par un `upsert` inconditionnel, c'était le défaut initial.
 * Un `upsert` PostgREST est un `INSERT … ON CONFLICT DO UPDATE` : PostgreSQL
 * valide d'abord l'INSERT, donc une mise à jour partielle — n'écrire que
 * `last_invoice_id`, par exemple — viole les contraintes NOT NULL de
 * `refresh_token`, `session_status` et `connected_at` et échoue **avant même**
 * d'atteindre la résolution de conflit.
 *
 * Constaté en traversée le 12/08/2026 : la première synchronisation a bien
 * enregistré la facture reçue, mais le curseur est resté nul. La conséquence
 * réelle aurait été plus grave qu'un compteur faux — sans curseur, chaque
 * passage recommence depuis la première facture, et au-delà de la borne de
 * pagination on cesse purement et simplement de recevoir les nouvelles. Le
 * même défaut cassait la mise en cache du jeton d'accès, donc tous les appels
 * d'API trente minutes après le raccordement.
 *
 * On distingue donc les deux cas : créer une ligne complète, ou modifier une
 * ligne existante.
 */
export async function saveConnection(
  userId: string,
  patch: Partial<Omit<SuperPdpConnection, "user_id">> & { connected_at?: string }
) {
  const admin = createAdminClient();

  // Un patch qui porte le refresh token est une création (ou un rebranchement) :
  // il contient de quoi satisfaire toutes les colonnes obligatoires.
  const estComplet = typeof patch.refresh_token === "string";

  const { error } = estComplet
    ? await admin
        .from("superpdp_connections")
        .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    : await admin.from("superpdp_connections").update(patch).eq("user_id", userId);

  if (error) throw new Error(`Enregistrement du raccordement impossible : ${error.message}`);
}

// ─────────────────────── Appels API authentifiés ───────────────────────

export class SuperPdpNotConnected extends Error {}
/** Super PDP vérifie le rattachement utilisateur/entreprise en différé. */
export class SuperPdpSessionPending extends Error {}

/**
 * État réel de la session, lu chez Super PDP.
 *
 * ⚠️ Ne pas revenir à déduire cet état d'un 403. C'est ce que faisait
 * `superpdpFetch` : tout refus était interprété comme « vérification en cours »,
 * ce qui confondait deux situations opposées — `needs_review`, où il faut
 * patienter, et `failed`, où il faut refaire le raccordement. Un utilisateur en
 * échec attendait donc indéfiniment un feu vert qui ne viendrait jamais.
 *
 * `GET /oauth2_sessions/me` donne les deux statuts explicitement. On garde
 * l'interception du 403 comme filet — la route de session peut elle-même
 * répondre 403 — mais l'état affiché vient désormais de la source.
 */
export type EtatSession = {
  entreprise: "verified" | "needs_review" | "failed";
  identite?: "verified" | "needs_review" | "failed" | "not_verified";
};

export async function lireEtatSession(userId: string): Promise<EtatSession | null> {
  try {
    const res = await superpdpFetch(userId, "/oauth2_sessions/me");
    if (!res.ok) return null;
    const body = (await res.json()) as {
      company_verification_status?: EtatSession["entreprise"];
      user_identity_verification_status?: EtatSession["identite"];
    };
    if (!body.company_verification_status) return null;
    return {
      entreprise: body.company_verification_status,
      identite: body.user_identity_verification_status,
    };
  } catch {
    // Non raccordé ou session refusée : l'appelant sait déjà le dire.
    return null;
  }
}

/** Traduit l'état Super PDP vers la colonne `session_status` de notre table. */
export function statutDepuisEtat(etat: EtatSession): "verified" | "pending" | "error" {
  if (etat.entreprise === "verified") return "verified";
  if (etat.entreprise === "failed") return "error";
  return "pending";
}

/**
 * Ce qu'il faut dire à l'utilisateur, selon l'état réel de sa session.
 *
 * `user_identity_verification_status` était lu, typé, transporté — et jamais
 * utilisé. Or il change complètement le message : `not_verified` signifie « The
 * user has either not started the process », c'est-à-dire **une action attendue
 * de sa part**. On lui affichait « Super PDP vérifie le rattachement de votre
 * entreprise », ce qui invite précisément à ne rien faire. Un blocage pouvait
 * durer indéfiniment parce qu'on avait dit à la personne d'attendre.
 */
export function messageEtatSession(etat: EtatSession): { texte: string; agir: boolean } {
  if (etat.identite === "not_verified") {
    return {
      texte:
        "Super PDP attend que vous vérifiiez votre identité. Tant que ce n'est pas fait, " +
        "rien ne peut avancer — la vérification se termine sur leur interface.",
      agir: true,
    };
  }
  if (etat.identite === "failed") {
    return {
      texte: "Super PDP n'a pas pu valider votre identité. Contactez leur support.",
      agir: true,
    };
  }
  if (etat.entreprise === "failed") {
    return {
      texte:
        "Super PDP n'a pas pu rattacher votre entreprise à votre compte. " +
        "Ce n'est pas une attente : il faut reprendre le raccordement.",
      agir: true,
    };
  }
  if (etat.entreprise === "verified") {
    return { texte: "Votre entreprise est vérifiée.", agir: false };
  }
  return {
    texte:
      "Super PDP vérifie le rattachement de votre entreprise. " +
      "Cette vérification est faite par leurs équipes, généralement sous 24 h.",
    agir: false,
  };
}

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
async function accessTokenValide(
  conn: SuperPdpConnection,
  /**
   * Faux au second passage. Empêche qu'une lecture concurrente perpétuelle
   * fasse tourner cette fonction sur elle-même : on retente exactement une
   * fois avec le jeton qu'un autre appel vient d'obtenir, jamais davantage.
   */
  peutReessayer = true
): Promise<string> {
  const expiration = conn.access_token_expires_at
    ? new Date(conn.access_token_expires_at).getTime()
    : 0;

  if (conn.access_token && expiration - MARGE_EXPIRATION_MS > Date.now()) {
    return conn.access_token;
  }

  let tokens;
  try {
    tokens = await refreshTokens(conn.refresh_token);
  } catch (err) {
    // Un `invalid_grant` au rafraîchissement veut dire que CE refresh token est
    // mort. Il y a deux façons de mourir, et elles n'ont rien à voir :
    //
    //   - révoqué ou expiré : le raccordement est perdu, il faut refaire le
    //     tunnel ;
    //   - **consommé par un appel concurrent** : sous rotation OAuth 2.1, deux
    //     requêtes qui voient toutes deux un jeton d'accès expiré rafraîchissent
    //     avec le MÊME refresh token ; la première réussit et fait tourner le
    //     jeton, la seconde reçoit `invalid_grant`. Le raccordement est
    //     parfaitement sain — c'est la perdante qui arrive en retard.
    //
    // On les confondait, et on inscrivait `session_status = "error"` dans les
    // deux cas. Conséquence réelle : la tâche horaire et un chargement de page
    // qui se croisent suffisaient à afficher « Votre autorisation n'est plus
    // valide, reconnectez votre entreprise » sur un compte qui fonctionnait,
    // et à faire démonter par l'utilisateur un raccordement intact. C'est le
    // même défaut que le doublon d'émission : une course qu'on n'avait pas vue.
    //
    // Le départage est direct : si le refresh token en base n'est plus celui
    // avec lequel on vient d'échouer, quelqu'un d'autre a rotationné avec
    // succès. On se range derrière lui.
    const detail = err instanceof Error ? err.message : String(err);
    if (/invalid_grant/i.test(detail)) {
      const relu = peutReessayer ? await getConnection(conn.user_id).catch(() => null) : null;
      if (relu && relu.refresh_token !== conn.refresh_token) {
        return accessTokenValide(relu, false);
      }
      await saveConnection(conn.user_id, {
        session_status: "error",
        last_error:
          "Votre autorisation Super PDP n'est plus valide. Reconnectez votre entreprise.",
      }).catch(() => {});
    }
    throw err;
  }

  const dureeMs = (tokens.expires_in ?? 1800) * 1000;

  // Écriture CONDITIONNELLE sur l'ancien refresh token.
  //
  // OAuth 2.1 impose la rotation : l'ancien jeton meurt dès qu'on s'en sert.
  // Rien ne sérialisait deux rafraîchissements concurrents — la tâche horaire
  // et un chargement de page peuvent se croiser, voir tous deux un jeton
  // expiré, et rafraîchir en parallèle avec le MÊME refresh token. Le second
  // reçoit `invalid_grant`, et surtout le perdant écrasait en base le jeton
  // que le gagnant venait d'obtenir : raccordement mort, tunnel à refaire.
  //
  // `WHERE refresh_token = <ancien>` fait que seul le premier écrit. Le second
  // ne touche rien et se contente de son propre jeton d'accès, qui est valide.
  if (tokens.refresh_token) {
    const admin = createAdminClient();
    await admin
      .from("superpdp_connections")
      .update({
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        access_token_expires_at: new Date(Date.now() + dureeMs).toISOString(),
      })
      .eq("user_id", conn.user_id)
      .eq("refresh_token", conn.refresh_token);
  } else {
    // Pas de rotation : on ne met à jour que le jeton d'accès.
    await saveConnection(conn.user_id, {
      access_token: tokens.access_token,
      access_token_expires_at: new Date(Date.now() + dureeMs).toISOString(),
    });
  }

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

  const appel = async (jeton: string) =>
    fetch(`${SUPERPDP_API}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${jeton}`,
      },
      cache: "no-store",
    });

  let res = await appel(await accessTokenValide(conn));

  // 401 : le jeton d'accès a été invalidé côté serveur avant son expiration
  // nominale — révocation, rebranchement, redémarrage de leur côté. Il n'était
  // pas traité : chaque appelant recevait une erreur générique, et l'émission
  // affichait « la Plateforme Agréée a refusé la facture » là où il fallait
  // lire « reconnectez votre compte ». Un seul réessai après rafraîchissement
  // forcé suffit, et il ne peut pas boucler.
  if (res.status === 401) {
    const rafraichi = await getConnection(userId);
    if (rafraichi) {
      const jeton = await accessTokenValide({ ...rafraichi, access_token_expires_at: null });
      res = await appel(jeton);
    }
  }

  if (res.status === 403) {
    // ⚠️ Ne rien écrire ici.
    //
    // La spec produit le MÊME 403 pour `needs_review` (vérification en cours)
    // et pour `failed` (« Support has determined the user is not authorized —
    // Access is blocked »). Écrire `pending` écrasait donc activement le
    // diagnostic que `lireEtatSession` venait d'établir à la source : un
    // utilisateur définitivement refusé lisait « vérification en cours,
    // généralement sous 24 h » pour toujours.
    //
    // Le statut se lit par `GET /oauth2_sessions/me`, et nulle part ailleurs.
    throw new SuperPdpSessionPending(
      "Super PDP n'a pas encore validé le rattachement de votre compte à votre entreprise. " +
        "Cette vérification est faite par leurs équipes, généralement sous 24 h."
    );
  }

  return res;
}
