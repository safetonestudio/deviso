/**
 * Le registre : une seule source de vérité pour tout le contenu du blog.
 *
 * Pourquoi ce fichier existe. Avant lui, publier un article demandait de saisir
 * la même information à six endroits : les métadonnées Next, le JSON-LD de la
 * page, l'entrée du sitemap, la carte de l'index `/blog`, le `hasPart` du
 * `CollectionPage`, et les liens « articles liés ». Six saisies manuelles dont
 * deux qu'on peut oublier **en silence**, un article absent du sitemap n'est
 * signalé par rien, il est seulement invisible.
 *
 * L'audit SEO du 11/09/2026 a montré ce que ça coûtait. 19 articles, 4 398
 * lignes de TSX, et quatre erreurs factuelles dispersées dans quatre fichiers :
 * des montants d'amendes périmés depuis le 1er septembre 2026, recopiés à la
 * fois dans le corps d'un article, dans un JSON-LD `FAQPage` et sur l'index.
 * Le problème n'était pas la volonté de tenir le blog à jour, c'était son prix
 * unitaire.
 *
 * Trois propriétés que le code précédent n'avait pas :
 *
 *   - **une information est écrite une fois.** Le titre, la description, les
 *     dates, la catégorie, le métier rattaché : ici, et nulle part ailleurs ;
 *   - **une erreur de slug casse la compilation.** `article("typo")` lève, donc
 *     un lien interne mort ne peut plus atteindre la production ;
 *   - **`misAJourLe` est une vraie date.** Elle ne bouge que quand on modifie
 *     le contenu, ce qui rend enfin la fraîcheur mesurable, c'est le signal
 *     qu'un blog réglementaire doit pouvoir envoyer.
 *
 * Ce que ce fichier ne contient pas, volontairement : les icônes (elles
 * resteraient importées par le sitemap, qui n'en a rien à faire) et le corps
 * des articles (il vit dans le JSX de la page, ou dans les props de
 * `<BlogPost>`). Le registre porte ce qui est *partagé*, pas tout.
 *
 * Pour publier un article, voir `docs/seo/04-publier-un-article.md`.
 */

export const SITE = "https://getdeviso.fr";

/**
 * Les catégories vivent dans `lib/blog/categories.ts`, et le type s'en déduit :
 * ajouter une catégorie, c'est ajouter une entrée là-bas, et le compilateur
 * accepte aussitôt les articles qui s'y rattachent. Une catégorie inventée ici
 * casse la compilation, c'est le but.
 */
export type { Categorie } from "./categories";
import type { Categorie } from "./categories";

export type Article = {
  slug: string;
  categorie: Categorie;
  /** Titre de l'onglet. Le gabarit `%s | Deviso` de `app/layout.tsx` s'y ajoute. */
  titre: string;
  /** Méta-description. 150-160 caractères, c'est ce que Google affiche. */
  description: string;
  /** Le H1 de la page, et le `headline` du JSON-LD. Les deux doivent coïncider. */
  h1: string;
  /** Titre et description du partage social, quand ils gagnent à être plus longs. */
  og?: { titre?: string; description?: string };
  /** Date de première publication. Ne change jamais. */
  publieLe: string;
  /**
   * Date de dernière modification *de fond*. À avancer quand on corrige un
   * chiffre, une date, un paragraphe, jamais pour faire joli : un `lastmod`
   * qui bouge sans raison est un `lastmod` que Google finit par ignorer.
   */
  misAJourLe: string;
  dureeLecture: number;
  /** Ce que voit le visiteur sur l'index `/blog`. */
  carte: { titre: string; resume: string; badge?: string };
  /**
   * Métier rattaché, pour les articles de la famille `metier`. C'est ce qui
   * permet de relier automatiquement les trois pages d'un même métier :
   * l'article, la landing produit et la page tarifs.
   */
  metier?: {
    landing: string;
    landingLabel: string;
    profession: string;
    professionPluriel: string;
  };
  /** Articles à proposer en fin de lecture. Slugs du registre, vérifiés au build. */
  lies?: string[];
};

/**
 * Ordre d'importance décroissante à l'intérieur de chaque famille : c'est lui
 * qui fixe la priorité dans le sitemap et l'ordre d'affichage sur `/blog`.
 */
