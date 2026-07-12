import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { email, plan } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!["free", "solo", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("waitlist")
    .upsert({ email: email.toLowerCase().trim(), plan }, { onConflict: "email,plan" });

  if (error) {
    console.error("[waitlist] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
