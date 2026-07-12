import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

// Vercel cron job, déclenché quotidiennement à 8h
// Protégé par CRON_SECRET (Vercel l'injecte automatiquement)

const SOLO_INTERVALS = [3, 7]; // jours fixes pour Solo
const DAY_MS = 24 * 60 * 60 * 1000;

type OwnerProfile = {
  id: string;
  plan: string;
  full_name: string | null;
  company_name: string | null;
  reminder_intervals: number[] | null;
  reminder_message: string | null;
};

function getIntervals(profile: OwnerProfile): number[] {
  if (profile.plan === "pro" && profile.reminder_intervals && profile.reminder_intervals.length > 0) {
    return [...profile.reminder_intervals].sort((a, b) => a - b);
  }
  return SOLO_INTERVALS;
}

/** Renvoie true si une relance est due aujourd'hui pour ce document */
function isDue(createdAt: string, reminderCount: number, intervals: number[]): boolean {
  if (reminderCount >= intervals.length) return false;
  const targetDay = intervals[reminderCount];
  const targetDate = new Date(createdAt).getTime() + targetDay * DAY_MS;
  return Date.now() >= targetDate;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // ── 1. Récupérer tous les profils Solo/Pro avec leurs config de relance ──
  const { data: ownerProfiles } = await supabase
    .from("profiles")
    .select("id, plan, full_name, company_name, reminder_intervals, reminder_message")
    .in("plan", ["solo", "pro"])
    .neq("is_demo", true);

  if (!ownerProfiles || ownerProfiles.length === 0) {
    return NextResponse.json({ invoices_sent: 0, proposals_sent: 0 });
  }

  const profileMap = Object.fromEntries(ownerProfiles.map((p) => [p.id, p])) as Record<string, OwnerProfile>;
  const eligibleIds = ownerProfiles.map((p) => p.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";

  // ── 2. Factures ──────────────────────────────────────────────────────────
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_name, client_email, client_company, total_ttc, due_date, payment_link_url, reminder_count, seller_name, seller_company, user_id, issue_date")
    .eq("status", "sent")
    .lt("due_date", now)
    .lt("reminder_count", 10)
    .in("user_id", eligibleIds);

  let invoicesSent = 0;

  for (const invoice of invoices ?? []) {
    if (!invoice.client_email) continue;
    const profile = profileMap[invoice.user_id];
    if (!profile) continue;

    const intervals = getIntervals(profile);
    // Pour les factures, on utilise issue_date comme point de départ
    if (!isDue(invoice.issue_date || invoice.due_date, invoice.reminder_count, intervals)) continue;

    const clientName = invoice.client_company || invoice.client_name || "Client";
    const senderName = profile.company_name || profile.full_name || "Votre prestataire";
    const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(invoice.total_ttc);
    const daysOverdue = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / DAY_MS);
    const reminderNum = (invoice.reminder_count || 0) + 1;
    const urgency = reminderNum >= 3 ? "⚠️ Dernier rappel" : reminderNum === 2 ? "2ème rappel" : "Rappel de paiement";

    const html = buildInvoiceReminderEmail({
      clientName, senderName, invoiceNumber: invoice.invoice_number,
      amount, daysOverdue, paymentLinkUrl: invoice.payment_link_url,
      reminderNum, urgency,
      customMessage: profile.plan === "pro" ? profile.reminder_message : null,
    });

    const { error: emailError } = await resend.emails.send({
      from: "Deviso <noreply@getdeviso.fr>",
      to: invoice.client_email,
      subject: `${urgency}, Facture ${invoice.invoice_number} (${amount})`,
      html,
    });

    if (!emailError) {
      await supabase
        .from("invoices")
        .update({ last_reminder_sent_at: now, reminder_count: reminderNum })
        .eq("id", invoice.id);
      invoicesSent++;
    }
  }

  // ── 3. Devis ─────────────────────────────────────────────────────────────
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, proposal_number, title, client_name, client_email, client_company, total_ttc, valid_until, share_token, reminder_count, user_id, created_at")
    .in("status", ["sent", "viewed"])
    .lt("reminder_count", 10)
    .in("user_id", eligibleIds);

  let proposalsSent = 0;

  for (const proposal of proposals ?? []) {
    if (!proposal.client_email) continue;
    const profile = profileMap[proposal.user_id];
    if (!profile) continue;

    const intervals = getIntervals(profile);
    if (!isDue(proposal.created_at, proposal.reminder_count, intervals)) continue;

    const clientName = proposal.client_company || proposal.client_name || "Client";
    const senderName = profile.company_name || profile.full_name || "Votre prestataire";
    const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(proposal.total_ttc);
    const reminderNum = (proposal.reminder_count || 0) + 1;
    const signUrl = `${baseUrl}/p/${proposal.share_token}`;
    const urgency = reminderNum >= 3 ? "⚠️ Dernier rappel" : reminderNum === 2 ? "2ème rappel" : "Rappel, Devis en attente";
    const borderColor = reminderNum >= 3 ? "#dc2626" : reminderNum === 2 ? "#d97706" : "#4f46e5";

    const html = buildProposalReminderEmail({
      clientName, senderName, proposalTitle: proposal.title,
      amount, validUntil: proposal.valid_until, signUrl,
      reminderNum, urgency, borderColor,
      customMessage: profile.plan === "pro" ? profile.reminder_message : null,
    });

    const { error: emailError } = await resend.emails.send({
      from: "Deviso <noreply@getdeviso.fr>",
      to: proposal.client_email,
      subject: `${urgency}, ${proposal.title} (${amount})`,
      html,
    });

    if (!emailError) {
      await supabase
        .from("proposals")
        .update({ last_reminder_sent_at: now, reminder_count: reminderNum })
        .eq("id", proposal.id);
      proposalsSent++;
    }
  }

  return NextResponse.json({ invoices_sent: invoicesSent, proposals_sent: proposalsSent });
}

