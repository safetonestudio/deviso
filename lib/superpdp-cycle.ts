/**
 * Ce qu'un destinataire peut répondre à une facture reçue.
 *
 * Pourquoi ça existe. `status_code_create` accepte dix codes — `fr:204` à
 * `fr:212` plus `fr:220` — et Deviso n'en émettait que deux : le refus et
 * l'encaissement. Face à une facture douteuse, la seule action offerte était
 * donc le **refus**, dont la route dit elle-même qu'il est « définitif et
 * global » et « oblige le fournisseur à procéder à une annulation comptable ».
 *
 * Ne proposer que l'option irréversible pousse mécaniquement à l'utiliser à
 * tort : quelqu'un qui veut juste signaler une erreur de montant refuse la
 * facture entière, et son fournisseur doit passer un avoir pour une virgule.
 * Le litige (`fr:207`) et la suspension (`fr:208`) existent exactement pour ça.
 *
 * Aucun de ces codes n'est obligatoire au sens du tableau 8 de la DGFiP — seuls
 * 200, 210, 212 et 213 le sont. Ils sont là parce qu'ils rendent la relation
 * commerciale utilisable, pas parce que la loi les impose.
 */

export type ActionCycle = {
  code: string;
  libelle: string;
  /** Ce que ça fait, dit à la personne qui va cliquer. */
  effet: string;
  /** Un motif de la nomenclature est-il exigé ? */
  motifRequis: boolean;
  /** Action lourde de conséquences, à confirmer. */
  irreversible: boolean;
};

/**
 * Les actions proposées au **destinataire** d'une facture reçue.
 * L'ordre est celui de l'écran : du plus courant au plus grave.
 */
export const ACTIONS_DESTINATAIRE: ActionCycle[] = [
  {
    code: "fr:204",
    libelle: "Accuser réception",
    effet: "Indique à votre fournisseur que vous avez bien reçu la facture et qu'elle est en cours de traitement.",
    motifRequis: false,
    irreversible: false,
  },
  {
    code: "fr:205",
    libelle: "Approuver",
    effet: "Vous acceptez la facture. Chez votre fournisseur, c'est ce qui fait partir le délai de paiement.",
    motifRequis: false,
    irreversible: false,
  },
  {
    code: "fr:208",
    libelle: "Suspendre",
    effet: "Met le traitement en attente, le temps d'obtenir une pièce ou une précision. Réversible.",
    motifRequis: false,
    irreversible: false,
  },
  {
    code: "fr:207",
    libelle: "Contester",
    effet: "Signale un désaccord sans annuler la facture. À préférer au refus tant qu'un accord reste possible.",
    motifRequis: false,
    irreversible: false,
  },
  {
    code: "fr:209",
    libelle: "Clore le traitement",
    effet: "Lève une suspension ou un litige : le traitement reprend son cours.",
    motifRequis: false,
    irreversible: false,
  },
  {
    code: "fr:211",
    libelle: "Signaler le paiement",
    effet: "Indique que vous avez payé. Votre fournisseur confirmera l'encaissement de son côté.",
    motifRequis: false,
    irreversible: false,
  },
];

const PAR_CODE = new Map(ACTIONS_DESTINATAIRE.map((a) => [a.code, a]));

export const actionDestinataire = (code: string): ActionCycle | undefined => PAR_CODE.get(code);

/**
 * Le refus (`fr:210`) et l'encaissement (`fr:212`) gardent leurs routes
 * dédiées : le premier exige un motif de la nomenclature AFNOR et une
 * confirmation, le second appartient au fournisseur et porte des montants.
 * Les mélanger ici les banaliserait.
 */
export const CODES_RESERVES = new Set(["fr:210", "fr:212"]);
