/**
 * Après un `invalid_grant` au rafraîchissement : le jeton a-t-il été
 * rotationné par un AUTRE appel, ou le raccordement est-il vraiment perdu ?
 *
 * Pourquoi ce fichier existe (23/11/2026). Le compte de test Atelier Lumière
 * est passé « autorisation plus valide » à 16:40:18 UTC alors que, 0,6 s plus
 * tôt, un renouvellement concurrent venait de RÉUSSIR (nouvelle expiration
 * 17:10:18 écrite en base). La garde existante relisait la base UNE fois,
 * immédiatement : si le gagnant n'avait pas encore écrit son nouveau jeton, le
 * perdant concluait à un jeton mort et écrivait l'erreur. Un raccordement sain
 * s'affichait « déconnecté », et le titulaire était invité à refaire tout le
 * tunnel d'autorisation pour rien. Le même défaut peut toucher un vrai client
 * (tâche horaire et chargement de page qui se croisent).
 *
 * D'où : relire plusieurs fois, en laissant au gagnant le temps d'écrire
 * (son écriture suit sa réponse de Super PDP de quelques centaines de
 * millisecondes). Fichier PUR, lecture et attente injectées, pour être testé
 * sans réseau (scripts/e2e/superpdp-rotation.ts).
 */

/** Message écrit quand l'autorisation est jugée perdue. Un renouvellement réussi le réfute. */
export const MESSAGE_AUTORISATION_PERDUE =
  "Votre autorisation Super PDP n'est plus valide. Reconnectez votre entreprise.";

/** Attentes avant chaque relecture : 0 + 0,3 + 0,9 + 1,8 = 3 s au plus, seulement quand le jeton est vraiment mort. */
export const DELAIS_RELECTURE_MS = [0, 300, 900, 1800];

/**
 * Renvoie la connexion relue si son refresh token n'est plus `ancien` (un autre
 * appel a rotationné avec succès : il faut se ranger derrière lui), sinon null
 * (personne ne l'a fait : le jeton est réellement mort).
 */
export async function rotationParUnAutre<T extends { refresh_token: string }>(
  ancien: string,
  relire: () => Promise<T | null>,
  attendre: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  delais: number[] = DELAIS_RELECTURE_MS,
): Promise<T | null> {
  for (const ms of delais) {
    if (ms > 0) await attendre(ms);
    const relu = await relire().catch(() => null);
    if (relu && relu.refresh_token !== ancien) return relu;
  }
  return null;
}
