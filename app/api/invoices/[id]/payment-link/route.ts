import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/**
 * Cette route ne crée PLUS de Payment Link sur le compte Stripe de Deviso.
 * Elle retourne simplement le lien de paiement configuré dans le profil de l'utilisateur.
 * Les paiements arrivent DIRECTEMENT chez l'utilisateur, Deviso n'intervient pas.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Vérifier que la facture appartient à l'utilisateur
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, payment_link_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Récupérer le lien de paiement depuis le profil de l'utilisateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("payment_method, payment_link_profile")
    .eq("id", user.id)
    .single();

  const profileLink = profile?.payment_link_profile;

  if (!profileLink) {
    return NextResponse.json(
      {
        error: "PAYMENT_NOT_CONFIGURED",
        message: "Configurez votre lien de paiement dans l'onglet Paiements de votre dashboard.",
      },
      { status: 400 }
    );
  }

  // Mettre à jour la facture avec le lien (pour l'affichage)
  await supabase
    .from("invoices")
    .update({ payment_link_url: profileLink, status: "sent" })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ url: profileLink });
}
