import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

function fecDate(dateStr: string): string {
  const d = new Date(dateStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
}

function amt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function clientCode(idx: number): string {
  return `C${String(idx).padStart(5, "0")}`;
}

// GET /api/export/fec?year=2025, Solo + Pro
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const workspaceId = await getWorkspaceUserId(user.id);

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const year = req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear());

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .in("status", ["sent", "paid"])
    .gte("issue_date", `${year}-01-01`)
    .lte("issue_date", `${year}-12-31`)
    .order("issue_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const COLS = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib",
    "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate",
    "Montantdevise", "Idevise",
  ];

  const rows: string[][] = [COLS];

  (invoices ?? []).forEach((inv, i) => {
    const date = fecDate(inv.issue_date);
    const ref = inv.invoice_number;
    const clientLib = (inv.client_company || inv.client_name || "CLIENT")
      .toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 17);
    const lib = `Facture ${ref}`;
    const numStr = `VT${String(i + 1).padStart(6, "0")}`;
    const cCode = clientCode(i + 1);
    const ht = +(inv.total_ht ?? 0).toFixed(2);
    const ttc = +(inv.total_ttc ?? 0).toFixed(2);
    const tva = +(ttc - ht).toFixed(2);

    const row = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
      [numStr, date, compte, compteLib, auxNum, auxLib, ref, date, lib, amt(debit), amt(credit), "", "", date, "", ""];

    // Débit 411 client (TTC)
    rows.push(["VT", "Ventes", ...row("411000", "Clients", cCode, clientLib, ttc, 0)]);
    // Crédit 706 prestations (HT)
    rows.push(["VT", "Ventes", ...row("706000", "Prestations de services", "", "", 0, ht)]);
    // Crédit 445710 TVA collectée (si applicable)
    if (tva > 0) {
      rows.push(["VT", "Ventes", ...row("445710", `TVA collectée ${inv.tva_rate}%`, "", "", 0, tva)]);
    }

    // Lignes de règlement si payée
    if (inv.status === "paid") {
      const payDate = fecDate(inv.updated_at || inv.issue_date);
      const payNum = `BQ${String(i + 1).padStart(6, "0")}`;
      const payLib = `Règlement ${ref}`;

      const payRow = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
        [payNum, payDate, compte, compteLib, auxNum, auxLib, ref, payDate, payLib, amt(debit), amt(credit), "", "", payDate, "", ""];

      rows.push(["BQ", "Banque", ...payRow("512000", "Banque", "", "", ttc, 0)]);
      rows.push(["BQ", "Banque", ...payRow("411000", "Clients", cCode, clientLib, 0, ttc)]);
    }
  });

  const content = rows.map((r) => r.join("\t")).join("\r\n");
  const filename = `FEC_${year}_${new Date().toISOString().split("T")[0]}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
