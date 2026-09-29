import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { transmettreAchat, patchStatut, type AchatInternational } from "@/lib/superpdp-achats";

/**
 * Retente la transmission d'un achat international resté en attente ou en échec.
 *
 * Sert au réessai manuel depuis l'interface, et de brique au réessai
 * automatique. On ne retransmet jamais un achat déjà transmis : sa déclaration
 * existe chez la Plateforme Agréée, la renvoyer la ferait compter deux fois.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const refus = exigerTitulaire(user.id, workspaceId);
  if (refus) return refus;

  const admin = createAdminClient();
  const { data: achat } = await admin
    .from("superpdp_achats_int")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!achat) {
    return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
  }

  if (achat.transmission_status === "transmis") {
    return NextResponse.json({
      achat,
      transmission: { ok: true, superpdpId: achat.superpdp_id },
      dejaTransmis: true,
    });
  }

  const resultat = await transmettreAchat(workspaceId, achat as AchatInternational);

  // Retransmission manuelle : on repart d'un compteur neuf, l'utilisateur
  // demande explicitement une nouvelle chance (il a pu corriger la saisie).
  const patch = { ...patchStatut(resultat), retry_count: 0 };

  await admin.from("superpdp_achats_int").update(patch).eq("id", achat.id).eq("user_id", workspaceId);

  return NextResponse.json({ achat: { ...achat, ...patch }, transmission: resultat });
}
