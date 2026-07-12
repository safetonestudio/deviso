import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const workspaceId = await getWorkspaceUserId(user.id);

  // Admin client pour bypasser la RLS : un membre (auth.uid ≠ user_id owner) ne pourrait
  // pas lire les services de l'owner via le client SSR normal.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_catalog")
    .select("*")
    .eq("user_id", workspaceId)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const workspaceId = await getWorkspaceUserId(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", workspaceId)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "PLAN_REQUIRED", message: "Le catalogue nécessite le plan Pro." }, { status: 403 });
  }

  const { name, description, unit, unit_price, type } = await req.json();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const itemType = type === "hourly" ? "hourly" : "fixed";
  // Pour les items horaires, l'unité est forcée à "heure"
  const itemUnit = itemType === "hourly" ? "heure" : (unit || "forfait");

  const { data, error } = await supabase
    .from("service_catalog")
    .insert({ user_id: workspaceId, name, description, unit: itemUnit, unit_price: unit_price || 0, type: itemType })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
