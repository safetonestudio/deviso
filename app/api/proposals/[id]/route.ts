import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

// GET /api/proposals/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  if (data.user_id !== user?.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ proposal: data });
}

// PATCH /api/proposals/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Les documents appartiennent à l'espace de travail, pas au collaborateur :
  // filtrer sur user.id renvoyait 404 à tout membre d'équipe, alors que la
  // liste les affichait. Le plan Pro est vendu sur le multi-utilisateurs.
  const workspaceId = await getWorkspaceUserId(user.id);

  const body = await req.json();

  const { data, error } = await supabase
    .from("proposals")
    .update(body)
    .eq("id", id)
    .eq("user_id", workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data });
}

// DELETE /api/proposals/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", id)
    .eq("user_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
