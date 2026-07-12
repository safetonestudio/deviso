import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import { resend } from "@/lib/resend";

// Vercel cron, déclenché quotidiennement à 7h
// Génère les factures récurrentes dont la date de facturation est arrivée

type RecurringInvoice = {
  id: string;
  user_id: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_address: string | null;
  items: Array<{ id?: string; description: string; quantity: number; unit: string; unit_price: number; total: number }>;
  tva_rate: number;
  payment_terms: string | null;
  notes: string | null;
  interval: string;
  day_of_month: number;
  next_billing_date: string;
  active: boolean;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Récupérer toutes les factures récurrentes actives dont la date est arrivée
  const { data: dueRecurring } = await supabase
    .from("recurring_invoices")
    .select("*")
    .eq("active", true)
    .lte("next_billing_date", today);

  if (!dueRecurring || dueRecurring.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  let generated = 0;

  for (const rec of dueRecurring as RecurringInvoice[]) {
    // Récupérer le profil du propriétaire (pour numéro de facture, seller info, couleur)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, siret, address, email, tva_number, plan, proposal_color")
      .eq("id", rec.user_id)
      .single();

    if (!profile) continue;

    // Générer le numéro de facture
    const { data: invoiceNumber } = await supabase.rpc("next_invoice_number", { p_user_id: rec.user_id });
    const number = invoiceNumber || `${new Date().getFullYear()}-REC`;

    // Calculer les totaux
    const total_ht = rec.items.reduce((sum, item) => sum + item.total, 0);
    const tva_amount = total_ht * (rec.tva_rate / 100);
    const total_ttc = total_ht + tva_amount;

    const issue_date = today;
    const due_date = computeDueDate(rec.payment_terms);

    // Créer la facture
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: rec.user_id,
        invoice_number: number,
        client_name: rec.client_name,
        client_email: rec.client_email,
        client_company: rec.client_company,
        client_address: rec.client_address,
        seller_name: profile.full_name,
        seller_company: profile.company_name,
        seller_siren: profile.siret,
        seller_address: profile.address,
        seller_tva_number: profile.tva_number,
        items: rec.items,
        total_ht,
        tva_rate: rec.tva_rate,
        total_ttc,
        type_code: "380",
        operation_category: "services",
        payment_on_debit: false,
        issue_date,
        due_date,
        payment_terms: rec.payment_terms,
        notes: rec.notes,
        status: rec.client_email ? "sent" : "draft",
      })
      .select()
      .single();

    if (invoiceError || !invoice) continue;

    // Envoyer l'email si client_email défini
    if (rec.client_email) {
      try {
        const accentColor = profile.proposal_color ?? undefined;
        const pdfBuffer = await generateFacturXPdf(invoice, accentColor);
        const filename = facturxFilename(invoice);
        const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(total_ttc);
        const clientName = rec.client_company || rec.client_name || "Client";
        const senderName = profile.company_name || profile.full_name || "Votre prestataire";
        const brand = accentColor || "#4f46e5";

        const dueDateFormatted = due_date
          ? new Date(due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
          : null;

        const html = buildInvoiceEmail({ clientName, senderName, invoiceNumber: number, amount, brand, dueDate: dueDateFormatted });

        await resend.emails.send({
          from: "Deviso <noreply@getdeviso.fr>",
          to: rec.client_email,
          subject: `Facture ${number}, ${amount}`,
          html,
          attachments: [{ filename, content: Buffer.from(pdfBuffer).toString("base64") }],
        });
      } catch {
        // L'email a échoué mais la facture est créée, on continue
      }
    }

    // Calculer la prochaine date de facturation
    const next_billing_date = computeNextBillingDate(rec.interval, rec.day_of_month, rec.next_billing_date);

    await supabase
      .from("recurring_invoices")
      .update({ last_billed_at: new Date().toISOString(), next_billing_date })
      .eq("id", rec.id);

    generated++;
  }

  return NextResponse.json({ generated });
}

function computeNextBillingDate(interval: string, day: number, fromDate: string): string {
  const base = new Date(fromDate);
  if (interval === "monthly") base.setMonth(base.getMonth() + 1);
  else if (interval === "quarterly") base.setMonth(base.getMonth() + 3);
  else if (interval === "yearly") base.setFullYear(base.getFullYear() + 1);
  // Ajuste le jour du mois (attention aux mois courts)
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, lastDay));
  return base.toISOString().split("T")[0];
}

function computeDueDate(paymentTerms: string | null): string {
  const days = paymentTerms ? extractDays(paymentTerms) : 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function extractDays(terms: string): number {
  const match = terms.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

function buildInvoiceEmail({ clientName, senderName, invoiceNumber, amount, brand, dueDate }: {
  clientName: string; senderName: string; invoiceNumber: string; amount: string; brand: string; dueDate: string | null;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:${brand};padding:28px 36px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">Deviso</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">Bonjour ${clientName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            Veuillez trouver ci-joint la facture de <strong style="color:#0f172a;">${senderName}</strong>.
          </p>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;">Numéro de facture</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;">${invoiceNumber}</td>
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
}
