import type { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_COMPTABLE } from "@/lib/droits";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Controle d'acces du cockpit cabinet.
 *
 * Le cockpit lit les dossiers des clients avec la cle de service (hors RLS) :
 * c'est ce qui permet au comptable de tout voir depuis SON interface, sans se
 * connecter chez chaque client. En contrepartie, TOUTE lecture d'un dossier
 * passe d'abord par l'une de ces deux fonctions. Le lien qui fait foi est la
 * ligne team_members active (role comptable) creee quand le client a saisi le
 * code de son cabinet. scripts/check-cabinet.mjs le verifie.
 */

/** Dossiers clients (owner_id) auxquels le cabinet a un acces actif. */
export async function dossiersDuCabinet(admin: Admin, cabinetId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("team_members")
    .select("owner_id")
    .eq("member_id", cabinetId)
    .eq("role", ROLE_COMPTABLE)
    .eq("status", "active");
  if (error) throw new Error(`Lecture des dossiers du cabinet impossible : ${error.message}`);
  return [...new Set((data ?? []).map((l) => l.owner_id as string))];
}

/** Le cabinet a-t-il un acces actif au dossier de ce client ? */
export async function estComptableDe(admin: Admin, cabinetId: string, clientId: string): Promise<boolean> {
  if (!clientId || clientId === cabinetId) return false;
  const { data, error } = await admin
    .from("team_members")
    .select("id")
    .eq("owner_id", clientId)
    .eq("member_id", cabinetId)
    .eq("role", ROLE_COMPTABLE)
    .eq("status", "active")
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

/** Le compte agit-il comme cabinet (dossiers suivis ou codes en attente) ? */
export async function estCabinet(admin: Admin, userId: string): Promise<boolean> {
  const [{ data: liens }, { data: invits }] = await Promise.all([
    admin.from("team_members").select("id").eq("member_id", userId).eq("role", ROLE_COMPTABLE).eq("status", "active").limit(1),
    admin.from("cabinet_invitations").select("id").eq("cabinet_id", userId).limit(1),
  ]);
  return (liens ?? []).length > 0 || (invits ?? []).length > 0;
}
