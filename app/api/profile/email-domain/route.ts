import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

// GET, état actuel du domaine + enregistrements DNS
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email_domain, email_domain_resend_id, email_domain_verified")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "Réservé au plan Pro." }, { status: 403 });
  }

  if (!profile.email_domain_resend_id) {
    return NextResponse.json({ domain: profile.email_domain, verified: false, records: [] });
  }

  // Récupère l'état live depuis Resend
  const { data: domainData, error: resendError } = await resend.domains.get(profile.email_domain_resend_id);
  if (resendError || !domainData) {
    return NextResponse.json({ domain: profile.email_domain, verified: profile.email_domain_verified, records: [] });
  }

  const verified = domainData.status === "verified";

  // Met à jour la vérification en base si changement
  if (verified !== profile.email_domain_verified) {
    await supabase.from("profiles").update({ email_domain_verified: verified }).eq("id", user.id);
  }

  return NextResponse.json({
    domain: profile.email_domain,
    verified,
    status: domainData.status,
    records: domainData.records ?? [],
  });
}

// POST, enregistrer un nouveau domaine OU vérifier (?action=verify)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email_domain, email_domain_resend_id")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "Réservé au plan Pro." }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ── Vérification manuelle ──
  if (action === "verify") {
    if (!profile.email_domain_resend_id) {
      return NextResponse.json({ error: "Aucun domaine enregistré." }, { status: 400 });
    }
    const { error } = await resend.domains.verify(profile.email_domain_resend_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Re-fetch le statut
    const { data: domainData } = await resend.domains.get(profile.email_domain_resend_id);
    const verified = domainData?.status === "verified";
    await supabase.from("profiles").update({ email_domain_verified: verified }).eq("id", user.id);

    return NextResponse.json({ verified, status: domainData?.status, records: domainData?.records ?? [] });
  }

  // ── Enregistrement d'un nouveau domaine ──
  const body = await req.json();
  const domain = (body.domain as string | undefined)?.trim().toLowerCase();

  if (!domain) return NextResponse.json({ error: "Domaine requis." }, { status: 400 });

  // Validation format domaine
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    return NextResponse.json({ error: "Format de domaine invalide (ex: monentreprise.fr)." }, { status: 400 });
  }

  // Si un ancien domaine Resend existe, on le supprime d'abord
  if (profile.email_domain_resend_id) {
    await resend.domains.remove(profile.email_domain_resend_id);
  }

  // Crée le domaine dans Resend
  const { data: created, error: createError } = await resend.domains.create({ name: domain });
  if (createError || !created) {
    return NextResponse.json({ error: createError?.message || "Erreur Resend." }, { status: 500 });
  }

  // Sauvegarde en base
  await supabase.from("profiles").update({
    email_domain: domain,
    email_domain_resend_id: created.id,
    email_domain_verified: false,
  }).eq("id", user.id);

  return NextResponse.json({
    domain,
    verified: false,
    status: (created as { status?: string }).status,
    records: (created as { records?: unknown[] }).records ?? [],
  });
}

// DELETE, supprimer le domaine
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email_domain_resend_id")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") return NextResponse.json({ error: "Réservé au plan Pro." }, { status: 403 });

  if (profile.email_domain_resend_id) {
    await resend.domains.remove(profile.email_domain_resend_id);
  }

  await supabase.from("profiles").update({
    email_domain: null,
    email_domain_resend_id: null,
    email_domain_verified: false,
  }).eq("id", user.id);

  return NextResponse.json({ success: true });
}
