import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";

type Params = { params: Promise<{ id: string }> };

/**
 * Réponse « pas encore payée » à la relance de pointage
 * (`lib/pointage-paiement.ts`) : la question sera reposée dans 7 jours.
 *
 * Titulaire seul, comme « Marquer comme payée » : pointer les paiements est
 * son acte (décision du 21/09). Une requête POST, jamais un GET : les
 * analyseurs de liens des messageries ouvrent les liens des courriels.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const refus = exigerTitulaire(user.id, workspaceId);
  if (refus) return refus;

  const { data, error } = await supabase
    .from("invoices")
    .update({ pointage_pas_encore_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", workspaceId)
    .eq("status", "sent")
    .select("id, pointage_pas_encore_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Facture introuvable ou déjà réglée" }, { status: 404 });
  return NextResponse.json({ invoice: data });
}
