import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { calculerStats } from "@/lib/stats";

// GET /api/stats, Solo + Pro (analytics Pro en bonus)
//
// Le calcul vit dans `lib/stats.ts`, partage avec la page serveur
// `app/(dashboard)/stats/page.tsx` : une seule source de verite, pas de
// divergence entre ce que montre la page et ce que renvoie l'API.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  // Le profil de l'ESPACE, pas celui de la personne connectée : sur un espace
  // Pro multi-utilisateurs, lire le profil de la personne au lieu de l'espace
  // donnait un plan errone a un collaborateur.
  const profile = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");

  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const isPro = profile?.plan === "pro";
  const payload = await calculerStats(supabase, workspaceId, isPro);
  return NextResponse.json(payload);
}
