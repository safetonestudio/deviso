/**
 * Garde-fou Stripe — conservé comme point d'entrée historique.
 *
 * La règle qu'il énonçait (« tout fichier qui écrit dans Stripe passe par
 * ici ») s'est révélée valable bien au-delà de Stripe : le courriel et les
 * dépôts chez un tiers sortent eux aussi de la base et échappent à la purge
 * des comptes de démonstration. Elle vit désormais dans `lib/garde-demo.ts`,
 * qui la porte pour les trois familles.
 *
 * Ce fichier réexporte, pour que `scripts/check-stripe.mjs` et les routes
 * Stripe continuent de désigner le même verrou.
 */
export { estCompteDemo, MESSAGE_DEMO } from "@/lib/garde-demo";
