// Ventilation de la TVA par taux, utilisee par tous les chemins qui calculent
// des totaux ou rendent une facture (creation, modification, devis,
// recurrentes, generation IA, Factur-X, PDF, plateforme agreee, FEC).

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

// Forme minimale attendue d'une ligne: son total HT et, optionnellement, son
// propre taux de TVA. Compatible avec ProposalItem et toutes les lignes de
// facture/devis de l'app, sans import ni cast chez les appelants.
export type LigneMontant = { total?: unknown; tva_rate?: number | null };

export type GroupeTva = {
  taux: number; // ex: 20, 10, 5.5, 0
  base_ht: number; // somme HT des lignes a ce taux
  montant_tva: number;
};

export type VentilationTva = {
  groupes: GroupeTva[]; // un groupe par taux present, trie par taux decroissant
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  multiTaux: boolean;
};

// Taux effectif d'une ligne: son propre taux s'il est defini, sinon le taux
// par defaut de la facture (derive du regime du compte). Garantit que les
// factures mono-taux et les lignes existantes se comportent comme avant.
export function tauxLigne(item: LigneMontant, tauxDefaut: number): number {
  const t = item.tva_rate;
  if (t === undefined || t === null || Number.isNaN(Number(t))) return tauxDefaut;
  return Number(t);
}

// Regroupe les lignes par taux et produit la ventilation (base HT et montant
// de TVA par taux) plus les totaux. La TVA est arrondie par groupe puis sommee,
// ce qui respecte la regle de coherence des montants (base + taxe = total).
export function ventilationTva(items: LigneMontant[], tauxDefaut: number): VentilationTva {
  const parTaux = new Map<number, number>();
  for (const it of items || []) {
    const taux = tauxLigne(it, tauxDefaut);
    const ht = round2(Number(it.total) || 0);
    parTaux.set(taux, round2((parTaux.get(taux) || 0) + ht));
  }
  const groupes: GroupeTva[] = [...parTaux.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([taux, base_ht]) => ({ taux, base_ht, montant_tva: round2((base_ht * taux) / 100) }));
  const total_ht = round2(groupes.reduce((s, g) => s + g.base_ht, 0));
  const total_tva = round2(groupes.reduce((s, g) => s + g.montant_tva, 0));
  const total_ttc = round2(total_ht + total_tva);
  return { groupes, total_ht, total_tva, total_ttc, multiTaux: groupes.length > 1 };
}
