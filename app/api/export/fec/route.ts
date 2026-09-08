import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

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

/**
 * Code du compte auxiliaire client.
 *
 * Il était dérivé de l'INDEX DE LA LIGNE dans l'export. Deux conséquences :
 * un même client changeait de code auxiliaire à chaque facture, et `C00001`
 * désignait un client différent d'une année sur l'autre. Le lettrage
 * auxiliaire — la raison d'être de cette colonne — était donc inexploitable.
 *
 * On le dérive maintenant du nom normalisé du client, stable par construction.
 * Un préfixe alphabétique plus une empreinte courte : pas de collision en
 * pratique, et le même client garde son code d'un exercice à l'autre.
 */
function clientCode(nomNormalise: string): string {
  let h = 0;
  for (let i = 0; i < nomNormalise.length; i++) {
    h = (h * 31 + nomNormalise.charCodeAt(i)) >>> 0;
  }
  return `C${String(h % 100000).padStart(5, "0")}`;
}

// GET /api/export/fec?year=2025, Solo + Pro
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

    /**
     * Un avoir s'enregistre en SENS INVERSE d'une facture.
     *
     * Il passait dans le même moule que la facture qu'il annule. Les montants
     * d'un avoir sont positifs — c'est la règle BR-27, le type du document
     * porte le sens — donc une facture de 1 000 € HT suivie de son avoir
     * produisait 2 000 € de crédit au 706 et 400 € de TVA collectée au lieu de
     * zéro. L'équilibre débit/crédit tenait, ce qui est le pire des cas : le
     * contrôle de cohérence du cabinet ne voyait rien, et le chiffre d'affaires
     * comme la TVA collectée étaient doublés.
     *
     * On ne retranche pas : on inverse le sens des écritures, ce qui est la
     * pratique comptable et laisse la trace de l'avoir dans le journal.
     */
    const estAvoir = inv.invoice_type === "avoir" || inv.type_code === "381";
    const lib = `${estAvoir ? "Avoir" : "Facture"} ${ref}`;
    const numStr = `VT${String(i + 1).padStart(6, "0")}`;
    const cCode = clientCode(clientLib);
    const ht = +(inv.total_ht ?? 0).toFixed(2);
    const ttc = +(inv.total_ttc ?? 0).toFixed(2);
    const tva = +(ttc - ht).toFixed(2);

    // 706 « prestations de services » ou 707 « ventes de marchandises » : le
    // plan comptable les distingue, et l'information existe déjà sur la
    // facture. Tout était imputé en 706, y compris les ventes de biens.
    const compteVente = inv.operation_category === "goods" ? "707000" : "706000";
    const libelleVente =
      inv.operation_category === "goods" ? "Ventes de marchandises" : "Prestations de services";

    const row = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
      [numStr, date, compte, compteLib, auxNum, auxLib, ref, date, lib, amt(debit), amt(credit), "", "", date, "", ""];

    // Client : débité sur une facture (il doit), crédité sur un avoir (on lui doit).
    rows.push([
      "VT",
      "Ventes",
      ...row("411000", "Clients", cCode, clientLib, estAvoir ? 0 : ttc, estAvoir ? ttc : 0),
    ]);
    // Produit : crédité sur une facture, débité sur un avoir.
    rows.push([
      "VT",
      "Ventes",
      ...row(compteVente, libelleVente, "", "", estAvoir ? ht : 0, estAvoir ? 0 : ht),
    ]);
    if (tva > 0) {
      rows.push([
        "VT",
        "Ventes",
        ...row("445710", `TVA collectee ${inv.tva_rate}%`, "", "", estAvoir ? tva : 0, estAvoir ? 0 : tva),
      ]);
    }

    // Lignes de règlement si payée
    if (inv.status === "paid") {
      // Date d'encaissement réelle, pas `updated_at`.
      //
      // `updated_at` bouge à la moindre modification : une facture réglée le
      // 15/12 puis simplement rouverte le 03/01 produisait une écriture de
      // banque datée du 03/01 **dans le FEC de l'année précédente** — une
      // écriture hors exercice, que le contrôle de la DGFiP relève.
      const payDate = fecDate(inv.paid_at || inv.updated_at || inv.issue_date);
      const payNum = `BQ${String(i + 1).padStart(6, "0")}`;
      const payLib = `${estAvoir ? "Remboursement" : "Reglement"} ${ref}`;

      const payRow = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
        [payNum, payDate, compte, compteLib, auxNum, auxLib, ref, payDate, payLib, amt(debit), amt(credit), "", "", payDate, "", ""];

      // Un avoir remboursé sort de la banque, il n'y entre pas.
      rows.push([
        "BQ",
        "Banque",
        ...payRow("512000", "Banque", "", "", estAvoir ? 0 : ttc, estAvoir ? ttc : 0),
      ]);
      rows.push([
        "BQ",
        "Banque",
        ...payRow("411000", "Clients", cCode, clientLib, estAvoir ? ttc : 0, estAvoir ? 0 : ttc),
      ]);
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
