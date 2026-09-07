/**
 * Un avoir se transmet-il, ou reste-t-il dans les livres ?
 *
 * Pourquoi ce fichier existe. Deviso sait depuis le 01/09/2026 créer l'avoir
 * qui annule une facture, et la route d'émission sait le transmettre comme
 * n'importe quel document. C'est juste — sauf dans un cas, et ce cas est
 * précisément le plus fréquent : la facture **refusée** ou **rejetée**.
 *
 * La règle vient du dossier de spécifications externes de la DGFiP, v3.2 du
 * 30/04/2026, page 60, immédiatement sous le tableau 8 :
 *
 *   « Dans les cas des statuts "Refusée" ou "Rejetée", le fournisseur doit
 *     procéder à une annulation comptable (avoir interne). Cette opération ne
 *     doit pas générer de flux de données réglementaires (F1) au PPF. »
 *
 * Le raisonnement est simple une fois écrit. Le statut 210 ou 213 a **déjà**
 * dit à l'administration que cette facture ne vaut plus rien : le cycle de vie
 * l'a transporté, c'est même pour cela que ces deux statuts sont obligatoires.
 * Transmettre en plus un avoir électronique déclarerait une seconde fois la
 * même annulation — une minoration de chiffre d'affaires comptée deux fois.
 * L'avoir reste donc un document comptable interne : il s'imprime, il se
 * classe, il s'envoie au client s'il le veut, mais il ne part pas dans le
 * circuit.
 *
 * ⚠️ La symétrie est trompeuse : un avoir qui annule une facture **acceptée**
 * ou **encaissée**, lui, DOIT être transmis. Rien d'autre n'apprendrait
 * l'annulation à l'administration. Se tromper de sens ici est une erreur
 * fiscale dans les deux directions, et c'est pour cela que la règle est isolée
 * ici, pure et testée, plutôt que glissée dans la route d'émission.
 *
 * Le périmètre est celui de la phrase, et rien de plus : les statuts français
 * de refus et de rejet. `fr:501` (« Irrecevable ») s'y ajoute parce qu'il dit
 * la même chose plus tôt — le flux n'a jamais été admis, il n'y a donc rien
 * qu'un avoir puisse venir corriger au PPF. Les statuts `api:*` en sont
 * exclus : ils décrivent des factures hors cadre français, qui ne produisent
 * aucun flux F1 auquel cette règle pourrait s'appliquer.
 */

/** Statuts après lesquels l'annulation est déjà connue de l'administration. */
const ANNULATION_DEJA_DECLAREE = new Set(["fr:210", "fr:213", "fr:501"]);

export type VerdictAvoir = {
  /** Vrai quand l'avoir doit rester un document comptable interne. */
  interne: boolean;
  /** Ce qu'on affiche à l'utilisateur. Vide quand l'avoir est transmissible. */
  message: string;
};

/**
 * @param statutFactureAnnulee le `superpdp_status` de la facture que cet avoir
 *   annule — pas celui de l'avoir, qui n'a pas encore d'histoire.
 */
export function verdictAvoir(statutFactureAnnulee: string | null | undefined): VerdictAvoir {
  if (!statutFactureAnnulee || !ANNULATION_DEJA_DECLAREE.has(statutFactureAnnulee)) {
    return { interne: false, message: "" };
  }

  const refus = statutFactureAnnulee === "fr:210";
  return {
    interne: true,
    message:
      `La facture annulée a été ${refus ? "refusée" : "rejetée"} : son annulation est ` +
      "déjà connue de l'administration. Cet avoir est une écriture comptable interne — " +
      "imprimez-le et transmettez-le à votre client si besoin, mais il ne doit pas " +
      "partir dans le circuit de facturation électronique, sous peine de déclarer " +
      "deux fois la même annulation.",
  };
}
