import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name, is_demo")
      .eq("id", user.id)
      .single();

    // Même garde-fou que sur le tunnel de paiement : la démonstration ne doit
    // jamais toucher le compte Stripe de production.
    if (profile?.is_demo) {
      return NextResponse.json(
        { error: "La gestion de l'abonnement n'est pas disponible en mode démo." },
        { status: 403 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Vérifie que le customer existe vraiment dans Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        // Customer invalide (ex: ID de test en mode live) → on le réinitialise
        customerId = null;
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: null })
          .eq("id", user.id);
      }
    }

    // On ne crée plus de client Stripe ici. Le portail sert à gérer un
    // abonnement existant : sans abonnement, il n'y a rien à gérer, et créer un
    // client à la volée remplissait le compte Stripe de production de fiches
    // orphelines — notamment depuis les comptes de démonstration, purgés de la
    // base au bout de deux heures mais jamais de Stripe.
    if (!customerId) {
      return NextResponse.json(
        {
          error: "NO_SUBSCRIPTION",
          message: "Aucun abonnement à gérer pour le moment. Choisissez une formule pour commencer.",
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[portal] Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
