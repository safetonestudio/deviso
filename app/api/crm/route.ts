import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  const [
    { data: proposals, error: pErr },
    { data: invoices, error: iErr },
    { data: contacts },
  ] = await Promise.all([
    admin
      .from("proposals")
      .select("id, proposal_number, title, client_name, client_email, client_company, total_ttc, status, created_at")
      .eq("user_id", workspaceId)
      .order("created_at", { ascending: false }),
    admin
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_company, total_ttc, status, created_at")
      .eq("user_id", workspaceId)
      .order("created_at", { ascending: false }),
    admin
      .from("contacts")
      .select("email, name, company, phone")
      .eq("user_id", workspaceId),
  ]);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // Index contacts by email for fast lookup
  const contactMap: Record<string, { phone: string | null }> = {};
  for (const c of contacts ?? []) {
    if (c.email) contactMap[c.email.toLowerCase().trim()] = { phone: c.phone ?? null };
  }

  return NextResponse.json({
    proposals: proposals ?? [],
    invoices: invoices ?? [],
    contacts: contactMap,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const { email, phone } = await req.json();

  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin.from("contacts").upsert({
    user_id: workspaceId,
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
