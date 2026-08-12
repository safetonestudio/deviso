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

/**
 * Lit le profil du propriétaire d'un espace de travail.
 *
 * Passe obligatoirement par le client d'administration. La table `profiles`
 * reste volontairement en RLS par utilisateur : sa ligne contient l'IBAN, les
 * identifiants Chorus Pro et les références Stripe, et la RLS ne sait pas
 * restreindre par colonne. Un membre d'équipe ne doit donc jamais la lire
 * directement — mais les routes ont besoin du plan et des coordonnées de
 * l'entreprise pour fonctionner. C'est ce détour qui concilie les deux.
 *
 * Sans lui, un collaborateur recevait un 403 « plan insuffisant » parce que la
 * lecture du profil renvoyait zéro ligne.
 */
export async function getWorkspaceProfile<T = Record<string, unknown>>(
  workspaceId: string,
  columns: string
): Promise<T | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(columns)
    .eq("id", workspaceId)
    .maybeSingle();
  return (data as T) ?? null;
}
