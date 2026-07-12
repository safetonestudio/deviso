import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  if (!proposal.client_email) return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
  if (proposal.status === "signed") return NextResponse.json({ error: "Ce devis est déjà signé" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .single();

  const clientName = proposal.client_company || proposal.client_name || "Client";
  const senderName = profile?.company_name || profile?.full_name || "Votre prestataire";
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(proposal.total_ttc);
  const reminderNum = (proposal.reminder_count || 0) + 1;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";
  const signUrl = `${baseUrl}/p/${proposal.share_token}`;

  const urgency = reminderNum >= 3 ? "Dernier rappel" : reminderNum === 2 ? "2ème rappel" : "Rappel, Devis en attente";
  const borderColor = reminderNum >= 3 ? "#dc2626" : reminderNum === 2 ? "#d97706" : "#4f46e5";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:2px solid ${borderColor};overflow:hidden;">
        <tr><td style="background:${borderColor};padding:24px 36px;">
          <span style="color:#ffffff;font-size:16px;font-weight:700;">${urgency}</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">Bonjour ${clientName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            <strong style="color:#0f172a;">${senderName}</strong> vous rappelle qu'un devis est en attente de votre validation.
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;">Devis</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;">${proposal.proposal_number || proposal.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">Objet</td>
                <td align="right" style="font-size:13px;font-weight:600;color:#0f172a;padding-top:8px;">${proposal.title}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">Montant</td>
                <td align="right" style="font-size:18px;font-weight:800;color:#1d4ed8;padding-top:8px;">${amount}</td>
              </tr>
              ${proposal.valid_until ? `<tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">Valable jusqu'au</td>
                <td align="right" style="font-size:13px;font-weight:600;color:#0f172a;padding-top:8px;">${new Date(proposal.valid_until).toLocaleDateString("fr-FR")}</td>
              </tr>` : ""}
            </table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${signUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Consulter et signer le devis &rarr;
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
            Si vous avez deja repondu a ce devis, ignorez ce message.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Envoye via <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">Deviso</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error: emailError } = await resend.emails.send({
    from: "Deviso <noreply@getdeviso.fr>",
    to: proposal.client_email,
    subject: `${urgency}, ${proposal.title} (${amount})`,
    html,
  });

  if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 });

  await supabase
    .from("proposals")
    .update({ last_reminder_sent_at: new Date().toISOString(), reminder_count: reminderNum })
    .eq("id", id);

  return NextResponse.json({ success: true, reminder_count: reminderNum });
}
