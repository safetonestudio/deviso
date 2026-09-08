import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import { resend } from "@/lib/resend";
import { piedDePageMarque } from "@/lib/emails/branding";
import { cronAutorise } from "@/lib/cron-auth";
import { numeroDocument } from "@/lib/numerotation";

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
  if (!cronAutorise(req)) {
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
      .select("full_name, company_name, siret, address, email, tva_number, plan, proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
      .eq("id", rec.user_id)
      .single();

    if (!profile) continue;

    // Numéro de facture : la règle partagée, et surtout PAS de repli.
    //
    // Cette ligne était `invoiceNumber || \`${année}-REC\``, exactement le
    // motif que `lib/numerotation.ts` documente comme ayant déjà causé un
    // incident et qu'il interdit depuis. L'erreur de la fonction SQL n'était
    // même pas lue : le jour où l'appel échoue — il a déjà échoué, faute de
    // droits d'exécution — TOUTES les factures récurrentes de TOUS les comptes
    // prennent le numéro « 2026-REC », partent par courriel au client, et
    // violent l'article 242 nonies A du CGI qui impose une numérotation
    // continue et sans doublon. Un numéro inventé pour éviter une erreur
    // produit une facture irrégulière, ce qui est plus grave que l'échec qu'il
    // masque : on abandonne cette échéance et on la reprendra demain.
    let number: string;
    try {
      number = await numeroDocument(supabase, rec.user_id, "standard");
    } catch (err) {
      console.error(`[cron/recurring] ${rec.id} : numérotation indisponible`, err);
      continue;
    }

    // Totaux arrondis au centime, comme partout ailleurs : sans cela la somme
    // des lignes du PDF ne correspond pas au total imprimé, et le XML embarqué
    // viole BR-CO-10.
    const centimes = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
    const lignes = rec.items.map((it) => ({ ...it, total: centimes(it.total) }));
    const total_ht = centimes(lignes.reduce((sum, item) => sum + item.total, 0));
    const total_ttc = centimes(total_ht * (1 + rec.tva_rate / 100));

    const issue_date = today;
    const due_date = computeDueDate(rec.payment_terms);

    /**
     * On réserve l'échéance AVANT de créer la facture.
     *
     * L'ordre était l'inverse : numéro consommé, facture insérée, courriel
     * envoyé, puis seulement `next_billing_date` avancé. Cette fonction n'a
     * aucune limite de durée déclarée et rend un PDF par facture (deux à
     * quatre secondes pièce) : au 1er du mois, avec quelques centaines
     * d'abonnements, elle est tuée par Vercel au bout de quinze ou vingt.
     * Toutes les échéances non avancées repassaient le lendemain — même
     * période, deuxième numéro légal, deuxième facture, deuxième courriel au
     * client. Une facture en double ne s'annule que par un avoir.
     *
     * En réservant d'abord, sous condition que la date n'ait pas bougé, une
     * exécution coupée ne refacture rien : elle a simplement sauté une
     * échéance, ce qui se rattrape. Le `.eq("next_billing_date", …)` rend
     * l'opération sûre même si deux exécutions du cron se croisent — Vercel
     * garantit « au moins une fois », pas « exactement une fois ».
     */
    const next_billing_date = computeNextBillingDate(rec.interval, rec.day_of_month, rec.next_billing_date);
    const { data: reservee } = await supabase
      .from("recurring_invoices")
      .update({ last_billed_at: new Date().toISOString(), next_billing_date })
      .eq("id", rec.id)
      .eq("next_billing_date", rec.next_billing_date)
      .select("id");

    if (!reservee || reservee.length === 0) {
      // Une autre exécution s'en occupe déjà.
      continue;
    }

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
        items: lignes,
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
        // Coordonnées de paiement : elles n'étaient pas passées, et une facture
        // récurrente partait donc SANS IBAN ni lien de paiement, là où toute
        // facture émise à la main en porte. Le client reçoit une facture et ne
        // sait pas où payer — sur un abonnement, tous les mois.
        const paymentInfo = {
          method: (profile.payment_method || "none") as "none" | "link" | "bank" | "both",
          linkProvider: profile.payment_link_provider,
          linkUrl: profile.payment_link_profile,
          bankIban: profile.bank_iban,
          bankBic: profile.bank_bic,
          bankAccountName: profile.bank_account_name,
        };
        const pdfBuffer = await generateFacturXPdf(invoice, accentColor, paymentInfo);
        const filename = facturxFilename(invoice);
        const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(total_ttc);
        const clientName = rec.client_company || rec.client_name || "Client";
        const senderName = profile.company_name || profile.full_name || "Votre prestataire";
        const brand = accentColor || "#4f46e5";

        const dueDateFormatted = due_date
          ? new Date(due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
          : null;

        const html = buildInvoiceEmail({ clientName, senderName, invoiceNumber: number, amount, brand, dueDate: dueDateFormatted, plan: profile?.plan ?? null });

        await resend.emails.send({
          // Le client a reçu le devis ou la facture au nom de son prestataire.
          // Recevoir la relance de « Deviso », une société qu'il ne connaît pas,
          // ressemble à une tentative d'hameçonnage et abîme la crédibilité de
          // l'émetteur. Le nom commercial doit être le même partout.
          from: `${profile?.company_name || profile?.full_name || "Deviso"} <noreply@getdeviso.fr>`,
          // Reply-To vers l'émetteur : sans lui, la réponse du client se perd.
          ...(profile?.email ? { replyTo: profile.email } : {}),
          to: rec.client_email,
          subject: `Facture ${number}, ${amount}`,
          html,
          attachments: [{ filename, content: Buffer.from(pdfBuffer).toString("base64") }],
        });
      } catch (err) {
        // L'envoi a échoué. La facture, elle, existe — et elle porte le statut
        // « envoyée », que la boucle de relance interprète comme « le client
        // l'a reçue ». Sans cette correction, le client recevait trois rappels
        // de paiement pour une facture qu'il n'avait jamais vue, et le
        // freelance n'avait aucun moyen de comprendre pourquoi son client
        // s'énervait : le `catch` d'origine était vide, il n'écrivait même pas
        // dans les journaux.
        console.error(
          `[cron/recurring] facture ${number} créée mais NON envoyée à ${rec.client_email} :`,
          err
        );
        await supabase.from("invoices").update({ status: "draft" }).eq("id", invoice.id);
      }
    }

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

function buildInvoiceEmail({ clientName, senderName, invoiceNumber, amount, brand, dueDate, plan }: {
  clientName: string; senderName: string; invoiceNumber: string; amount: string; brand: string; dueDate: string | null;
  plan: string | null;
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
        ${piedDePageMarque(plan, "Facture émise via", brand)
          ? `<tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">${piedDePageMarque(plan, "Facture émise via", brand)}</td></tr>`
          : ""}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
