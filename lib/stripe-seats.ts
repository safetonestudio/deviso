import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { estCompteDemo } from "@/lib/stripe-guard";
import { siegesDus, MEMBRES_INCLUS } from "@/lib/sieges";

export { siegesDus, MEMBRES_INCLUS };

/**
 * Les sièges facturés se **calculent**, ils ne s'incrémentent pas.
 *
 * Deux défauts sont nés de l'ancienne version, qui faisait `quantity + 1` à
 * l'acceptation d'une invitation et `quantity - 1` au retrait d'un membre :
 *
 * 1. **Elle facturait dès le premier collaborateur.** Les CGU vendent pourtant
 *    « 3 utilisateurs inclus — le titulaire du compte et 2 membres — , +5 €/mois
 *    par utilisateur supplémentaire ». Un client Pro qui invitait deux personnes
 *    payait donc 10 €/mois qui ne lui étaient pas dus, et la page de facturation
 *    lui affichait en même temps la promesse inverse.
 *
 * 2. **Un compteur dérive, un calcul non.** Le double clic sur un lien
 *    d'invitation avait déjà fait facturer deux sièges pour un collaborateur ;
 *    l'acceptation a été rendue atomique pour ça. Mais toute autre divergence —
 *    un membre supprimé en base, un appel perdu, une reprise manuelle — laissait
 *    la quantité Stripe et la réalité s'écarter sans que rien ne les rapproche.
 *
 * On lit donc le nombre de membres actifs, on en déduit les sièges dus, et on
 * pose cette quantité. La fonction est idempotente : la rejouer ne change rien,
 * et elle répare une divergence au lieu de l'aggraver.
 */

/**
 * Aligne la quantité de sièges facturés sur le nombre réel de membres actifs.
 *
 * Silencieuse et sans effet quand il n'y a rien à faire : compte de
 * démonstration, pas d'abonnement Stripe, ou quantité déjà juste.
 */
export async function synchroniserSieges(ownerId: string): Promise<void> {
  // Une protection qui dépend d'un état de données n'en est pas une : on refuse
  // explicitement la démonstration, même si elle n'a normalement pas d'abonnement.
  if (await estCompteDemo(ownerId)) return;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", ownerId)
    .single();

  const subId = profile?.stripe_subscription_id;
  if (!subId) return; // pas d'abonnement Stripe (compte de test, plan gratuit)

  const seatPriceId = process.env.STRIPE_SEAT_PRICE_ID;
  if (!seatPriceId) return;

  // On compte les membres ACTIFS. Une invitation en attente n'est pas un siège
  // occupé : elle peut n'être jamais acceptée, et la facturer reviendrait à
  // faire payer une intention.
  const { count } = await admin
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "active");

  const voulue = siegesDus(count ?? 0);

  const subscription = await stripe.subscriptions.retrieve(subId, { expand: ["items"] });
  const seatItem = subscription.items.data.find((item) => item.price.id === seatPriceId);
  const actuelle = seatItem ? seatItem.quantity ?? 0 : 0;

  if (voulue === actuelle) return;

  if (voulue === 0) {
    if (seatItem) {
      await stripe.subscriptionItems.del(seatItem.id, {
        proration_behavior: "create_prorations",
      });
    }
    return;
  }

  if (seatItem) {
    await stripe.subscriptionItems.update(seatItem.id, {
      quantity: voulue,
      proration_behavior: "create_prorations",
    });
  } else {
    await stripe.subscriptionItems.create({
      subscription: subId,
      price: seatPriceId,
      quantity: voulue,
      proration_behavior: "create_prorations",
    });
  }
}
