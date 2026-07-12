import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

// GET /api/export/invoices-csv?year=2025, Pro only
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
    .select("*")
    .eq("user_id", workspaceId)
    .gte("issue_date", `${year}-01-01`)
    .lte("issue_date", `${year}-12-31`)
    .order("issue_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  function esc(val: string | null | undefined): string {
    if (!val) return "";
    const str = String(val).replace(/"/g, '""');
    return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
  }

  function fmtDate(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR");
  }

  function fmtAmt(n: number | null): string {
    if (n == null) return "0,00";
    return n.toFixed(2).replace(".", ",");
  }

  const STATUS_FR: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
    cancelled: "Annulée",
  };

  const headers = [
    "Numéro",
    "Date d'émission",
    "Date d'échéance",
    "Client",
    "Entreprise client",
    "SIREN client",
    "Statut",
    "Montant HT (€)",
    "TVA %",
    "Montant TVA (€)",
    "Montant TTC (€)",
    "Lien de paiement",
  ];

  const rows = (invoices ?? []).map((inv) => {
    const tva = (inv.total_ttc ?? 0) - (inv.total_ht ?? 0);
    return [
      esc(inv.invoice_number),
      esc(fmtDate(inv.issue_date)),
      esc(fmtDate(inv.due_date)),
      esc(inv.client_name),
      esc(inv.client_company),
      esc(inv.client_siren),
      esc(STATUS_FR[inv.status] ?? inv.status),
      fmtAmt(inv.total_ht),
      fmtAmt(inv.tva_rate),
      fmtAmt(tva),
      fmtAmt(inv.total_ttc),
      esc(inv.payment_link_url),
    ];
  });

  // BOM UTF-8 pour Excel
  const BOM = "﻿";
  const csv = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const filename = `Factures_${year}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
