import type { LucideIcon } from "lucide-react";

/**
 * Les catégories du blog, déclarées une fois.
 *
 * Pourquoi ce fichier existe. L'index `/blog` affichait deux menus dépliants
 * écrits à la main, un pour la réforme, un pour les métiers, plus des cartes
 * à plat pour tout le reste. Trois présentations différentes, dont deux codées
 * en dur avec leur titre, leur compteur et leur couleur. Ajouter une catégorie
 * voulait dire écrire un troisième bloc de JSX, et ajouter un article à une
 * catégorie qui n'avait pas de bloc revenait à le publier dans un fourre-tout.
 *
 * Désormais une catégorie est une ligne de données. L'index en dérive un menu
 * dépliant, le fil d'Ariane son libellé, et `check-blog` vérifie qu'aucun
 * article ne référence une catégorie qui n'existe pas, et qu'aucune catégorie
 * déclarée ne reste vide, parce qu'un menu vide est un bug visible.
 *
 * L'ordre du tableau est l'ordre d'affichage. Il n'est pas alphabétique : il va
 * du plus urgent pour le lecteur au plus durable.
 */

/**
 * Les identifiants de catégorie. Le type se déduit du tableau plus bas, donc
 * ajouter une catégorie, c'est ajouter une entrée, pas maintenir une union à
 * part qui finirait par diverger.
 */
export type Categorie = (typeof CATEGORIES)[number]["id"];

/** La forme d'une catégorie, hors identifiant, pour éviter une référence circulaire. */
type FormeCategorie = {
  id: string;
  /** Titre du menu dépliant sur `/blog`. */
  titre: string;
  /** Étiquette courte, affichée sur les cartes et en haut des articles. */
  badge: string;
  /** Une phrase qui dit à qui s'adresse la catégorie et ce qu'elle couvre. */
  resume: string;
  /**
   * Couleur d'accent. Volontairement limitée à quatre valeurs connues : une
   * couleur libre par catégorie produirait une page arlequin au quatrième ajout.
   */
  accent: "amber" | "indigo" | "emerald" | "rose" | "sky";
  /**
   * Les catégories réglementaires bougent et portent la valeur SEO : leurs
   * articles sortent en priorité 0.9 au sitemap, les autres en 0.8.
   */
  prioritaire?: boolean;
  /** Ouverte par défaut sur `/blog`. Au plus une, sinon la page n'a plus de hiérarchie. */
  ouverteParDefaut?: boolean;
};

/*
 * OÙ RANGER UN NOUVEL ARTICLE (réorganisation du 20/11/2026).
 *
 * Les familles sont rangées par SUJET, pas par public : un article sur les
 * délais de paiement sert autant à une SASU qu'à un micro-entrepreneur. Pour
 * classer un nouvel article, se demander ce que le lecteur cherche à faire :
 *
 *   reforme     se mettre en conformité avec la facturation électronique 2026
 *   factures    émettre le bon document, avec les bonnes mentions (devis,
 *               facture, avoir, acompte, numérotation, frais, étranger)
 *   paiement    être payé et ne pas se faire voler (délais, relances,
 *               impayés, fraudes)
 *   micro       tenir une micro-entreprise (URSSAF, TVA, plafonds, livre
 *               des recettes, calendrier) : tout ce qui ne vaut QUE pour le micro
 *   gestion     décider et faire grandir l'entreprise (statut, prix, régime,
 *               outils, embauche, trésorerie) : toutes formes d'entreprise
 *   metier      un devis propre à une profession (un article par métier)
 *   comptables  ce qu'un expert-comptable veut savoir pour ses clients
 *
 * Un article qui hésite entre « micro » et une autre famille va dans l'autre :
 * « micro » est réservé à ce qui ne concerne que le régime micro. Ajouter une
 * famille reste possible, mais seulement quand trois articles au moins la
 * justifient, sinon l'index se fragmente.
 */
