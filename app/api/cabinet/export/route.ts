import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { journaliser } from "@/lib/cabinet-journal";
import { genererFec, genererCsvFactures, nomFichierFec, segmentFichier, STATUTS_FEC, EcritureDesequilibree } from "@/lib/exports-comptables";
import { genererQuadra, nomPieceQuadra } from "@/lib/export-quadra";
import { chargerAchats, toutLire } from "@/lib/achats-export";
import type { AchatExport } from "@/lib/exports-comptables";
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
 * GET /api/cabinet/export?format=fec|quadra|csv&year=2026&clients=<id>,<id>
 * Sans `clients` : tout le portefeuille. Un seul dossier : le fichier
 * directement. Plusieurs : une archive ZIP, un fichier par dossier.
 *
 * Chaque identifiant demande est confronte a la liste des dossiers auxquels le
 * cabinet a un acces actif : un identifiant hors portefeuille refuse TOUT
 * l'export, on ne livre jamais un sous-ensemble silencieux.
 */
export async function GET(req: NextRequest) {
  try {
    return await exporter(req);
  } catch (e) {
    // Une ecriture desequilibree n'est jamais livree : le cabinet voit pourquoi.
    if (e instanceof EcritureDesequilibree) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}

async function exporter(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  // quadra : format d'import de Cegid Quadra (lib/export-quadra.ts), choisi par
  // le cabinet dans ses paramètres (lib/logiciels-comptables.ts).
  const demande = params.get("format");
  const format = demande === "csv" ? "csv" : demande === "quadra" ? "quadra" : "fec";
  const ecritures = format !== "csv";
  // PDF des factures nommes comme leur piece (PieceRef) : le logiciel du
  // cabinet rattache chaque PDF a son ecriture sans intervention (20/11/2026).
  const avecPdf = ecritures && params.get("pdf") === "1";
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
    .select("id, company_name, full_name, siret, proposal_color, proposal_template, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
    .in("id", selection);

  // Le plan de comptes du CABINET (réglé dans son espace), appliqué à tous
  // ses FEC. Un plan illisible retombe sur le plan par défaut, jamais d'erreur.
  const { data: profilCabinet } = await admin.from("profiles").select("plan_comptes_fec").eq("id", user.id).maybeSingle();
  const lu = validerPlan(profilCabinet?.plan_comptes_fec ?? null);
  const plan = "plan" in lu ? lu.plan : PLAN_PAR_DEFAUT;

  const fichiers: FichierZip[] = [];
  /** Achats qu'on n'a pas pu convertir en euros, par dossier : jamais tus. */
  const nonRepris: string[] = [];
  /** Points d'achat à vérifier par le cabinet (acompte non retrouvé, achat étranger en échec...). */
  const aVerifier: string[] = [];
  let nbPdf = 0;
  const nomsPris = new Set<string>();
  for (const ownerId of selection) {
    // Page par page, comme les achats : au-delà de 1 000 lignes PostgREST
    // tronque sans prévenir, et le FEC resterait équilibré, donc muet.
    let invoices: Invoice[];
    try {
      invoices = await toutLire<Invoice>((de, a) => {
        let q = admin
          .from("invoices")
          .select("*")
          .eq("user_id", ownerId)
          .gte("issue_date", `${year}-01-01`)
          .lte("issue_date", `${year}-12-31`);
        if (ecritures) q = q.in("status", [...STATUTS_FEC]);
        return q.order("issue_date", { ascending: true }).order("id", { ascending: true }).range(de, a);
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }

    // Achats du dossier (factures reçues, achats à l'étranger) : le journal
    // des achats du FEC et de Quadra. Sans eux, le cabinet les ressaisissait.
    let achats: AchatExport[] = [];
    const p = (profils ?? []).find((x) => x.id === ownerId);
    if (ecritures) {
      try {
        const lus = await chargerAchats(ownerId, year);
        achats = lus.achats;
        for (const n of lus.nonRepris) nonRepris.push(`${p?.company_name || p?.full_name || "Dossier"} : ${n}`);
        for (const n of lus.aVerifier) aVerifier.push(`${p?.company_name || p?.full_name || "Dossier"} : ${n}`);
      } catch {
        return NextResponse.json({ error: "Lecture des achats impossible" }, { status: 500 });
      }
    }

    let base = segmentFichier(p?.company_name || p?.full_name || "dossier");
    if (nomsPris.has(base)) base = `${base}_${ownerId.slice(0, 6)}`;
    nomsPris.add(base);

    if (!avecPdf) {
      fichiers.push(
        format === "fec"
          ? { nom: nomFichierFec(p?.siret, year, base), contenu: genererFec(invoices ?? [], plan, achats) }
          : format === "quadra"
            ? { nom: `Quadra_${year}_${base}.txt`, contenu: genererQuadra(invoices ?? [], { plan }, achats) }
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
    // Quadra lit les PDF à côté du fichier, sous un nom 8.3 écrit dans
    // l'écriture (position 182) ; le FEC les range dans pieces/, nommés comme
    // leur pièce (PieceRef).
    const numerotees = (invoices ?? []).filter((inv) => inv.invoice_number);
    const nomsQuadra = new Map(numerotees.map((inv, k) => [inv.invoice_number as string, nomPieceQuadra(k)]));
    fichiers.push(
      format === "quadra"
        ? { nom: `${base}/Quadra_${year}_${base}.txt`, contenu: genererQuadra(invoices ?? [], { plan, pieces: nomsQuadra }, achats) }
        : { nom: `${base}/${nomFichierFec(p?.siret, year, base)}`, contenu: genererFec(invoices ?? [], plan, achats) },
    );
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
      const pdf = await generateFacturXPdf(inv as Invoice, { accent: p?.proposal_color, modele: p?.proposal_template }, paymentInfo, lie.numero, lie.date);
      const nomPdf = format === "quadra" ? `${base}/${nomsQuadra.get(inv.invoice_number)}` : `${base}/pieces/${segmentPiece(inv.invoice_number)}.pdf`;
      fichiers.push({ nom: nomPdf, contenu: new Uint8Array(pdf) });
    }
  }

  await journaliser(
    admin,
    user.id,
    format === "csv" ? "export_csv" : "export_fec",
    selection.length === 1 ? selection[0] : null,
    `${year} · ${selection.length} dossier${selection.length > 1 ? "s" : ""}`,
  );

  // Un achat non converti : un fichier seul le tairait, on refuse en le
  // nommant ; une archive porte une note à côté des fichiers.
  if (nonRepris.length > 0) {
    if (fichiers.length === 1 && !avecPdf) {
      return NextResponse.json(
        { error: `Achat${nonRepris.length > 1 ? "s" : ""} impossible${nonRepris.length > 1 ? "s" : ""} à convertir en euros, à corriger dans « Achats à l'étranger » : ${nonRepris.join(" ; ")}` },
        { status: 422 },
      );
    }
    fichiers.push({
      nom: "ACHATS_NON_REPRIS.txt",
      contenu: `Achats absents des fichiers de cette archive, faute de cours de change :\r\n${nonRepris.map((n) => `- ${n}`).join("\r\n")}\r\n`,
    });
  }
  // Dans une archive, une note à côté des fichiers ; un fichier seul n'a pas
  // de place pour elle (l'écriture du solde y est la facture telle quelle).
  if (aVerifier.length > 0 && !(fichiers.length === 1 && !avecPdf)) {
    fichiers.push({
      nom: "ACHATS_A_VERIFIER.txt",
      contenu: `Points que le cabinet doit vérifier (écritures passées telles que les pièces) :\r\n${aVerifier.map((n) => `- ${n}`).join("\r\n")}\r\n`,
    });
  }

  if (fichiers.length === 1 && !avecPdf) {
    const f = fichiers[0];
    return new NextResponse(f.contenu as string, {
      headers: {
        "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${f.nom}"`,
      },
    });
  }

  const zip = creerZip(fichiers);
  const nomZip = `${format === "fec" ? "FEC" : format === "quadra" ? "Quadra" : "Factures"}${avecPdf ? "_et_pieces" : ""}_${year}_${selection.length === 1 ? segmentFichier((profils ?? [])[0]?.company_name || (profils ?? [])[0]?.full_name || "dossier") : "portefeuille"}_${new Date().toISOString().split("T")[0]}.zip`;
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
