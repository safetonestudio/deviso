import type { createAdminClient } from "@/lib/supabase/admin";
import { BETA_OUVERTE } from "@/lib/beta";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Compte ouvert sans invitation pendant la bêta ?
 *
 * La page d'inscription est fermée, mais l'inscription elle-même passe par
 * l'API d'authentification, joignable avec la clé publique : quelqu'un d'un
 * peu technique peut créer un compte sans y passer. Ce compte ne doit RIEN
 * pouvoir faire : l'espace affiche l'appel à candidater, et la création de
 * devis (seule création ouverte à un compte sans formule) est refusée.
 *
 * Un tel compte, c'est, tant que la bêta est ouverte :
 *   - sans formule, jamais client Stripe, jamais bêta-testeur ;
 *   - pas membre d'une équipe ni compte de démonstration (vérifié par l'appelant) ;
 *   - sans invitation utilisée (bêta-testeur ou cabinet) à son nom.
 * Bêta fermée : toujours false, le comportement d'avant revient.
 */
export async function compteSansInvitation(
  admin: Admin,
  userId: string,
  profil: { plan?: string | null; stripe_customer_id?: string | null; beta_debut?: string | null } | null
): Promise<boolean> {
  if (!BETA_OUVERTE || !profil) return false;
  if ((profil.plan ?? "free") !== "free" || profil.stripe_customer_id || profil.beta_debut) return false;
  const { count } = await admin
    .from("beta_candidatures")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return !count;
}
