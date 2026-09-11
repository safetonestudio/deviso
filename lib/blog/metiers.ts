import { TARIFS_DATA } from "@/lib/tarifs-data";
import { ARTICLES, type Article } from "./registre";

/**
 * Le triangle des trois pages d'un même métier, calculé une fois.
 *
 * Pourquoi ce fichier existe. Pour chaque métier, Deviso a trois pages qui
 * visent le même champ sémantique :
 *
 *     /freelance-redacteur                        ← la landing produit
 *     /blog/devis-redacteur-web                   ← l'article
 *     /combien-facturer/redacteur-web-freelance   ← la page tarifs
 *
 * L'audit du 11/09/2026 a mesuré le maillage réel entre ces trois pages, par
 * métier : **deux arêtes sur six**, et les deux dans le même sens. L'article
 * pointait vers la landing, la page tarifs pointait vers la landing, et c'est
 * tout. Trois pages sur un même sujet qui ne se renvoient presque rien.
 *
 * La correspondance existait déjà, en double, dans deux endroits qui ne se
 * parlaient pas : `metier.landing` dans le registre du blog, et `landingHref`
 * dans `TARIFS_DATA`. Il suffisait de les joindre. C'est ce que fait ce fichier,
 * et c'est pour ça qu'aucune liste de correspondance n'est écrite à la main ici :
 * un métier ajouté au registre et aux tarifs est relié automatiquement.
 *
 * Conséquence pratique : ajouter un métier, c'est ajouter une entrée au registre
 * et une à `TARIFS_DATA`. Les six liens se créent tout seuls.
 */
export type Metier = {
  /** Chemin de la landing produit, qui sert de clé de jointure. */
  landing: string;
  /** Libellé court, pour les listes et les pieds de page. */
  label: string;
  /** L'article du blog, s'il existe. */
  article?: { slug: string; href: string; titre: string };
  /** La page tarifs, si le métier est dans `TARIFS_DATA`. */
  tarifs?: { slug: string; href: string; label: string };
};

function construire(): Metier[] {
  const articlesParLanding = new Map<string, Article>();
  for (const a of ARTICLES) {
    if (a.metier) articlesParLanding.set(a.metier.landing, a);
  }

  const tarifsParLanding = new Map(TARIFS_DATA.map((t) => [t.landingHref, t]));

  // L'union des deux sources, dans l'ordre du registre puis des tarifs : un
  // métier qui n'aurait qu'une page tarifs et pas d'article reste listé.
  const landings: string[] = [];
  for (const a of ARTICLES) {
    if (a.metier && !landings.includes(a.metier.landing)) landings.push(a.metier.landing);
  }
  for (const t of TARIFS_DATA) {
    if (!landings.includes(t.landingHref)) landings.push(t.landingHref);
  }

  return landings.map((landing) => {
    const a = articlesParLanding.get(landing);
    const t = tarifsParLanding.get(landing);
    return {
      landing,
      label: t?.name ?? a?.carte.titre ?? landing,
      ...(a
        ? { article: { slug: a.slug, href: `/blog/${a.slug}`, titre: a.carte.titre } }
        : {}),
      ...(t
        ? { tarifs: { slug: t.slug, href: `/combien-facturer/${t.slug}`, label: t.label } }
        : {}),
    };
  });
}

export const METIERS: Metier[] = construire();

const PAR_LANDING = new Map(METIERS.map((m) => [m.landing, m]));

/** Le métier rattaché à une landing page. */
export function metierDeLanding(landing: string): Metier | undefined {
  return PAR_LANDING.get(landing);
}

/**
 * Les métiers, réduits à ce dont un pied de page a besoin. Une liste de liens
 * croisés landing → landing, tenue à jour sans intervention.
 */
export const METIERS_LANDING: { landing: string; label: string }[] = METIERS.map((m) => ({
  landing: m.landing,
  label: m.label,
}));
