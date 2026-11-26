import { ventilationTva, type LigneMontant } from "@/lib/tva";
import { natureEffective, type LigneNature } from "@/lib/nature-operation";

/**
 * Montants déclarés dans le statut `fr:212 Encaissée` (blocs MDT-207 « MEN »).
 *
 * Pourquoi ce fichier existe (26/11/2026). Une facture MIXTE (lignes de biens
 * ET lignes de prestations, BT-23 = M1) est désormais transmise en B2B. Or les
 * données de paiement ne concernent que les opérations dont la TVA est
 * exigible à l'encaissement : fiche DGFiP « Données de paiement à transmettre à
 * l'administration » (MAJ août 2026), « E-reporting des données de paiement
 * uniquement sur les opérations dont la TVA est exigible à l'encaissement (par
 * exemple les prestations de services) ». La TVA d'une livraison de biens est
 * exigible à la livraison (art. 269-2-a CGI).
 *
 * Super PDP ne fait pas le tri. Constaté au bac à sable le 24/11/2026 : sans
 * détail, il enregistre l'encaissement de TOUTE la facture (1 200 € sur une
 * facture dont 480 € de prestations), biens compris. Confirmé par écrit par
 * Super PDP (ticket 9381527, réponse lue le 26/11/2026) : « C'est donc bien l'encaissement
 * des 480€ qui est à déclarer ». Détail : docs/superpdp/factures-mixtes.md.
 *
 * D'où la règle :
 *   - facture mixte : un bloc par taux, sur les SEULES lignes de prestations,
 *     TOUJOURS envoyé (avec la date quand on l'a ; un bloc sans date est
 *     accepté, vérifié au bac à sable le 26/11) ;
 *   - toute autre facture : inchangé, blocs sur toutes les lignes quand la date
 *     et les montants sont sûrs, sinon corps minimal (Super PDP calcule).
 */
export type BlocMen = {
  type_code: "MEN";
  amount: string;
  currency_code: "EUR";
  value_percent: string;
  date?: string;
};

export type FactureEncaissement = {
  items?: (LigneMontant & LigneNature)[] | null;
  tva_rate?: number | string | null;
  total_ttc?: number | string | null;
  operation_category?: string | null;
};

/** Lignes dont l'encaissement se déclare : les prestations seules sur une facture mixte. */
export function lignesEncaissables(f: FactureEncaissement): (LigneMontant & LigneNature)[] {
  const lignes = f.items ?? [];
  if (f.operation_category !== "mixed") return lignes;
  return lignes.filter((l) => natureEffective(l, f.operation_category) === "services");
}

/**
 * Blocs MEN à joindre au `fr:212`. Tableau vide = corps minimal (laisser la
 * plateforme calculer), ce qui n'arrive jamais pour une facture mixte.
 */
export function blocsMen(f: FactureEncaissement, dateValide: string | null): BlocMen[] {
  const ttc = Number(f.total_ttc);
  const taux = Number(f.tva_rate);
  const chiffresSurs = Number.isFinite(ttc) && ttc > 0 && Number.isFinite(taux) && taux >= 0;
  const mixte = f.operation_category === "mixed";

  if (!mixte && !(dateValide && chiffresSurs)) return [];

  const v = ventilationTva(lignesEncaissables(f), Number.isFinite(taux) ? taux : 0);
  return v.groupes
    .filter((g) => !mixte || g.base_ht + g.montant_tva > 0)
    .map((g) => ({
      type_code: "MEN" as const,
      amount: (g.base_ht + g.montant_tva).toFixed(2),
      currency_code: "EUR" as const,
      value_percent: g.taux.toFixed(2),
      ...(dateValide ? { date: dateValide } : {}),
    }));
}
