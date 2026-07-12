import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { resend } from "@/lib/resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { to, shareUrl, senderName, proposalTitle } = await req.json();

  if (!to || !shareUrl) return NextResponse.json({ error: "Email et lien requis" }, { status: 400 });

  const workspaceId = await getWorkspaceUserId(user.id);

  // Domaine email personnalisé (Pro)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("plan, company_name, email_domain, email_domain_verified")
    .eq("id", workspaceId)
    .single();

  const useCustomDomain = profileData?.plan === "pro" && profileData?.email_domain_verified && profileData?.email_domain;
  const displayName = profileData?.company_name || senderName || "Votre prestataire";
  const fromAddress = useCustomDomain
    ? `${displayName} <devis@${profileData.email_domain}>`
    : `${displayName} <noreply@getdeviso.fr>`;

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, client_name, client_email, client_company")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:#4f46e5;padding:28px 36px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">${displayName}</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Vous avez reçu un devis</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            <strong style="color:#0f172a;">${senderName || "Votre prestataire"}</strong> vous a envoyé un devis pour :<br>
            <em style="color:#4f46e5;">${proposalTitle || "une prestation"}</em>
          </p>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Comment ça marche ?</p>
            <p style="margin:0 0 8px;font-size:14px;color:#475569;"><span style="display:inline-block;width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:#fff;font-size:11px;font-weight:700;margin-right:8px;">1</span>Cliquez sur le bouton ci-dessous pour consulter le devis</p>
            <p style="margin:0 0 8px;font-size:14px;color:#475569;"><span style="display:inline-block;width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:#fff;font-size:11px;font-weight:700;margin-right:8px;">2</span>Lisez le détail des prestations et les conditions</p>
            <p style="margin:0;font-size:14px;color:#475569;"><span style="display:inline-block;width:22px;height:22px;background:#4f46e5;border-radius:50%;text-align:center;line-height:22px;color:#fff;font-size:11px;font-weight:700;margin-right:8px;">3</span>Cliquez sur <strong>Accepter et signer</strong> ou <strong>Refuser</strong></p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${shareUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Consulter et signer le devis &rarr;
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
            Ce devis a été créé via <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">Deviso</a>
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Si vous n'attendiez pas ce devis, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Devis de ${displayName} — ${proposalTitle || "nouvelle proposition"}`,
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (proposal.status === "draft") {
    await supabase.from("proposals").update({ status: "sent" }).eq("id", id);
  }

  // Upsert contact, ne pas écraser le téléphone s'il existe déjà
  if (proposal.client_email) {
    const admin = createAdminClient();
    await admin.from("contacts").upsert({
      user_id: workspaceId,
      email: proposal.client_email.toLowerCase().trim(),
      name: proposal.client_name || null,
      company: proposal.client_company || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,email" });
  }

  return NextResponse.json({ success: true });
}
