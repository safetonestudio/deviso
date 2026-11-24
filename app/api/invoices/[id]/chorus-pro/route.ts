import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFacturXPdf } from "@/lib/facturx";
import type { Invoice } from "@/types";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerActe } from "@/lib/droits";
import { estCompteDemo, MESSAGE_DEMO_TIERS } from "@/lib/garde-demo";
import { deposerFacturX, enteteCompte, jetonPiste, siretDestinataire } from "@/lib/chorus-pro";

/**
 * Dépôt d'une facture sur Chorus Pro (client public).
 *
 * Refait le 20/11/2026 : on dépose le PDF Factur-X lui-même (flux
 * IN_DP_E2_CII_FACTURX), voir lib/chorus-pro.ts pour le pourquoi. L'ancienne
 * version envoyait une description JSON de la facture à une adresse qui
 * n'accepte qu'un fichier, et n'avait jamais servi.
 */

// ─── Génère le PDF Factur-X directement (sans fetch HTTP interne) ────────────
async function pdfFacturXBase64(
  invoice: Invoice,
  workspaceId: string,
  admin: ReturnType<typeof createAdminClient>,
  siret: string
): Promise<string> {
  const { data: profileData } = await admin
    .from("profiles")
    .select("proposal_color, proposal_template, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
    .eq("id", workspaceId)
    .single();

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentInfo = profileData ? {
    method: (profileData.payment_method || "none") as "none" | "link" | "bank" | "both",
    linkProvider: profileData.payment_link_provider,
    linkUrl: profileData.payment_link_profile,
    bankIban: profileData.bank_iban,
    bankBic: profileData.bank_bic,
    bankAccountName: profileData.bank_account_name,
  } : undefined;

  // Facture de solde ou avoir : la facture d'origine (numéro ET date, BT-25/26).
  let linkedNumber: string | null = null;
  let linkedDate: string | null = null;
  if (invoice.linked_invoice_id) {
    const { data: linked } = await admin
      .from("invoices")
      .select("invoice_number, issue_date")
      .eq("id", invoice.linked_invoice_id)
      .single();
    linkedNumber = linked?.invoice_number ?? null;
    linkedDate = linked?.issue_date ? String(linked.issue_date).slice(0, 10) : null;
  }

  const pdf = await generateFacturXPdf(invoice, { accent: accentColor, modele: profileData?.proposal_template }, paymentInfo, linkedNumber, linkedDate, { siretDestinataire: siret });
  return Buffer.from(pdf).toString("base64");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // L'autorisation d'abord : un collaborateur sans le droit « déposer sur
  // Chorus » doit s'entendre dire ça, avant tout autre motif de refus.
  // Les documents appartiennent à l'espace de travail, pas au collaborateur.
  const workspaceId = await getWorkspaceUserId(user.id);
  const refusActe = await exigerActe(user.id, workspaceId, "deposer_chorus");
  if (refusActe) return refusActe;

  // Aucun dépôt chez un tiers depuis un compte de démonstration. Voir
  // lib/garde-demo.ts : PISTE est en production, et le jeu de données de
  // démonstration contient une facture adressée au SIREN d'une commune réelle.
  if (await estCompteDemo(user.id)) {
    return NextResponse.json({ error: "DEMO", message: MESSAGE_DEMO_TIERS }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: invoice, error: invErr } = await admin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (invErr || !invoice)
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  if (invoice.chorus_pro_ref)
    return NextResponse.json(
      { error: "Déjà déposée sur Chorus Pro", ref: invoice.chorus_pro_ref },
      { status: 409 }
    );

  if (!invoice.invoice_number)
    return NextResponse.json({ error: "Un brouillon ne peut pas être déposé : finalise d'abord la facture." }, { status: 422 });

  // Le compte technique Chorus Pro de l'ESPACE, pas celui du collaborateur :
  // sinon un membre déposerait la facture de l'entreprise sous son propre
  // compte. La déposition reste réglée par la permission deposer_chorus.
  const { data: profile } = await admin
    .from("profiles")
    .select("chorus_pro_login, chorus_pro_password, chorus_pro_user_id")
    .eq("id", workspaceId)
    .single();

  if (!profile?.chorus_pro_login || !profile?.chorus_pro_password) {
    return NextResponse.json(
      { error: "Compte Chorus Pro non configuré. Rends-toi dans Paramètres → Chorus Pro." },
      { status: 422 }
    );
  }

  const siret = siretDestinataire(invoice.client_siren);
  if (!siret) {
    return NextResponse.json(
      {
        error:
          "Chorus Pro identifie l'administration par son SIRET (14 chiffres), pas par son SIREN (9). " +
          "Renseigne le SIRET du service destinataire dans la facture.",
      },
      { status: 422 }
    );
  }

  let compte: string;
  try {
    compte = enteteCompte(profile.chorus_pro_login, profile.chorus_pro_password);
  } catch {
    return NextResponse.json(
      { error: "Mot de passe Chorus Pro illisible : ressaisis-le dans Paramètres → Chorus Pro." },
      { status: 422 }
    );
  }

  let jeton: string;
  try {
    jeton = await jetonPiste();
  } catch (e) {
    return NextResponse.json({ error: `Chorus Pro injoignable : ${(e as Error).message}` }, { status: 502 });
  }

  let pdfBase64: string;
  try {
    pdfBase64 = await pdfFacturXBase64(invoice as Invoice, workspaceId, admin, siret);
  } catch (e) {
    return NextResponse.json({ error: `Génération du PDF : ${(e as Error).message}` }, { status: 502 });
  }

  // Prise atomique juste avant le dépôt. La garde-lecture `chorus_pro_ref`
  // plus haut ne suffit pas : deux appels concurrents (double-clic, deux
  // onglets, réessai réseau) la franchissent tous deux et déposent DEUX fois
  // la même facture chez la collectivité, qui la refuse pour doublon. Le
  // verrou se périme en 10 min pour qu'un plantage ne bloque pas la facture.
  const perimeDepot = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: priseDepot } = await admin
    .from("invoices")
    .update({ chorus_pro_depot_debute_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", workspaceId)
    .is("chorus_pro_ref", null)
    .or(`chorus_pro_depot_debute_at.is.null,chorus_pro_depot_debute_at.lt.${perimeDepot}`)
    .select("id")
    .maybeSingle();

  if (!priseDepot) {
    return NextResponse.json(
      {
        error: "Dépôt déjà en cours",
        message:
          "Cette facture est déjà en cours de dépôt sur Chorus Pro. Patiente quelques " +
          "secondes et recharge la page plutôt que de réessayer : un second dépôt la ferait " +
          "arriver en double chez l'administration, qui la refuserait.",
      },
      { status: 409 }
    );
  }

  let numeroFlux: string;
  try {
    const r = await deposerFacturX({
      jeton,
      compte,
      pdfBase64,
      nomFichier: `${String(invoice.invoice_number).replace(/[^\w.-]/g, "_")}.pdf`,
      idUtilisateurCourant: profile.chorus_pro_user_id,
    });
    numeroFlux = r.numeroFluxDepot;
  } catch (e) {
    // Rend le verrou : un réessai (SIRET corrigé, PISTE momentanément
    // indisponible) ne doit pas se heurter à « déjà en cours » pendant 10 min.
    await admin
      .from("invoices")
      .update({ chorus_pro_depot_debute_at: null })
      .eq("id", id)
      .eq("user_id", workspaceId)
      .then(() => undefined, () => undefined);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const maintenant = new Date().toISOString();
  await admin
    .from("invoices")
    .update({
      chorus_pro_ref: numeroFlux,
      chorus_pro_submitted_at: maintenant,
      chorus_pro_status: "DEPOSEE",
      chorus_pro_status_date: maintenant,
      chorus_pro_motif_rejet: null,
    })
    .eq("id", id);

  return NextResponse.json({
    ref: numeroFlux,
    message: "Facture déposée sur Chorus Pro. Son traitement prend quelques minutes : actualise le statut ensuite.",
  });
}