export const CATEGORIES = [
  {
    id: "reforme",
    titre: "Facturation électronique : la réforme, concrètement",
    badge: "Réforme 2026",
    resume:
      "La réforme est entrée en application le 1er septembre 2026. Ce qui s'applique déjà, ce qui arrive en 2027, les plateformes agréées, l'e-reporting, les amendes réelles.",
    accent: "amber",
    prioritaire: true,
  },
  {
    id: "factures",
    titre: "Devis et factures : les règles du jeu",
    badge: "Devis et factures",
    resume:
      "Quel document émettre et ce qu'il doit contenir : devis, acompte, avoir, note d'honoraires, numérotation, frais refacturés, clients à l'étranger.",
    accent: "indigo",
  },
  {
    id: "paiement",
    titre: "Se faire payer et se protéger",
    badge: "Paiement",
    resume:
      "Délais légaux, pénalités de retard, relances, impayés, fraude au faux RIB : sécuriser l'argent que vos clients vous doivent.",
    accent: "rose",
  },
  {
    id: "micro",
    titre: "Micro-entreprise : cotisations, TVA et plafonds",
    badge: "Micro-entreprise",
    resume:
      "Déclarations URSSAF, versement libératoire, passage à la TVA, livre des recettes, plafonds, calendrier : tenir sa micro-entreprise sans s'y perdre.",
    accent: "sky",
  },
  {
    id: "gestion",
    titre: "Gérer et développer son entreprise",
    badge: "Gestion",
    resume:
      "Choisir son statut, fixer ses prix, passer au régime réel, s'entourer d'un expert-comptable, choisir ses outils : les décisions qui font grandir une entreprise.",
    accent: "emerald",
  },
  {
    id: "metier",
    titre: "Devis par métier",
    badge: "Par métier",
    resume:
      "Mentions obligatoires, exemple chiffré et clauses propres à chaque profession. Un guide dédié par métier.",
    accent: "indigo",
  },
  {
    id: "comptables",
    titre: "Pour les experts-comptables",
    badge: "Experts-comptables",
    resume:
      "Mandat et lettre de mission, trajectoire de conformité, échéance de 2027 : accompagner ses clients dans la réforme et suivre tout un portefeuille.",
    accent: "sky",
  },
] as const satisfies readonly FormeCategorie[];

/**
 * La même liste, typée `Categorie_[]`.
 *
 * `as const satisfies` ci-dessus sert à déduire le type `Categorie` des
 * identifiants réels. Mais il fige aussi chaque entrée sur ses seules clés
 * présentes, donc `c.prioritaire` ou `c.ouverteParDefaut` ne se lisent pas sur
 * une entrée qui ne les déclare pas. Cette vue-là les rend uniformément
 * lisibles, sans perdre l'union d'identifiants.
 */
export type Categorie_ = FormeCategorie & { id: Categorie };

export const LISTE_CATEGORIES: readonly Categorie_[] = CATEGORIES;

const PAR_ID = new Map<string, Categorie_>(CATEGORIES.map((c) => [c.id, c]));

/**
 * Récupérer une catégorie. Lève si elle n'existe pas : le registre est lu au
 * rendu, donc une catégorie inventée casse la compilation plutôt que de
 * produire un article invisible sur l'index.
 */
export function categorie(id: string): Categorie_ {
  const c = PAR_ID.get(id);
  if (!c) {
    throw new Error(
      `[blog] catégorie inconnue : « ${id} ». Catégories déclarées : ${CATEGORIES.map((x) => x.id).join(", ")}`
    );
  }
  return c;
}

/** Les classes Tailwind par accent, en un seul endroit. */
export const ACCENTS: Record<
  Categorie_["accent"],
  { badge: string; bordure: string; bordureActive: string; texte: string; survol: string }
> = {
  amber: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    bordure: "border-amber-500/20",
    bordureActive: "open:border-amber-500/40 hover:border-amber-500/40",
    texte: "group-open:text-amber-200",
    survol: "group-hover/item:text-amber-200",
  },
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    bordure: "border-ds-border",
    bordureActive: "open:border-indigo-500/30 hover:border-indigo-500/40",
    texte: "group-open:text-indigo-200",
    survol: "group-hover/item:text-indigo-200",
  },
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    bordure: "border-ds-border",
    bordureActive: "open:border-emerald-500/30 hover:border-emerald-500/40",
    texte: "group-open:text-emerald-200",
    survol: "group-hover/item:text-emerald-200",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    bordure: "border-ds-border",
    bordureActive: "open:border-rose-500/30 hover:border-rose-500/40",
    texte: "group-open:text-rose-200",
    survol: "group-hover/item:text-rose-200",
  },
  sky: {
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    bordure: "border-ds-border",
    bordureActive: "open:border-sky-500/30 hover:border-sky-500/40",
    texte: "group-open:text-sky-200",
    survol: "group-hover/item:text-sky-200",
  },
};

/** L'icône d'une catégorie est fournie par l'index, qui seul importe lucide. */
export type IconesCategorie = Partial<Record<Categorie, LucideIcon>>;
