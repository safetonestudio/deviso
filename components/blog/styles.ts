import { H1, H2 } from "@/components/site/PageSite";

/**
 * Jetons de mise en page des articles du blog, dérivés de ceux de l'accueil
 * (components/site/PageSite.tsx). Une seule source pour les gabarits.
 */

/** Titre d'article : le H1 de l'accueil, plafonné pour tenir en colonne de lecture. */
export const H1_ARTICLE = H1.replace("text-[clamp(34px,4.1vw,60px)]", "text-[clamp(30px,3.6vw,46px)]");

/** Titre de section d'article : le H2 du cadre. */
export const H2_ARTICLE = `${H2} mb-5`;

/** Corps de lecture : 17 px, interligne relâché. */
export const CORPS = "text-[17px] leading-[1.75] text-gray-300";

/** Lien de texte : souligné au survol. */
export const LIEN = "text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 transition-colors";

/** Surface de carte, sans bordure. */
export const CARTE = "bg-ds-surface rounded-xl";

/** Carte cliquable : survol discret. */
export const CARTE_LIEN = `${CARTE} hover:bg-ds-elevated transition-colors`;

/** Encadrés d'article : surface plus filet de couleur selon le sens. */
export const ENCADRE = {
  /** Information, réforme. */
  info: `${CARTE} border-l-[3px] border-sky-400`,
  /** Avertissement, échéance. */
  alerte: `${CARTE} border-l-[3px] border-amber-400`,
  /** Conseil, action. */
  conseil: `${CARTE} border-l-[3px] border-indigo-400`,
} as const;

export { H2 };
