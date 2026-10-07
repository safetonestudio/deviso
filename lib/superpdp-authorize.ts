/**
 * Construction des paramètres de l'URL d'autorisation Super PDP (OAuth 2.1).
 *
 * Source UNIQUE de ces paramètres, volontairement sans aucun import : la route
 * `app/api/superpdp/connect/route.ts` l'appelle, et `scripts/check-superpdp-connect.mjs`
 * l'importe pour prouver l'invariant ci-dessous. Si ces deux usages lisaient
 * deux constructions différentes, le garde ne garderait rien.
 *
 * L'INVARIANT, appris en prod le 07/10/2026 (commit 152ae40) : Super PDP refuse
 * `superpdp_directory_entry_identifier` s'il n'est pas accompagné de
 * `superpdp_company_number` (« superpdp_company_number is required with
 * superpdp_directory_entry_identifier »), et tout le tunnel repart alors en
 * erreur. Les deux ne doivent donc JAMAIS partir l'un sans l'autre.
 */

export type EntreesAutorisation = {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
  siren: string | null;
  scheme: string;
  prefillCompany: boolean;
  email: string | null;
};

export function construireParamsAutorisation(e: EntreesAutorisation): URLSearchParams {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: e.clientId,
    redirect_uri: e.redirectUri,
    state: e.state,
    code_challenge: e.challenge,
    code_challenge_method: "S256",
  });

  // Pré-remplissage de l'entreprise, désactivé par défaut (un numéro inconnu de
  // Super PDP interrompt le tunnel pour tout nouvel inscrit, cf. route connect).
  // C'est le SEUL endroit où superpdp_directory_entry_identifier peut être posé,
  // et uniquement aux côtés de superpdp_company_number : l'invariant est tenu
  // par construction.
  if (e.siren && e.prefillCompany) {
    params.set("superpdp_company_number", e.siren);
    params.set("superpdp_company_number_scheme", e.scheme);
    if (e.scheme === "fr_siren") {
      params.set("superpdp_directory_entry_identifier", e.siren);
    }
  }

  if (e.email) params.set("login_hint", e.email);

  // Réception forcée : sans ligne d'annuaire, l'utilisateur se croit raccordé
  // mais ne peut pas recevoir (obligation du 1er septembre 2026).
  params.set("superpdp_send_and_receive", "receive");

  return params;
}

/**
 * Vrai si les paramètres violent l'invariant : identifiant d'annuaire présent
 * sans numéro d'entreprise. C'est la condition exacte que Super PDP rejette.
 */
export function violeInvariantAnnuaire(params: URLSearchParams): boolean {
  return (
    params.has("superpdp_directory_entry_identifier") &&
    !params.has("superpdp_company_number")
  );
}
