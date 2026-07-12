import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/templates/[id], supprime un modèle (owner seulement)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  // Seul le workspace owner peut supprimer
  if (user.id !== workspaceId) {
    return NextResponse.json({ error: "Seul le propriétaire du workspace peut supprimer un modèle." }, { status: 403 });
  }

  const { error } = await supabase
    .from("proposal_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
