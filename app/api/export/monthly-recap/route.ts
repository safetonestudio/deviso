import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

// GET /api/export/monthly-recap?year=2025, Pro only
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const year = req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear());

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("issue_date, total_ht, total_ttc, tva_rate, status")
    .eq("user_id", workspaceId)
    .neq("status", "cancelled")
    .gte("issue_date", `${year}-01-01`)
    .lte("issue_date", `${year}-12-31`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  type MonthData = {
    nb_factures: number;
    ca_ht: number;
    tva: number;
    ca_ttc: number;
    paye_ttc: number;
    impaye_ttc: number;
  };

  const byMonth: Record<number, MonthData> = {};
  for (let m = 0; m < 12; m++) {
    byMonth[m] = { nb_factures: 0, ca_ht: 0, tva: 0, ca_ttc: 0, paye_ttc: 0, impaye_ttc: 0 };
  }

  (invoices ?? []).forEach((inv) => {
    const m = new Date(inv.issue_date).getMonth();
    const ht = inv.total_ht ?? 0;
    const ttc = inv.total_ttc ?? 0;
    const tva = ttc - ht;
    byMonth[m].nb_factures++;
    byMonth[m].ca_ht += ht;
    byMonth[m].tva += tva;
    byMonth[m].ca_ttc += ttc;
    if (inv.status === "paid") byMonth[m].paye_ttc += ttc;
    else byMonth[m].impaye_ttc += ttc;
  });

  function fmtAmt(n: number): string {
    return n.toFixed(2).replace(".", ",");
  }

  const headers = [
    "Mois",
    "Nb factures",
    "CA HT (€)",
    "TVA (€)",
    "CA TTC (€)",
    "Encaissé TTC (€)",
    "En attente TTC (€)",
  ];

  const rows = MONTHS.map((name, m) => {
    const d = byMonth[m];
    return [
      name,
      String(d.nb_factures),
      fmtAmt(d.ca_ht),
      fmtAmt(d.tva),
      fmtAmt(d.ca_ttc),
      fmtAmt(d.paye_ttc),
      fmtAmt(d.impaye_ttc),
    ];
  });

  // Ligne totaux
  const totals = Object.values(byMonth).reduce(
    (acc, d) => ({
      nb: acc.nb + d.nb_factures,
      ht: acc.ht + d.ca_ht,
      tva: acc.tva + d.tva,
      ttc: acc.ttc + d.ca_ttc,
      paye: acc.paye + d.paye_ttc,
      impaye: acc.impaye + d.impaye_ttc,
    }),
    { nb: 0, ht: 0, tva: 0, ttc: 0, paye: 0, impaye: 0 }
  );

  rows.push([
    `TOTAL ${year}`,
    String(totals.nb),
    fmtAmt(totals.ht),
    fmtAmt(totals.tva),
    fmtAmt(totals.ttc),
    fmtAmt(totals.paye),
    fmtAmt(totals.impaye),
  ]);

  const BOM = "﻿";
  const csv = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const filename = `Recap_CA_${year}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
