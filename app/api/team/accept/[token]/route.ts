import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addSeatToSubscription } from "@/lib/stripe-seats";

type Params = { params: Promise<{ token: string }> };

// GET /api/team/accept/[token], accepter une invitation
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";

  if (authError || !user) {
    return NextResponse.redirect(`${baseUrl}/login?next=/join/${token}`);
  }

  const admin = createAdminClient();

  // Trouver l'invitation par token
  const { data: invite } = await admin
    .from("team_members")
    .select("id, owner_id, email, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=invalid`);
  }

  if (invite.status === "active") {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=already_accepted`);
  }

  // Bloquer si l'utilisateur connecté est le propriétaire du workspace
  if (user.id === invite.owner_id) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=wrong_account`);
  }

  // Vérifier que l'email correspond (si l'utilisateur est connecté avec un autre email, on l'accepte quand même)
  const { error } = await admin
    .from("team_members")
    .update({
      member_id: user.id,
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=error`);
  }

  // Facturer le siège supplémentaire sur l'abonnement Stripe de l'owner
  await addSeatToSubscription(invite.owner_id).catch(() => {
    // Échec silencieux, le siège est activé mais le billing sera régularisé manuellement
  });

  return NextResponse.redirect(`${baseUrl}/dashboard?invite=accepted`);
}
