import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Le document auquel celui-ci renvoie : numéro ET date.
 *
 * Deux documents portent une référence à un autre, et pour deux raisons
 * différentes :
 *
 *   - une **facture de solde** renvoie à son acompte, pour que le client
 *     comprenne ce qui vient en déduction ;
 *   - un **avoir** renvoie à la facture qu'il annule, et là ce n'est plus du
 *     confort : BR-FR-CO-05 l'exige, avec la date (BT-26). Une référence non
 *     datée n'est pas comptée du tout — le validateur officiel répond
 *     « Références entête trouvées : 0 » sur un document qui en porte pourtant
 *     bien une.
 *
 * Pourquoi ce fichier existe. Cette résolution était recopiée dans chaque
 * chemin de rendu, et chaque copie s'était arrêtée à un endroit différent :
 * la route de téléchargement ne traitait que le solde et ne lisait que le
 * numéro ; l'envoi par courriel ne passait rien du tout ; la génération
 * récurrente non plus ; seule la route d'émission vers la Plateforme Agréée
 * faisait le travail complet. Résultat, pour un même avoir, le XML transmis à
 * l'administration était conforme et celui embarqué dans le PDF envoyé au
 * client ne l'était pas — et pour une même facture de solde, le PDF téléchargé
 * portait le bandeau « vient en déduction de… » que le PDF envoyé par courriel
 * n'avait pas. Quatre rendus du même document, quatre comportements.
 *
 * Une seule fonction, donc, appelée partout où l'on fabrique un rendu.
 */
export type DocumentLie = { numero: string | null; date: string | null };

const VIDE: DocumentLie = { numero: null, date: null };

export async function documentLie(
  supabase: SupabaseClient,
  facture: { invoice_type?: string | null; linked_invoice_id?: string | null },
  workspaceId: string
): Promise<DocumentLie> {
  if (facture.invoice_type !== "solde" && facture.invoice_type !== "avoir") return VIDE;
  if (!facture.linked_invoice_id) return VIDE;

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number, issue_date")
    // Le filtre d'espace n'est pas décoratif : `linked_invoice_id` est un champ
    // que l'API accepte en écriture, et sans lui on lirait le numéro d'une
    // facture d'un autre compte pour l'imprimer sur celle-ci.
    .eq("id", facture.linked_invoice_id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  return { numero: data?.invoice_number ?? null, date: data?.issue_date ?? null };
}
