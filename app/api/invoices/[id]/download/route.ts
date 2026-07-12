import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import type { Invoice } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
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
  const { data: profileData } = await supabase
    .from("profiles")
    .select("proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
    .eq("id", user.id)
    .single();

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentInfo = profileData ? {
    method: (profileData.payment_method || "none") as "none" | "link" | "bank" | "both",
    linkProvider: profileData.payment_link_provider,
    linkUrl: profileData.payment_link_profile,
    bankIban: profileData.bank_iban,
    bankBic: profileData.bank_bic,
    bankAccountName: profileData.bank_account_name,
  } : undefined;

  // Pour les factures de solde : récupérer le numéro de la facture d'acompte liée
  let linkedInvoiceNumber: string | null = null;
  if (invoice.invoice_type === "solde" && invoice.linked_invoice_id) {
    const { data: linkedInv } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("id", invoice.linked_invoice_id)
      .single();
    linkedInvoiceNumber = linkedInv?.invoice_number ?? null;
  }

  const pdfBuffer = await generateFacturXPdf(invoice, accentColor, paymentInfo, linkedInvoiceNumber);
  const filename = facturxFilename(invoice);

  // Sauvegarde optionnelle du chemin en BDD (best-effort)
  const storagePath = `invoices/${user.id}/${filename}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (!uploadError) {
    await supabase
      .from("invoices")
      .update({ facturx_pdf_path: storagePath })
      .eq("id", id);
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
