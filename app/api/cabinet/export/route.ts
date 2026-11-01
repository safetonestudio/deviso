import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { journaliser } from "@/lib/cabinet-journal";
import { genererFec, genererCsvFactures, segmentFichier, STATUTS_FEC } from "@/lib/exports-comptables";
import { creerZip } from "@/lib/zip";

/**
 * Export comptable depuis le cockpit cabinet.
 *
 * GET /api/cabinet/export?format=fec|csv&year=2026&clients=<id>,<id>
 * Sans `clients` : tout le portefeuille. Un seul dossier : le fichier
 * directement. Plusieurs : une archive ZIP, un fichier par dossier.
 *
 * Chaque identifiant demande est confronte a la liste des dossiers auxquels le
 * cabinet a un acces actif : un identifiant hors portefeuille refuse TOUT
 * l'export, on ne livre jamais un sous-ensemble silencieux.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const format = params.get("format") === "csv" ? "csv" : "fec";
  const year = params.get("year") ?? String(new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) return NextResponse.json({ error: "Année invalide" }, { status: 400 });

  const admin = createAdminClient();
  const portefeuille = await dossiersDuCabinet(admin, user.id);
  if (portefeuille.length === 0) {
    return NextResponse.json({ error: "Aucun dossier rattaché" }, { status: 404 });
  }

  const demandes = (params.get("clients") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (demandes.some((id) => !portefeuille.includes(id))) {
    return NextResponse.json({ error: "Dossier hors de votre portefeuille" }, { status: 403 });
  }
  const selection = demandes.length > 0 ? [...new Set(demandes)] : portefeuille;

  const { data: profils } = await admin
    .from("profiles")
    .select("id, company_name, full_name")
    .in("id", selection);

  const fichiers: { nom: string; contenu: string }[] = [];
  const nomsPris = new Set<string>();
  for (const ownerId of selection) {
    let q = admin
      .from("invoices")
      .select("*")
      .eq("user_id", ownerId)
      .gte("issue_date", `${year}-01-01`)
      .lte("issue_date", `${year}-12-31`)
      .order("issue_date", { ascending: true });
    if (format === "fec") q = q.in("status", [...STATUTS_FEC]);
    const { data: invoices, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const p = (profils ?? []).find((x) => x.id === ownerId);
    let base = segmentFichier(p?.company_name || p?.full_name || "dossier");
    if (nomsPris.has(base)) base = `${base}_${ownerId.slice(0, 6)}`;
    nomsPris.add(base);

    fichiers.push(
      format === "fec"
        ? { nom: `FEC_${year}_${base}.txt`, contenu: genererFec(invoices ?? []) }
        : { nom: `Factures_${year}_${base}.csv`, contenu: genererCsvFactures(invoices ?? []) },
    );
  }

  await journaliser(
    admin,
    user.id,
    format === "fec" ? "export_fec" : "export_csv",
    selection.length === 1 ? selection[0] : null,
    `${year} · ${selection.length} dossier${selection.length > 1 ? "s" : ""}`,
  );

  if (fichiers.length === 1) {
    const f = fichiers[0];
    return new NextResponse(f.contenu, {
      headers: {
        "Content-Type": format === "fec" ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${f.nom}"`,
      },
    });
  }

  const zip = creerZip(fichiers);
  const nomZip = `${format === "fec" ? "FEC" : "Factures"}_${year}_portefeuille_${new Date().toISOString().split("T")[0]}.zip`;
  return new NextResponse(zip.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomZip}"`,
    },
  });
}
