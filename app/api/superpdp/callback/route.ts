import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import {
  SUPERPDP_API,
  exchangeCode,
  saveConnection,
  superpdpConfig,
} from "@/lib/superpdp";

const SETTINGS = "/profil";

function back(req: NextRequest, params: Record<string, string>) {
  const url = new URL(SETTINGS, process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = NextResponse.redirect(url);
  for (const name of ["superpdp_state", "superpdp_verifier", "superpdp_uid"]) {
    res.cookies.set(name, "", { path: "/api/superpdp", maxAge: 0 });
  }
  return res;
}

/** Retour du tunnel d'autorisation Super PDP. */
export async function GET(req: NextRequest) {
  const cfg = superpdpConfig();
  if (!cfg) return back(req, { superpdp: "indisponible" });

  const q = req.nextUrl.searchParams;

  // L'utilisateur a refusé, ou Super PDP a renvoyé une erreur.
  const oauthError = q.get("error");
  if (oauthError) {
    return back(req, {
      superpdp: "erreur",
      detail: q.get("error_description") ?? oauthError,
    });
  }

  const code = q.get("code");
  const state = q.get("state");
  const expectedState = req.cookies.get("superpdp_state")?.value;
  const verifier = req.cookies.get("superpdp_verifier")?.value;
  const cookieUid = req.cookies.get("superpdp_uid")?.value;

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    // State absent ou divergent : requête forgée, ou cookie expiré (>10 min).
    return back(req, { superpdp: "expire" });
  }

  // On revalide la session : le cookie prouve l'origine de la requête, pas
  // l'identité. Sans cela, un lien de callback rejoué raccorderait l'entreprise
  // de la victime au compte Super PDP de l'attaquant.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return back(req, { superpdp: "session_perdue" });

  const workspaceId = await getWorkspaceUserId(user.id);
  if (cookieUid && cookieUid !== workspaceId) {
    return back(req, { superpdp: "erreur", detail: "Compte différent de celui du raccordement." });
  }

  try {
    const tokens = await exchangeCode(code, verifier);
    if (!tokens.refresh_token) {
      throw new Error("Super PDP n'a pas renvoyé de refresh token.");
    }

    // Récupération de l'entreprise raccordée. Un 403 ici est normal : Super PDP
    // vérifie le rattachement utilisateur/entreprise en différé.
    let companyId: string | null = null;
    let status: "pending" | "verified" = "pending";

    const me = await fetch(`${SUPERPDP_API}/companies/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (me.ok) {
      const body = await me.json().catch(() => null);
      companyId = body?.id ?? body?.company?.id ?? null;
      status = "verified";
    }

    await saveConnection(workspaceId, {
      refresh_token: tokens.refresh_token,
      company_id: companyId,
      session_status: status,
      last_error: null,
      connected_at: new Date().toISOString(),
    });

    return back(req, { superpdp: status === "verified" ? "connecte" : "en_attente" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[superpdp/callback]", message);
    return back(req, { superpdp: "erreur", detail: message.slice(0, 200) });
  }
}
