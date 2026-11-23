/**
 * Nature d'une operation : livraison de biens ou prestation de services.
 * REGLE UNIQUE, partagee par l'ecran de facture, la route de creation, les
 * exports comptables (FEC, Quadra) et le livre des recettes (23/11/2026).
 *
 * Pourquoi. Jusqu'au 23/11/2026, la nature d'une facture
 * (`invoices.operation_category`) se choisissait a la main, une fois par
 * facture, avec « services » par defaut ; un devis converti n'en transmettait
 * aucune. Or elle decide du cadre de facturation (BT-23, donc la categorie
 * d'e-reporting), du compte de vente (706 / 707), de l'exigibilite de la TVA
 * (encaissement pour les services, facturation pour les biens) et de la
 * categorie du CA micro (abattements et seuils differents). Une erreur ici est
 * une erreur de declaration.
 *
 * Desormais chaque offre du catalogue porte sa nature, chaque ligne la reprend
 * (`items[].nature`), et la nature de la facture se DEDUIT des lignes :
 *   - que des prestations      -> "services"
 *   - que des biens            -> "goods"
 *   - les deux                 -> "mixed"
 *   - au moins une ligne sans nature -> on ne suppose rien : l'ecran demande,
 *     le serveur refuse si personne n'a tranche.
 *
 * Fichier PUR, sans dependance.
 */

export type NatureLigne = "goods" | "services";
export type CategorieOperation = "goods" | "services" | "mixed";

export function estNatureLigne(v: unknown): v is NatureLigne {
  return v === "goods" || v === "services";
}

export function estCategorieOperation(v: unknown): v is CategorieOperation {
  return v === "goods" || v === "services" || v === "mixed";
}

export type LigneNature = { nature?: unknown };

export type Deduction = {
  /** Categorie deduite des lignes qui ont une nature ; null si aucune n'en a. */
  categorie: CategorieOperation | null;
  /** Vrai si TOUTES les lignes ont une nature : la deduction est sure. */
  complete: boolean;
  /** Nombre de lignes sans nature. */
  sansNature: number;
};

/** Deduit la nature de l'operation de celle de ses lignes. */
export function deduireCategorie(lignes: LigneNature[] | null | undefined): Deduction {
  let biens = false;
  let services = false;
  let sansNature = 0;
  for (const l of lignes ?? []) {
    const n = l?.nature;
    if (n === "goods") biens = true;
    else if (n === "services") services = true;
    else sansNature++;
  }
  const categorie: CategorieOperation | null =
    biens && services ? "mixed" : biens ? "goods" : services ? "services" : null;
  return { categorie, complete: sansNature === 0 && categorie !== null, sansNature };
}

export type ResolutionCategorie =
  | { ok: true; categorie: CategorieOperation; source: "lignes" | "historique" }
  | { ok: false; erreur: "NATURE_A_PRECISER"; sansNature: number };

/**
 * Categorie a enregistrer sur une facture, cote serveur. Decision du
 * 23/11/2026 : elle se DEDUIT TOUJOURS des lignes. Une valeur envoyee par
 * l'appelant (`operation_category`) est ignoree : sans cela, une facture
 * pouvait dire « services » au PDF et au XML (BT-23) pendant que le FEC et le
 * livre des recettes, qui lisent les lignes, disaient « biens ». Toute ligne
 * doit porter sa nature, sinon refus (avant tout numero).
 *
 * Le parametre `_ignore` garde la signature des appelants qui recoivent la
 * valeur envoyee : elle n'entre JAMAIS dans le resultat.
 */
export function resoudreCategorie(
  lignes: LigneNature[] | null | undefined,
  _ignore?: unknown,
): ResolutionCategorie {
  void _ignore;
  const d = deduireCategorie(lignes);
  if (d.complete && d.categorie) return { ok: true, categorie: d.categorie, source: "lignes" };
  return { ok: false, erreur: "NATURE_A_PRECISER", sansNature: Math.max(d.sansNature, 1) };
}

/**
 * Meme regle pour un MODELE de facture recurrente, avec une seule tolerance :
 * un modele cree avant le 23/11/2026 dont AUCUNE ligne ne porte de nature
 * garde son comportement d'avant (services, `source: "historique"`). Des que
 * une ligne en porte une, toutes doivent en porter : refus sinon.
 */
export function resoudreCategorieModele(lignes: LigneNature[] | null | undefined): ResolutionCategorie {
  const d = deduireCategorie(lignes);
  if (d.complete && d.categorie) return { ok: true, categorie: d.categorie, source: "lignes" };
  if (d.categorie === null && (lignes ?? []).length > 0) return { ok: true, categorie: "services", source: "historique" };
  return { ok: false, erreur: "NATURE_A_PRECISER", sansNature: Math.max(d.sansNature, 1) };
}

/**
 * Montants d'une ligne : aucun negatif (quantite, prix unitaire, total). Une
 * remise se fait autrement, une annulation par un avoir (dont les montants
 * restent positifs, BR-27). Une ligne negative dans une facture mixte faisait
 * passer une TVA negative sous le seuil d'ecriture du FEC.
 */
