import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { cloreSignalement } from "@/lib/cabinet-signalements";

/**
 * Le client marque comme traite un signalement de son cabinet (cote client).
 *
 * POST { id }. La cloture est bornee a l'espace du client (getWorkspaceUserId) :
 * un identifiant d'un autre espace ne clot rien.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const admin = createAdminClient();
  const clientId = await getWorkspaceUserId(user.id);
  const ok = await cloreSignalement(admin, id, clientId);
  if (!ok) return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
