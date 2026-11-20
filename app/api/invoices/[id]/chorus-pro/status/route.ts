import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { estCompteDemo, MESSAGE_DEMO_TIERS } from "@/lib/garde-demo";
import { consulterCompteRendu, enteteCompte, jetonPiste } from "@/lib/chorus-pro";

/**
 * Statut d'une facture déposée sur Chorus Pro : compte rendu du flux
 * (transverses/v1/consulterCR, interrogé avec le numéro de flux reçu au dépôt).
 * L'ancienne version interrogeait factures/v1/consulterCR avec un numéro de
 * facture, adresse et paramètre qui ne correspondent pas à l'API.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // La démonstration porte une référence Chorus Pro inventée : interroger
  // l'administration avec un numéro qui n'existe pas n'apprend rien.
  if (await estCompteDemo(user.id)) {
    return NextResponse.json({ error: "DEMO", message: MESSAGE_DEMO_TIERS }, { status: 403 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, chorus_pro_ref")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (!invoice.chorus_pro_ref) return NextResponse.json({ error: "Pas encore déposée sur Chorus Pro" }, { status: 404 });

  // Le compte technique de l'ESPACE (celui qui a déposé), pas celui du
  // collaborateur qui consulte : sur user.id, un membre obtenait « non configuré ».
  const { data: profile } = await admin
    .from("profiles")
    .select("chorus_pro_login, chorus_pro_password")
    .eq("id", workspaceId)
    .single();

  if (!profile?.chorus_pro_login || !profile?.chorus_pro_password) {
    return NextResponse.json({ error: "Compte Chorus Pro non configuré" }, { status: 422 });
  }

  try {
    const jeton = await jetonPiste();
    const compte = enteteCompte(profile.chorus_pro_login, profile.chorus_pro_password);
    const cr = await consulterCompteRendu({ jeton, compte, numeroFluxDepot: invoice.chorus_pro_ref });
    const etat = cr.etat || "DEPOSEE";
    const rejet = /REJET|INCIDENT|ERREUR|ANOMALIE/i.test(etat);
    const motif = rejet ? String(cr.raw.libelle ?? "") || null : null;

    await admin
      .from("invoices")
      .update({
        chorus_pro_status: etat,
        chorus_pro_status_date: new Date().toISOString(),
        chorus_pro_motif_rejet: motif,
      })
      .eq("id", invoice.id);

    return NextResponse.json({
      ref: invoice.chorus_pro_ref,
      status: etat,
      label: cr.libelle,
      color: rejet ? "red" : /INTEGR/i.test(etat) ? "emerald" : "blue",
      motifRejet: motif,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
