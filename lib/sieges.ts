/**
 * La règle de facturation des sièges, sans rien qui touche à Stripe.
 *
 * Elle vit dans son propre fichier pour deux raisons. D'abord, c'est une règle
 * **contractuelle** avant d'être technique : elle traduit une phrase des CGU,
 * et elle doit pouvoir être relue à côté de cette phrase. Ensuite, un module
 * sans dépendance se vérifie directement — `scripts/e2e/sieges.mjs` l'importe
 * et le confronte au texte des CGU, ce qui serait impossible à travers
 * `lib/stripe-seats.ts` et ses alias de chemin.
 */

/**
 * Membres inclus dans le plan Pro, **en plus** du titulaire du compte.
 *
 * Source : CGU, article « Plan Pro » — « 3 utilisateurs inclus — le titulaire
 * du compte et 2 membres —, +5 €/mois/utilisateur supplémentaire ».
 * Ne pas changer cette valeur sans changer les CGU : `npm run test:sieges`
 * compare les deux et échoue si elles divergent.
 */
export const MEMBRES_INCLUS = 2;

/**
 * Sièges facturables pour un nombre de membres actifs donné.
 *
 * C'est un calcul, pas un compteur. L'ancienne version incrémentait la
 * quantité Stripe à chaque invitation acceptée : elle facturait dès le premier
 * collaborateur, et dérivait dès qu'un appel se perdait ou se rejouait.
 */
export function siegesDus(membresActifs: number): number {
  return Math.max(0, membresActifs - MEMBRES_INCLUS);
}
