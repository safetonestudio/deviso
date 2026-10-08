import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { calculerStats } from "@/lib/stats";
import { StatsClient } from "./StatsClient";

export const dynamic = "force-dynamic";

/**
 * Page Activite (statistiques), en rendu SERVEUR.
 *
 * Avant : page cliente qui faisait fetch('/api/stats') au montage. Desormais le
 * calcul est fait cote serveur via `calculerStats` (la MEME fonction que la
 * route /api/stats, donc aucun risque d'ecart) et passe en props.
 *
 * Gate identique a la route : acces reserve aux plans Solo et Pro (sinon la
 * page rend l'ecran d'invitation a l'upgrade). Les membres n'atteignent pas
 * /stats (le layout les bloque). La portee est garantie par workspaceId.
 */
export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const profile = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");
  const accessOk = ["solo", "pro"].includes(profile?.plan ?? "");

  if (!accessOk) {
    return <StatsClient initial={null} accessOk={false} />;
  }

  const isPro = profile?.plan === "pro";
  const initial = await calculerStats(supabase, workspaceId, isPro);

  return <StatsClient initial={initial} accessOk />;
}
