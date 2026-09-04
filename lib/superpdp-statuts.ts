/**
 * Les statuts de cycle de vie, tous, et ce qu'ils veulent dire.
 *
 * ⚠️ Table recopiée depuis l'énumération `status_code` de
 * `docs/superpdp/openapi.json` (43 valeurs) et sa glose. Les libellés `fr:*`
 * viennent du tableau 8 du dossier de spécifications externes de la DGFiP,
 * v3.2 du 30/04/2026. Cette table a d'abord été écrite de mémoire, et elle
 * était décalée d'un cran à partir du code 204 : une facture **refusée** (210)
 * s'affichait « Paiement transmis ». Ne pas la modifier sans rouvrir la source.
 *
 * Trois familles, que la spec distingue :
 *   - `fr:*` — le cycle de vie officiel français ;
 *   - `api:*` — les statuts internes de Super PDP, « used when an invoice does
 *     not belong to the French framework » (factures Peppol) ;
 *   - `ppf:*` — les accusés d'acheminement vers le Portail Public de
 *     Facturation. Ils intéressent le support, jamais l'utilisateur, et ils
 *     arrivent EN MÊME TEMPS que leur `fr:*` correspondant. Ils ne doivent donc
 *     ni s'afficher ni écraser un statut lisible (voir `statutQuiFaitFoi`).
 */

export type TonStatut = "neutre" | "attention" | "bien";

export type Statut = {
  texte: string;
  ton: TonStatut;
  /** Colonne « Caractère » du tableau 8 : quatre statuts seulement le sont. */
  obligatoire?: boolean;
  /** La facture n'attend plus de paiement : ne pas la signaler en retard. */
  cloture?: boolean;
};

export const STATUTS: Record<string, Statut> = {
  // ── Cycle de vie officiel ────────────────────────────────────────────────
  "fr:200": { texte: "Déposée", ton: "neutre", obligatoire: true },
  "fr:201": { texte: "Émise par la plateforme", ton: "neutre" },
  "fr:202": { texte: "Reçue par la plateforme", ton: "neutre" },
  "fr:203": { texte: "Mise à disposition", ton: "neutre" },
  "fr:204": { texte: "Prise en charge", ton: "neutre" },
  "fr:205": { texte: "Approuvée", ton: "bien" },
  "fr:206": { texte: "Approuvée partiellement", ton: "attention" },
  "fr:207": { texte: "En litige", ton: "attention" },
  "fr:208": { texte: "Suspendue", ton: "attention" },
  "fr:209": { texte: "Complétée", ton: "neutre" },
  "fr:210": { texte: "Refusée", ton: "attention", obligatoire: true, cloture: true },
  "fr:211": { texte: "Paiement transmis", ton: "neutre" },
  "fr:212": { texte: "Encaissée", ton: "bien", obligatoire: true, cloture: true },
  "fr:213": { texte: "Rejetée", ton: "attention", obligatoire: true, cloture: true },
  // 214 « Inconnu (facture) » : la nomenclature le définit, l'énumération de la
  // plateforme ne le crée pas. Reçu, il doit s'afficher en français plutôt
  // qu'en code brut — c'est le seul de la table 200-214 qui nous manquait.
  "fr:214": { texte: "Statut inconnu du destinataire", ton: "attention" },
  // Glosé par la spec (« Inadmissible ») mais absent de son énumération. On le
  // connaît quand même : reçu, il doit s'afficher, pas tomber en code brut.
  "fr:501": { texte: "Irrecevable", ton: "attention", cloture: true },

  // ── Factures hors cadre français (Peppol) ────────────────────────────────
  "api:uploaded": { texte: "Déposée, en attente de contrôle", ton: "neutre" },
  "api:invalid": { texte: "Invalide — non transmise", ton: "attention", cloture: true },
  "api:validated": { texte: "Contrôles passés", ton: "neutre" },
  "api:sent": { texte: "Transmise", ton: "neutre" },
  "api:rejected": { texte: "Rejetée par le destinataire", ton: "attention", cloture: true },
  "api:received": { texte: "Reçue par le destinataire", ton: "neutre" },
  "api:acknowledged": { texte: "Accusé de réception", ton: "neutre" },
  "api:accepted": { texte: "Acceptée", ton: "bien" },
};

/** Un statut d'acheminement administratif, à ne jamais montrer à l'utilisateur. */
export const estStatutAcheminement = (code: string) => code.startsWith("ppf:");

/**
 * Une facture est-elle encore en attente de paiement ?
 *
 * L'échéance dépassée ne suffit pas. Une facture **encaissée** est payée, et
 * une facture **refusée**, **rejetée** ou **irrecevable** est annulée — le
 * fournisseur doit passer un avoir. Les afficher en rouge réclamerait un
 * paiement pour des factures qui n'ont plus lieu d'être payées, et noierait les
 * vrais retards au milieu.
 *
 * Constaté sur une capture de Selim : une facture refusée gardait son échéance
 * en rouge. La liste des statuts clôturants était alors écrite en dur et
 * ignorait les `api:*` — une facture Peppol rejetée restait « en retard ».
 */
export function estCloture(code: string | null | undefined): boolean {
  if (!code) return false;
  return STATUTS[code]?.cloture === true;
}

export function libelleStatut(code: string | null | undefined): Statut | null {
  if (!code) return null;
  // Un code inconnu s'affiche tel quel plutôt que « Inconnu » : leur
  // nomenclature évolue, et un code brut reste consultable.
  return STATUTS[code] ?? null;
}
