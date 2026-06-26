import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import type { ProposalItem } from "@/types";

// GET /api/proposals — liste tous les devis de l'utilisateur
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposals: data });
}

// POST /api/proposals — crée un nouveau devis
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier la limite plan Free (3 devis max)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (!profile || profile.plan !== "pro") {
    const { count } = await supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "LIMIT_REACHED", message: "Limite de 3 devis atteinte sur le plan gratuit." },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const {
    title, client_name, client_email, client_company,
    description, items, total_ht, tva_rate, total_ttc,
    valid_until, payment_terms, notes, ai_brief
  } = body;

  // Assigner un ID à chaque ligne si manquant
  const itemsWithIds = (items as ProposalItem[]).map((item) => ({
    ...item,
    id: item.id || uuidv4(),
  }));

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      title,
      client_name,
      client_email,
      client_company,
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
