import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { toSiren } from "@/lib/facturx-helpers";
import {
  SUPERPDP_HOST,
  companyNumberScheme,
  createPkcePair,
  createState,
  superpdpConfig,
} from "@/lib/superpdp";
import { construireParamsAutorisation } from "@/lib/superpdp-authorize";
import { estCompteDemo, MESSAGE_DEMO_TIERS } from "@/lib/garde-demo";

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
  // Aucun dépôt chez un tiers depuis un compte de démonstration. Voir
  // lib/garde-demo.ts : PISTE et la Plateforme Agréée sont en production, et le
  // jeu de données de démonstration contient de vrais destinataires, dont une
  // facture B2G adressée au SIREN d'une commune réelle.
  if (await estCompteDemo(user.id)) {
    return NextResponse.json({ error: "DEMO", message: MESSAGE_DEMO_TIERS }, { status: 403 });
  }

  // Le raccordement appartient à l'entreprise, pas au collaborateur : un membre
  // d'équipe connecte le compte du propriétaire de l'espace de travail.
  const workspaceId = await getWorkspaceUserId(user.id);

  // Le raccordement à la Plateforme Agréée engage l'entreprise (jeton d'un an,
  // SIREN émetteur) : titulaire seul. Un membre ne relie pas, et ne peut donc
  // pas écraser, le compte PA de l'espace.
  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;

  const profile = await getWorkspaceProfile<{ siret: string | null; email: string | null }>(
    workspaceId,
    "siret, email"
  );

  const siren = toSiren(profile?.siret ?? null);

  const state = createState();
  const { verifier, challenge } = createPkcePair();

  // Tous les paramètres de l'URL d'autorisation sont construits par une
  // fonction pure (lib/superpdp-authorize.ts), source UNIQUE testée par
  // check:superpdp-connect. Elle tient par construction l'invariant appris en
  // prod le 07/10 : superpdp_directory_entry_identifier ne part jamais sans
  // superpdp_company_number, sinon Super PDP refuse tout le tunnel.
  //
  // Le pré-remplissage de l'entreprise reste désactivé par défaut : envoyer un
  // numéro que Super PDP ne connaît pas encore (tout nouvel inscrit) interrompt
  // le tunnel (« No company found... ») au lieu de l'ignorer. Mieux vaut que
  // l'utilisateur saisisse son SIREN dans le tunnel. Activable par
  // SUPERPDP_PREFILL_COMPANY=true une fois ce chemin confirmé en réel. Noms de
  // paramètres (préfixe superpdp_) et superpdp_send_and_receive=receive vérifiés
  // dans la documentation « Authentification » (12/08 et 30/08/2026).
  const params = construireParamsAutorisation({
    clientId: cfg.clientId,
    redirectUri: cfg.redirectUri,
    state,
    challenge,
    siren,
    scheme: companyNumberScheme(),
    prefillCompany: process.env.SUPERPDP_PREFILL_COMPANY === "true",
    email: profile?.email ?? null,
  });

  const res = NextResponse.redirect(`${SUPERPDP_HOST}/oauth2/authorize?${params}`);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/superpdp",
    // 30 minutes. Le tunnel d'inscription Super PDP comporte cinq étapes, dont
    // une vérification d'adresse e-mail et une vérification d'identité : dix
    // minutes ne suffisent pas à un premier raccordement mené normalement, et
    // l'utilisateur revenait sur un « la demande a expiré » sans comprendre ce
    // qu'il avait fait de travers. Allonger la fenêtre ne coûte rien en
    // sécurité : le `state` est à usage unique, le cookie est httpOnly, et il
    // est effacé au retour du tunnel, quelle qu'en soit l'issue.
    maxAge: 1800,
  };
  res.cookies.set("superpdp_state", state, cookieOpts);
  res.cookies.set("superpdp_verifier", verifier, cookieOpts);
  res.cookies.set("superpdp_uid", workspaceId, cookieOpts);

  return res;
}
