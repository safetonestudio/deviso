import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import { resend } from "@/lib/resend";
import type { Invoice } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const invoice = data as Invoice;
  if (!invoice.client_email) return NextResponse.json({ error: "Email client manquant" }, { status: 400 });

  const { data: profileData } = await supabase
    .from("profiles")
    .select("proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name, plan, company_name, full_name, email_domain, email_domain_verified")
    .eq("id", user.id)
    .single();

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentMethod = (profileData?.payment_method || "none") as "none" | "link" | "bank" | "both";
  const profilePaymentLink = profileData?.payment_link_profile ?? null;
  const paymentInfo = profileData ? {
    method: paymentMethod,
    linkProvider: profileData.payment_link_provider,
    linkUrl: profilePaymentLink,
    bankIban: profileData.bank_iban,
    bankBic: profileData.bank_bic,
    bankAccountName: profileData.bank_account_name,
  } : undefined;

  const pdfBuffer = await generateFacturXPdf(invoice, accentColor, paymentInfo);
  const filename = facturxFilename(invoice);
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(invoice.total_ttc);
  const clientName = invoice.client_company || invoice.client_name || "Client";
  const senderName = invoice.seller_company || invoice.seller_name || "Votre prestataire";
  const invoiceDisplayName = profileData?.company_name || invoice.seller_company || profileData?.full_name || "Votre prestataire";
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  // Lien de paiement : priorité au lien du profil, fallback sur l'ancien lien Stripe de la facture
  const paymentLinkForEmail = (paymentMethod === "link" || paymentMethod === "both") ? profilePaymentLink : null;
  const showBankInEmail = (paymentMethod === "bank" || paymentMethod === "both") && profileData?.bank_iban;

  const brand = accentColor || "#4f46e5";
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:${brand};padding:28px 36px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">${invoiceDisplayName}</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">Bonjour ${clientName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            Veuillez trouver ci-joint la facture de <strong style="color:#0f172a;">${invoiceDisplayName}</strong>.
          </p>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;">Numéro de facture</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">Montant</td>
                <td align="right" style="font-size:18px;font-weight:800;color:#0f172a;padding-top:8px;">${amount}</td>
              </tr>
              ${dueDate ? `<tr>
                <td style="font-size:13px;color:#64748b;padding-top:8px;">À régler avant le</td>
                <td align="right" style="font-size:13px;font-weight:700;color:${brand};padding-top:8px;">${dueDate}</td>
              </tr>` : ""}
            </table>
          </div>
          ${paymentLinkForEmail ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${paymentLinkForEmail}" style="display:inline-block;background:${brand};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Payer en ligne &rarr;
              </a>
            </td></tr>
          </table>` : ""}
          ${showBankInEmail ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Virement bancaire</p>
            ${profileData?.bank_account_name ? `<p style="margin:0 0 4px;font-size:13px;color:#166534;">Titulaire : <strong>${profileData.bank_account_name}</strong></p>` : ""}
            <p style="margin:0 0 4px;font-size:13px;color:#166534;font-family:monospace;">IBAN : ${(profileData?.bank_iban || "").replace(/(.{4})/g, "$1 ").trim()}</p>
            ${profileData?.bank_bic ? `<p style="margin:0;font-size:13px;color:#166534;font-family:monospace;">BIC : ${profileData.bank_bic}</p>` : ""}
          </div>` : ""}
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
            La facture Factur-X est jointe en PDF à cet email.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Facture émise via <a href="https://getdeviso.fr" style="color:${brand};text-decoration:none;">Deviso</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const useCustomDomain = profileData?.plan === "pro" && profileData?.email_domain_verified && profileData?.email_domain;
  const invoiceFrom = useCustomDomain
    ? `${invoiceDisplayName} <facturation@${profileData!.email_domain}>`
    : `${invoiceDisplayName} <noreply@getdeviso.fr>`;

  const { error: emailError } = await resend.emails.send({
    from: invoiceFrom,
    to: invoice.client_email,
    subject: `Votre facture de ${invoiceDisplayName} — ${invoice.invoice_number} (${amount})`,
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBuffer).toString("base64"),
      },
    ],
  });

  if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 });

  await supabase.from("invoices").update({ status: "sent" }).eq("id", id).eq("status", "draft");

  return NextResponse.json({ success: true });
}
