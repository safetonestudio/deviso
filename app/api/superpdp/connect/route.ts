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
  //
  // ⚠️ Le pré-remplissage de l'entreprise est **désactivé par défaut**, et ce
  // n'est pas de la prudence de principe. Testé le 12/08/2026 : envoyer un
  // numéro qui ne correspond à aucune entreprise connue de Super PDP ne se
  // contente pas d'ignorer le paramètre, cela **interrompt tout le tunnel** —
  // « No company found with these superpdp_company_number_scheme and
  // superpdp_company_number ». En bac à sable c'est systématique, puisque les
  // entreprises y sont fictives et ne portent pas de vrai SIREN.
  //
  // En production le risque reste entier pour toute entreprise que Super PDP ne
  // connaît pas encore, c'est-à-dire tout nouvel utilisateur. Or le principe
  // retenu sur ce projet est qu'aucun élément ne doit bloquer : mieux vaut que
  // l'utilisateur saisisse son SIREN dans le tunnel que de le voir buter sur un
  // message d'erreur en anglais. Le confort d'un champ pré-rempli ne vaut pas
  // ce risque.
  //
  // Activable par `SUPERPDP_PREFILL_COMPANY=true` pour tester ce chemin une fois
  // qu'on aura confirmé son comportement en réel auprès de Super PDP.
  if (siren && process.env.SUPERPDP_PREFILL_COMPANY === "true") {
    params.set("superpdp_company_number", siren);
    params.set("superpdp_company_number_scheme", companyNumberScheme());
  }

  // L'adresse qui sera créée si l'utilisateur active la réception.
  //
  // Envoyé indépendamment du pré-remplissage de l'entreprise : la
  // documentation « Authentification » le décrit seul — « pour les entreprises
  // fr_siren il est possible de configurer l'adresse de facturation
  // électronique qui sera créée dans le cas où l'utilisateur active la
  // réception des factures ». Il ne porte donc pas le risque de blocage du
  // couple `superpdp_company_number` / `_scheme`, et il rend prévisible
  // l'adresse ouverte : le SIREN nu, celui que `lireLigneAnnuaire` attend et
  // que la documentation « Annuaire » conseille à tout le monde.
  if (siren && companyNumberScheme() === "fr_siren") {
    params.set("superpdp_directory_entry_identifier", siren);
  }

  // `login_hint` ne pré-remplit qu'un champ texte : aucun risque de blocage.
  if (profile?.email) params.set("login_hint", profile.email);

  // Le point décisif pour nous. Sans ce paramètre l'interface laisse le choix
  // d'ouvrir ou non une ligne d'annuaire — or « pour recevoir une facture, il
  // faut avoir ouvert une ligne d'annuaire ». Un utilisateur qui passe outre
  // croirait être raccordé tout en restant incapable de recevoir, c'est-à-dire
  // hors de l'obligation du 1ᵉʳ septembre 2026. On force donc la réception,
  // puisque c'est l'objet même du raccordement proposé dans Deviso.
  //
  // Paramètre **documenté**, section « Authentification » : `any` (défaut)
  // laisse le choix, `send` masque la réception, `receive` « force
  // l'utilisateur à accepter l'enregistrement d'une ligne dans l'annuaire ».
  // Un audit l'avait signalé comme absent de la référence OpenAPI — il l'est,
  // mais il figure bien dans la documentation. Vérifié le 30/08/2026.
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
