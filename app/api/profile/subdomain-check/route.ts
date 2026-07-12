import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
  if (!slug) return NextResponse.json({ available: false, error: "Slug manquant" });

  // Format check
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
    return NextResponse.json({ available: false, error: "Format invalide" });
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("subdomain", slug)
    .neq("id", user.id)
    .single();

  return NextResponse.json({ available: !data });
}
