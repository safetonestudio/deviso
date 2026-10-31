/**
 * TVA multi-taux : la ventilation par taux, sans reseau.
 *
 * ventilationTva est le coeur de calcul partage par le Factur-X, le PDF,
 * l'export FEC et l'emission vers la plateforme agreee : si la base HT et la
 * TVA par taux sont justes ici, elles le sont partout. La conformite du XML
 * multi-taux lui-meme est jugee par le validateur officiel via test:conformite.
 */
import { verifier, bilan } from "./lib.mjs";
import { ventilationTva } from "../../lib/tva.ts";

console.log("");
console.log("-- TVA multi-taux : ventilation --");
console.log("");

// 1. Mono-taux : comportement inchange
{
  const v = ventilationTva([{ total: 100 }], 20);
  verifier("mono: un seul groupe, multiTaux faux", v.groupes.length === 1 && v.multiTaux === false);
  verifier("mono: total_ht 100", v.total_ht === 100, String(v.total_ht));
  verifier("mono: total_tva 20", v.total_tva === 20, String(v.total_tva));
  verifier("mono: total_ttc 120", v.total_ttc === 120, String(v.total_ttc));
}

// 2. Multi-taux explicite par ligne
{
  const v = ventilationTva([{ total: 100, tva_rate: 20 }, { total: 50, tva_rate: 10 }], 20);
  verifier("multi: deux groupes, multiTaux vrai", v.groupes.length === 2 && v.multiTaux === true);
  verifier("multi: 20% => 100 HT / 20 TVA", v.groupes[0].taux === 20 && v.groupes[0].base_ht === 100 && v.groupes[0].montant_tva === 20);
  verifier("multi: 10% => 50 HT / 5 TVA", v.groupes[1].taux === 10 && v.groupes[1].base_ht === 50 && v.groupes[1].montant_tva === 5);
  verifier("multi: total_ht 150", v.total_ht === 150, String(v.total_ht));
  verifier("multi: total_tva 25", v.total_tva === 25, String(v.total_tva));
  verifier("multi: total_ttc 175", v.total_ttc === 175, String(v.total_ttc));
}

// 3. Une ligne sans taux herite du taux par defaut
{
  const v = ventilationTva([{ total: 100 }, { total: 50, tva_rate: 10 }], 20);
  const g20 = v.groupes.find((g) => g.taux === 20);
  const g10 = v.groupes.find((g) => g.taux === 10);
  verifier("defaut herite: 20% base 100", !!g20 && g20.base_ht === 100);
  verifier("defaut herite: 10% base 50", !!g10 && g10.base_ht === 50);
}

// 4. Deux lignes au meme taux fusionnent en un groupe
{
  const v = ventilationTva([{ total: 100, tva_rate: 20 }, { total: 50, tva_rate: 20 }], 20);
  verifier("meme taux: un seul groupe", v.groupes.length === 1 && v.groupes[0].base_ht === 150);
}

// 5. Arrondi par groupe (regle base + taxe = total)
{
  const v = ventilationTva([{ total: 33.33, tva_rate: 20 }], 20);
  verifier("arrondi: TVA 6.67", v.total_tva === 6.67, String(v.total_tva));
  verifier("arrondi: TTC 40.00", v.total_ttc === 40, String(v.total_ttc));
}

// 6. Ligne a 0% melangee a une ligne taxee
{
  const v = ventilationTva([{ total: 100, tva_rate: 20 }, { total: 30, tva_rate: 0 }], 20);
  verifier("mix 0%: deux groupes", v.groupes.length === 2 && v.multiTaux === true);
  verifier("mix 0%: total_tva 20", v.total_tva === 20, String(v.total_tva));
  verifier("mix 0%: total_ttc 150", v.total_ttc === 150, String(v.total_ttc));
}

process.exit(bilan() ? 1 : 0);
