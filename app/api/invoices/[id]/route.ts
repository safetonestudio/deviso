import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type Params = { params: Promise<{ id: string }> };

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // Enrichir linked_invoice_number pour les factures de solde
  let enriched = { ...data };
  if (data.linked_invoice_id) {
    const { data: linked } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("id", data.linked_invoice_id)
      .single();
    if (linked) enriched.linked_invoice_number = linked.invoice_number;
  }

  return NextResponse.json({ invoice: enriched });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  // Whitelist des champs modifiables, jamais user_id, invoice_number, etc.
  const ALLOWED = [
    "status", "title", "client_name", "client_email", "client_company",
    "client_address", "items", "total_ht", "tva_rate", "total_ttc",
    "issue_date", "due_date", "payment_terms", "notes", "invoice_type",
    "deposit_percentage", "linked_invoice_id", "operation_category",
    "payment_on_debit", "type_code", "chorus_pro_ref", "chorus_pro_submitted_at",
  ] as const;
  const safeUpdate = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k as typeof ALLOWED[number]))
  );

  // Charger la facture actuelle pour détecter le changement de statut
  const { data: current } = await supabase
    .from("invoices")
    .select("status, invoice_number")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("invoices")
    .update(safeUpdate)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notification quand une facture passe à "paid"
  if (body.status === "paid" && current?.status !== "paid") {
    const invoiceNum = current?.invoice_number || data.invoice_number || "Facture";
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "invoice_paid",
      title: "Facture marquée payée 💰",
      body: `La facture ${invoiceNum} a été marquée comme payée.`,
      link: `/invoices/${id}`,
    });
  }

  return NextResponse.json({ invoice: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
