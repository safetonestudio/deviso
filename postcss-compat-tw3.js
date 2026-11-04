/**
 * Compatibilite Tailwind 3 : space-x/y, divide-x/y, et interligne des
 * tailles de texte (voir INTERLIGNE plus bas).
 *
 * Pourquoi. Tailwind 4 a change le selecteur de ces utilitaires :
 *   v3 : .space-y-4 > :not([hidden]) ~ :not([hidden])   { margin-top }
 *   v4 : :where(.space-y-4 > :not(:last-child))          { margin-bottom }
 * Trois effets visibles sur nos 250 usages : un enfant qui porte son propre
 * mt-* ou mb-* n'est plus ecrase (specificite nulle de :where), il s'ajoute ;
 * un dernier enfant masque (classe hidden, lg:hidden) laisse une marge en trop
 * sous l'avant-dernier ; un enfant avec l'attribut hidden compte de nouveau.
 * Tailwind 4 ne permet ni de desactiver ni de remplacer un utilitaire natif
 * (un @utility du meme nom s'ajoute au lieu de remplacer), d'ou ce greffon,
 * place APRES @tailwindcss/postcss : il reecrit les regles generees pour
 * retrouver exactement celles de la v3.
 *
 * Correspondance (r = --tw-*-reverse, 0 par defaut) :
 *   v4 margin-block-end   = V*(1-r)  ->  v3 margin-top
 *   v4 margin-block-start = V*r      ->  v3 margin-bottom
 *   v4 margin-inline-end  = V*(1-r)  ->  v3 margin-left
 *   v4 margin-inline-start= V*r      ->  v3 margin-right
 *   meme permutation pour les largeurs de bordure de divide-*.
 *
 * A retirer le jour ou la refonte decide d'adopter le comportement v4 (ou de
 * passer ces blocs en flex + gap). Garde : check:tailwind4.
 */
// Espaces facultatifs autour de ">" : en production, Tailwind minifie avant nous.
const SELECTEUR = /:where\(((?:[^()]|\([^()]*\))+?)\s*>\s*:not\(:last-child\)\)/g;
const UTILITAIRE = /(?:^|[\s.:\\])-?(?:space|divide)-/;

const PERMUTATION = {
  "margin-block-end": "margin-top",
  "margin-block-start": "margin-bottom",
  "margin-inline-end": "margin-left",
  "margin-inline-start": "margin-right",
  "border-bottom-width": "border-top-width",
  "border-top-width": "border-bottom-width",
  "border-inline-end-width": "border-left-width",
  "border-inline-start-width": "border-right-width",
};

/** Exporte pour le controle check:tailwind4. */
function reecrireSelecteur(sel) {
  return sel.replace(SELECTEUR, (tout, interieur) =>
    UTILITAIRE.test(interieur) ? `${interieur} > :not([hidden]) ~ :not([hidden])` : tout
  );
}

/**
 * Interligne des tailles de texte. En v4, text-4xl ecrit
 * line-height: var(--tw-leading, 2.5rem) : un leading-tight pose a cote gagne
 * toujours, meme quand text-4xl vient d'une variante (sm:text-4xl). En v3,
 * sm:text-4xl, plus loin dans la feuille, ecrasait leading-tight au-dela de
 * 640 px (titres du blog et des pages publiques : 40 px et non 45 px).
 * On retire l'enveloppe var(--tw-leading, ...) : l'ordre de la feuille decide
 * de nouveau, comme en v3 (leading-* vient apres text-* a variante egale).
 */
const INTERLIGNE = /^var\(--tw-leading,\s*(.+)\)$/;

module.exports = () => ({
  postcssPlugin: "compat-tw3-espacement",
  OnceExit(root) {
    root.walkDecls("line-height", (d) => {
      const m = d.value.match(INTERLIGNE);
      if (m) d.value = m[1];
    });
    root.walkRules((rule) => {
      const avant = rule.selector;
      const apres = reecrireSelecteur(avant);
      if (apres === avant) return;
      rule.selector = apres;
      rule.each((d) => {
        if (d.type === "decl" && PERMUTATION[d.prop]) d.prop = PERMUTATION[d.prop];
      });
    });
  },
});
module.exports.postcss = true;
module.exports.reecrireSelecteur = reecrireSelecteur;
module.exports.PERMUTATION = PERMUTATION;
module.exports.INTERLIGNE = INTERLIGNE;