// ── Email builders ────────────────────────────────────────────────────────────

function buildProposalReminderEmail({ clientName, senderName, proposalTitle, amount, validUntil, signUrl, reminderNum, urgency, borderColor, customMessage }: {
  clientName: string; senderName: string; proposalTitle: string; amount: string;
  validUntil: string | null; signUrl: string; reminderNum: number; urgency: string;
  borderColor: string; customMessage: string | null;
}) {
  const customBlock = customMessage
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">${customMessage.replace(/\n/g, "<br>")}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
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
          ${customBlock}
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:13px;color:#64748b;">Objet</td><td align="right" style="font-size:13px;font-weight:600;color:#0f172a;">${proposalTitle}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding-top:8px;">Montant</td><td align="right" style="font-size:18px;font-weight:800;color:#1d4ed8;padding-top:8px;">${amount}</td></tr>
              ${validUntil ? `<tr><td style="font-size:13px;color:#64748b;padding-top:8px;">Valable jusqu'au</td><td align="right" style="font-size:13px;font-weight:600;color:#dc2626;padding-top:8px;">${new Date(validUntil).toLocaleDateString("fr-FR")}</td></tr>` : ""}
            </table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${signUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Consulter et signer le devis &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Relance automatique via <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">Deviso</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildInvoiceReminderEmail({ clientName, senderName, invoiceNumber, amount, daysOverdue, paymentLinkUrl, reminderNum, urgency, customMessage }: {
  clientName: string; senderName: string; invoiceNumber: string; amount: string;
  daysOverdue: number; paymentLinkUrl: string | null; reminderNum: number; urgency: string;
  customMessage: string | null;
}) {
  const borderColor = reminderNum >= 3 ? "#dc2626" : reminderNum === 2 ? "#d97706" : "#4f46e5";
  const btnColor = reminderNum >= 3 ? "#dc2626" : "#4f46e5";

  const customBlock = customMessage
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">${customMessage.replace(/\n/g, "<br>")}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
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
            Nous vous contactons au nom de <strong style="color:#0f172a;">${senderName}</strong> concernant la facture suivante, dont le paiement n'a pas encore été reçu.
          </p>
          ${customBlock}
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:13px;color:#64748b;">Facture</td><td align="right" style="font-size:13px;font-weight:700;color:#0f172a;">${invoiceNumber}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding-top:8px;">Montant dû</td><td align="right" style="font-size:18px;font-weight:800;color:#dc2626;padding-top:8px;">${amount}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding-top:8px;">En retard de</td><td align="right" style="font-size:13px;font-weight:700;color:#dc2626;padding-top:8px;">${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}</td></tr>
            </table>
          </div>
          ${paymentLinkUrl ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${paymentLinkUrl}" style="display:inline-block;background:${btnColor};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Payer maintenant &rarr;
              </a>
            </td></tr>
          </table>` : ""}
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
            En cas de paiement déjà effectué, veuillez ignorer ce message. Merci.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Relance automatique envoyée via <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">Deviso</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
