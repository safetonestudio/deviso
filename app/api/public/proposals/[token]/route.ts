import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ token: string }> };

const admin = createAdminClient();

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const { data: proposal, error } = await admin
    .from("proposals")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, company_name, email, phone, address, siret, tva_number, tva_regime, logo_url, proposal_color, proposal_template, plan, cgv_text")
    .eq("id", proposal.user_id)
    .single();

  if (proposal.status === "sent") {
    await admin.from("proposals").update({ status: "viewed" }).eq("id", proposal.id);
    proposal.status = "viewed";
  }

  return NextResponse.json({ proposal, profile: profile ?? null, plan: profile?.plan ?? "free" });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const body = await req.json();
  const action: "sign" | "decline" | "view" = body.action;
  const signerName: string | undefined = body.signer_name;

  if (!action) return NextResponse.json({ error: "Action requise" }, { status: 400 });

  const { data: proposal, error } = await admin
    .from("proposals")
    .select("id, status, user_id, client_email, client_name, title")
    .eq("share_token", token)
    .single();

  if (error || !proposal) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  if (action !== "view" && (proposal.status === "signed" || proposal.status === "declined")) {
    return NextResponse.json({ error: "Ce devis a deja ete traite." }, { status: 409 });
  }

  if (action === "view") {
    if (proposal.status === "sent") {
      await admin.from("proposals").update({ status: "viewed" }).eq("id", proposal.id);
    }
    return NextResponse.json({ success: true });
  }

  if (action === "sign") {
    const updateData: Record<string, unknown> = {
      status: "signed",
      approval_status: "approved",
      signed_at: new Date().toISOString(),
    };
    if (signerName) updateData.signer_name = signerName;

    const { data: updated, error: updateError } = await admin
      .from("proposals")
      .update(updateData)
      .eq("id", proposal.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name, company_name, email_domain, email_domain_verified, plan")
        .eq("id", proposal.user_id)
        .single();
      if (profile?.email) {
        const { resend } = await import("@/lib/resend");
        const displayName = profile.company_name || profile.full_name || "Deviso";
        const useCustomDomain = profile.plan === "pro" && profile.email_domain_verified && profile.email_domain;
        const fromAddress = useCustomDomain ? `${displayName} <noreply@${profile.email_domain}>` : "Deviso <noreply@getdeviso.fr>";
        await resend.emails.send({
          from: fromAddress,
          to: profile.email,
          subject: `Devis signe : ${proposal.title || "votre devis"}`,
          html: `<p>Bonjour,</p><p><strong>${signerName || proposal.client_name || "Votre client"}</strong> vient de signer votre devis <em>${proposal.title || ""}</em>.</p><p>Connectez-vous a <a href="https://getdeviso.fr/dashboard">votre espace Deviso</a> pour creer la facture.</p><p>L'equipe Deviso</p>`,
        });
      }
    } catch { /* non-blocking */ }

    return NextResponse.json({ proposal: updated });
  }

  if (action === "decline") {
    const { data: updated, error: updateError } = await admin
      .from("proposals")
      .update({ status: "declined", approval_status: "rejected" })
      .eq("id", proposal.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name, company_name, plan, email_domain, email_domain_verified")
        .eq("id", proposal.user_id)
        .single();
      if (profile?.email) {
        const { resend } = await import("@/lib/resend");
        const displayName = profile.company_name || profile.full_name || "Deviso";
        const useCustomDomain = profile.plan === "pro" && profile.email_domain_verified && profile.email_domain;
        const fromAddress = useCustomDomain ? `${displayName} <noreply@${profile.email_domain}>` : "Deviso <noreply@getdeviso.fr>";
        await resend.emails.send({
          from: fromAddress,
          to: profile.email,
          subject: `Devis refuse : ${proposal.title || "votre devis"}`,
          html: `<p>Bonjour,</p><p>Votre devis <em>${proposal.title || ""}</em> a ete refuse par le client.</p><p>Connectez-vous a <a href="https://getdeviso.fr/dashboard">votre espace Deviso</a> pour en savoir plus.</p><p>L'equipe Deviso</p>`,
        });
      }
    } catch { /* non-blocking */ }

    return NextResponse.json({ proposal: updated });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
