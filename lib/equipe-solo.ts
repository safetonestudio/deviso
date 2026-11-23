import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_COMPTABLE } from "@/lib/droits";
import { synchroniserSieges } from "@/lib/stripe-seats";

/**
 * Ce que perd un espace qui passe à Solo : ses collaborateurs, jamais son
 * expert-comptable.
 *
 * Solo ne comporte qu'un utilisateur, mais l'accès expert-comptable est
 * gratuit, hors siège, et vendu dès Solo (lib/plans.ts, `accesComptable`).
 * Avant le 23/11/2026, le passage à Solo supprimait TOUTES les lignes de
 * l'équipe, comptable compris, et le comptait même parmi les « collaborateurs
 * retirés » annoncés au client.
 *
 * Deux chemins mènent à Solo, et ils appliquent la même règle :
 *   · la page Abonnement (`/api/stripe/checkout`), après confirmation ;
 *   · le portail client Stripe, qui permet de changer de formule sans passer
 *     par Deviso : le webhook `customer.subscription.updated` retire alors
 *     l'équipe lui-même. Sans cela, les collaborateurs gardaient l'accès sur
 *     un espace Solo, que la page Équipe ne permet plus de gérer.
 */

/** Filtre PostgREST : tout sauf le comptable. `neq` seul exclurait les rôles NULL. */
export const SAUF_COMPTABLE = `role.is.null,role.neq.${ROLE_COMPTABLE}`;

/** Collaborateurs actifs qu'un passage à Solo retirerait (comptable exclu). */
export async function collaborateursARetirer(client: SupabaseClient, ownerId: string): Promise<number> {
  const { count } = await client
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .or(SAUF_COMPTABLE);
  return count ?? 0;
}

/**
 * Retire l'équipe d'un espace passé à Solo (invitations en attente comprises),
 * garde le comptable, puis réaligne les sièges facturés.
 *
 * Renvoie une erreur lisible plutôt que de lever : les deux appelants
 * journalisent et continuent (la formule, elle, est déjà changée chez Stripe).
 */
export async function retirerEquipePourSolo(ownerId: string): Promise<{ erreur: string | null; retires: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .delete()
    .eq("owner_id", ownerId)
    .or(SAUF_COMPTABLE)
    .select("id");
  if (error) return { erreur: error.message, retires: 0 };

  try {
    await synchroniserSieges(ownerId);
  } catch (err) {
    return {
      erreur: `équipe retirée mais sièges NON réalignés : ${err instanceof Error ? err.message : String(err)}`,
      retires: data?.length ?? 0,
    };
  }
  return { erreur: null, retires: data?.length ?? 0 };
}
