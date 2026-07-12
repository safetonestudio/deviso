import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { resend } from "@/lib/resend";
import { inviteEmailHtml } from "@/lib/emails/invite";

// GET /api/team — liste les membres de l'équipe du workspace
// Pour un membre invité, retourne les membres de l'owner (pas le sien propre).
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Résoudre l'owner du workspace (pour les membres, c'est l'owner ; pour l'owner, c'est lui-même)
  const admin = createAdminClient();
  const workspaceOwnerId = await getWorkspaceUserId(user.id);

  // Vérifier le plan de l'owner du workspace (pas du membre lui-même)
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", workspaceOwnerId)
    .single();

  if (ownerProfile?.plan !== "pro") return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });

  const { data: members } = await admin
    .from("team_members")
    .select("id, email, role, status, invited_at, accepted_at, member_id")
    .eq("owner_id", workspaceOwnerId)
    .order("invited_at", { ascending: false });

  return NextResponse.json({ members: members ?? [] });
}

// POST /api/team, inviter un membre (Pro only)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name, company_name")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });

  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Tu ne peux pas t'inviter toi-même" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Vérifier si ce membre existe déjà (re-invitation)
  const { data: existing } = await admin
    .from("team_members")
    .select("id, status")
    .eq("owner_id", user.id)
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // Limite de 10 sièges pour l'offre Pro (uniquement pour les nouveaux membres)
  if (!existing) {
    const { count: seatCount } = await admin
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);

    if ((seatCount ?? 0) >= 10) {
      return NextResponse.json({ error: "SEAT_LIMIT_REACHED" }, { status: 403 });
    }
  }

  let inviteToken: string;

  if (existing) {
    // Régénérer le token si déjà existant
    const { data: updated } = await admin
      .from("team_members")
      .update({ status: "pending", invite_token: crypto.randomUUID(), accepted_at: null })
      .eq("id", existing.id)
      .select("invite_token")
      .single();
    inviteToken = updated?.invite_token;
  } else {
    const { data: inserted } = await admin
      .from("team_members")
      .insert({ owner_id: user.id, email: email.toLowerCase() })
      .select("invite_token")
      .single();
    inviteToken = inserted?.invite_token;
  }

  if (!inviteToken) return NextResponse.json({ error: "Erreur lors de la création de l'invitation" }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";
  const inviteUrl = `${baseUrl}/join/${inviteToken}`;

  await resend.emails.send({
    from: "Deviso <noreply@getdeviso.fr>",
    to: email,
    subject: `${profile?.company_name || profile?.full_name || "Quelqu'un"} t'invite sur Deviso`,
    html: inviteEmailHtml(profile?.full_name ?? "", profile?.company_name ?? "", inviteUrl),
  });

  return NextResponse.json({ success: true });
}
