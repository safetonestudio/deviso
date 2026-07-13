import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Résout l'owner effectif : si l'utilisateur est un collaborateur d'une équipe Pro,
 * retourne l'owner_id. Sinon retourne user.id directement.
 * Le plan Pro est vérifié sur le profil de l'owner.
 */
async function resolveOwner(userId: string): Promise<{ ownerId: string; isPro: boolean }> {
  const admin = createAdminClient();

  // Cas 1 : l'utilisateur est lui-même Pro
  const { data: ownProfile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (ownProfile?.plan === "pro") {
    return { ownerId: userId, isPro: true };
  }

  // Cas 2 : l'utilisateur est collaborateur d'un workspace Pro
  const { data: membership } = await admin
    .from("team_members")
    .select("owner_id, profiles!team_members_owner_id_fkey(plan)")
    .eq("member_id", userId)
    .eq("status", "active")
    .single();

  if (membership?.owner_id) {
    const ownerPlan = (membership as unknown as { profiles?: { plan: string } | null }).profiles?.plan;
    return { ownerId: membership.owner_id, isPro: ownerPlan === "pro" };
  }

  return { ownerId: userId, isPro: false };
}

// GET /api/recurring, liste les factures récurrentes de l'utilisateur
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ownerId, isPro } = await resolveOwner(user.id);
  if (!isPro) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recurring_invoices")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recurring: data });
}

// POST /api/recurring, créer une facture récurrente
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ownerId, isPro } = await resolveOwner(user.id);
  if (!isPro) {
    return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });
  }

  const body = await req.json();
  const { client_name, client_email, client_company, client_address, items, tva_rate, payment_terms, notes, interval, day_of_month } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Au moins un article est requis" }, { status: 400 });
  }
  if (!["monthly", "quarterly", "yearly"].includes(interval)) {
    return NextResponse.json({ error: "Intervalle invalide (monthly | quarterly | yearly)" }, { status: 400 });
  }

  // Calcule la prochaine date de facturation
  const next_billing_date = computeNextBillingDate(interval, day_of_month || 1);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recurring_invoices")
    .insert({
      user_id: ownerId,
      client_name,
      client_email,
      client_company,
      client_address,
      items,
      tva_rate: tva_rate ?? 0,
      payment_terms,
      notes,
      interval,
      day_of_month: day_of_month || 1,
      next_billing_date,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recurring: data }, { status: 201 });
}

// DELETE /api/recurring?id=xxx, supprimer une facture récurrente
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { ownerId, isPro } = await resolveOwner(user.id);
  if (!isPro) return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("recurring_invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/recurring?id=xxx, activer/désactiver
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { ownerId, isPro } = await resolveOwner(user.id);
  if (!isPro) return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 403 });

  const body = await req.json();
  const admin = createAdminClient();
  const { error } = await admin
    .from("recurring_invoices")
    .update({ active: body.active })
    .eq("id", id)
    .eq("user_id", ownerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

function computeNextBillingDate(interval: string, day: number): string {
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), day);
  if (next <= now) {
    if (interval === "monthly") next.setMonth(next.getMonth() + 1);
    else if (interval === "quarterly") next.setMonth(next.getMonth() + 3);
    else if (interval === "yearly") next.setFullYear(next.getFullYear() + 1);
  }
  return next.toISOString().split("T")[0];
}
