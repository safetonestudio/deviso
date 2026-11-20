import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { journaliser } from "@/lib/cabinet-journal";
import { genererFec, genererCsvFactures, nomFichierFec, segmentFichier, STATUTS_FEC } from "@/lib/exports-comptables";
import { creerZip, type FichierZip } from "@/lib/zip";
import { validerPlan, PLAN_PAR_DEFAUT } from "@/lib/plan-comptes-fec";
import { generateFacturXPdf } from "@/lib/facturx";
import { documentLie } from "@/lib/document-lie";
import type { Invoice } from "@/types";

// Joindre les PDF : la generation prend du temps (une facture apres l'autre).
export const maxDuration = 60;

/** Au-dela, les PDF ne tiendraient pas dans le temps imparti : dossier par dossier. */
const MAX_PDF = 150;

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
  // PDF des factures nommes comme leur piece (PieceRef) : le logiciel du
  // cabinet rattache chaque PDF a son ecriture sans intervention (20/11/2026).
  const avecPdf = format === "fec" && params.get("pdf") === "1";
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
    .select("id, company_name, full_name, siret, proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
    .in("id", selection);

  // Le plan de comptes du CABINET (réglé dans son espace), appliqué à tous
  // ses FEC. Un plan illisible retombe sur le plan par défaut, jamais d'erreur.
  const { data: profilCabinet } = await admin.from("profiles").select("plan_comptes_fec").eq("id", user.id).maybeSingle();
  const lu = validerPlan(profilCabinet?.plan_comptes_fec ?? null);
  const plan = "plan" in lu ? lu.plan : PLAN_PAR_DEFAUT;

  const fichiers: FichierZip[] = [];
  let nbPdf = 0;
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

    if (!avecPdf) {
      fichiers.push(
        format === "fec"
          ? { nom: nomFichierFec(p?.siret, year, base), contenu: genererFec(invoices ?? [], plan) }
          : { nom: `Factures_${year}_${base}.csv`, contenu: genererCsvFactures(invoices ?? []) },
      );
      continue;
    }

    // Avec les PDF : un dossier par client, le FEC et ses pieces.
    nbPdf += (invoices ?? []).length;
    if (nbPdf > MAX_PDF) {
      return NextResponse.json(
        { error: `Trop de factures pour joindre les PDF en un seul téléchargement (plus de ${MAX_PDF}). Exportez dossier par dossier.` },
        { status: 413 },
      );
    }
    fichiers.push({ nom: `${base}/${nomFichierFec(p?.siret, year, base)}`, contenu: genererFec(invoices ?? [], plan) });
    const paymentInfo = p
      ? {
          method: (p.payment_method || "none") as "none" | "link" | "bank" | "both",
          linkProvider: p.payment_link_provider,
          linkUrl: p.payment_link_profile,
          bankIban: p.bank_iban,
          bankBic: p.bank_bic,
          bankAccountName: p.bank_account_name,
        }
      : undefined;
    for (const inv of invoices ?? []) {
      if (!inv.invoice_number) continue;
      const lie = await documentLie(admin, inv, ownerId);
      const pdf = await generateFacturXPdf(inv as Invoice, p?.proposal_color ?? undefined, paymentInfo, lie.numero, lie.date);
      fichiers.push({ nom: `${base}/pieces/${segmentPiece(inv.invoice_number)}.pdf`, contenu: new Uint8Array(pdf) });
    }
  }

  await journaliser(
    admin,
    user.id,
    format === "fec" ? "export_fec" : "export_csv",
    selection.length === 1 ? selection[0] : null,
    `${year} · ${selection.length} dossier${selection.length > 1 ? "s" : ""}`,
  );

  if (fichiers.length === 1 && !avecPdf) {
    const f = fichiers[0];
    return new NextResponse(f.contenu as string, {
      headers: {
        "Content-Type": format === "fec" ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${f.nom}"`,
      },
    });
  }

  const zip = creerZip(fichiers);
  const nomZip = `${format === "fec" ? "FEC" : "Factures"}${avecPdf ? "_et_pieces" : ""}_${year}_${selection.length === 1 ? segmentFichier((profils ?? [])[0]?.company_name || (profils ?? [])[0]?.full_name || "dossier") : "portefeuille"}_${new Date().toISOString().split("T")[0]}.zip`;
  return new NextResponse(zip.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomZip}"`,
    },
  });
}

/**
 * Nom du PDF d'une piece : le numero de facture tel quel (c'est la PieceRef
 * du FEC), sans les seuls caracteres interdits dans un nom de fichier.
 */
function segmentPiece(numero: string): string {
  return numero.replace(/[\\/:*?"<>|]/g, "_");
}
