import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFacturXPdf, facturxFilename } from "@/lib/facturx";
import { documentLie } from "@/lib/document-lie";
import type { Invoice } from "@/types";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

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
  // Le profil de l'ESPACE, pas celui de la personne connectée.
  //
  // Ce `.eq("id", user.id)` était un défaut discret et coûteux : sur un plan
  // Pro multi-utilisateurs, un collaborateur agissant sur un document de
  // l'espace lisait SON profil. Selon la route, cela donnait un PDF portant
  // son IBAN (ou aucun) au lieu de celui de l'entreprise — le client paie
  // alors sur le mauvais compte — ou un refus « plan insuffisant » sur une
  // fonction que l'espace paie pourtant.
  const profileData = await getWorkspaceProfile<{ proposal_color: string | null; payment_method: string | null; payment_link_provider: string | null; payment_link_profile: string | null; bank_iban: string | null; bank_bic: string | null; bank_account_name: string | null }>(
    workspaceId,
    "proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name"
  );

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentInfo = profileData ? {
    method: (profileData.payment_method || "none") as "none" | "link" | "bank" | "both",
    linkProvider: profileData.payment_link_provider,
    linkUrl: profileData.payment_link_profile,
    bankIban: profileData.bank_iban,
    bankBic: profileData.bank_bic,
    bankAccountName: profileData.bank_account_name,
  } : undefined;

  // Solde ET avoir : numéro et date du document lié. Cette route ne traitait
  // que le solde, et ne lisait que le numéro — voir lib/document-lie.ts.
  const lie = await documentLie(supabase, invoice, workspaceId);

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
