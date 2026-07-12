import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (!invoice.client_email) return NextResponse.json({ error: "Email client manquant" }, { status: 400 });

  const clientName = invoice.client_company || invoice.client_name || "Client";
  const senderName = invoice.seller_company || invoice.seller_name || "Votre prestataire";
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(invoice.total_ttc);
  const daysOverdue = invoice.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const reminderNum = (invoice.reminder_count || 0) + 1;
  const urgency = reminderNum >= 3 ? "Dernier rappel" : reminderNum === 2 ? "2eme rappel" : "Rappel de paiement";
  const borderColor = reminderNum >= 3 ? "#dc2626" : reminderNum === 2 ? "#d97706" : "#4f46e5";
  const btnColor = reminderNum >= 3 ? "#dc2626" : "#4f46e5";

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
            <strong style="color:#0f172a;">${senderName}</strong> vous rappelle qu'une facture est en attente de reglement.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;">Facture</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">Montant du</td>
                <td align="right" style="font-size:18px;font-weight:800;color:#dc2626;padding-top:8px;">${amount}</td>
              </tr>
              ${daysOverdue > 0 ? `<tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">En retard de</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#dc2626;padding-top:8px;">${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}</td>
              </tr>` : ""}
            </table>
          </div>
          ${invoice.payment_link_url ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${invoice.payment_link_url}" style="display:inline-block;background:${btnColor};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Payer maintenant &rarr;
              </a>
            </td></tr>
          </table>` : ""}
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">En cas de paiement deja effectue, ignorez ce message.</p>
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

  const { error } = await resend.emails.send({
    from: "Deviso <noreply@getdeviso.fr>",
    to: invoice.client_email,
    subject: `${urgency}, Facture ${invoice.invoice_number} (${amount})`,
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();
  await supabase
    .from("invoices")
    .update({ last_reminder_sent_at: now, reminder_count: reminderNum })
    .eq("id", id);

  return NextResponse.json({ success: true, reminder_count: reminderNum });
}
