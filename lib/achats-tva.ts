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
export type NatureTva = "aucune" | "hors_france" | "francaise" | "etrangere";

export const NATURES_TVA: { valeur: NatureTva; libelle: string; aide: string }[] = [
  { valeur: "aucune", libelle: "Aucune TVA (autoliquidation)", aide: "La facture ne porte pas de TVA et l'achat a lieu en France (logiciel, prestation, marchandise livrée en France) : tu dois la TVA française et tu la déduis. Cas le plus courant." },
  { valeur: "hors_france", libelle: "Aucune TVA, opération hors de France", aide: "Hôtel, restaurant, transport, salon ou travaux à l'étranger, facturés sans TVA : l'opération n'a pas lieu en France, rien à autoliquider ni à déclarer." },
  { valeur: "francaise", libelle: "TVA française", aide: "La facture porte la TVA française (fournisseur enregistré à la TVA en France). Elle est déductible ; ton comptable vérifiera qu'elle était bien due." },
  { valeur: "etrangere", libelle: "TVA étrangère", aide: "TVA du pays du fournisseur (hôtel, salon, achat sur place) : elle n'est pas récupérable en France." },
];

/** Taux de TVA français (CGI, métropole et outre-mer). */
export const TAUX_FRANCAIS = [20, 10, 8.5, 5.5, 2.1, 1.05, 0.9] as const;
/** Taux appliqué à une autoliquidation quand rien d'autre n'est dit : le taux normal. */
export const TAUX_AUTOLIQUIDATION_DEFAUT = 20;

export const estNatureTva = (v: unknown): v is NatureTva => v === "aucune" || v === "hors_france" || v === "francaise" || v === "etrangere";
/** Natures sans TVA sur la facture (montant nul, imposé en base). */
export const sansTvaFacturee = (n: NatureTva | null | undefined) => n === "aucune" || n === "hors_france";
export const estTauxFrancais = (v: unknown) => TAUX_FRANCAIS.some((t) => Math.abs(t - Number(v)) < 1e-9);

/**
 * Nature de la TVA d'un achat. Obligatoire en base depuis le 21/11/2026, avec
 * une contrainte qui la lie au montant ; le repli sur le montant ne sert plus
 * qu'à une saisie incomplète avant validation.
 */
export function natureTva(a: { tva_facturee?: string | null; montant_tva: number | string | null }): NatureTva {
  if (estNatureTva(a.tva_facturee)) return a.tva_facturee;
  return Number(a.montant_tva) > 0 ? "etrangere" : "aucune";
}

/** États membres de l'UE (codes ISO, plus « EL » pour la Grèce dans les n° de TVA). */
export const PAYS_UE = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "GR", "EL", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];

/** Biens achetés hors UE : importation, la TVA se liquide en douane, pas sur la facture. */
export const estImportation = (categorie: string | null | undefined, pays: string | null | undefined) =>
  categorie === "biens" && !PAYS_UE.includes(String(pays ?? "").toUpperCase());

/**
 * L'achat est-il hors du champ de l'e-reporting d'acquisition ? (21/11/2026)
 *
 * Sont déclarés, par l'acheteur établi en France, les achats auprès d'un
 * assujetti non établi qui sont SITUÉS EN FRANCE : acquisitions
 * intracommunautaires de biens, livraisons de biens imposables en France,
 * prestations de services situées en France (CGI art. 290, I-3° ;
 * BOI-TVA-DECLA-20-30-50-10 § 60). Restent hors champ :
 *  - les importations (même texte, remarque) : biens venus d'un pays tiers
 *    sans TVA française sur la facture ; la douane les connaît, leur TVA
 *    s'autoliquide sur la déclaration de TVA (CGI art. 1695 II) ;
 *  - une opération facturée avec une TVA ÉTRANGÈRE : son lieu d'imposition est
 *    hors de France (hôtel, salon, achat sur place), elle n'est pas taxable en
 *    France.
 * Renvoie le motif, à afficher, ou null si l'achat doit être déclaré.
 */
export function motifHorsChamp(a: { tva_facturee?: string | null; montant_tva: number | string | null; categorie: string | null; fournisseur_pays: string | null }): string | null {
  const nature = natureTva(a);
  if (nature === "hors_france") {
    return "Hors du champ de la déclaration : opération réalisée hors de France, sans TVA française (CGI art. 259 A et 290). L'achat reste dans ta comptabilité.";
  }
  if (nature === "etrangere") {
    return "Hors du champ de la déclaration : la TVA étrangère facturée montre une opération située hors de France (CGI art. 290). L'achat reste dans ta comptabilité.";
  }
  if (nature === "aucune" && estImportation(a.categorie, a.fournisseur_pays)) {
    return "Hors du champ de la déclaration : importation de biens, connue par la douane (BOI-TVA-DECLA-20-30-50-10). Sa TVA s'autoliquide sur ta déclaration de TVA (CGI art. 1695 II). L'achat reste dans ta comptabilité.";
  }
  return null;
}
