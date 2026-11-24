import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorise } from "@/lib/cron-auth";
import { passageFinBeta } from "@/lib/fin-beta";

// Cron quotidien (8 h 30) : rappel J-7, fin de bêta, avis avant fermeture de
// la réception, purge des candidatures. Règles dans `lib/fin-beta.ts`.
// Inerte tant qu'aucun compte n'est en bêta.
export async function GET(req: NextRequest) {
  if (!cronAutorise(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr").replace(/\/$/, "");
  const bilan = await passageFinBeta(createAdminClient(), new Date(), base);
  if (bilan.erreurs.length) console.error("[cron/fin-beta]", bilan.erreurs);
  return NextResponse.json(bilan, { status: bilan.erreurs.length ? 500 : 200 });
}
