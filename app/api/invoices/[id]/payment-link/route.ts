import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Récupérer la facture
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // Si un lien existe déjà, le retourner directement
  if (invoice.payment_link_url) {
    return NextResponse.json({ url: invoice.payment_link_url });
  }

  // Créer un Price Stripe à usage unique pour cette facture
  const price = await stripe.prices.create({
    unit_amount: Math.round(invoice.total_ttc * 100), // centimes
    currency: "eur",
    product_data: {
      name: `Facture ${invoice.invoice_number}`,
      metadata: { invoice_id: id },
    },
  });

  // Créer le Payment Link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      invoice_id: id,
      user_id: user.id,
    },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}?paid=1`,
      },
    },
    payment_method_types: ["card"],
    billing_address_collection: "auto",
  });

  // Sauvegarder l'URL en base
  await supabase
    .from("invoices")
    .update({
      payment_link_url: paymentLink.url,
      stripe_payment_link_id: paymentLink.id,
      status: "sent",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ url: paymentLink.url });
}
