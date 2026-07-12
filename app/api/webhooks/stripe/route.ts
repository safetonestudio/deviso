import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Correspondance price_id → plan (mensuel ET annuel)
function planFromPriceId(priceId: string): "solo" | "pro" | null {
  if (priceId === process.env.STRIPE_SOLO_PRICE_ID) return "solo";
  if (priceId === process.env.STRIPE_SOLO_ANNUAL_PRICE_ID) return "solo";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) return "pro";
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {

    // ── Paiement initial réussi ──────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Cas 1 : lien de paiement facture (mode payment avec invoice_id en metadata)
      if (session.mode !== "subscription") {
        const invoiceId = session.metadata?.invoice_id;
        if (invoiceId && session.payment_status === "paid") {
          const { error } = await supabase
            .from("invoices")
            .update({ status: "paid" })
            .eq("id", invoiceId);
          if (error) console.error("checkout.session.completed invoice update error:", error);
        }
        break;
      }

      // Cas 2 : souscription abonnement
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const targetPlan = session.metadata?.target_plan as "solo" | "pro" | null;

      if (!customerId) break;

      // Récupère l'abonnement pour avoir le plan ET le statut réel (trialing si essai sans carte)
      let plan: "solo" | "pro" = targetPlan ?? "solo";
      let subscriptionStatus = "active";
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id;
      if (!targetPlan) plan = planFromPriceId(priceId) ?? "solo";
      subscriptionStatus = sub.status; // "trialing", "active", etc.

      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("checkout.session.completed subscription error:", error);
      break;
    }

    // ── Abonnement modifié (upgrade / downgrade / renouvellement) ─────────
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const priceId = sub.items.data[0]?.price.id;
      const plan = planFromPriceId(priceId);
      const status = sub.status; // active, past_due, canceled, etc.

      if (!plan) break;

      // trialing = utilisateur en essai → accès au plan souscrit (pas "free")
      const isActive = status === "active" || status === "trialing";
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: isActive ? plan : "free",
          subscription_status: status,
          stripe_subscription_id: sub.id,
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("subscription.updated error:", error);
      break;
    }

    // ── Abonnement résilié ────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { error } = await supabase
        .from("profiles")
        .update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("subscription.deleted error:", error);
      break;
    }

    default:
      // Événement non géré — on ignore silencieusement
      break;
  }

  return NextResponse.json({ received: true });
}
