/**
 * Les territoires où la TVA française s'applique, et l'Union européenne.
 *
 * Fichier volontairement SANS AUCUN import : il est chargé tel quel par les
 * traversées de `scripts/e2e/`, qui tournent sous node sans le résolveur
 * d'alias de Next. C'est la même contrainte, et la même raison, que pour
 * `lib/superpdp-fermeture.ts` — une règle qu'on veut pouvoir éprouver sans
 * réseau ne doit pas traîner derrière elle la moitié de l'application.
 *
 * Monaco est traité comme la France au regard de la TVA (art. 302 F du CGI).
 * Les DOM sont hors du territoire de TVA métropolitain mais restent français,
 * et relèvent du circuit national de facturation : on ne les sort donc pas en
 * opération internationale.
 */
export const CODES_FRANCE = new Set(["FR", "MC", "GP", "MQ", "GF", "RE", "YT"]);

/** États membres de l'Union européenne (ISO 3166-1 alpha-2). */
export const CODES_UE = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR",
  "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI",
  "SK",
]);

/**
 * Un pays absent n'est pas une information : c'est une absence, et on la traite
 * comme la France — le comportement le moins surprenant pour un logiciel
 * français, et celui que `parseAddress` applique déjà par défaut.
 */
export function estFrance(code: string | null | undefined): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return true;
  return CODES_FRANCE.has(c);
}
