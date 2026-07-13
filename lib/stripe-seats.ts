import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ajoute un siège à l'abonnement Stripe de l'owner (+5€/mois).
 * Si pas d'abonnement actif, ne fait rien (cas compte de test).
 */
export async function addSeatToSubscription(ownerId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", ownerId)
    .single();

  const subId = profile?.stripe_subscription_id;
  if (!subId) return; // pas d'abonnement Stripe actif (ex: compte test)

  const seatPriceId = process.env.STRIPE_SEAT_PRICE_ID;
  if (!seatPriceId) return;

  const subscription = await stripe.subscriptions.retrieve(subId, {
    expand: ["items"],
  });

  const seatItem = subscription.items.data.find(
    (item) => item.price.id === seatPriceId
  );

  if (seatItem) {
    await stripe.subscriptionItems.update(seatItem.id, {
      quantity: (seatItem.quantity ?? 0) + 1,
      proration_behavior: "create_prorations",
    });
  } else {
    await stripe.subscriptionItems.create({
      subscription: subId,
      price: seatPriceId,
      quantity: 1,
      proration_behavior: "create_prorations",
    });
  }
}

/**
 * Retire un siège de l'abonnement Stripe de l'owner (-5€/mois).
 */
export async function removeSeatFromSubscription(ownerId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", ownerId)
    .single();

  const subId = profile?.stripe_subscription_id;
  if (!subId) return;

  const seatPriceId = process.env.STRIPE_SEAT_PRICE_ID;
  if (!seatPriceId) return;

  const subscription = await stripe.subscriptions.retrieve(subId, {
    expand: ["items"],
  });

  const seatItem = subscription.items.data.find(
    (item) => item.price.id === seatPriceId
  );

  if (!seatItem) return;

  if ((seatItem.quantity ?? 0) <= 1) {
    await stripe.subscriptionItems.del(seatItem.id, {
      proration_behavior: "create_prorations",
    });
  } else {
    await stripe.subscriptionItems.update(seatItem.id, {
      quantity: (seatItem.quantity ?? 1) - 1,
      proration_behavior: "create_prorations",
    });
  }
}
