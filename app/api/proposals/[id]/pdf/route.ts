import { NextRequest, NextResponse } from "next/server";
import React, { type ReactElement } from "react";
import { renderToBuffer, type Document } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { chargerDevis, nomFichierDevis } from "@/lib/devis-donnees";
import { contenuDevis } from "@/lib/devis-contenu";
import { DocumentPDF } from "@/lib/invoice-pdf";

type Params = { params: Promise<{ id: string }> };

/**
 * Le PDF d'un devis, téléchargé depuis sa page (panneau Actions).
 *
 * Même mise en page et même modèle (Profil : Classique, Moderne, Épuré) que le
 * PDF des factures et que la feuille affichée à l'écran : les textes viennent
 * de `contenuDevis()`, le rendu de `DocumentPDF` (lib/invoice-pdf.tsx). Un devis
 * n'est pas une facture : pas de XML Factur-X, un PDF simple.
 *
 * Lecture seule, mêmes droits que le PDF d'une facture : tout membre de
 * l'espace. Rien n'est enregistré ni envoyé.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const devis = await chargerDevis(id, workspaceId);
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const { proposal, profile } = devis;
  const c = contenuDevis(proposal, profile, { marque: profile?.plan === "free" });
  const vendeur = profile?.company_name || profile?.full_name || "Deviso";
  const numero = proposal.proposal_number || "";

  const pdf = await renderToBuffer(
    React.createElement(DocumentPDF, {
      c,
      meta: {
        title: `Devis ${numero}`.trim(),
        author: vendeur,
        subject: `Devis ${numero}, ${proposal.client_company || proposal.client_name || ""}`,
        producer: "Deviso",
      },
    }) as ReactElement<React.ComponentProps<typeof Document>>
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomFichierDevis(proposal)}"`,
      "Cache-Control": "no-store",
    },
  });
}
