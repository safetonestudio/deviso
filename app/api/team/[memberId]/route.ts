import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeSeatFromSubscription } from "@/lib/stripe-seats";

type Params = { params: Promise<{ memberId: string }> };

// DELETE /api/team/[memberId], retirer un membre
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();

  // Récupérer le membre avant suppression pour savoir s'il était actif
  const { data: member } = await admin
    .from("team_members")
    .select("status")
    .eq("id", memberId)
    .eq("owner_id", user.id)
    .single();

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Retirer le siège de l'abonnement Stripe seulement si le membre était actif
  if (member?.status === "active") {
    await removeSeatFromSubscription(user.id).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
