import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { genererFec, STATUTS_FEC } from "@/lib/exports-comptables";

// GET /api/export/fec?year=2025, Solo + Pro.
// Le contenu est fabrique par lib/exports-comptables, source partagee avec le
// cockpit cabinet : le comptable importe exactement ce fichier.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Le profil de l'ESPACE, pas celui de la personne connectée : un
  // collaborateur lisait sinon SON plan au lieu de celui de l'entreprise.
  const workspaceId = await getWorkspaceUserId(user.id);
  const profile = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");

  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const year = req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear());

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .in("status", [...STATUTS_FEC])
    .gte("issue_date", `${year}-01-01`)
    .lte("issue_date", `${year}-12-31`)
    .order("issue_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const content = genererFec(invoices ?? []);
  const filename = `FEC_${year}_${new Date().toISOString().split("T")[0]}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
