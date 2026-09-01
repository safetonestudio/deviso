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
 * ⚠️ Le libellé de `CMD_ERR` a longtemps été **déduit** du code, faute de
 * source : « Facture non conforme à la commande ». C'était faux. La
 * nomenclature officielle dit « N° de commande incorrect ou manquant » — un
 * problème de référence, pas de contenu. Un utilisateur pouvait donc refuser
 * définitivement une facture pour un motif qui ne voulait pas dire ce qu'il
 * croyait. Corrigé le 01/09/2026, avec quatre autres libellés remis au texte
 * exact de la nomenclature.
 *
 * La spécification `invoice_event_detail.reason` de Super PDP renvoie
 * explicitement à la norme pour cette liste : « ReasonCode (MDT-113). See
 * AFNOR XP Z12-012 for the list of allowed values. » Les libellés ci-dessous
 * viennent donc d'une source tierce qui publie la nomenclature MDT-113
 * complète, recoupée avec la liste de codes que l'API a elle-même renvoyée en
 * refusant un motif inventé. Ils restent à confirmer sur la norme elle-même.
 *
 * ⚠️ Second enseignement, non exploité à ce jour : ces codes ne servent pas
 * qu'au refus. La nomenclature les rattache aussi aux statuts **206**
 * (approuvée partiellement), **207** (en litige) et **208** (suspendue).
 * Contester ou suspendre peut donc porter un motif structuré, là où Deviso
 * n'envoie qu'un texte libre. Décision ouverte.
 */

export type MotifRefus = {
  code: string;
  libelle: string;
  /** Faux quand le libellé n'a pas pu être vérifié dans le document officiel. */
  sourced: boolean;
};

export const MOTIFS_REFUS: MotifRefus[] = [
  { code: "NON_CONFORME", libelle: "Mention légale manquante", sourced: true },
  { code: "MONTANTTOTAL_ERR", libelle: "Un des montants totaux de la facture est erroné", sourced: true },
  { code: "TX_TVA_ERR", libelle: "Taux de TVA erroné", sourced: true },
  { code: "CALCUL_ERR", libelle: "Erreur de calcul de la facture", sourced: true },
  { code: "DOUBLON", libelle: "Facture en doublon (déjà émise / reçue)", sourced: true },
  { code: "DOUBLE_FACT", libelle: "Double facturation", sourced: true },
  { code: "DEST_ERR", libelle: "Erreur de destinataire", sourced: true },
  { code: "ADR_ERR", libelle: "L'adresse de facturation électronique du destinataire est absente ou erronée", sourced: true },
  { code: "EMMET_INC", libelle: "Émetteur inconnu", sourced: true },
  { code: "TRANSAC_INC", libelle: "Transaction inconnue", sourced: true },
  { code: "CONTRAT_TERM", libelle: "Contrat terminé", sourced: true },
  {
    code: "REF_CT_ABSENT",
    libelle: "Référence contractuelle manquante",
    sourced: true,
  },
  { code: "CMD_ERR", libelle: "N° de commande incorrect ou manquant", sourced: true },
];

export const estMotifValide = (code: string) => MOTIFS_REFUS.some((m) => m.code === code);
