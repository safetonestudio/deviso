/**
 * Motifs de refus d'une facture reçue — statut 210 « Refusée ».
 *
 * D'où vient cette liste. Elle n'a pas été recopiée d'une documentation : c'est
 * l'API Super PDP elle-même qui l'a donnée, en refusant un motif inventé le
 * 12/08/2026 :
 *
 *   [BR-FR-CDV-CL-09/MDT-113_210] : le code motif « X » n'est pas dans la liste
 *   des codes autorisés pour le statut REFUSÉE (210) : TX_TVA_ERR,
 *   MONTANTTOTAL_ERR, CALCUL_ERR, NON_CONFORME, DOUBLON, DEST_ERR, TRANSAC_INC,
 *   EMMET_INC, CONTRAT_TERM, DOUBLE_FACT, CMD_ERR, ADR_ERR, REF_CT_ABSENT.
 *
 * Treize codes, et treize seulement — il n'existe **pas** de motif « Autre »
 * pour ce statut. Un refus doit donc entrer dans l'une de ces cases.
 *
 * Les libellés viennent de l'annexe 7 « Règles de gestion » du dossier de
 * spécifications externes de la DGFiP (v3.2, 30/04/2026), pas d'une traduction
 * personnelle des codes.
 *
 * ⚠️ Une exception, signalée plutôt que masquée : le libellé de `CMD_ERR` est
 * introuvable dans les annexes. Celui retenu ici est **déduit** du code, il n'est
 * pas sourcé. À faire confirmer par Super PDP ou par la DGFiP avant de s'y fier.
 */

export type MotifRefus = {
  code: string;
  libelle: string;
  /** Faux quand le libellé n'a pas pu être vérifié dans le document officiel. */
  sourced: boolean;
};

export const MOTIFS_REFUS: MotifRefus[] = [
  { code: "NON_CONFORME", libelle: "Mention légale manquante", sourced: true },
  { code: "MONTANTTOTAL_ERR", libelle: "Montant total erroné", sourced: true },
  { code: "TX_TVA_ERR", libelle: "Taux de TVA erroné", sourced: true },
  { code: "CALCUL_ERR", libelle: "Erreur de calcul de la facture", sourced: true },
  { code: "DOUBLON", libelle: "Facture en doublon (déjà reçue)", sourced: true },
  { code: "DOUBLE_FACT", libelle: "Données réglementaires en doublon", sourced: true },
  { code: "DEST_ERR", libelle: "Erreur de destinataire", sourced: true },
  { code: "ADR_ERR", libelle: "Adresse de facturation électronique erronée", sourced: true },
  { code: "EMMET_INC", libelle: "Émetteur inconnu", sourced: true },
  { code: "TRANSAC_INC", libelle: "Transaction inconnue", sourced: true },
  { code: "CONTRAT_TERM", libelle: "Contrat terminé", sourced: true },
  {
    code: "REF_CT_ABSENT",
    libelle: "Référence contractuelle manquante",
    sourced: true,
  },
  // Libellé déduit du code, absent des annexes consultées. Voir l'avertissement
  // en tête de fichier.
  { code: "CMD_ERR", libelle: "Facture non conforme à la commande", sourced: false },
];

export const estMotifValide = (code: string) => MOTIFS_REFUS.some((m) => m.code === code);
