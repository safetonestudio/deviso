/**
 * Cadre de facturation (BT-23), la règle unique.
 *
 * Pourquoi ce fichier existe. Jusqu'au 23/11/2026, Deviso écrivait `B1`
 * (« Dépôt d'une facture de bien ») EN DUR dans toutes ses factures. Or c'est
 * de ce code que la plateforme déduit la catégorie d'e-reporting B2C : les
 * factures de prestations de services ressortaient classées `TLB1` (livraisons
 * de biens) au lieu de `TPS1`. C'était la « seule inconnue » de
 * docs/superpdp/chantier.md : le champ existait, nous le remplissions mal.
 *
 * Sources (paquet DGFiP « spécifications externes » v3.2 du 30/04/2026,
 * relu le 23/11/2026) :
 *
 *   - Annexe 1, BT-23 : « Type de processus métier (cadre de facturation) »,
 *     1..1, « Cadre de facturation à renseigner par le vendeur », règles
 *     G1.02, G1.60, G6.08. En CII :
 *     ExchangedDocumentContext/BusinessProcessSpecifiedDocumentContextParameter/ID.
 *   - Annexe 7, G1.02, valeurs autorisées : B1 / S1 / M1 (bien / prestation
 *     de service / facture double), B2 / S2 / M2 (les mêmes « déjà payée »),
 *     B4 / S4 / M4 (« facture définitive (après acompte) »), S5, S6
 *     (sous-traitant, cotraitant), B7, S7 (TVA déjà collectée par e-reporting).
 *   - Annexe 7, G1.60 : B4 / S4 / M4 interdits sur une facture d'acompte
 *     (386), une facture d'acompte auto-facturée (500) et un avoir de facture
 *     d'acompte (503).
 *   - Annexe 6, onglet « E-REPORTING - Correspondance » : B1, B2, B4, B7 →
 *     TLB1 ; S1, S2, S3, S4, S5, S6, S7 → TPS1 ; M1, M2, M4 → TLB1 + TPS1.
 *
 * Ce que Deviso sait, et donc ce qu'il peut déclarer :
 *
 *   - la nature (lettre) : `operation_category`, goods → B, mixed → M, et
 *     services → S. Une valeur absente vaut services : c'est le défaut de la
 *     colonne en base (`default 'services'`) et la lecture du FEC et du livre
 *     des recettes (lib/exports-comptables.ts, lib/recettes.ts). Une même
 *     facture ne doit pas être « service » au comptable et « bien » à
 *     l'administration.
 *   - « définitive après acompte » (chiffre 4) : une facture de SOLDE qui
 *     renvoie à son acompte (BT-25 écrit). Sans référence à l'acompte, rien
 *     dans le document ne l'établit : on n'affirme pas.
 *   - sinon, chiffre 1.
 *
 * « Déjà payée » (B2 / S2 / M2) n'est VOLONTAIREMENT PAS produit, même quand
 * la facture est au statut payée. Constaté au validateur officiel le
 * 23/11/2026 (scripts/e2e/cadre-facturation.ts) : « BR-FR-CO-09/BT-23 : Si le
 * cadre de facturation (BT-23) est B2, S2 ou M2, alors le net à payer
 * (BT-115) doit être égal à 0 ». Deviso écrit le net à payer égal au TTC
 * (pas de montant déjà versé, BT-113) : une facture payée déclarée S2 serait
 * donc REJETÉE. Le chiffre 1 ne change rien à la catégorie d'e-reporting
 * (S1 comme S2 → TPS1, annexe 6), et l'encaissement est déjà déclaré par
 * l'« Encaissée » (fr:212) envoyée juste après la transmission
 * (app/api/superpdp/invoices/[id]/emettre/route.ts). Produire S2 demanderait
 * d'écrire BT-113 = TTC et BT-115 = 0, donc un autre document : chantier à
 * part, pas un effet de bord de cette règle.
 *
 * Deux choix, faute de texte qui les tranche (déduits, pas lus) :
 *
 *   - Un AVOIR garde le chiffre 1 : le libellé 4 décrit une facture
 *     définitive, pas une note de crédit.
 *   - Une catégorie absente vaut services (voir plus haut).
 *
 * Non produits non plus, parce que Deviso n'en a pas la donnée : S3, S5, S6
 * (sous-traitance, cotraitance) et B7 / S7 (TVA déjà collectée par
 * e-reporting).
 *
 * Fichier PUR, sans dépendance : appelé par lib/invoice-xml.ts (Factur-X
 * transmis, PDF, Chorus Pro) et lib/superpdp-achats.ts (déclaration d'un
 * achat à l'étranger, flux 10.1, TT-28 = même règle G1.02).
 */

export type CadreFacturation = "B1" | "S1" | "M1" | "B4" | "S4" | "M4";

export type EntreeCadre = {
  /** `invoices.operation_category` : "services" | "goods" | "mixed" (absent = services). */
  categorie: string | null | undefined;
  /** `invoices.invoice_type` : "standard" | "acompte" | "solde" | "avoir". */
  typeFacture?: string | null;
  /** BT-3, UNTDID 1001 (380, 386, 381...). */
  typeCode?: string | number | null;
  /** Le document renvoie à la facture d'acompte qu'il solde (BT-25 écrit). */
  renvoieAcompte?: boolean;
};

/** Avoirs (annexe 7, G1.01). Ils gardent le chiffre 1. */
const AVOIRS = new Set(["261", "381", "396", "502", "503"]);
/** Types interdits avec B4 / S4 / M4 (annexe 7, G1.60). */
const INTERDITS_APRES_ACOMPTE = new Set(["386", "500", "503"]);

export function lettreCadre(categorie: string | null | undefined): "B" | "S" | "M" {
  if (categorie === "goods") return "B";
  if (categorie === "mixed") return "M";
  return "S";
}

export function cadreFacturation(e: EntreeCadre): CadreFacturation {
  const lettre = lettreCadre(e.categorie);
  const code = String(e.typeCode ?? "380").trim();
  const avoir = e.typeFacture === "avoir" || AVOIRS.has(code);
  if (avoir) return `${lettre}1`;

  const definitiveApresAcompte =
    e.typeFacture === "solde" && e.renvoieAcompte === true && !INTERDITS_APRES_ACOMPTE.has(code);
  if (definitiveApresAcompte) return `${lettre}4`;
  return `${lettre}1`;
}
