/**
 * TVA d'un achat à l'étranger (21/11/2026). Sans dépendance serveur : importé
 * par les formulaires de saisie, la validation, la transmission et l'export.
 *
 * Ce que porte la facture du fournisseur :
 *  - « aucune »    : pas de TVA. Autoliquidation : l'acheteur doit la TVA
 *    française au taux applicable (`taux_autoliquidation`, 20 % par défaut) et
 *    la déduit ; pour des biens achetés hors UE, c'est une importation, la TVA
 *    se liquide sur la déclaration en douane ;
 *  - « francaise » : TVA française, facturée par un fournisseur immatriculé à la
 *    TVA en France : déductible comme celle d'un fournisseur français ;
 *  - « etrangere » : TVA du pays du fournisseur : non déductible en France,
 *    elle s'ajoute à la charge.
 *
 * Les achats saisis avant ce choix n'ont pas de nature en base (NULL) : on
 * garde la règle d'alors, déduite du montant (TVA > 0 = étrangère).
 */
export type NatureTva = "aucune" | "francaise" | "etrangere";

export const NATURES_TVA: { valeur: NatureTva; libelle: string; aide: string }[] = [
  { valeur: "aucune", libelle: "Aucune TVA (autoliquidation)", aide: "La facture ne porte pas de TVA : tu la dois en France et tu la déduis. Cas le plus courant (services de l'UE)." },
  { valeur: "francaise", libelle: "TVA française", aide: "Le fournisseur est immatriculé à la TVA en France et facture la TVA française : elle est déductible." },
  { valeur: "etrangere", libelle: "TVA étrangère", aide: "TVA du pays du fournisseur (hôtel, salon, achat sur place) : elle n'est pas récupérable en France." },
];

/** Taux de TVA français (CGI, métropole et outre-mer). */
export const TAUX_FRANCAIS = [20, 10, 8.5, 5.5, 2.1, 1.05, 0.9] as const;
/** Taux appliqué à une autoliquidation quand rien d'autre n'est dit : le taux normal. */
export const TAUX_AUTOLIQUIDATION_DEFAUT = 20;

export const estNatureTva = (v: unknown): v is NatureTva => v === "aucune" || v === "francaise" || v === "etrangere";
export const estTauxFrancais = (v: unknown) => TAUX_FRANCAIS.some((t) => Math.abs(t - Number(v)) < 1e-9);

/** Nature de la TVA d'un achat, y compris pour un achat saisi avant ce choix. */
export function natureTva(a: { tva_facturee?: string | null; montant_tva: number | string | null }): NatureTva {
  if (estNatureTva(a.tva_facturee)) return a.tva_facturee;
  return Number(a.montant_tva) > 0 ? "etrangere" : "aucune";
}

/** États membres de l'UE (codes ISO, plus « EL » pour la Grèce dans les n° de TVA). */
export const PAYS_UE = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "GR", "EL", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];

/** Biens achetés hors UE : importation, la TVA se liquide en douane, pas sur la facture. */
export const estImportation = (categorie: string | null | undefined, pays: string | null | undefined) =>
  categorie === "biens" && !PAYS_UE.includes(String(pays ?? "").toUpperCase());
