import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

// GET /api/export/invoices-csv?year=2025, Pro only
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Le profil de l'ESPACE, pas celui de la personne connectée.
  //
  // Ce `.eq("id", user.id)` était un défaut discret et coûteux : sur un plan
  // Pro multi-utilisateurs, un collaborateur agissant sur un document de
  // l'espace lisait SON profil. Selon la route, cela donnait un PDF portant
  // son IBAN (ou aucun) au lieu de celui de l'entreprise — le client paie
  // alors sur le mauvais compte — ou un refus « plan insuffisant » sur une
  // fonction que l'espace paie pourtant.
  const profile = await getWorkspaceProfile<{ plan: string | null }>(
    await getWorkspaceUserId(user.id),
    "plan"
  );

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
    return /[;,"\n\r]/.test(str) ? `"${str}"` : str;
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
  // Séparateur point-virgule, et ce n'est pas une préférence.
  //
  // Les montants sont formatés à la française — « 1234,56 » — et étaient
  // joints par une virgule. Chaque colonne numérique éclatait donc en deux
  // champs : une ligne à douze colonnes en produisait seize, et Excel lisait
  // « Montant HT = 1234 », « TVA % = 56 ». TOUTES les lignes étaient fausses,
  // ligne de totaux comprise, et rien ne le signalait — le fichier s'ouvre
  // sans erreur, il est juste décalé.
  //
  // Le point-virgule est la convention qui va avec la virgule décimale : c'est
  // ce qu'Excel attend en locale française, et ce que Deviso produit déjà de
  // fait par le BOM UTF-8 juste en dessous.
  const SEP = ";";
  const csv = BOM + [headers.join(SEP), ...rows.map((r) => r.join(SEP))].join("\r\n");
  const filename = `Factures_${year}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
