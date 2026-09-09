import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Prévenir le propriétaire d'un espace, de façon durable.
 *
 * Pourquoi ce fichier existe. Deviso avait une table `notifications`, une
 * cloche dans l'interface, et même des icônes prêtes pour `proposal_signed` et
 * `proposal_declined` — mais rien n'insérait jamais ces lignes. Le seul signal
 * qu'un devis venait d'être signé était un courriel, envoyé dans un `try/catch`
 * dont la branche d'erreur était vide. Un refus passager de Resend, et le
 * freelance n'apprenait jamais qu'il avait décroché la mission.
 *
 * C'est le pire endroit possible pour un signal fragile : la signature d'un
 * devis est l'événement qui déclenche tout le reste — la facture, l'acompte, le
 * travail. Une notification en base, elle, attend qu'on la lise.
 *
 * Deux propriétés que le reste du code n'avait pas :
 *
 *   - **elle ne peut pas faire échouer l'action qui l'a déclenchée.** Un devis
 *     signé reste signé même si la notification n'entre pas ;
 *   - **son échec est journalisé.** Un `catch` vide transforme une panne en
 *     absence, et une absence ne se diagnostique pas.
 *
 * Le destinataire est le propriétaire de l'espace (`user_id` du document), pas
 * l'auteur de l'action : sur les routes publiques, l'action vient du client
 * final, qui n'a pas de compte.
 */
export type Notification = {
  type: "proposal_signed" | "proposal_declined" | "proposal_viewed" | "invoice_paid";
  title: string;
  body: string;
  /** Chemin interne vers le document concerné. */
  link: string;
};

export async function notifierProprietaire(
  admin: SupabaseClient,
  proprietaireId: string,
  notification: Notification
): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    user_id: proprietaireId,
    ...notification,
  });

  if (error) {
    console.error(
      `[notifications] « ${notification.title} » non enregistrée pour ${proprietaireId} :`,
      error.message
    );
  }
}
