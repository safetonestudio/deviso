import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getWorkspaceUserId } from "@/lib/workspace";
import { resend } from "@/lib/resend";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  // Only collaborators can submit (not the owner themselves)
  if (user.id === workspaceId) {
    return NextResponse.json({ error: "Le propriétaire peut envoyer directement" }, { status: 400 });
  }

  // Fetch proposal (must belong to workspace)
  const { data: proposal, error: propErr } = await supabaseAdmin
    .from("proposals")
    .select("id, title, status, approval_status, created_by, user_id")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (propErr || !proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  if (proposal.status !== "draft") return NextResponse.json({ error: "Seul un brouillon peut être soumis" }, { status: 400 });
  if (proposal.approval_status === "pending_review") return NextResponse.json({ error: "Déjà soumis pour validation" }, { status: 400 });

  // Update approval_status
  const { error: updateErr } = await supabaseAdmin
    .from("proposals")
    .update({ approval_status: "pending_review" })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Send email notification to owner
  const { data: ownerProfile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name, company_name")
    .eq("id", workspaceId)
    .single();

  const { data: creatorProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";
  const proposalUrl = `${baseUrl}/proposals/${id}`;

  if (ownerProfile?.email) {
    const creatorName = creatorProfile?.full_name || creatorProfile?.email || "Un collaborateur";
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:#4f46e5;padding:28px 36px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">Deviso</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Devis en attente de validation</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            <strong style="color:#0f172a;">${creatorName}</strong> a soumis le devis
            <em style="color:#4f46e5;">&laquo;&nbsp;${proposal.title}&nbsp;&raquo;</em>
            pour votre validation avant envoi au client.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${proposalUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Valider le devis &rarr;
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
            Connectez-vous sur <a href="${baseUrl}" style="color:#4f46e5;text-decoration:none;">Deviso</a> pour approuver ou refuser.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: "Deviso <noreply@getdeviso.fr>",
      to: ownerProfile.email,
      subject: `Devis à valider : ${proposal.title}`,
      html,
    });
  }

  return NextResponse.json({ success: true });
}
