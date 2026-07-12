import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/team/invite-info/[token], infos publiques d'une invitation (sans auth)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("team_members")
    .select("email, status, owner_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  if (invite.status === "active") return NextResponse.json({ error: "already_accepted" }, { status: 409 });

  // Récupère le nom de l'inviteur
  const { data: owner } = await admin
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", invite.owner_id)
    .single();

  const ownerName = owner?.company_name || owner?.full_name || "Quelqu'un";

  return NextResponse.json({
    invitee_email: invite.email,
    owner_name: ownerName,
  });
}
