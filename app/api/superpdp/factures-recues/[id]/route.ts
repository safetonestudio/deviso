import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { estTauxFrancais, TAUX_FRANCAIS } from "@/lib/achats-tva";
import { baseAutoliquidee } from "@/lib/achats-export";

/**
 * Taux français d'une facture reçue en autoliquidation (catégorie AE), choisi
 * par le titulaire (21/11/2026). La facture ne porte pas de TVA (taux nul
 * imposé par la norme) : sans ce choix, la comptabilité présume le taux normal
 * et le signale au cabinet. Comptabilité de l'entreprise : titulaire seul.
 *
 * PATCH { taux_autoliquidation: 20 | 10 | 8.5 | 5.5 | 2.1 | 1.05 | 0.9 | null }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const refus = exigerTitulaire(user.id, workspaceId);
  if (refus) return refus;

  let corps: { taux_autoliquidation?: unknown };
  try {
    corps = (await req.json()) as { taux_autoliquidation?: unknown };
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const taux = corps.taux_autoliquidation;
  if (taux !== null && !estTauxFrancais(taux)) {
    return NextResponse.json(
      { error: "Taux invalide", message: `Choisis un taux de TVA français (${TAUX_FRANCAIS.join(", ")} %).` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: facture } = await admin
    .from("superpdp_invoices")
    .select("id, en_invoice")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .eq("direction", "in")
    .maybeSingle();
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (!(baseAutoliquidee(facture.en_invoice) > 0)) {
    return NextResponse.json(
      { error: "Pas d'autoliquidation", message: "Cette facture ne porte aucune part en autoliquidation (catégorie AE)." },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("superpdp_invoices")
    .update({ taux_autoliquidation: taux === null ? null : Number(taux) })
    .eq("id", id)
    .eq("user_id", workspaceId);
  if (error) return NextResponse.json({ error: "Enregistrement impossible", message: error.message }, { status: 500 });
  return NextResponse.json({ taux_autoliquidation: taux === null ? null : Number(taux) });
}
