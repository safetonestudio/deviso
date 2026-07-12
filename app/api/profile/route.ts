import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getWorkspaceUserId } from "@/lib/workspace";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const is_owner = user.id === workspaceId;

  return NextResponse.json({ profile: data, is_owner });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "full_name", "company_name", "siret", "address", "email", "phone",
    "tva_number", "logo_url", "proposal_template", "proposal_color",
    "require_approval", "tva_regime",
    "payment_method", "payment_link_provider", "payment_link_profile",
    "bank_iban", "bank_bic", "bank_account_name",
    "cgv_text",
    "chorus_pro_login", "chorus_pro_password", "chorus_pro_fournisseur_id",
    "chorus_pro_bank_code", "chorus_pro_user_id",
  ];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  // ── Subdomain, Pro only ──
  if ("subdomain" in body) {
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("plan").eq("id", user.id).single();

    if (profile?.plan !== "pro") {
      return NextResponse.json({ error: "Le sous-domaine est réservé au plan Pro." }, { status: 403 });
    }

    const slug = (body.subdomain as string | null)?.trim().toLowerCase() || null;

    if (slug !== null) {
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
        return NextResponse.json(
          { error: "Sous-domaine invalide. 3-30 caractères, lettres minuscules, chiffres et tirets uniquement." },
          { status: 400 }
        );
      }
      const { data: existing } = await supabaseAdmin
        .from("profiles").select("id").eq("subdomain", slug).neq("id", user.id).single();
      if (existing) {
        return NextResponse.json({ error: "Ce sous-domaine est déjà pris." }, { status: 409 });
      }
    }
    updates.subdomain = slug;
  }

  // ── Reminder config, Pro only ──
  if ("reminder_intervals" in body || "reminder_message" in body) {
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("plan").eq("id", user.id).single();

    if (profile?.plan !== "pro") {
      return NextResponse.json({ error: "Les relances personnalisées sont réservées au plan Pro." }, { status: 403 });
    }

    if ("reminder_intervals" in body) {
      const intervals = body.reminder_intervals;
      if (!Array.isArray(intervals) || intervals.some((v: unknown) => typeof v !== "number" || v < 1 || v > 365)) {
        return NextResponse.json({ error: "Intervalles invalides (nombres entiers entre 1 et 365)." }, { status: 400 });
      }
      if (intervals.length > 10) {
        return NextResponse.json({ error: "Maximum 10 intervalles." }, { status: 400 });
      }
      updates.reminder_intervals = [...new Set(intervals as number[])].sort((a, b) => a - b);
    }

    if ("reminder_message" in body) {
      const msg = (body.reminder_message as string | null)?.trim() || null;
      updates.reminder_message = msg && msg.length <= 500 ? msg : null;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
