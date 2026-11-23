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
  | { ok: true; categorie: CategorieOperation; source: "lignes" | "choix" | "historique" }
  | { ok: false; erreur: "NATURE_A_PRECISER"; sansNature: number };

/**
 * Categorie a enregistrer sur une facture, cote serveur.
 *
 *   1. un choix explicite valide l'emporte (la nature reste modifiable par
 *      l'utilisateur, qui peut savoir mieux que ses lignes) ;
 *   2. sinon la deduction, si toutes les lignes ont une nature ;
 *   3. aucune ligne n'a de nature (appel ancien, facture recurrente creee
 *      avant le 23/11/2026) : "services", le comportement historique, signale
 *      par `source: "historique"` ;
 *   4. certaines lignes ont une nature et d'autres non, sans choix : refus.
 *      On ne devine pas une moitie de facture.
 */
export function resoudreCategorie(
  lignes: LigneNature[] | null | undefined,
  choix: unknown,
): ResolutionCategorie {
  if (estCategorieOperation(choix)) return { ok: true, categorie: choix, source: "choix" };
  const d = deduireCategorie(lignes);
  if (d.complete && d.categorie) return { ok: true, categorie: d.categorie, source: "lignes" };
  if (d.categorie === null) return { ok: true, categorie: "services", source: "historique" };
  return { ok: false, erreur: "NATURE_A_PRECISER", sansNature: d.sansNature };
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
 * Repartit un montant (acompte, solde) entre les natures des lignes d'un
 * devis, au prorata de leur HT. Une seule nature presente : une seule part.
 * Lignes sans nature : une part sans nature (l'utilisateur tranchera). La
 * derniere part absorbe l'arrondi : la somme des parts vaut le montant.
 */
export function repartirParNature(
  lignes: (LigneNature & { total?: unknown })[] | null | undefined,
  montant: number,
): { nature: NatureLigne | undefined; montant: number }[] {
  const bases = new Map<NatureLigne | undefined, number>();
  for (const l of lignes ?? []) {
    const n = estNatureLigne(l?.nature) ? l.nature : undefined;
    bases.set(n, (bases.get(n) ?? 0) + (Number(l?.total) || 0));
  }
  const total = [...bases.values()].reduce((s, v) => s + v, 0);
  const entrees = [...bases.entries()].filter(([, v]) => v !== 0);
  if (entrees.length <= 1 || total === 0) {
    return [{ nature: entrees[0]?.[0] ?? (bases.size === 1 ? [...bases.keys()][0] : undefined), montant }];
  }
  // Ordre stable : services, biens, puis sans nature.
  const ordre = (n: NatureLigne | undefined) => (n === "services" ? 0 : n === "goods" ? 1 : 2);
  entrees.sort((a, b) => ordre(a[0]) - ordre(b[0]));
  let reste = Math.round(montant * 100);
  return entrees.map(([nature, base], i) => {
    const c = i === entrees.length - 1 ? reste : Math.round((montant * 100 * base) / total);
    reste -= c;
    return { nature, montant: c / 100 };
  });
}
