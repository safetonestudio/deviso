import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Retourne l'ID du workspace (owner) pour un utilisateur donné.
 * Si l'utilisateur est membre d'une équipe, retourne l'ID du propriétaire.
 * Sinon retourne l'ID de l'utilisateur lui-même.
 */
export async function getWorkspaceUserId(userId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data?.owner_id ?? userId;
}

/**
 * Retourne true si l'utilisateur est un membre d'équipe (pas le owner).
 */
export async function isTeamMember(userId: string): Promise<boolean> {
  const workspaceId = await getWorkspaceUserId(userId);
  return workspaceId !== userId;
}
