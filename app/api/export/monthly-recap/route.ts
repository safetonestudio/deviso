import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

// GET /api/export/monthly-recap?year=2025, Pro only
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
    .select("issue_date, total_ht, total_ttc, tva_rate, status, invoice_type")
    .eq("user_id", workspaceId)
    // Un brouillon n'est pas du chiffre d'affaires : il n'est parti nulle part
    // et son numéro n'est même pas définitif. Il n'était exclu nulle part, et
    // gonflait à la fois le CA du mois et la colonne « impayé ».
    .in("status", ["sent", "paid"])
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
    // Un avoir RETRANCHE du chiffre d'affaires : ses montants sont positifs
    // (règle BR-27, c'est le type du document qui porte le sens), et ils
    // étaient additionnés. Une facture de 1 000 € et son avoir affichaient
    // 2 000 € de CA au lieu de zéro.
    const signe = inv.invoice_type === "avoir" ? -1 : 1;
    const ht = signe * (inv.total_ht ?? 0);
    const ttc = signe * (inv.total_ttc ?? 0);
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
  const filename = `Recap_CA_${year}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
