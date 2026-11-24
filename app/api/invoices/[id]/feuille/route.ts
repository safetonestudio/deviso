import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { donneesRenduFacture } from "@/lib/facture-rendu";
import type { Invoice } from "@/types";
import { getWorkspaceUserId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

/**
 * Ce qu'il faut à la feuille affichée dans l'application pour montrer
 * exactement le PDF : la facture lue comme la lit `/download` (même requête,
 * même ligne brute), la couleur, les modalités de paiement de l'espace et le
 * document lié. Lecture seule, mêmes droits que le téléchargement du PDF :
 * tout membre de l'espace.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();
  if (error || !data) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const invoice = data as Invoice;
  const { accentColor, modele, paymentInfo, lie } = await donneesRenduFacture(supabase, invoice, workspaceId);
  return NextResponse.json({
    invoice,
    accentColor: accentColor ?? null,
    modele,
    paymentInfo: paymentInfo ?? null,
    linkedNumber: lie.numero,
  });
}
