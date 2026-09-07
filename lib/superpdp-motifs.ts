/**
 * Motifs de refus d'une facture reçue — statut 210 « Refusée ».
 *
 * D'où vient cette liste. Deux sources, et il a fallu les deux.
 *
 * 1. **Quels codes sont acceptés** : l'API Super PDP elle-même, en refusant un
 *    motif inventé le 12/08/2026 :
 *
 *      [BR-FR-CDV-CL-09/MDT-113_210] : le code motif « X » n'est pas dans la
 *      liste des codes autorisés pour le statut REFUSÉE (210) : TX_TVA_ERR,
 *      MONTANTTOTAL_ERR, CALCUL_ERR, NON_CONFORME, DOUBLON, DEST_ERR,
 *      TRANSAC_INC, EMMET_INC, CONTRAT_TERM, DOUBLE_FACT, CMD_ERR, ADR_ERR,
 *      REF_CT_ABSENT.
 *
 *    Treize codes, et treize seulement — il n'existe **pas** de motif « Autre »
 *    pour ce statut, alors que la nomenclature complète en contient un. Un
 *    refus doit donc entrer dans l'une de ces treize cases.
 *
 * 2. **Ce que chaque code veut dire** : l'onglet « Tableau des motifs de
 *    refus » de l'annexe 7 (« Règles de gestion », v1.9 du 30/04/2026) du
 *    dossier de spécifications externes de la DGFiP v3.2, lu le 07/09/2026.
 *    Quarante codes, avec libellé et description. C'est la source normative,
 *    et elle règle le point qui restait ouvert : la spécification Super PDP
 *    renvoie pour MDT-113 à « AFNOR XP Z12-012 », norme payante — mais la
 *    DGFiP en publie la table dans son propre paquet.
 *
 * Deux libellés qui étaient faux, et pourquoi c'était grave. Un refus est
 * **terminal** : il oblige le fournisseur à passer un avoir. Se tromper de
 * motif, ce n'est pas une imprécision de vocabulaire, c'est annuler une
 * facture pour une raison qui n'est pas la vraie.
 *
 *   - `CMD_ERR` : libellé longtemps **déduit** du code — « Facture non conforme
 *     à la commande ». Faux : c'est « N° de commande incorrect ou manquant »,
 *     un problème de référence, pas de contenu. Corrigé le 01/09/2026.
 *   - `DOUBLE_FACT` : libellé « Double facturation », lui aussi déduit du code.
 *     Faux, et trompeur au point d'être le seul choix évident pour un
 *     utilisateur facturé deux fois — qui aurait alors employé un motif
 *     réservé au flux de données réglementaires F1. La nomenclature dit
 *     « Données réglementaires F1 en doublon ». Le motif d'une facture reçue
 *     deux fois est `DOUBLON`, et lui seul. Corrigé le 07/09/2026.
 *
 * Les `description` viennent mot pour mot de la même table (ponctuation
 * normalisée). Elles ne sont pas décoratives : sans elles, `DOUBLON` et
 * `DOUBLE_FACT` se ressemblent, et `CMD_ERR` porte une restriction d'emploi
 * qu'on ne peut pas deviner.
 *
 * ⚠️ Enseignement non exploité à ce jour : ces codes ne servent pas qu'au
 * refus. La nomenclature les rattache aussi aux statuts **206** (approuvée
 * partiellement), **207** (en litige) et **208** (suspendue). Contester ou
 * suspendre peut donc porter un motif structuré, là où Deviso n'envoie qu'un
 * texte libre. Décision ouverte — la liste des codes autorisés pour ces trois
 * statuts n'a pas été obtenue, et l'API ne la donne qu'en refusant un envoi.
 */

export type MotifRefus = {
  code: string;
  libelle: string;
  /** Texte de la nomenclature. Absent quand elle n'en donne pas. */
  description?: string;
  /** Faux quand le libellé n'a pas pu être vérifié dans le document officiel. */
  sourced: boolean;
};

export const MOTIFS_REFUS: MotifRefus[] = [
  {
    code: "NON_CONFORME",
    libelle: "Mention légale manquante",
    description: "Toute mention légale non contrôlée.",
    sourced: true,
  },
  {
    code: "MONTANTTOTAL_ERR",
    libelle: "Montant total erroné",
    description:
      "Un des montants totaux de la facture est erroné, par exemple le net à payer.",
    sourced: true,
  },
  { code: "TX_TVA_ERR", libelle: "Taux de TVA erroné", sourced: true },
  {
    code: "CALCUL_ERR",
    libelle: "Erreur de calcul de la facture",
    description:
      "Détectée au contrôle automatique ou après, sur les lignes ou un arrondi non accepté.",
    sourced: true,
  },
  {
    code: "DOUBLON",
    libelle: "Facture en doublon (déjà émise / reçue)",
    description:
      "Même numéro, même vendeur et même année de date de facture.",
    sourced: true,
  },
  {
    code: "DOUBLE_FACT",
    libelle: "Données réglementaires F1 en doublon",
    description:
      "Réservé au doublon des données réglementaires transmises à l'administration " +
      "(même numéro, même vendeur, même année). Pour une facture reçue deux fois, " +
      "le motif est « Facture en doublon ».",
    sourced: true,
  },
  { code: "DEST_ERR", libelle: "Erreur de destinataire", sourced: true },
  {
    code: "ADR_ERR",
    libelle: "Adresse de facturation électronique erronée",
    description:
      "L'adresse de facturation électronique du destinataire (BT-49 ou BT-34) est absente ou erronée.",
    sourced: true,
  },
  {
    code: "EMMET_INC",
    libelle: "Émetteur inconnu",
    description: "L'émetteur de la facture est inconnu du destinataire.",
    sourced: true,
  },
  {
    code: "TRANSAC_INC",
    libelle: "Transaction inconnue",
    description:
      "La facture ne correspond pas à une livraison effectuée ou à une prestation de service rendue.",
    sourced: true,
  },
  {
    code: "CONTRAT_TERM",
    libelle: "Contrat terminé",
    description: "Contrat terminé, plus de facture possible.",
    sourced: true,
  },
  {
    code: "REF_CT_ABSENT",
    libelle: "Référence contractuelle manquante",
    description:
      "Une référence exigée contractuellement est absente : n° de contrat, n° de bon de " +
      "livraison, référence acheteur, objet facturé, référence projet, facture antérieure.",
    sourced: true,
  },
  {
    code: "CMD_ERR",
    libelle: "N° de commande incorrect ou manquant",
    description:
      "N° de commande erroné, inexistant ou déjà facturé. Ne peut justifier un refus que " +
      "si l'acheteur a fourni ce numéro avant la facturation.",
    sourced: true,
  },
];

export const estMotifValide = (code: string) => MOTIFS_REFUS.some((m) => m.code === code);

/** Le motif choisi, pour afficher sa description. `null` si le code est inconnu. */
export const motifParCode = (code: string): MotifRefus | null =>
  MOTIFS_REFUS.find((m) => m.code === code) ?? null;
