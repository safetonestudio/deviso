import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { genererCodeCabinet } from "@/lib/cabinet";

/**
 * Invitations cabinet (cote cabinet, depuis le cockpit).
 *
 * Le cabinet genere un code a usage unique par client, eventuellement avec un
 * libelle pour s'y retrouver avant que le client ait rejoint. RLS restreint
 * chaque ligne a son cabinet (cabinet_id = auth.uid()).
 */

// GET : invitations en attente du cabinet.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { data } = await supabase
    .from("cabinet_invitations")
    .select("id, code, libelle, status, created_at")
    .eq("cabinet_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({ invitations: data ?? [] });
}

// POST { libelle? } : genere un code a usage unique.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const libelle =
    typeof body.libelle === "string" && body.libelle.trim()
      ? body.libelle.trim().slice(0, 120)
      : null;

  // Collision de code tres improbable ; on retente quelques fois par securite.
  for (let essai = 0; essai < 5; essai++) {
    const code = genererCodeCabinet();
    const { data, error } = await supabase
      .from("cabinet_invitations")
      .insert({ cabinet_id: user.id, code, libelle })
      .select("id, code, libelle, status, created_at")
      .single();
    if (!error && data) return NextResponse.json({ invitation: data });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: "Creation impossible" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Creation impossible" }, { status: 500 });
}

// DELETE ?id= : revoque une invitation encore en attente.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const { error } = await supabase
    .from("cabinet_invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("cabinet_id", user.id)
    .eq("status", "pending");
  if (error) return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  return NextResponse.json({ success: true });
}
