import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import type { ProposalItem } from "@/types";
import { getWorkspaceUserId } from "@/lib/workspace";

// GET /api/invoices
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const workspaceId = await getWorkspaceUserId(user.id);

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

// POST /api/invoices
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  // Bloquer les utilisateurs Free (pas de factures)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, payment_method")
    .eq("id", workspaceId)
    .single();

  if (!profile || profile.plan === "free") {
    return NextResponse.json(
      { error: "PLAN_REQUIRED", message: "La création de factures nécessite le plan Solo ou Pro." },
      { status: 403 }
    );
  }

  // Bloquer si aucun moyen de paiement configuré
  if (!profile.payment_method || profile.payment_method === "none") {
    return NextResponse.json(
      {
        error: "PAYMENT_NOT_CONFIGURED",
        message: "Configurez votre moyen de paiement dans l'onglet Paiements avant de créer une facture.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const invoiceType = body.invoice_type || "standard";

  // Génère le numéro de facture auto si absent
  let invoiceNumber = body.invoice_number;
  if (!invoiceNumber) {
    if (invoiceType === "acompte") {
      // Séquence atomique via document_sequences, garantit AC-YYYY-NNN continu sans race condition
      const { data: numData } = await supabase
        .rpc("next_acompte_number", { p_user_id: workspaceId });
      invoiceNumber = numData || `AC-${new Date().getFullYear()}-001`;
    } else {
      // Séquence atomique via document_sequences, garantit YYYY-NNN continu sans race condition
      const { data: numData } = await supabase
        .rpc("next_invoice_number", { p_user_id: workspaceId });
      invoiceNumber = numData || `${new Date().getFullYear()}-001`;
    }
  }

  const itemsWithIds = ((body.items || []) as ProposalItem[]).map((item) => ({
    ...item,
    id: item.id || uuidv4(),
  }));

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      ...body,
      user_id: workspaceId,
      created_by: user.id,
      invoice_number: invoiceNumber,
      items: itemsWithIds,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data }, { status: 201 });
}