export const ARTICLES: Article[] = [
  // ── Famille « réforme » ────────────────────────────────────────────────────
  {
    slug: "facturation-electronique-2026",
    categorie: "reforme",
    titre: "Facturation électronique 2026 : le guide",
    description:
      "Facturation électronique : ce qui s'applique depuis le 1er septembre 2026, ce qui arrive en 2027, formats et plateformes agréées, pour toute entreprise.",
    h1: "Facturation électronique 2026 : le guide complet pour les entreprises, des indépendants aux PME",
    og: {
      titre: "Facturation électronique 2026 : le guide complet pour les entreprises",
      description:
        "Calendrier, formats Factur-X, plateformes agréées, e-reporting, tout comprendre en 10 minutes.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-11-27",
    dureeLecture: 10,
    carte: {
      titre: "Guide complet réforme facturation électronique 2026",
      resume:
        "Ce qui s'applique déjà, ce qui arrive en 2027, pas de portail public gratuit, Factur-X, plateformes agréées",
      badge: "Guide pilier",
    },
    lies: [
      "facture-electronique-refusee-que-faire",
      "plateforme-agreee-ou-solution-compatible",
      "reforme-facturation-micro-entrepreneur",
      "choisir-plateforme-agreee-freelance",
      "e-reporting-freelance-2026",
      "checklist-reforme-facturation-2026",
    ],
  },
  {
    slug: "reforme-facturation-micro-entrepreneur",
    categorie: "reforme",
    titre: "Micro-entrepreneur : la réforme 2026 expliquée",
    description:
      "Micro-entrepreneur : ce que la réforme de la facturation électronique change vraiment pour vous. Franchise de TVA, Factur-X, plateforme agréée, calendrier.",
    h1: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
    og: {
      titre: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
      description:
        "La franchise TVA ne vous exempte pas. Voici ce que vous devez savoir et faire avant septembre 2027.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Micro-entrepreneur : ce que la réforme change pour vous",
      resume: "Franchise TVA ≠ exemption. Les 3 scénarios selon votre activité B2B/B2C",
      badge: "Micro-entrepreneur",
    },
    lies: ["facturation-electronique-2026", "e-reporting-freelance-2026", "checklist-reforme-facturation-2026"],
  },
  {
    slug: "choisir-plateforme-agreee-freelance",
    categorie: "reforme",
    titre: "Choisir sa plateforme agréée (freelance, TPE, PME)",
    description:
      "Pas de portail public gratuit : seules les plateformes agréées transmettent les factures. 5 critères pour choisir la bonne, en freelance comme en entreprise.",
    h1: "Comment choisir sa plateforme agréée : freelance, indépendant ou dirigeant de petite entreprise",
    og: {
      titre: "Comment choisir sa plateforme agréée : freelance, TPE ou PME",
      description:
        "Pas de portail public gratuit, plateforme agréée obligatoire. Critères de choix, questions à poser, intégration avec votre logiciel de facturation.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Choisir sa plateforme agréée : guide comparatif",
      resume: "Pas de portail public gratuit. 5 critères pour sélectionner la bonne plateforme pour votre activité",
      badge: "Plateforme agréée",
    },
    lies: [
      "facturation-electronique-2026",
      "plateforme-agreee-ou-solution-compatible",
      "reforme-facturation-micro-entrepreneur",
      "checklist-reforme-facturation-2026",
    ],
  },
  {
    slug: "liste-plateformes-agreees",
    categorie: "reforme",
    titre: "Liste des plateformes agréées (PA)",
    description:
      "La liste officielle tient en deux fichiers, et leurs noms trompent. Ce qu’ils contiennent, ce qu’ils taisent, et comment vérifier un éditeur en deux minutes.",
    h1: "Liste des plateformes agréées : les deux fichiers officiels, et comment les lire",
    og: {
      titre: "Liste des plateformes agréées : les deux fichiers officiels",
      description:
        "Une plateforme immatriculée et une plateforme en attente ne figurent pas au même endroit. Les comparateurs mélangent les deux.",
    },
    publieLe: "2026-09-14",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "La liste des plateformes agréées, lue à la source",
      resume: "Deux fichiers, des noms trompeurs, et ce que la DGFiP ne publie pas",
      badge: "Plateforme agréée",
    },
    lies: [
      "choisir-plateforme-agreee-freelance",
      "plateforme-agreee-ou-solution-compatible",
      "facturation-electronique-2026",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  {
    slug: "e-reporting-freelance-2026",
    categorie: "reforme",
    titre: "E-reporting 2026 : l'obligation B2C",
    description:
      "La facturation électronique ne concerne pas que le B2B. Si votre entreprise facture des particuliers, l'e-reporting s'applique aussi. À faire avant 2027.",
    h1: "E-reporting 2026 : l'obligation B2C dont personne ne parle",
    og: {
      titre: "E-reporting 2026 : l'obligation B2C oubliée des entreprises",
      description:
        "Vous avez des clients particuliers ? L'e-reporting TVA vous concerne, même si vous n'émettez pas d'e-factures. Calendrier, obligations, amendes.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "E-reporting : l'obligation B2C dont personne ne parle",
      resume:
        "Si vous avez des clients particuliers, l'e-reporting TVA vous concerne aussi. Amende : 500 € par transmission",
      badge: "B2C",
    },
    lies: ["facturation-electronique-2026", "reforme-facturation-micro-entrepreneur", "checklist-reforme-facturation-2026"],
  },
  {
    slug: "facture-electronique-refusee-que-faire",
    categorie: "reforme",
    titre: "Facture électronique refusée : que faire ?",
    description:
      "Refusée ou rejetée : ni les mêmes causes, ni les mêmes remèdes. Les statuts, les treize motifs de refus, et pourquoi un avoir ne se transmet pas toujours.",
    h1: "Votre facture électronique a été refusée : ce que ça veut dire et quoi faire",
    og: {
      titre: "Facture électronique refusée ou rejetée : comprendre et corriger",
      description:
        "Les statuts du cycle de vie, la différence entre un refus du client et un rejet de la plateforme, les motifs réels, et la règle de l'avoir que personne n'explique.",
    },
    publieLe: "2026-09-11",
    misAJourLe: "2026-11-27",
    dureeLecture: 12,
    carte: {
      titre: "Facture refusée ou rejetée : que faire ?",
      resume:
        "Les statuts, les treize motifs de refus possibles, et la règle de l'avoir qui ne doit pas être transmis",
      badge: "Cycle de vie",
    },
    lies: [
      "facturation-electronique-2026",
      "plateforme-agreee-ou-solution-compatible",
      "gerer-impayes-freelance",
    ],
  },
  {
    slug: "plateforme-agreee-ou-solution-compatible",
    categorie: "reforme",
    titre: "Plateforme agréée ou solution compatible ?",
    description:
      "La distinction est officielle, pas marketing : une solution compatible ne transmet ni ne reçoit vos factures sans plateforme agréée. Où se situe votre outil ?",
    h1: "Plateforme agréée ou solution compatible : ce que la différence change pour vous",
    og: {
      titre: "Plateforme agréée ou solution compatible : la différence qui compte",
      description:
        "Une solution compatible doit s'adosser à une plateforme agréée. La question à poser à votre éditeur n'est pas « êtes-vous conforme ? » mais « êtes-vous agréé, ou adossé à qui ? »",
    },
    publieLe: "2026-09-11",
    misAJourLe: "2026-09-11",
    dureeLecture: 7,
    carte: {
      titre: "Plateforme agréée ou solution compatible ?",
      resume:
        "La distinction officielle, et les trois questions à poser à votre éditeur",
      badge: "Plateforme agréée",
    },
    lies: [
      "facturation-electronique-2026",
      "choisir-plateforme-agreee-freelance",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  {
    slug: "checklist-reforme-facturation-2026",
    categorie: "reforme",
    titre: "Checklist réforme facturation 2026 : 7 points",
    description:
      "Réforme de la facturation électronique : 7 points à vérifier pour être prêt. Logiciel, format Factur-X, plateforme agréée, e-reporting, mentions légales.",
    h1: "Checklist réforme facturation 2026 : êtes-vous prêt ?",
    og: {
      titre: "Checklist réforme facturation 2026 pour votre entreprise",
      description:
        "7 points à vérifier pour être en conformité avec la réforme de facturation électronique.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-11-27",
    dureeLecture: 10,
    carte: {
      titre: "Checklist réforme 2026 : êtes-vous prêt ?",
      resume: "7 points à vérifier pour ne rien rater, à partager avec votre comptable",
      badge: "Checklist",
    },
    lies: ["facturation-electronique-2026", "e-reporting-freelance-2026", "choisir-plateforme-agreee-freelance"],
  },

  {
    slug: "facturation-electronique-petit-chiffre-affaires",
    categorie: "reforme",
    titre: "Facturation électronique et petit chiffre d'affaires",
    description:
      "Vous facturez quelques milliers d'euros par an ? Ce que la réforme vous impose réellement, ce qu'elle ne vous impose pas, et les options gratuites qui existent.",
    h1: "Facturation électronique quand on fait un petit chiffre d'affaires : ce qui s'applique vraiment",
    og: {
      titre: "Petit chiffre d'affaires et facturation électronique : les options réelles",
      description:
        "Entre la réception obligatoire depuis 2026 et l'émission en 2027, ce qu'un très petit CA doit faire, et ce qu'il ne doit pas payer.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Petit chiffre d'affaires : ce qui s'applique vraiment",
      resume: "Ce que la réforme impose à un très petit CA, et ce qu'elle ne vous oblige pas à payer",
    },
    lies: [
      "facturation-electronique-2026",
      "plateforme-agreee-ou-solution-compatible",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  {
    slug: "pas-de-plateforme-gratuite-etat",
    categorie: "reforme",
    titre: "Pas de plateforme gratuite de l'État",
    description:
      "Le portail public gratuit de facturation a été abandonné en 2024. Ce qu'il devait être, ce qu'il est devenu, et pourquoi tout passe par un opérateur privé.",
    h1: "Non, il n'y a pas de plateforme gratuite de l'État pour vos factures électroniques",
    og: {
      titre: "Non, il n'y a pas de plateforme gratuite de l'État",
      description:
        "Le portail public gratuit devait tout gérer. Il a été abandonné en 2024. Voici ce qui existe vraiment, et comment ne pas payer trop cher.",
    },
    publieLe: "2026-09-27",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Pas de plateforme gratuite de l'État",
      resume:
        "Le portail public gratuit a été abandonné en 2024. Ce qui existe vraiment, et comment ne pas trop payer",
      badge: "Réforme 2026",
    },
    lies: [
      "facturation-electronique-2026",
      "choisir-plateforme-agreee-freelance",
      "plateforme-agreee-ou-solution-compatible",
    ],
  },
  {
    slug: "amendes-facturation-electronique-2026",
    categorie: "reforme",
    titre: "Amendes de la facturation électronique 2026",
    description:
      "Montants en vigueur : 50 € par facture, 500 € par e-reporting, 500 € puis 1 000 € sans plateforme de réception après mise en demeure, plafond 15 000 € par an.",
    h1: "Amendes de la facturation électronique : les montants réels depuis le 1er septembre 2026",
    og: {
      titre: "Amendes de la facturation électronique : les montants réels",
      description:
        "50 € par facture, 500 € par e-reporting, 500 € puis 1 000 € sans plateforme de réception après mise en demeure. Ce que la loi de finances 2026 a changé.",
    },
    publieLe: "2026-09-27",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Les amendes réelles depuis septembre 2026",
      resume:
        "50 € par facture, 500 € par e-reporting, plafond 15 000 € : les montants en vigueur et leur source",
      badge: "Réforme 2026",
    },
    lies: [
      "facturation-electronique-2026",
      "e-reporting-freelance-2026",
      "checklist-reforme-facturation-2026",
    ],
  },
  {
    slug: "factur-x-explique-freelance",
    categorie: "reforme",
    titre: "Factur-X expliqué simplement",
    description:
      "Factur-X, c'est un PDF normal doublé d'un fichier que les logiciels savent lire. À quoi ça sert, ce que ça change, et pourquoi rien n'est à faire à la main.",
    h1: "Factur-X expliqué à quelqu'un qui n'est pas comptable",
    og: {
      titre: "Factur-X expliqué à quelqu'un qui n'est pas comptable",
      description:
        "Un PDF que l'humain lit et que la machine lit aussi. Ce qu'est vraiment Factur-X, sans jargon, et ce que ça change pour votre entreprise.",
    },
    publieLe: "2026-09-27",
    misAJourLe: "2026-09-27",
    dureeLecture: 7,
    carte: {
      titre: "Factur-X expliqué simplement",
      resume:
        "Un PDF que l'humain et la machine lisent tous les deux. Ce que c'est, sans jargon comptable",
      badge: "Réforme 2026",
    },
    lies: [
      "facturation-electronique-2026",
      "plateforme-agreee-ou-solution-compatible",
      "e-reporting-freelance-2026",
    ],
  },
  // ── Famille « documents » ──────────────────────────────────────────────────
  {
    slug: "facture-acompte-freelance",
    categorie: "factures",
    titre: "Facture d'acompte : le document d'après le devis",
    description:
      "Devis signé, acompte versé : il vous faut une facture d'acompte. Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'il faut déclarer.",
    h1: "Facture d'acompte : le document que personne ne vous explique après la signature du devis",
    og: {
      titre: "Facture d'acompte freelance : mentions, solde, TVA et déclaration",
      description:
        "Ce que doit contenir une facture d'acompte, comment la relier à la facture de solde, et quand déclarer la somme encaissée à l'URSSAF.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Facture d'acompte",
      resume: "Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'on déclare",
    },
    lies: ["facture-avoir-erreur-facture", "clauses-devis-freelance", "numerotation-factures-freelance"],
  },
  {
    slug: "facture-avoir-erreur-facture",
    categorie: "factures",
    titre: "Erreur sur une facture : l'avoir, pas la gomme",
    description:
      "Une facture émise ne se modifie ni ne se supprime. Comment la corriger : avoir total ou partiel, facture rectificative, et ce que la réforme y change.",
    h1: "J'ai fait une erreur sur une facture : pourquoi on ne la supprime jamais, et quoi faire",
    og: {
      titre: "Corriger une facture : avoir, rectification, et ce que la réforme change",
      description:
        "Une facture émise est définitive. L'avoir est le seul outil de correction, et avec la facturation électronique, le rattrapage n'est plus le même.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 9,
    carte: {
      titre: "Erreur sur une facture : l'avoir",
      resume: "Pourquoi on ne supprime jamais une facture, et comment la corriger proprement",
    },
    lies: [
      "facture-electronique-refusee-que-faire",
      "numerotation-factures-freelance",
      "facture-acompte-freelance",
      "note-honoraires-ou-facture",
    ],
  },
  {
    slug: "note-honoraires-ou-facture",
    categorie: "factures",
    titre: "Note d'honoraires : c'est quoi, et faut-il une facture ?",
    description:
      "Une note d'honoraires, c'est quoi ? Pour une profession libérale, ce n'est pas un document à part : ce qui la distingue d'une facture, et ce qu'elle contient.",
    h1: "Note d'honoraires : c'est quoi, et en quoi diffère-t-elle d'une facture ?",
    og: {
      titre: "Note d'honoraires : c'est quoi, et en quoi diffère-t-elle d'une facture",
      description:
        "Pour un praticien ou une profession libérale, la note d'honoraires obéit aux mêmes obligations qu'une facture. Ce qui change, et ce qui ne change pas.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Note d'honoraires ou facture ?",
      resume: "Ce que la note d'honoraires change vraiment, et ce qu'elle doit contenir",
    },
    lies: ["facture-acompte-freelance", "numerotation-factures-freelance", "facturation-electronique-2026"],
  },
  {
    slug: "attestation-vigilance-urssaf-freelance",
    categorie: "factures",
    titre: "Mon client demande une attestation de vigilance",
    description:
      "Votre client exige une attestation de vigilance URSSAF avant de payer. Pourquoi il y est tenu, comment l'obtenir en micro, et que faire en cas de refus.",
    h1: "Mon client me demande une attestation de vigilance URSSAF : que faire ?",
    og: {
      titre: "Attestation de vigilance URSSAF : pourquoi votre client l'exige et comment l'obtenir",
      description:
        "Dès 5 000 € HT, votre client a l'obligation de la réclamer. Comment la télécharger, sa durée de validité, et les cas de refus.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: {
      titre: "Attestation de vigilance URSSAF",
      resume: "Pourquoi votre client l'exige au-delà de 5 000 €, et comment l'obtenir",
    },
    lies: ["gerer-impayes-freelance", "facture-acompte-freelance", "clauses-devis-freelance"],
  },

  // ── Famille « obligations » ────────────────────────────────────────────────
  {
    slug: "livre-des-recettes-micro-entrepreneur",
    categorie: "micro",
    titre: "Le livre des recettes du micro-entrepreneur",
    description:
      "Le seul document comptable obligatoire en micro-entreprise. Les mentions à porter, le piège de l'encaissement, et ce qui est vraiment sanctionné en cas d'oubli.",
    h1: "Le livre des recettes du micro-entrepreneur : le tenir juste, sans y passer ses soirées",
    og: {
      titre: "Livre des recettes du micro-entrepreneur : le guide clair",
      description:
        "Obligatoire pour tous les micro-entrepreneurs. Les mentions, le piège de l'encaissement, le registre des achats et les sanctions.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Le livre des recettes du micro-entrepreneur",
      resume: "Les mentions obligatoires, le piège de l'encaissement, et ce qui est vraiment sanctionné",
    },
    lies: [
      "plafonds-micro-entreprise-2026",
      "reforme-facturation-micro-entrepreneur",
      "numerotation-factures-freelance",
    ],
  },
  {
    slug: "biens-ou-services-micro-entrepreneur",
    categorie: "micro",
    titre: "Micro-entreprise : vente de biens ou prestation de services",
    description:
      "Services BIC ou BNC, ou vente de biens : la catégorie de votre micro-entreprise fixe cotisations, abattement, plafond et seuil de TVA. Les chiffres 2026.",
    h1: "Micro-entreprise : vente de biens ou prestation de services (BIC, BNC), ce qui change pour vous",
    og: {
      titre: "Micro-entreprise : vente de biens ou prestation de services (BIC, BNC)",
      description:
        "Taux de cotisations, abattement, plafond, seuil de TVA : tout dépend de la catégorie de votre activité. Et l'activité mixte se ventile.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Biens ou services : la distinction qui change tout",
      resume: "Cotisations, abattement, plafond, seuil de TVA : pourquoi la catégorie décide de tout",
    },
    lies: [
      "livre-des-recettes-micro-entrepreneur",
      "plafonds-micro-entreprise-2026",
      "declarer-chiffre-affaires-urssaf",
      "note-honoraires-ou-facture",
    ],
  },
  {
    slug: "passer-a-la-tva-micro-entrepreneur",
    categorie: "micro",
    titre: "Passer à la TVA en micro-entreprise",
    description:
      "La franchise de TVA s'arrête avant votre plafond de micro-entreprise. Les seuils 2026, ce qui déclenche la bascule, et les démarches pour passer à la TVA.",
    h1: "Passer à la TVA en micro-entreprise : sortie de franchise et déclaration",
    og: {
      titre: "Passer à la TVA en micro : seuils 2026 et démarches",
      description:
        "Seuils 85 000 / 37 500 €, seuil majoré, numéro intracommunautaire, CA12 ou CA3 : tout ce qui change le jour où vous facturez la TVA.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Passer à la TVA en micro-entreprise",
      resume: "Sortie de franchise, seuils 2026 et choix du régime de déclaration",
    },
    lies: [
      "plafonds-micro-entreprise-2026",
      "declarer-chiffre-affaires-urssaf",
      "biens-ou-services-micro-entrepreneur",
    ],
  },
  {
    slug: "declarer-chiffre-affaires-urssaf",
    categorie: "micro",
    titre: "Déclarer son chiffre d'affaires à l'URSSAF",
    description:
      "Chaque mois ou chaque trimestre, vous déclarez votre chiffre d'affaires encaissé et payez vos cotisations dessus. Taux 2026, périodicité, ACRE, oublis coûteux.",
    h1: "Déclarer son chiffre d'affaires à l'URSSAF : taux 2026 et ACRE",
    og: {
      titre: "Déclarer son CA à l'URSSAF : taux 2026 et ACRE",
      description:
        "Déclaration à l'encaissement, même à zéro, taux 12,3 à 25,6 %, ACRE à 25 % depuis juillet 2026 : le mode d'emploi.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Déclarer son chiffre d'affaires à l'URSSAF",
      resume: "Taux 2026, périodicité, ACRE, et les oublis qui coûtent une pénalité",
    },
    lies: [
      "livre-des-recettes-micro-entrepreneur",
      "biens-ou-services-micro-entrepreneur",
      "versement-liberatoire-2026",
    ],
  },
  {
    slug: "versement-liberatoire-2026",
    categorie: "micro",
    titre: "Le versement libératoire en 2026 : pour qui",
    description:
      "Payer son impôt au fil de l'eau, séduisant mais pas pour tout le monde. Taux 2026, condition de revenu, et la question qui décide : êtes-vous imposable ?",
    h1: "Le versement libératoire de l'impôt en 2026 : pour qui est-ce vraiment rentable",
    og: {
      titre: "Versement libératoire 2026 : rentable ou pas ?",
      description:
        "Taux 1 à 2,2 %, plafond de RFR de 29 579 € par part : à qui le versement libératoire fait gagner, et à qui il fait perdre.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Le versement libératoire en 2026 : pour qui",
      resume: "Taux, condition de RFR, et le piège de l'impôt payé pour rien",
    },
    lies: [
      "declarer-chiffre-affaires-urssaf",
      "micro-ou-reel-quand-basculer",
      "plafonds-micro-entreprise-2026",
    ],
  },
  {
    slug: "obligations-comptables-micro-entrepreneur",
    categorie: "micro",
    titre: "Les obligations comptables au-delà du livre des recettes",
    description:
      "La micro-entreprise dispense de bilan, pas de tout. Compte bancaire dédié, factures conformes, registre des achats, conservation 10 ans : le tour complet.",
    h1: "Au-delà du livre des recettes : compte bancaire, factures et conservation",
    og: {
      titre: "Obligations comptables du micro : le tour complet",
      description:
        "Compte dédié (dès le début en commerce, au-delà de 10 000 € sinon), factures numérotées, registre des achats, conservation 10 ans, et ce dont vous êtes dispensé.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Les obligations comptables au-delà du livre des recettes",
      resume: "Compte bancaire, factures, registre des achats, conservation : tout le reste",
    },
    lies: [
      "livre-des-recettes-micro-entrepreneur",
      "numerotation-factures-freelance",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  {
    slug: "plafonds-micro-entreprise-2026",
    categorie: "micro",
    titre: "Plafonds de la micro-entreprise 2026-2028",
    description:
      "203 100 € et 83 600 € depuis 2026. Surtout, ne confondez pas ces plafonds avec les seuils de TVA, bien plus bas, que vous franchirez en premier en pratique.",
    h1: "Plafonds de la micro-entreprise 2026-2028 : les vrais chiffres, et le piège des deux seuils",
    og: {
      titre: "Plafonds micro-entreprise 2026-2028 : 203 100 € et 83 600 €",
      description:
        "Les plafonds ont été revalorisés de 7,6 % pour 2026-2028. Les seuils de TVA, eux, n'ont pas bougé, et c'est eux que vous franchirez d'abord.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Plafonds micro-entreprise 2026-2028",
      resume: "203 100 € et 83 600 €, et le piège de la confusion avec les seuils de TVA",
    },
    lies: [
      "facturer-client-etranger-freelance",
      "refacturer-frais-client-freelance",
      "fixer-ses-tarifs-freelance",
    ],
  },
  {
    slug: "refacturer-frais-client-freelance",
    categorie: "factures",
    titre: "Refacturer ses frais sans gonfler son CA",
    description:
      "Refacturer un train ou un hôtel gonfle votre chiffre d'affaires, donc vos cotisations. Le mécanisme du débours, ses conditions strictes, et ses limites.",
    h1: "Refacturer ses frais à un client sans faire exploser son chiffre d'affaires",
    og: {
      titre: "Refacturer des frais en micro-entreprise : le piège des cotisations",
      description:
        "Un frais refacturé entre dans votre chiffre d'affaires et donc dans l'assiette de vos cotisations. Sauf s'il remplit les conditions du débours.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 9,
    carte: {
      titre: "Refacturer ses frais sans gonfler son CA",
      resume: "Le mécanisme du débours, ses conditions strictes, et le piège des cotisations",
    },
    lies: [
      "plafonds-micro-entreprise-2026",
      "facture-acompte-freelance",
      "fixer-ses-tarifs-freelance",
    ],
  },
  {
    slug: "facturer-client-etranger-freelance",
    categorie: "factures",
    titre: "Facturer un client à l'étranger",
    description:
      "Client pro dans l'UE, particulier en Belgique, entreprise aux États-Unis : la mention à porter sur la facture change à chaque fois. Le guide des quatre cas.",
    h1: "Facturer un client à l'étranger : quelle mention porter, dans quel cas",
    og: {
      titre: "Facturer un client étranger en freelance : TVA, mentions, DES",
      description:
        "Autoliquidation, numéro de TVA intracommunautaire obligatoire même en franchise, Déclaration européenne de services : les quatre cas, sans jargon.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-11-27",
    dureeLecture: 10,
    carte: {
      titre: "Facturer un client à l'étranger",
      resume: "UE ou hors UE, pro ou particulier : la mention change à chaque fois",
    },
    lies: [
      "plafonds-micro-entreprise-2026",
      "e-reporting-freelance-2026",
      "facture-acompte-freelance",
    ],
  },
  {
    slug: "numerotation-factures-freelance",
    categorie: "factures",
    titre: "Numéroter ses factures, et réparer un trou",
    description:
      "La numérotation des factures doit être continue et sans trou : c'est une obligation du CGI. Les formats qui tiennent, et comment réparer une série cassée.",
    h1: "Numéroter ses factures sans se tromper, et que faire si c'est déjà raté",
    og: {
      titre: "Numérotation des factures : les règles, les formats, et comment réparer",
      description:
        "Séquence continue, sans trou, sans doublon. Les formats qui tiennent dans le temps, et la marche à suivre quand la série est déjà cassée.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 7,
    carte: {
      titre: "Numéroter ses factures",
      resume: "La séquence continue, les formats qui tiennent, et comment réparer un trou",
    },
    lies: [
      "facture-avoir-erreur-facture",
      "facture-acompte-freelance",
      "facturation-electronique-2026",
    ],
  },

  // ── Famille « métier » ─────────────────────────────────────────────────────
  {
    slug: "devis-graphiste-freelance",
    categorie: "metier",
    titre: "Devis graphiste freelance : mentions obligatoires",
    description:
      "Tout ce qu'un devis de graphiste freelance doit contenir : mentions légales, droits de cession, acompte, révisions. Exemple concret + erreurs à éviter.",
    h1: "Devis de graphiste freelance : mentions obligatoires, exemple et erreurs à éviter",
    og: {
      titre: "Devis graphiste freelance : mentions obligatoires et exemple",
      description:
        "Mentions légales, droits de cession, acompte, révisions, tout ce qu'un devis de graphiste doit contenir. Exemple concret.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: { titre: "Graphiste freelance", resume: "Droits de cession, révisions, formats livrés" },
    metier: {
      landing: "/freelance-graphiste",
      landingLabel: "logiciel de devis pour graphistes",
      profession: "graphiste freelance",
      professionPluriel: "graphistes freelances",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance", "devis-redacteur-web"],
  },
  {
    slug: "devis-developpeur-web",
    categorie: "metier",
    titre: "Devis développeur web freelance : le guide",
    description:
      "Comment rédiger un devis de développement web freelance : mentions obligatoires, TJM ou forfait, dérive du périmètre, Chorus Pro. Exemple concret inclus.",
    h1: "Devis développeur web freelance : guide complet, exemple et erreurs à éviter",
    og: {
      titre: "Devis développeur web freelance : guide complet 2026",
      description:
        "Mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro, guide complet pour votre devis de dev web freelance.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 7,
    carte: { titre: "Développeur web", resume: "TJM vs forfait, scope creep, propriété du code" },
    metier: {
      landing: "/freelance-developpeur",
      landingLabel: "logiciel de devis pour développeurs",
      profession: "développeur web freelance",
      professionPluriel: "développeurs web freelances",
    },
    lies: ["scope-creep-freelance", "clauses-devis-freelance"],
  },
  {
    slug: "devis-consultant-independant",
    categorie: "metier",
    titre: "Devis consultant indépendant : propale et TJM",
    description:
      "Comment rédiger la proposition commerciale d'un consultant indépendant : livrables, TJM, confidentialité, grands comptes. Exemple concret et erreurs à éviter.",
    h1: "Devis de consultant indépendant : rédiger une propale efficace en 2026",
    og: {
      titre: "Devis consultant indépendant : propale, TJM, livrables",
      description:
        "Livrables, TJM, confidentialité, Factur-X grands comptes, guide complet pour votre propale de consultant indépendant.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: { titre: "Consultant indépendant", resume: "Propale efficace, régie vs forfait, grands comptes" },
    metier: {
      landing: "/freelance-consultant",
      landingLabel: "logiciel de devis pour consultants",
      profession: "consultant indépendant",
      professionPluriel: "consultants indépendants",
    },
    lies: ["fixer-ses-tarifs-freelance", "clauses-devis-freelance"],
  },
  {
    slug: "devis-photographe-freelance",
    categorie: "metier",
    titre: "Devis photographe : droits d'auteur et acompte",
    description:
      "Comment rédiger un devis de photographe freelance : droits d'utilisation, retouches, frais de déplacement, acompte. Exemple concret et erreurs à éviter.",
    h1: "Devis de photographe freelance : droits d'auteur, acompte et exemple concret",
    og: {
      titre: "Devis photographe freelance : droits d'auteur, acompte, exemple",
      description:
        "Droits d'utilisation, retouches, frais de déplacement, acompte, tout ce qu'un devis photo doit contenir. Exemple concret.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 5,
    carte: { titre: "Photographe freelance", resume: "Droits d'auteur, acompte, conditions d'annulation" },
    metier: {
      landing: "/freelance-photographe",
      landingLabel: "logiciel de devis pour photographes",
      profession: "photographe freelance",
      professionPluriel: "photographes freelances",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },
  {
    slug: "devis-redacteur-web",
    categorie: "metier",
    titre: "Devis rédacteur web : tarifs, exemple et droits",
    description:
      "Devis rédacteur web : tarif au mot ou à la page, révisions, cession de droits et relances, avec un exemple de devis de rédaction web et les erreurs à éviter.",
    h1: "Devis rédacteur web : tarifs, exemple, révisions et erreurs à éviter",
    og: {
      titre: "Devis rédacteur web : tarifs, exemple, révisions, droits",
      description:
        "Tarif au mot ou à la page, révisions, cession de droits, guide complet pour votre devis de rédaction web freelance.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 5,
    carte: { titre: "Rédacteur & copywriter", resume: "Tarif au mot, révisions limitées, cession de droits" },
    metier: {
      landing: "/freelance-redacteur",
      landingLabel: "logiciel de devis pour rédacteurs",
      profession: "rédacteur web freelance",
      professionPluriel: "rédacteurs web freelances",
    },
    lies: ["scope-creep-freelance", "clauses-devis-freelance"],
  },
  {
    slug: "devis-formateur-independant",
    categorie: "metier",
    titre: "Devis formateur : mentions OPCO et exemple",
    description:
      "Devis de formation professionnelle : mentions attendues par l'OPCO, objectifs pédagogiques, acompte et solde, TVA. Exemple concret et erreurs à éviter.",
    h1: "Devis de formateur indépendant : mentions OPCO, exemple et erreurs à éviter",
    og: {
      titre: "Devis formateur indépendant : mentions OPCO et exemple 2026",
      description:
        "Mentions OPCO obligatoires, objectifs pédagogiques, acompte/solde, Factur-X, guide complet pour votre devis de formation.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: { titre: "Formateur indépendant", resume: "Mentions OPCO, exonération TVA, Qualiopi" },
    metier: {
      landing: "/freelance-formateur",
      landingLabel: "logiciel de devis pour formateurs",
      profession: "formateur indépendant",
      professionPluriel: "formateurs indépendants",
    },
    lies: ["clauses-devis-freelance", "gerer-impayes-freelance"],
  },
  {
    slug: "devis-artisan-btp",
    categorie: "metier",
    titre: "Devis artisan BTP : TVA réduite et décennale",
    description:
      "Devis d'artisan du BTP : taux de TVA selon les travaux, mention de l'assurance décennale, acompte, validité. Un exemple concret et les erreurs à éviter.",
    h1: "Devis artisan BTP : TVA réduite, garantie décennale et erreurs à éviter",
    og: {
      titre: "Devis artisan BTP : TVA réduite, garantie décennale, exemple",
      description:
        "TVA 5,5 % / 10 % / 20 %, garantie décennale obligatoire, acompte, tout ce qu'un devis artisan BTP doit contenir.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: { titre: "Artisan BTP", resume: "TVA réduite, garantie décennale, acompte" },
    metier: {
      landing: "/freelance-artisan",
      landingLabel: "logiciel de devis pour artisans",
      profession: "artisan BTP",
      professionPluriel: "artisans BTP",
    },
    lies: ["clauses-devis-freelance", "gerer-impayes-freelance"],
  },
  {
    slug: "devis-community-manager",
    categorie: "metier",
    titre: "Devis community manager : forfait et périmètre",
    description:
      "Devis de community manager : définir le périmètre (réseaux, publications, visuels), le forfait mensuel et la résiliation. Exemple concret et erreurs à éviter.",
    h1: "Devis community manager freelance : périmètre, forfait mensuel et erreurs à éviter",
    og: {
      titre: "Devis community manager freelance : périmètre, forfait mensuel, erreurs",
      description:
        "Périmètre précis, forfaits mensuels, conditions de résiliation, tout ce qu'un devis de CM freelance doit contenir.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 6,
    carte: { titre: "Community manager", resume: "Périmètre, forfait mensuel, résiliation" },
    metier: {
      landing: "/freelance-community-manager",
      landingLabel: "logiciel de devis pour community managers",
      profession: "community manager freelance",
      professionPluriel: "community managers freelances",
    },
    lies: ["scope-creep-freelance", "clauses-devis-freelance", "devis-redacteur-web"],
  },
  {
    slug: "devis-coach-freelance",
    categorie: "metier",
    titre: "Devis coach freelance : TVA, abandon, exemple",
    description:
      "Devis de coaching : franchise ou exonération de TVA, conditions d'abandon et de remboursement, séances ou programmes. Exemple concret et erreurs à éviter.",
    h1: "Devis coach freelance : TVA, conditions d'abandon de programme et erreurs à éviter",
    og: {
      titre: "Devis coach freelance : TVA, conditions abandon programme, exemple",
      description:
        "TVA franchise ou exonération, conditions d'abandon, séances vs programmes, tout ce qu'un devis de coach freelance doit contenir.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: { titre: "Coach freelance", resume: "TVA, conditions d'abandon de programme" },
    metier: {
      landing: "/freelance-coach",
      landingLabel: "logiciel de devis pour coachs freelances",
      profession: "coach freelance",
      professionPluriel: "coachs freelances",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },
  {
    slug: "devis-traducteur-freelance",
    categorie: "metier",
    titre: "Devis traducteur freelance : tarifs et droits",
    description:
      "Devis de traduction : tarif au mot ou à la page, révisions incluses, droits sur la traduction et tarif d'urgence. Exemple concret et erreurs à éviter.",
    h1: "Devis traducteur freelance : tarification, révisions, droits sur la traduction et erreurs à éviter",
    og: {
      titre: "Devis traducteur freelance : tarification, révisions, droits sur la traduction",
      description:
        "Tarification au mot ou à la page, révisions, droits sur la traduction, tarif urgence, guide complet pour votre devis de traduction.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: { titre: "Traducteur freelance", resume: "Tarif au mot, droits sur la traduction, urgences" },
    metier: {
      landing: "/freelance-traducteur",
      landingLabel: "logiciel de devis pour traducteurs freelances",
      profession: "traducteur freelance",
      professionPluriel: "traducteurs freelances",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },

  // ── Famille « transverse » ─────────────────────────────────────────────────
  {
    slug: "micro-ou-reel-quand-basculer",
    categorie: "gestion",
    titre: "Micro ou régime réel : quand basculer",
    description:
      "Le micro applique un abattement forfaitaire, le réel déduit vos charges. La bascule tient à une question : vos charges dépassent-elles votre abattement ?",
    h1: "Micro-entreprise ou régime réel : quand le passage devient rentable",
    og: {
      titre: "Micro ou régime réel : quand basculer",
      description:
        "Abattement forfaitaire contre charges réelles : à partir de quel niveau de charges le régime réel l'emporte, et ce qu'il implique.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Micro ou régime réel : quand basculer",
      resume: "Abattement contre charges réelles : le seuil où le réel devient rentable",
    },
    lies: [
      "biens-ou-services-micro-entrepreneur",
      "versement-liberatoire-2026",
      "quand-prendre-expert-comptable-micro",
    ],
  },
  {
    slug: "quand-prendre-expert-comptable-micro",
    categorie: "gestion",
    titre: "Micro-entrepreneur : quand prendre un expert-comptable",
    description:
      "En micro-entreprise, l'expert-comptable n'est pas obligatoire. La vraie question : à partir de quand devient-il rentable ? Les moments qui le justifient.",
    h1: "Micro-entrepreneur : quand (et pourquoi) prendre un expert-comptable",
    og: {
      titre: "Micro : quand prendre un expert-comptable",
      description:
        "Aucune obligation en micro, mais TVA, régime réel, embauche ou contrôle changent la donne. Ce que vous pouvez garder pour vous.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-02",
    dureeLecture: 7,
    carte: {
      titre: "Micro-entrepreneur : quand prendre un expert-comptable",
      resume: "Pas obligatoire, mais utile à certains moments précis : lesquels",
    },
    lies: [
      "micro-ou-reel-quand-basculer",
      "obligations-comptables-micro-entrepreneur",
      "experts-comptables-equiper-clients-micro",
    ],
  },
  {
    slug: "experts-comptables-equiper-clients-micro",
    categorie: "comptables",
    titre: "Experts-comptables : équiper ses clients micro",
    description:
      "Le dossier micro est peu rentable non parce qu'il est simple, mais parce qu'il arrive en désordre. L'équiper à la source, et la place des clients sociétés.",
    h1: "Experts-comptables : équiper ses clients micro d'un outil de facturation conforme",
    og: {
      titre: "Experts-comptables : équiper ses clients micro",
      description:
        "Ressaisie, relances, non-conformité : ce que le dossier micro mal tenu coûte au cabinet, et pourquoi la réforme rend l'équipement incontournable.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-23",
    dureeLecture: 8,
    carte: {
      titre: "Experts-comptables : équiper ses clients micro",
      resume: "Tarir le désordre à la source plutôt que l'absorber dossier par dossier",
    },
    lies: [
      "quand-prendre-expert-comptable-micro",
      "deviso-solution-comptable-marche",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  {
    slug: "trajectoire-conformite-facturation-electronique-cabinet",
    categorie: "comptables",
    titre: "Réforme : documenter la conformité de vos clients",
    description: "Le guide de démarrage de la DGFiP tient compte des difficultés documentées. Les preuves qu'il attend, et comment le cabinet aide chaque client à les réunir.",
    h1: "Facturation électronique : aider vos clients à documenter leur trajectoire de conformité",
    og: {
      titre: "Réforme : documenter la trajectoire de conformité de vos clients",
      description: "Ni report ni suspension : la DGFiP apprécie les difficultés réelles, documentées et suivies. Les preuves à réunir, dossier par dossier, avec le cabinet.",
    },
    publieLe: "2026-11-23",
    misAJourLe: "2026-11-23",
    dureeLecture: 8,
    carte: {
      titre: "Documenter la trajectoire de conformité",
      resume: "Les preuves que la DGFiP attend au démarrage, et le rôle du cabinet",
    },
    lies: [
      "portefeuille-clients-echeance-septembre-2027",
      "amendes-facturation-electronique-2026",
      "facture-electronique-refusee-que-faire",
    ],
  },
  {
    slug: "mandat-facturation-electronique-expert-comptable",
    categorie: "comptables",
    titre: "Mandat et facture électronique : le rôle du cabinet",
    description: "Choix de plateforme, raccordement, émission pour le client : ce que l'expert-comptable peut faire sous mandat, et ce que la lettre de mission doit préciser.",
    h1: "Facturation électronique : ce que le cabinet peut faire sous mandat pour ses clients",
    og: {
      titre: "Facture électronique : ce que le cabinet peut faire sous mandat",
      description: "Le choix de la plateforme reste une décision du client. Mandat de facturation, mandat présumé, lettre de mission : les règles, et les points à écrire.",
    },
    publieLe: "2026-11-23",
    misAJourLe: "2026-11-27",
    dureeLecture: 9,
    carte: {
      titre: "Le mandat entre le cabinet et son client",
      resume: "Plateforme, émission sous mandat, lettre de mission : qui fait quoi",
    },
    lies: [
      "choisir-plateforme-agreee-freelance",
      "plateforme-agreee-ou-solution-compatible",
      "experts-comptables-equiper-clients-micro",
    ],
  },
  {
    slug: "portefeuille-clients-echeance-septembre-2027",
    categorie: "comptables",
    titre: "Septembre 2027 : préparer son portefeuille clients",
    description: "Au 1er septembre 2027, PME, TPE et micro émettent en électronique et font leur e-reporting. Trier le portefeuille par profil et préparer chaque dossier.",
    h1: "Échéance de septembre 2027 : préparer le portefeuille de clients PME, TPE et micro",
    og: {
      titre: "Septembre 2027 : préparer le portefeuille de clients du cabinet",
      description: "Taille appréciée au 1er janvier 2025, profils prioritaires, rythme du e-reporting selon le régime de TVA, nouvelles mentions : le plan du cabinet.",
    },
    publieLe: "2026-11-23",
    misAJourLe: "2026-11-23",
    dureeLecture: 9,
    carte: {
      titre: "Préparer le portefeuille pour septembre 2027",
      resume: "Trier les dossiers par profil avant l'émission des PME et micro",
    },
    lies: [
      "e-reporting-freelance-2026",
      "checklist-reforme-facturation-2026",
      "experts-comptables-equiper-clients-micro",
    ],
  },
  {
    slug: "calendrier-fiscal-social-micro",
    categorie: "micro",
    titre: "Le calendrier fiscal et social du micro",
    description:
      "Déclaration de chiffre d'affaires, déclaration de revenus, CFE, TVA : le tour des rendez-vous de l'année en micro, et de ceux qui tombent même sans activité.",
    h1: "Votre calendrier fiscal et social de l'année en micro-entreprise",
    og: {
      titre: "Le calendrier fiscal et social du micro",
      description:
        "Les échéances récurrentes du micro, les deux dates qui bougent chaque année, et ce qui reste dû même en l'absence d'activité.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: {
      titre: "Le calendrier fiscal et social du micro",
      resume: "Les rendez-vous de l'année, et ceux qui tombent même sans activité",
    },
    lies: [
      "declarer-chiffre-affaires-urssaf",
      "versement-liberatoire-2026",
      "obligations-comptables-micro-entrepreneur",
    ],
  },
  {
    slug: "deviso-solution-comptable-marche",
    categorie: "gestion",
    titre: "Deviso face au marché : notre outil de gestion",
    description:
      "Les outils de gestion laissent des trous aux petites entreprises. Où se place Deviso, du micro-entrepreneur à la société, et ce qu'il ne prétend pas être.",
    h1: "Deviso face au marché : notre place, et les difficultés que nous réglons pour votre entreprise",
    og: {
      titre: "Deviso face au marché de la facturation",
      description:
        "Du micro-entrepreneur à la société : où se place Deviso, et ce qu'il ne prétend pas être.",
    },
    publieLe: "2026-11-02",
    misAJourLe: "2026-11-23",
    dureeLecture: 7,
    carte: {
      titre: "Deviso face au marché : notre outil de gestion",
      resume: "Entre outils grand public et grosses plateformes : notre place et nos partis pris",
    },
    lies: [
      "experts-comptables-equiper-clients-micro",
      "reforme-facturation-micro-entrepreneur",
      "quand-prendre-expert-comptable-micro",
    ],
  },
  {
    slug: "clauses-devis-freelance",
    categorie: "factures",
    titre: "Clauses indispensables d'un devis freelance",
    description:
      "Périmètre, acompte, révisions, propriété intellectuelle, résiliation : les 9 clauses à mettre dans un devis freelance, avec formulations prêtes à l'emploi.",
    h1: "Les clauses indispensables dans un devis freelance, guide complet 2026",
    og: {
      titre: "Les clauses indispensables dans un devis freelance, guide complet 2026",
      description:
        "Périmètre, acompte, révisions, droits d'auteur, résiliation, NDA, les 9 clauses à ne jamais oublier dans votre devis freelance.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Les clauses indispensables dans un devis freelance (avec formulations)",
      resume:
        "Périmètre, acompte, révisions, propriété intellectuelle, résiliation, les 9 clauses à mettre dans tout devis freelance, avec des formulations prêtes à l'emploi.",
      badge: "Tous métiers",
    },
    lies: ["scope-creep-freelance", "gerer-impayes-freelance"],
  },
  {
    slug: "scope-creep-freelance",
    categorie: "factures",
    titre: "Scope creep freelance : s'en protéger au devis",
    description:
      "La dérive du périmètre (scope creep) ronge la rentabilité d'une mission freelance. Comment elle s'installe, et quelles clauses du devis vous en protègent.",
    h1: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
    og: {
      titre: "Scope creep freelance : comment s'en protéger avec son devis",
      description:
        "Qu'est-ce que le scope creep ? Comment l'éviter ? Quelles clauses inclure dans votre devis ? Guide pratique pour freelances.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: {
      titre: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
      resume:
        "La dérive du périmètre (scope creep) ronge la rentabilité d'une mission. Comment elle s'installe, et les clauses pour vous en protéger.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },
  {
    slug: "gerer-impayes-freelance",
    categorie: "paiement",
    titre: "Gérer les impayés en freelance : les 4 étapes",
    description:
      "Récupérer une facture impayée en freelance : relance amiable, mise en demeure, injonction de payer. Les étapes concrètes, et comment se protéger dès le devis.",
    h1: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
    og: {
      titre: "Gérer les impayés en freelance : relance, mise en demeure, tribunal",
      description:
        "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
      resume:
        "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées, étape par étape.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "scope-creep-freelance"],
  },
  {
    slug: "fixer-ses-tarifs-freelance",
    categorie: "gestion",
    titre: "Fixer ses tarifs en freelance : TJM et méthodes",
    description:
      "Calculer son TJM en freelance : trois méthodes, les erreurs classiques, les temps non facturables, et comment augmenter ses tarifs sans perdre ses clients.",
    h1: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
    og: {
      titre: "Comment fixer ses tarifs en freelance : TJM, méthodes, erreurs à éviter",
      description:
        "Les 3 méthodes pour calculer son TJM, les erreurs classiques, et comment augmenter ses tarifs. Guide complet pour freelances.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 7,
    carte: {
      titre: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
      resume:
        "Les 3 méthodes pour calculer son TJM, les erreurs classiques (syndrome de l'imposteur, temps non facturables), et comment augmenter ses tarifs sans perdre ses clients.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "scope-creep-freelance"],
  },
  // ── Articles du 19/11/2026 : sujets d'actualité pour toutes les entreprises ──
  {
    slug: "delais-paiement-penalites-retard",
    categorie: "paiement",
    titre: "Délais de paiement et pénalités de retard : ce que dit la loi",
    description:
      "Entre professionnels : 30 jours par défaut, 60 jours au plus, pénalités automatiques et 40 € par facture en retard. Les règles, les mentions et les recours.",
    h1: "Délais de paiement et pénalités de retard : ce que dit la loi entre entreprises",
    publieLe: "2026-11-19",
    misAJourLe: "2026-11-27",
    dureeLecture: 7,
    carte: {
      titre: "Délais de paiement et pénalités de retard",
      resume: "30, 60 ou 45 jours fin de mois, pénalités automatiques, 40 € par facture : vos droits face aux retards",
    },
    lies: ["gerer-impayes-freelance", "clauses-devis-freelance", "numerotation-factures-freelance"],
  },
  {
    slug: "fraude-faux-rib-faux-fournisseur",
    categorie: "paiement",
    titre: "Fraude au faux RIB et au faux fournisseur : s'en protéger",
    description:
      "Un faux changement de RIB au nom d'un fournisseur ou d'un client : les signaux d'alerte, la règle du contre-appel, et que faire si le virement est déjà parti.",
    h1: "Fraude au faux RIB et au faux fournisseur : comment protéger votre entreprise",
    publieLe: "2026-11-19",
    misAJourLe: "2026-11-19",
    dureeLecture: 6,
    carte: {
      titre: "Fraude au faux RIB : s'en protéger",
      resume: "Les signaux d'alerte, la règle du contre-appel, et les bons réflexes si le virement est parti",
    },
    lies: ["facturation-electronique-2026", "gerer-impayes-freelance"],
  },
  {
    slug: "choisir-statut-micro-ei-eurl-sasu",
    categorie: "gestion",
    titre: "Micro, EI, EURL ou SASU : choisir son statut",
    description:
      "Micro-entreprise, entreprise individuelle au réel, EURL ou SASU : impôt, cotisations, protection sociale et formalités comparés pour choisir le bon statut.",
    h1: "Micro-entreprise, EI, EURL ou SASU : quel statut choisir pour votre entreprise",
    publieLe: "2026-11-19",
    misAJourLe: "2026-11-27",
    dureeLecture: 8,
    carte: {
      titre: "Micro, EI, EURL ou SASU : choisir son statut",
      resume: "Impôt, cotisations, protection sociale : les quatre statuts comparés, et comment trancher",
    },
    lies: ["micro-ou-reel-quand-basculer", "plafonds-micro-entreprise-2026", "quand-prendre-expert-comptable-micro"],
  },
  {
    slug: "cfe-cotisation-fonciere-entreprises",
    categorie: "gestion",
    titre: "CFE : qui la paie, combien, et avant quand",
    description:
      "La CFE concerne toutes les entreprises, même sans local. Exonération la première année, seuil de 5 000 €, avis en ligne, paiement avant le 15 décembre.",
    h1: "CFE : qui doit la payer, combien, et ce qu'il faut faire avant le 15 décembre",
    publieLe: "2026-11-20",
    misAJourLe: "2026-11-27",
    dureeLecture: 6,
    carte: {
      titre: "CFE : qui la paie, combien, et avant quand",
      resume: "Exonération de création, seuil de 5 000 €, base minimum, avis en ligne et échéance du 15 décembre",
    },
    lies: ["choisir-statut-micro-ei-eurl-sasu", "calendrier-fiscal-social-micro", "plafonds-micro-entreprise-2026"],
  },
];

/** Index par slug, construit une fois. */
const PAR_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

/**
 * Récupérer un article par son slug.
 *
 * Lève si le slug est inconnu, et c'est voulu : le registre est lu au moment du
 * rendu des pages, donc une faute de frappe dans un slug d'« article lié »
 * échoue au build plutôt que de produire un lien mort en production. C'est la
 * seule façon de garantir qu'il n'y a pas de 404 interne.
 */
export function article(slug: string): Article {
  const a = PAR_SLUG.get(slug);
  if (!a) {
    throw new Error(
      `[blog] slug inconnu : « ${slug} ». Les slugs connus sont : ${ARTICLES.map((x) => x.slug).join(", ")}`
    );
  }
  return a;
}

export function articlesDe(categorie: Categorie): Article[] {
  return ARTICLES.filter((a) => a.categorie === categorie);
}

export function urlArticle(slug: string): string {
  return `${SITE}/blog/${slug}`;
}

export function cheminArticle(slug: string): string {
  return `/blog/${slug}`;
}

/** Les articles liés, résolus en objets, et donc vérifiés. */
export function articlesLies(slug: string): Article[] {
  return (article(slug).lies ?? []).map(article);
}

/**
 * L'article de la famille `metier` rattaché à une landing page, s'il existe.
 * C'est ce qui permet à `/freelance-redacteur` de pointer vers son article sans
 * que personne ait à maintenir la correspondance à la main.
 */
export function articleDeLanding(landing: string): Article | undefined {
  return ARTICLES.find((a) => a.metier?.landing === landing);
}
