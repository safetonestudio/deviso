import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import type { ProposalItem } from "@/types";
import { getWorkspaceUserId } from "@/lib/workspace";

// GET /api/proposals, liste tous les devis de l'utilisateur
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const workspaceId = await getWorkspaceUserId(user.id);

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposals: data });
}

// POST /api/proposals, crée un nouveau devis
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);

  // Devis illimités sur tous les plans (Free inclus)
  // La différenciation Free vs Solo se fait sur les features (IA, relances, e-signature…), pas sur le volume.

  const body = await req.json();
  const {
    title, client_name, client_email, client_company,
    client_address, client_siren,
    description, items, total_ht, tva_rate, total_ttc,
    valid_until, payment_terms, notes, ai_brief
  } = body;

  // Génère le numéro de devis auto
  const { data: numData } = await supabase
    .rpc("next_proposal_number", { p_user_id: workspaceId });
  const proposalNumber = numData || `D-${new Date().getFullYear()}-001`;

  // Assigner un ID à chaque ligne si manquant
  const itemsWithIds = (items as ProposalItem[]).map((item) => ({
    ...item,
    id: item.id || uuidv4(),
  }));

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      user_id: workspaceId,
      created_by: user.id,
      proposal_number: proposalNumber,
      title,
      client_name,
      client_email,
      client_company,
      client_address: client_address || null,
      client_siren: client_siren || null,
      description,
      items: itemsWithIds,
      total_ht,
      tva_rate,
      total_ttc,
      valid_until,
      payment_terms,
      notes,
      ai_brief,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data }, { status: 201 });
}
