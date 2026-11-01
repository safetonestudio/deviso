import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { genererCsvFactures } from "@/lib/exports-comptables";

// GET /api/export/invoices-csv?year=2025, Solo + Pro.
// Le contenu est fabrique par lib/exports-comptables, source partagee avec le
// cockpit cabinet.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Le profil de l'ESPACE, pas celui de la personne connectée.
  const workspaceId = await getWorkspaceUserId(user.id);
  const profile = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;
  const year = req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear());

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .gte("issue_date", `${year}-01-01`)
    .lte("issue_date", `${year}-12-31`)
    .order("issue_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = genererCsvFactures(invoices ?? []);
  const filename = `Factures_${year}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
