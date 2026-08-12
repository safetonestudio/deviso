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

  const profile = await getWorkspaceProfile<{ siret: string | null; email: string | null }>(
    workspaceId,
    "siret, email"
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

  // Pré-remplissage du tunnel d'inscription.
  //
  // ⚠️ Les noms de ces paramètres sont préfixés `superpdp_`. La première version
  // envoyait `company_number` / `company_number_scheme` / `company_name` : des
  // paramètres inexistants, donc ignorés en silence. Rien n'aurait signalé
  // l'erreur — le tunnel se serait simplement affiché vide, ce qu'on aurait mis
  // sur le compte du produit et non du code. Noms vérifiés dans la
  // documentation « Authentification » le 12/08/2026.
  if (siren) {
    params.set("superpdp_company_number", siren);
    params.set("superpdp_company_number_scheme", companyNumberScheme());
    // Adresse électronique de facturation créée si l'utilisateur active la
    // réception. La documentation « Annuaire » conseille le SIREN nu, c'est ce
    // que fera la grande majorité des entreprises.
    if (companyNumberScheme() === "fr_siren") {
      params.set("superpdp_directory_entry_identifier", siren);
    }
  }
  if (profile?.email) params.set("login_hint", profile.email);

  // Le point décisif pour nous. Sans ce paramètre l'interface laisse le choix
  // d'ouvrir ou non une ligne d'annuaire — or « pour recevoir une facture, il
  // faut avoir ouvert une ligne d'annuaire ». Un utilisateur qui passe outre
  // croirait être raccordé tout en restant incapable de recevoir, c'est-à-dire
  // hors de l'obligation du 1ᵉʳ septembre 2026. On force donc la réception,
  // puisque c'est l'objet même du raccordement proposé dans Deviso.
  params.set("superpdp_send_and_receive", "receive");

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
