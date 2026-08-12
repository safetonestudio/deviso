import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Garde-fou : aucun compte de démonstration ne doit écrire dans Stripe.
 *
 * Pourquoi ce fichier existe. Le portail de facturation créait un client Stripe
 * à la volée, sans contrôle du mode démonstration. Un visiteur de la démo qui
 * cliquait « Gérer mon abonnement » inscrivait donc une fiche dans le compte de
 * **production**. Les comptes de démonstration sont purgés de la base au bout de
 * deux heures ; ces fiches, elles, restaient indéfiniment.
 *
 * Le tunnel de paiement avait bien ce contrôle, le portail non, et
 * `stripe-seats` s'en sortait seulement parce qu'un compte de démonstration n'a
 * pas d'identifiant d'abonnement — une protection accidentelle, pas voulue.
 *
 * Règle : tout fichier qui écrit dans Stripe passe par ici. `scripts/check-stripe.mjs`
 * refuse tout nouveau point d'écriture qui l'oublierait.
 */
export async function estCompteDemo(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("is_demo")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_demo);
}

/** Message unique, pour que l'utilisateur lise la même chose partout. */
export const MESSAGE_DEMO =
  "Les abonnements ne sont pas disponibles en mode démonstration. Créez un compte pour souscrire.";
