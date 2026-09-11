import { SITE } from "./registre";

/**
 * Qui écrit. Une seule déclaration, partagée par les pages et le balisage.
 *
 * Pourquoi ce fichier existe. Les dix-neuf articles étaient signés
 * `author: { "@type": "Organization", name: "Deviso" }` — c'est-à-dire par une
 * marque que personne ne connaît encore. Sur des sujets fiscaux et
 * réglementaires, Google valorise un auteur identifiable, et un lecteur aussi :
 * « Deviso vous explique les spécifications de la DGFiP » n'a pas le même poids
 * que quelqu'un qui les a lues et qui le dit sous son nom.
 *
 * C'est l'actif d'autorité le moins cher de tout le plan SEO : il ne demande pas
 * d'écrire une ligne de contenu de plus, seulement d'assumer la signature.
 *
 * La biographie ne contient que des faits vérifiables. Pas d'années
 * d'expérience inventées, pas de titre qu'on ne peut pas produire : sur un sujet
 * de conformité, une légitimité gonflée se retourne contre celui qui la gonfle.
 */

export const AUTEUR = {
  nom: "S. Albert",
  role: "Fondateur de Deviso",
  urlPage: `${SITE}/a-propos`,

  /** Une phrase, pour le bas d'un article. */
  resume:
    "Développeur indépendant en Gironde, fondateur de Deviso. J'ai lu les spécifications externes de la DGFiP pour écrire le code qui s'y conforme — c'est de là que vient tout ce que vous lisez ici.",

  /**
   * Ce qui rend la signature légitime. Chaque ligne est vérifiable : elle décrit
   * soit un fait administratif public, soit quelque chose qui existe dans le
   * produit et qu'on peut constater.
   */
  legitimite: [
    "J'ai construit Deviso seul, y compris l'intégration à une plateforme agréée, le cycle de vie des factures et la génération Factur-X.",
    "J'ai travaillé sur les spécifications externes de la DGFiP — les tableaux de statuts, les motifs de refus, les règles métier — parce qu'il fallait les implémenter, pas les résumer.",
    "Je suis moi-même micro-entrepreneur en France. Les obligations dont je parle sont aussi les miennes.",
    "Quand je ne sais pas, je l'écris. Plusieurs pages de ce site disent explicitement ce qui reste incertain dans les textes, et renvoient à la source officielle.",
  ],
} as const;

/** Le nœud `Person` du JSON-LD, pour les articles. */
export const AUTEUR_JSONLD = {
  "@type": "Person",
  "@id": `${AUTEUR.urlPage}#auteur`,
  name: AUTEUR.nom,
  url: AUTEUR.urlPage,
  jobTitle: AUTEUR.role,
  description: AUTEUR.resume,
  worksFor: { "@type": "Organization", name: "Deviso", url: SITE },
} as const;