export function ligneNegative(l: { quantity?: unknown; unit_price?: unknown; total?: unknown } | null | undefined): boolean {
  return [l?.quantity, l?.unit_price, l?.total].some((v) => v !== undefined && v !== null && Number(v) < 0);
}

/** Ne garde `nature` que si elle est valide. */
export function nettoyerNature<T extends { nature?: unknown }>(l: T): Omit<T, "nature"> & { nature?: NatureLigne } {
  const { nature, ...reste } = l;
  return estNatureLigne(nature) ? { ...reste, nature } : reste;
}

/**
 * Nature effective d'UNE ligne pour la ventilation comptable : la sienne si
 * elle en a une ; sinon celle de la facture quand elle est univoque ; une
 * facture mixte dont la ligne n'a pas de nature retombe en services (lecture
 * historique de lib/exports-comptables.ts et lib/recettes.ts).
 */
export function natureEffective(ligne: LigneNature | null | undefined, categorie: unknown): NatureLigne {
  const n = ligne?.nature;
  if (estNatureLigne(n)) return n;
  return categorie === "goods" ? "goods" : "services";
}

/** Libelles d'interface, une seule source. */
export const LIBELLE_NATURE: Record<NatureLigne, string> = {
  services: "Prestation de services",
  goods: "Vente de biens",
};
export const LIBELLE_NATURE_COURT: Record<NatureLigne, string> = {
  services: "Prestation",
  goods: "Bien",
};
export const LIBELLE_CATEGORIE: Record<CategorieOperation, string> = {
  services: "Prestation de services",
  goods: "Livraison de biens",
  mixed: "Mixte (biens + services)",
};

const normaliser = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export type OffreNature = { name: string; nature?: unknown };

/**
 * Nature d'une ligne d'apres le catalogue, pour les lignes qu'on ne voit pas
 * naitre d'un clic sur une offre (devis genere par l'IA) : la ligne reprend la
 * nature de l'offre dont elle porte le NOM en tete de description (le plus
 * long nom qui correspond l'emporte). Aucune correspondance, ou offre sans
 * nature : undefined, l'utilisateur tranchera. On ne demande pas la nature a
 * l'IA : elle se lit dans le catalogue, elle ne se devine pas.
 */
export function natureDepuisCatalogue(description: string | null | undefined, offres: OffreNature[]): NatureLigne | undefined {
  const d = normaliser(description ?? "");
  if (!d) return undefined;
  let meilleure: OffreNature | null = null;
  for (const o of offres) {
    const n = normaliser(o.name ?? "");
    if (!n) continue;
    const correspond = d === n || (d.startsWith(n) && /^[\s,;:.\-(]/.test(d.slice(n.length)));
    if (correspond && (!meilleure || n.length > normaliser(meilleure.name).length)) meilleure = o;
  }
  return meilleure && estNatureLigne(meilleure.nature) ? meilleure.nature : undefined;
}

/**
 * Repartit un montant (acompte, solde) entre les lignes d'un devis, par NATURE
 * et par TAUX de TVA, au prorata de leur HT : un devis mixte ou multi-taux
 * donne une part par couple (nature, taux), chacune reprenant le taux de ses
 * lignes. Lignes sans nature : une part sans nature (l'utilisateur tranchera).
 * La derniere part absorbe l'arrondi (la somme des parts vaut le montant), et
 * aucune part a 0 EUR n'est produite.
 */
export function repartirParNature(
  lignes: (LigneNature & { total?: unknown; tva_rate?: number | null })[] | null | undefined,
  montant: number,
): { nature: NatureLigne | undefined; tva_rate?: number; montant: number }[] {
  type Cle = { nature: NatureLigne | undefined; tva_rate?: number };
  const bases = new Map<string, { cle: Cle; base: number }>();
  for (const l of lignes ?? []) {
    const nature = estNatureLigne(l?.nature) ? l.nature : undefined;
    const t = l?.tva_rate;
    const tva_rate = t === undefined || t === null || Number.isNaN(Number(t)) ? undefined : Number(t);
    const k = `${nature ?? "-"}|${tva_rate ?? "-"}`;
    const e = bases.get(k) ?? { cle: { nature, ...(tva_rate !== undefined ? { tva_rate } : {}) }, base: 0 };
    e.base += Number(l?.total) || 0;
    bases.set(k, e);
  }
  const ordre = (n: NatureLigne | undefined) => (n === "services" ? 0 : n === "goods" ? 1 : 2);
  const entrees = [...bases.values()]
    .filter((e) => e.base > 0)
    .sort((a, b) => ordre(a.cle.nature) - ordre(b.cle.nature) || (b.cle.tva_rate ?? -1) - (a.cle.tva_rate ?? -1));
  const total = entrees.reduce((s, e) => s + e.base, 0);
  if (Math.round(montant * 100) <= 0) return [];
  if (entrees.length === 0 || total === 0) return [{ nature: undefined, montant }];
  let reste = Math.round(montant * 100);
  return entrees
    .map((e, i) => {
      const c = i === entrees.length - 1 ? reste : Math.round((montant * 100 * e.base) / total);
      reste -= c;
      return { ...e.cle, montant: c / 100 };
    })
    .filter((p) => p.montant !== 0);
}
