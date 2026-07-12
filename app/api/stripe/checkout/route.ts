import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetPlan: "solo" | "pro" = body.plan === "pro" ? "pro" : "solo";
  const billing: "monthly" | "annual" = body.billing === "annual" ? "annual" : "monthly";
  const priceId = billing === "annual" ? PLANS[targetPlan].annualPriceId : PLANS[targetPlan].priceId;

  if (!priceId) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, full_name, is_demo")
    .eq("id", user.id)
    .single();

  // Bloquer les comptes démo, pas d'abonnement réel possible
  if (profile?.is_demo) {
    return NextResponse.json({ error: "Les abonnements ne sont pas disponibles en mode démo." }, { status: 403 });
  }

  let customerId = profile?.stripe_customer_id;

  // Vérifier que le customer existe dans Stripe, sinon en créer un nouveau
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null;
      await supabase.from("profiles").update({ stripe_customer_id: null }).eq("id", user.id);
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      name: profile?.full_name || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      payment_method_collection: "if_required", // sans carte bancaire pendant l'essai
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/billing?upgraded=1`,
      cancel_url: `${baseUrl}/billing`,
      locale: "fr",
      subscription_data: {
        trial_period_days: 14,
        metadata: { target_plan: targetPlan, billing },
      },
      metadata: { target_plan: targetPlan, billing },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[stripe/checkout] session.create error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
