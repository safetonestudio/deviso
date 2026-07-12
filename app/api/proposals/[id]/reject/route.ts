import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getWorkspaceUserId } from "@/lib/workspace";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  // Only the workspace owner can reject
  if (user.id !== workspaceId) {
    return NextResponse.json({ error: "Seul le propriétaire peut refuser" }, { status: 403 });
  }

  const { data: proposal } = await supabaseAdmin
    .from("proposals")
    .select("id, approval_status")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("proposals")
    .update({ approval_status: "rejected" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
