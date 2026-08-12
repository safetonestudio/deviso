import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { toSiren } from "@/lib/facturx-helpers";
import {
  SUPERPDP_HOST,
  companyNumberScheme,
  createPkcePair,
  createState,
  superpdpConfig,
} from "@/lib/superpdp";

/**
 * Démarre le raccordement de l'utilisateur à Super PDP (OAuth 2.1, flow
 * « authorization code » + PKCE).
 *
 * `state` et le vérificateur PKCE sont posés dans des cookies httpOnly plutôt
 * qu'en base : ils ne vivent que le temps de l'aller-retour, et le cookie sert
 * lui-même de preuve d'origine au retour (double-submit).
 */
export async function GET() {
  const cfg = superpdpConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Le raccordement à la Plateforme Agréée n'est pas encore activé." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Le raccordement appartient à l'entreprise, pas au collaborateur : un membre
  // d'équipe connecte le compte du propriétaire de l'espace de travail.
  const workspaceId = await getWorkspaceUserId(user.id);

  const profile = await getWorkspaceProfile<{ siret: string | null; company_name: string | null }>(
    workspaceId,
    "siret, company_name"
  );

  const siren = toSiren(profile?.siret ?? null);

  const state = createState();
  const { verifier, challenge } = createPkcePair();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  // Pré-remplissage du tunnel d'inscription : évite à l'utilisateur de ressaisir
  // ce que nous connaissons déjà. Ignoré si Super PDP ne reconnaît pas le paramètre.
  if (siren) {
    params.set("company_number", siren);
    params.set("company_number_scheme", companyNumberScheme());
  }
  if (profile?.company_name) params.set("company_name", profile.company_name);

  const res = NextResponse.redirect(`${SUPERPDP_HOST}/oauth2/authorize?${params}`);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/superpdp",
    maxAge: 600, // 10 minutes : le temps du tunnel d'inscription
  };
  res.cookies.set("superpdp_state", state, cookieOpts);
  res.cookies.set("superpdp_verifier", verifier, cookieOpts);
  res.cookies.set("superpdp_uid", workspaceId, cookieOpts);

  return res;
}
