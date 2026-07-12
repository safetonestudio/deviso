import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

// GET /api/templates, liste les modèles partagés du workspace
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", workspaceId)
    .single();

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("proposal_templates")
    .select("id, name, description, items, tva_rate, payment_terms, notes, created_by, created_at")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

// POST /api/templates, crée un modèle partagé
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", workspaceId)
    .single();

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, items, tva_rate, payment_terms, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom du modèle est requis." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("proposal_templates")
    .insert({
      user_id: workspaceId,
      created_by: user.id,
      name: name.trim(),
      description: description || null,
      items: items || [],
      tva_rate: tva_rate ?? 0,
      payment_terms: payment_terms || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
