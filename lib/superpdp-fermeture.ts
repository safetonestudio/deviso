/**
 * Peut-on fermer cette ligne d'annuaire ?
 *
 * Cette règle vit dans son propre fichier, sans aucune dépendance, pour deux
 * raisons. D'abord parce qu'elle est éprouvable telle quelle, sans toucher à la
 * Plateforme Agréée — et c'est décisif ici : fermer une ligne pour de vrai rend
 * une entreprise injoignable, on ne peut donc pas l'essayer « pour voir ».
 * Ensuite parce que c'est elle, et non l'appel de suppression, qui porte tout
 * le risque de cette fonctionnalité.
 *
 * ⚠️ Le cas « migration » est le cœur du sujet.
 *
 * Une ligne « en erreur » est l'état NORMAL d'une portabilité en cours : quand
 * une entreprise arrive d'une autre Plateforme Agréée, « pendant le temps de la
 * migration, la ligne d'annuaire est en erreur côté SUPER PDP, mais ça n'est
 * pas grave, **il ne faut pas la supprimer** » (documentation Super PDP,
 * article « Annuaire »). L'ancienne plateforme a cinq jours pour rendre la main.
 *
 * Supprimer à cet instant, c'est interrompre son propre transfert. Et
 * l'utilisateur qui vient de lire un encadré ambre « votre ligne est en erreur »
 * est précisément celui qui aura envie d'appuyer sur le bouton. On refuse donc,
 * plutôt que de faire confiance au texte d'avertissement.
 */

/** Les états que `lireLigneAnnuaire` sait produire. */
export type EtatConnuLigne =
  | "joignable"
  | "programmee"
  | "en_cours"
  | "en_erreur"
  | "absente";

export type DecisionFermeture =
  | { fermer: true }
  | { fermer: false; raison: "absente" | "migration"; message: string };

export function decisionFermeture(
  etat: EtatConnuLigne | null | undefined
): DecisionFermeture {
  if (!etat || etat === "absente") {
    return {
      fermer: false,
      raison: "absente",
      message: "Aucune ligne de réception à fermer.",
    };
  }

  if (etat === "en_erreur") {
    return {
      fermer: false,
      raison: "migration",
      message:
        "Votre ligne est en cours de transfert depuis une autre Plateforme Agréée. " +
        "La fermer maintenant interromprait ce transfert. Attendez qu'il aboutisse — " +
        "l'ancienne plateforme a cinq jours pour répondre.",
    };
  }

  // `programmee` et `en_cours` se ferment sans réserve : une ligne pas encore
  // en vigueur, ou en cours de création, est une ligne qu'on a le droit
  // d'annuler. Refuser obligerait à attendre une date d'effet pour pouvoir
  // renoncer, ce qui n'a aucun sens.
  return { fermer: true };
}
