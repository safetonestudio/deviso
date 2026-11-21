import type Stripe from "stripe";

/**
 * Fin d'essai sans carte : reconnaître le fait, quelle que soit la façon dont
 * Stripe le raconte.
 *
 * Jusqu'au 20/11/2026, un essai de 14 jours qui se terminait sans carte
 * coupait l'accès (plan -> free) sans que Deviso n'écrive un mot ni que l'app
 * n'explique quoi que ce soit : le titulaire se reconnectait sur un espace
 * réduit, sans savoir pourquoi.
 *
 * Deux récits possibles côté Stripe, selon `trial_settings.end_behavior` :
 *   - `cancel` (posé par `app/api/stripe/checkout` depuis le 20/11) : l'abonnement
 *     est résilié à l'heure exacte de fin d'essai, `customer.subscription.deleted` ;
 *   - `create_invoice` (défaut Stripe, celui des abonnements de juillet) : une
 *     facture impayable est émise, l'abonnement passe `past_due`,
 *     `customer.subscription.updated` avec `previous_attributes.status = trialing`,
 *     puis résiliation pour impayé quelques semaines plus tard.
 * Les deux sont reconnus ici, la seconde pour les abonnements plus anciens.
 *
 * L'état est écrit dans `profiles.subscription_status` (colonne existante, texte
 * libre) : c'est lui qui déclenche l'écran de reprise et qui rend le courriel
 * idempotent (on n'écrit que si l'état n'y est pas déjà, on n'envoie que si on
 * a réellement écrit).
 */
export const STATUT_ESSAI_TERMINE = "essai_termine";

/** Statuts qui donnent accès au plan souscrit. */
export function estAJour(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/** Marge pour comparer une résiliation à la fin d'essai (horloges, latence). */
const MARGE_S = 24 * 3600;

/**
 * L'événement raconte-t-il un essai qui vient de se terminer sans moyen de
 * paiement ?
 *
 * Ce qui n'en est PAS un, et qu'on doit laisser au traitement ordinaire :
 *   - un titulaire qui résilie lui-même pendant l'essai (portail, « à la fin de
 *     la période ») : `cancel_at_period_end`, et `canceled_at` est la date de
 *     la demande, antérieure à la fin d'essai ;
 *   - un essai qui se termine AVEC une carte : l'abonnement passe `active` ;
 *   - un impayé sur un abonnement payé depuis des mois : le statut précédent
 *     n'était pas `trialing`.
 */
export function essaiTermineSansPaiement(event: Stripe.Event): boolean {
  if (
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return false;
  }
  const sub = event.data.object as Stripe.Subscription;
  if (!sub.trial_end) return false;
  if (sub.default_payment_method) return false;

  if (event.type === "customer.subscription.updated") {
    // Constaté en mode test le 21/11/2026 : avec `create_invoice`, Stripe ne
    // saute pas de `trialing` à `past_due`. Il passe d'abord `active` (fin
    // d'essai), PUIS `past_due` quand la facture ne peut être prélevée. On
    // reconnaît donc un passage à l'impayé, depuis l'essai ou depuis l'actif,
    // sur un abonnement issu d'un essai. Ce test ne suffit pas seul : un
    // abonné payant depuis des mois qui tombe en impayé suit la même séquence.
    // Le webhook confirme donc par les FAITS (app/api/webhooks/stripe) : aucune
    // facture jamais payée, aucune carte chez le client. Pas de fenêtre de
    // temps : `event.created` est l'heure réelle, pas celle d'une horloge de
    // test, et la comparer à `trial_end` faussait le banc.
    const avant = (event.data.previous_attributes ?? {}) as Partial<Stripe.Subscription>;
    if (avant.status !== "trialing" && avant.status !== "active") return false;
    return !estAJour(sub.status);
  }

  // customer.subscription.deleted
  //
  // ⚠️ `cancellation_details.reason` ne distingue RIEN ici : constaté en mode
  // test le 21/11/2026, Stripe écrit `cancellation_requested` aussi pour la
  // résiliation automatique de fin d'essai sans carte. Ce qui distingue une
  // résiliation voulue par le client, c'est la date de la décision :
  // `canceled_at` est l'heure de SA demande (antérieure à la fin d'essai), et
  // l'abonnement porte `cancel_at_period_end`.
  if (sub.cancel_at_period_end) return false;
  const fin = sub.ended_at ?? sub.canceled_at;
  if (!fin) return false;
  const decideeA = sub.canceled_at ?? fin;
  return decideeA >= sub.trial_end - 60 && fin - sub.trial_end <= MARGE_S;
}

/** La formule portée par l'abonnement, d'après ses métadonnées de souscription. */
export function formuleEssayee(
  sub: Stripe.Subscription,
  planDeAbonnement: (s: Stripe.Subscription) => "solo" | "pro" | null
): "solo" | "pro" {
  const meta = sub.metadata?.target_plan;
  if (meta === "solo" || meta === "pro") return meta;
  return planDeAbonnement(sub) ?? "solo";
}
