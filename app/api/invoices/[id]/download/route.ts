import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import { donneesRenduFacture } from "@/lib/facture-rendu";
import type { Invoice } from "@/types";
import { getWorkspaceUserId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Les documents appartiennent à l'espace de travail, pas au collaborateur :
  // filtrer sur user.id renvoyait 404 à tout membre d'équipe, alors que la
  // liste les affichait. Le plan Pro est vendu sur le multi-utilisateurs.
  const workspaceId = await getWorkspaceUserId(user.id);

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const invoice = data as Invoice;
  // Couleur, modalités de paiement (profil de l'ESPACE) et document lié :
  // même lecture que la feuille affichée dans l'application, lib/facture-rendu.ts.
  const { accentColor, paymentInfo, lie } = await donneesRenduFacture(supabase, invoice, workspaceId);

  const pdfBuffer = await generateFacturXPdf(invoice, accentColor, paymentInfo, lie.numero, lie.date);
  const filename = facturxFilename(invoice);

  // Sauvegarde optionnelle du chemin en BDD (best-effort)
  const storagePath = `invoices/${user.id}/${filename}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (!uploadError) {
    await supabase
      .from("invoices")
      .update({ facturx_pdf_path: storagePath })
      .eq("id", id);
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
