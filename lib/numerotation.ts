import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Attribuer un numéro de document.
 *
 * Extrait de la route de création de facture parce qu'un second chemin en a
 * désormais besoin — l'avoir. Deux copies de cette règle auraient fini par
 * diverger, et la divergence porterait ici sur une obligation légale :
 * l'article 242 nonies A du CGI impose une numérotation **chronologique,
 * continue et sans doublon**, avoirs compris.
 *
 * ⚠️ Aucun numéro de repli, jamais. La version d'origine écrivait
 * `numData || "YYYY-001"` : quand la séquence échouait, chaque facture du
 * compte recevait le même numéro, en silence. C'est arrivé — la fonction SQL
 * n'était pas exécutable par le rôle `authenticated`, l'appel échouait à tous
 * les coups, et un compte de test a accumulé quinze factures « 2026-001 » sans
 * que rien ne le signale. Un numéro inventé pour éviter une erreur produit une
 * facture irrégulière, ce qui est plus grave que l'échec qu'il masque.
 */
export type TypeDocument = "standard" | "acompte" | "solde" | "avoir";

export class NumerotationIndisponible extends Error {}

/**
 * Un avoir prend un numéro de la **même** série que les factures.
 *
 * Ce n'est pas un raccourci : l'administration attend une séquence unique et
 * continue par entreprise. Une série séparée serait défendable, mais elle
 * demanderait sa propre garantie de continuité — et une deuxième séquence est
 * une deuxième occasion de trou. Seuls les acomptes ont leur propre série,
 * héritée et déjà en production.
 */
export async function numeroDocument(
  supabase: SupabaseClient,
  workspaceId: string,
  type: TypeDocument
): Promise<string> {
  const fonction = type === "acompte" ? "next_acompte_number" : "next_invoice_number";
  const { data, error } = await supabase.rpc(fonction, { p_user_id: workspaceId });

  if (error || !data) {
    console.error(`[numerotation] ${fonction} :`, error?.message ?? "aucun numéro renvoyé");
    throw new NumerotationIndisponible(
      "Le numéro n'a pas pu être attribué. Rien n'a été créé : mieux vaut réessayer " +
        "que produire un numéro en doublon, interdit par la réglementation."
    );
  }

  return data as string;
}
