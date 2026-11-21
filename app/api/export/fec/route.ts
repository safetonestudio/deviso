import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { genererFec, nomFichierFec, STATUTS_FEC, EcritureDesequilibree } from "@/lib/exports-comptables";
import { chargerAchats, toutLire } from "@/lib/achats-export";

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
  const profile = await getWorkspaceProfile<{ plan: string | null; siret: string | null }>(workspaceId, "plan, siret");

  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const year = req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) return NextResponse.json({ error: "Année invalide" }, { status: 400 });

  // Page par page : au-delà de 1 000 lignes, PostgREST tronque sans prévenir,
  // et un FEC privé de ses dernières ventes reste équilibré, donc muet.
  let invoices;
  try {
    invoices = await toutLire((de, a) =>
      supabase
        .from("invoices")
        .select("*")
        .eq("user_id", workspaceId)
        .in("status", [...STATUTS_FEC])
        .gte("issue_date", `${year}-01-01`)
        .lte("issue_date", `${year}-12-31`)
        .order("issue_date", { ascending: true })
        .order("id", { ascending: true })
        .range(de, a)
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Achats (factures reçues, achats à l'étranger) : journal des achats.
  let lus;
  try {
    lus = await chargerAchats(workspaceId, year);
  } catch {
    return NextResponse.json({ error: "Lecture des achats impossible" }, { status: 500 });
  }
  if (lus.nonRepris.length > 0) {
    return NextResponse.json(
      { error: `Achat impossible à convertir en euros, à corriger dans « Achats à l'étranger » : ${lus.nonRepris.join(" ; ")}` },
      { status: 422 },
    );
  }
  let content: string;
  try {
    content = genererFec(invoices ?? [], undefined, lus.achats);
  } catch (e) {
    if (e instanceof EcritureDesequilibree) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
  const filename = nomFichierFec(profile?.siret, year, new Date().toISOString().split("T")[0]);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
