/**
 * Le registre : une seule source de vérité pour tout le contenu du blog.
 *
 * Pourquoi ce fichier existe. Avant lui, publier un article demandait de saisir
 * la même information à six endroits : les métadonnées Next, le JSON-LD de la
 * page, l'entrée du sitemap, la carte de l'index `/blog`, le `hasPart` du
 * `CollectionPage`, et les liens « articles liés ». Six saisies manuelles dont
 * deux qu'on peut oublier **en silence** — un article absent du sitemap n'est
 * signalé par rien, il est seulement invisible.
 *
 * L'audit SEO du 11/09/2026 a montré ce que ça coûtait. 19 articles, 4 398
 * lignes de TSX, et quatre erreurs factuelles dispersées dans quatre fichiers :
 * des montants d'amendes périmés depuis le 1er septembre 2026, recopiés à la
 * fois dans le corps d'un article, dans un JSON-LD `FAQPage` et sur l'index.
 * Le problème n'était pas la volonté de tenir le blog à jour — c'était son prix
 * unitaire.
 *
 * Trois propriétés que le code précédent n'avait pas :
 *
 *   - **une information est écrite une fois.** Le titre, la description, les
 *     dates, la catégorie, le métier rattaché : ici, et nulle part ailleurs ;
 *   - **une erreur de slug casse la compilation.** `article("typo")` lève, donc
 *     un lien interne mort ne peut plus atteindre la production ;
 *   - **`misAJourLe` est une vraie date.** Elle ne bouge que quand on modifie
 *     le contenu, ce qui rend enfin la fraîcheur mesurable — c'est le signal
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
 * casse la compilation — c'est le but.
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
   * chiffre, une date, un paragraphe — jamais pour faire joli : un `lastmod`
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
    titre: "Facturation électronique 2026 : le guide",
    description:
      "Réforme facturation électronique : ce qui s'applique déjà depuis le 1er septembre 2026, ce qui arrive en 2027, formats et plateformes agréées. Guide pour freelances.",
    h1: "Facturation électronique 2026 : le guide complet pour freelances et indépendants",
    og: {
      titre: "Facturation électronique 2026 : le guide complet pour freelances",
      description:
        "Calendrier, formats Factur-X, plateformes agréées, e-reporting, tout comprendre en 10 minutes.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-09-11",
    dureeLecture: 10,
    carte: {
      titre: "Guide complet réforme facturation électronique 2026",
      resume:
        "Ce qui s'applique déjà, ce qui arrive en 2027, le PPF abandonné, Factur-X, plateformes agréées",
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
    titre: "Micro-entrepreneur : la réforme 2026 expliquée",
    description:
      "Micro-entrepreneur : ce que la réforme de facturation électronique change vraiment pour vous. Franchise TVA, Factur-X, plateforme agréée, calendrier.",
    h1: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
    og: {
      titre: "Micro-entrepreneur et réforme facturation 2026 : ce qui change vraiment",
      description:
        "La franchise TVA ne vous exempte pas. Voici ce que vous devez savoir et faire avant septembre 2027.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-09-11",
    dureeLecture: 8,
    carte: {
      titre: "Micro-entrepreneur : ce que la réforme change pour toi",
      resume: "Franchise TVA ≠ exemption. Les 3 scénarios selon votre activité B2B/B2C",
      badge: "Micro-entrepreneur",
    },
    lies: ["facturation-electronique-2026", "e-reporting-freelance-2026", "checklist-reforme-facturation-2026"],
  },
  {
    slug: "choisir-plateforme-agreee-freelance",
    categorie: "reforme",
    titre: "Choisir sa plateforme agréée en freelance",
    description:
      "Le portail public (PPF) est abandonné : seules les plateformes agréées privées subsistent. 5 critères pour choisir la bonne quand on est freelance.",
    h1: "Comment choisir sa plateforme agréée quand on est freelance",
    og: {
      titre: "Comment choisir sa plateforme agréée en tant que freelance",
      description:
        "PPF abandonné, plateforme agréée obligatoire. Critères de choix, questions à poser, intégration avec votre logiciel de facturation.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-09-11",
    dureeLecture: 8,
    carte: {
      titre: "Choisir sa plateforme agréée : guide comparatif",
      resume: "Le PPF est abandonné. 5 critères pour sélectionner la bonne plateforme pour votre activité",
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
    slug: "e-reporting-freelance-2026",
    categorie: "reforme",
    titre: "E-reporting freelance : l'obligation B2C",
    description:
      "La facturation électronique ne concerne pas que le B2B. Si vous facturez des particuliers, l'e-reporting vous oblige aussi. Ce qu'il faut faire avant 2027.",
    h1: "E-reporting freelance : l'obligation B2C dont personne ne parle",
    og: {
      titre: "E-reporting freelance : l'obligation B2C oubliée",
      description:
        "Vous avez des clients particuliers ? L'e-reporting TVA vous concerne, même si vous n'émettez pas d'e-factures. Calendrier, obligations, amendes.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-09-11",
    dureeLecture: 7,
    carte: {
      titre: "E-reporting : l'obligation B2C dont personne ne parle",
      resume:
        "Si vous avez des clients particuliers, l'e-reporting TVA vous concerne aussi. Amende : 500 € par transmission",
      badge: "B2C",
    },
    lies: ["facturation-electronique-2026", "reforme-facturation-micro-entrepreneur", "checklist-reforme-facturation-2026"],
  },
  {
    slug: "facture-electronique-refusee-que-faire",
    categorie: "reforme",
    titre: "Facture électronique refusée : que faire ?",
    description:
      "Refusée ou rejetée, ce ne sont pas les mêmes causes ni les mêmes remèdes. Les statuts, les treize motifs de refus possibles, et pourquoi un avoir ne se transmet pas toujours.",
    h1: "Votre facture électronique a été refusée : ce que ça veut dire et quoi faire",
    og: {
      titre: "Facture électronique refusée ou rejetée : comprendre et corriger",
      description:
        "Les statuts du cycle de vie, la différence entre un refus du client et un rejet de la plateforme, les motifs réels, et la règle de l'avoir que personne n'explique.",
    },
    publieLe: "2026-09-11",
    misAJourLe: "2026-09-11",
    dureeLecture: 12,
    carte: {
      titre: "Facture refusée ou rejetée : que faire ?",
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
    titre: "Plateforme agréée ou solution compatible ?",
    description:
      "La distinction est officielle, pas marketing : une solution compatible ne peut ni transmettre ni recevoir vos factures. Comment vérifier où se situe votre logiciel.",
    h1: "Plateforme agréée ou solution compatible : ce que la différence change pour vous",
    og: {
      titre: "Plateforme agréée ou solution compatible : la différence qui compte",
      description:
        "Une solution compatible doit s'adosser à une plateforme agréée. La question à poser à votre éditeur n'est pas « êtes-vous conforme ? » mais « êtes-vous agréé, ou adossé à qui ? »",
    },
    publieLe: "2026-09-11",
    misAJourLe: "2026-09-11",
    dureeLecture: 7,
    carte: {
      titre: "Plateforme agréée ou solution compatible ?",
      resume:
        "La distinction officielle que presque personne n'explique, et les trois questions à poser à votre éditeur",
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
    titre: "Checklist réforme facturation 2026 : 7 points",
    description:
      "Réforme facturation électronique : 7 points à vérifier pour être prêt. Logiciel, format Factur-X, plateforme agréée, e-reporting, mentions légales.",
    h1: "Checklist réforme facturation 2026 : êtes-vous prêt ?",
    og: {
      titre: "Checklist réforme facturation 2026 pour freelances",
      description:
        "7 points à vérifier pour être en conformité avec la réforme de facturation électronique.",
    },
    publieLe: "2026-07-10",
    misAJourLe: "2026-09-11",
    dureeLecture: 10,
    carte: {
      titre: "Checklist réforme 2026 : êtes-vous prêt ?",
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
      "Vous facturez quelques milliers d'euros par an et la réforme vous inquiète. Ce qu'elle vous impose réellement, ce qu'elle ne vous impose pas, et les options gratuites.",
    h1: "Facturation électronique quand on fait un petit chiffre d'affaires : ce qui s'applique vraiment",
    og: {
      titre: "Petit chiffre d'affaires et facturation électronique : les options réelles",
      description:
        "Entre la réception obligatoire depuis 2026 et l'émission en 2027, ce qu'un très petit CA doit faire — et ce qu'il ne doit pas payer.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 8,
    carte: {
      titre: "Petit chiffre d'affaires : ce qui s'applique vraiment",
      resume: "Ce que la réforme impose à un très petit CA, et ce qu'elle ne vous oblige pas à payer",
    },
    lies: [
      "facturation-electronique-2026",
      "plateforme-agreee-ou-solution-compatible",
      "reforme-facturation-micro-entrepreneur",
    ],
  },
  // ── Famille « documents » ──────────────────────────────────────────────────
  {
    slug: "facture-acompte-freelance",
    categorie: "documents",
    titre: "Facture d'acompte : le document d'après le devis",
    description:
      "Votre devis est signé, le client verse un acompte : il faut une facture d'acompte. Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'il faut déclarer.",
    h1: "Facture d'acompte : le document que personne ne vous explique après la signature du devis",
    og: {
      titre: "Facture d'acompte freelance : mentions, solde, TVA et déclaration",
      description:
        "Ce que doit contenir une facture d'acompte, comment la relier à la facture de solde, et quand déclarer la somme encaissée à l'URSSAF.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 8,
    carte: {
      titre: "Facture d'acompte",
      resume: "Mentions obligatoires, lien avec la facture de solde, TVA, et ce qu'on déclare",
    },
    lies: ["facture-avoir-erreur-facture", "clauses-devis-freelance", "numerotation-factures-freelance"],
  },
  {
    slug: "facture-avoir-erreur-facture",
    categorie: "documents",
    titre: "Erreur sur une facture : l'avoir, pas la gomme",
    description:
      "Une facture émise ne se modifie ni ne se supprime. Comment corriger : avoir total, avoir partiel, facture rectificative — et ce que la facturation électronique change.",
    h1: "J'ai fait une erreur sur une facture : pourquoi on ne la supprime jamais, et quoi faire",
    og: {
      titre: "Corriger une facture : avoir, rectification, et ce que la réforme change",
      description:
        "Une facture émise est définitive. L'avoir est le seul outil de correction — et depuis la facturation électronique, le rattrapage n'est plus le même.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 9,
    carte: {
      titre: "Erreur sur une facture : l'avoir",
      resume: "Pourquoi on ne supprime jamais une facture, et comment la corriger proprement",
    },
    lies: [
      "facture-electronique-refusee-que-faire",
      "numerotation-factures-freelance",
      "facture-acompte-freelance",
    ],
  },
  {
    slug: "note-honoraires-ou-facture",
    categorie: "documents",
    titre: "Note d'honoraires ou facture : laquelle émettre ?",
    description:
      "Praticiens, consultants, professions libérales : la note d'honoraires n'est pas un document à part. Ce qui la distingue d'une facture, et ce qu'elle doit contenir.",
    h1: "Note d'honoraires ou facture : ce qui les distingue vraiment",
    og: {
      titre: "Note d'honoraires ou facture : la différence, et ce qu'elle doit contenir",
      description:
        "Pour un praticien ou une profession libérale, la note d'honoraires obéit aux mêmes obligations qu'une facture. Ce qui change, et ce qui ne change pas.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 7,
    carte: {
      titre: "Note d'honoraires ou facture ?",
      resume: "Ce que la note d'honoraires change vraiment, et ce qu'elle doit contenir",
    },
    lies: ["facture-acompte-freelance", "numerotation-factures-freelance", "facturation-electronique-2026"],
  },
  {
    slug: "attestation-vigilance-urssaf-freelance",
    categorie: "documents",
    titre: "Mon client demande une attestation de vigilance",
    description:
      "Votre client exige une attestation de vigilance URSSAF avant de payer. Pourquoi il y est obligé, comment l'obtenir en micro-entreprise, et quoi faire si elle vous est refusée.",
    h1: "Mon client me demande une attestation de vigilance URSSAF : que faire ?",
    og: {
      titre: "Attestation de vigilance URSSAF : pourquoi votre client l'exige et comment l'obtenir",
      description:
        "Au-delà de 5 000 € HT, votre client a l'obligation de la réclamer. Comment la télécharger, sa durée de validité, et les cas de refus.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 6,
    carte: {
      titre: "Attestation de vigilance URSSAF",
      resume: "Pourquoi votre client l'exige au-delà de 5 000 €, et comment l'obtenir",
    },
    lies: ["gerer-impayes-freelance", "facture-acompte-freelance", "clauses-devis-freelance"],
  },

  // ── Famille « obligations » ────────────────────────────────────────────────
  {
    slug: "plafonds-micro-entreprise-2026",
    categorie: "obligations",
    titre: "Plafonds de la micro-entreprise 2026-2028",
    description:
      "203 100 € et 83 600 € depuis 2026. Et surtout : ne confondez pas ces plafonds avec les seuils de TVA, bien plus bas, que vous franchirez en premier.",
    h1: "Plafonds de la micro-entreprise 2026-2028 : les vrais chiffres, et le piège des deux seuils",
    og: {
      titre: "Plafonds micro-entreprise 2026-2028 : 203 100 € et 83 600 €",
      description:
        "Les plafonds ont été revalorisés de 7,6 % pour 2026-2028. Les seuils de TVA, eux, n'ont pas bougé — et c'est eux que vous franchirez d'abord.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 8,
    carte: {
      titre: "Plafonds micro-entreprise 2026-2028",
      resume: "203 100 € et 83 600 €, et le piège de la confusion avec les seuils de TVA",
    },
    lies: [
      "facturer-client-etranger-freelance",
      "refacturer-frais-client-freelance",
      "fixer-ses-tarifs-freelance",
    ],
  },
  {
    slug: "refacturer-frais-client-freelance",
    categorie: "obligations",
    titre: "Refacturer ses frais sans gonfler son CA",
    description:
      "Refacturer un train ou un hôtel augmente votre chiffre d'affaires, donc vos cotisations. Le mécanisme du débours, ses conditions strictes, et quand il ne s'applique pas.",
    h1: "Refacturer ses frais à un client sans faire exploser son chiffre d'affaires",
    og: {
      titre: "Refacturer des frais en micro-entreprise : le piège des cotisations",
      description:
        "Un frais refacturé entre dans votre chiffre d'affaires et donc dans l'assiette de vos cotisations. Sauf s'il remplit les conditions du débours.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
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
    categorie: "obligations",
    titre: "Facturer un client à l'étranger",
    description:
      "Client pro dans l'UE, particulier en Belgique, entreprise aux États-Unis : la mention à porter sur la facture change à chaque fois. Le guide des quatre cas.",
    h1: "Facturer un client à l'étranger : quelle mention porter, dans quel cas",
    og: {
      titre: "Facturer un client étranger en freelance : TVA, mentions, DES",
      description:
        "Autoliquidation, numéro de TVA intracommunautaire obligatoire même en franchise, Déclaration européenne de services : les quatre cas, sans jargon.",
    },
    publieLe: "2026-09-12",
    misAJourLe: "2026-09-12",
    dureeLecture: 10,
    carte: {
      titre: "Facturer un client à l'étranger",
      resume: "UE ou hors UE, pro ou particulier : la mention change à chaque fois",
    },
    lies: [
      "plafonds-micro-entreprise-2026",
      "e-reporting-freelance-2026",
      "facture-acompte-freelance",
    ],
  },
  {
    slug: "numerotation-factures-freelance",
    categorie: "obligations",
    titre: "Numéroter ses factures, et réparer un trou",
    description:
      "La numérotation doit être continue et sans trou : c'est une obligation du CGI. Les formats qui tiennent, et comment réparer une série déjà cassée.",
    h1: "Numéroter ses factures sans se tromper — et que faire si c'est déjà raté",
    og: {
      titre: "Numérotation des factures : les règles, les formats, et comment réparer",
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
    titre: "Devis graphiste freelance : mentions obligatoires",
    description:
      "Tout ce qu'un devis de graphiste freelance doit contenir : mentions légales, droits de cession, acompte, révisions. Exemple concret + erreurs à éviter.",
    h1: "Devis de graphiste freelance : mentions obligatoires, exemple et erreurs à éviter",
    og: {
      titre: "Devis graphiste freelance : mentions obligatoires et exemple",
      description:
        "Mentions légales, droits de cession, acompte, révisions, tout ce qu'un devis de graphiste doit contenir. Exemple concret.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 6,
    carte: { titre: "Graphiste freelance", resume: "Droits de cession, révisions, formats livrés" },
    metier: {
      landing: "/freelance-graphiste",
      landingLabel: "logiciel de devis pour graphistes",
      profession: "graphiste freelance",
      professionPluriel: "graphistes freelances",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },
  {
    slug: "devis-developpeur-web",
    categorie: "metier",
    titre: "Devis développeur web freelance : le guide",
    description:
      "Comment rédiger un devis de développement web freelance : mentions obligatoires, TJM vs forfait, scope creep, Chorus Pro. Exemple concret inclus.",
    h1: "Devis développeur web freelance : guide complet, exemple et erreurs à éviter",
    og: {
      titre: "Devis développeur web freelance : guide complet 2026",
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
    titre: "Devis consultant indépendant : propale et TJM",
    description:
      "Comment rédiger une proposition commerciale de consultant indépendant : livrables, TJM, confidentialité, grands comptes. Exemple et erreurs à éviter.",
    h1: "Devis de consultant indépendant : rédiger une propale efficace en 2026",
    og: {
      titre: "Devis consultant indépendant : propale, TJM, livrables",
      description:
        "Livrables, TJM, confidentialité, Factur-X grands comptes, guide complet pour votre propale de consultant indépendant.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    titre: "Devis photographe : droits d'auteur et acompte",
    description:
      "Comment rédiger un devis de photographe freelance : droits d'utilisation, retouches, frais de déplacement, acompte. Exemple concret et erreurs à éviter.",
    h1: "Devis de photographe freelance : droits d'auteur, acompte et exemple concret",
    og: {
      titre: "Devis photographe freelance : droits d'auteur, acompte, exemple",
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
    titre: "Devis rédacteur web : tarifs et droits",
    description:
      "Comment rédiger un devis de rédaction web ou copywriting : tarif au mot ou à la page, révisions, cession de droits, relances. Exemple et erreurs à éviter.",
    h1: "Devis rédacteur web freelance : tarifs, révisions et erreurs à éviter",
    og: {
      titre: "Devis rédacteur web freelance : tarifs, révisions, droits",
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
    titre: "Devis formateur : mentions OPCO et exemple",
    description:
      "Devis de formation : mentions OPCO obligatoires, objectifs pédagogiques, acompte et solde. Exemple concret et erreurs à éviter.",
    h1: "Devis de formateur indépendant : mentions OPCO, exemple et erreurs à éviter",
    og: {
      titre: "Devis formateur indépendant : mentions OPCO et exemple 2026",
      description:
        "Mentions OPCO obligatoires, objectifs pédagogiques, acompte/solde, Factur-X, guide complet pour votre devis de formation.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    titre: "Devis artisan BTP : TVA réduite et décennale",
    description:
      "Devis d'artisan BTP : taux de TVA selon les travaux, mention garantie décennale, acompte. Exemple concret et erreurs à éviter.",
    h1: "Devis artisan BTP : TVA réduite, garantie décennale et erreurs à éviter",
    og: {
      titre: "Devis artisan BTP : TVA réduite, garantie décennale, exemple",
      description:
        "TVA 5,5 % / 10 % / 20 %, garantie décennale obligatoire, acompte, tout ce qu'un devis artisan BTP doit contenir.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    titre: "Devis community manager : forfait et périmètre",
    description:
      "Devis de community manager : définir le périmètre (plateformes, posts, visuels), forfait mensuel, résiliation. Exemple et erreurs à éviter.",
    h1: "Devis community manager freelance : périmètre, forfait mensuel et erreurs à éviter",
    og: {
      titre: "Devis community manager freelance : périmètre, forfait mensuel, erreurs",
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
    lies: ["scope-creep-freelance", "clauses-devis-freelance"],
  },
  {
    slug: "devis-coach-freelance",
    categorie: "metier",
    titre: "Devis coach freelance : TVA, abandon, exemple",
    description:
      "Devis de coaching : TVA franchise ou exonération, conditions d'abandon et de remboursement, séances vs programmes. Exemple et erreurs à éviter.",
    h1: "Devis coach freelance : TVA, conditions d'abandon de programme et erreurs à éviter",
    og: {
      titre: "Devis coach freelance : TVA, conditions abandon programme, exemple",
      description:
        "TVA franchise ou exonération, conditions d'abandon, séances vs programmes, tout ce qu'un devis de coach freelance doit contenir.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    titre: "Devis traducteur freelance : tarifs et droits",
    description:
      "Devis de traduction : tarifer au mot ou à la page, inclure les révisions, droits sur la traduction, tarif urgence. Exemple et erreurs à éviter.",
    h1: "Devis traducteur freelance : tarification, révisions, droits sur la traduction et erreurs à éviter",
    og: {
      titre: "Devis traducteur freelance : tarification, révisions, droits sur la traduction",
      description:
        "Tarification au mot ou à la page, révisions, droits sur la traduction, tarif urgence, guide complet pour votre devis de traduction.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    slug: "clauses-devis-freelance",
    categorie: "transverse",
    titre: "Clauses indispensables d'un devis freelance",
    description:
      "Périmètre, acompte, révisions, propriété intellectuelle, résiliation : les 9 clauses à mettre dans un devis freelance, avec formulations prêtes à l'emploi.",
    h1: "Les clauses indispensables dans un devis freelance, guide complet 2026",
    og: {
      titre: "Les clauses indispensables dans un devis freelance, guide complet 2026",
      description:
        "Périmètre, acompte, révisions, droits d'auteur, résiliation, NDA, les 9 clauses à ne jamais oublier dans votre devis freelance.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
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
    categorie: "transverse",
    titre: "Scope creep freelance : s'en protéger au devis",
    description:
      "Le scope creep est la première cause de perte de rentabilité en freelance. Comment il arrive et quelles clauses mettre au devis pour s'en protéger.",
    h1: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
    og: {
      titre: "Scope creep freelance : comment s'en protéger avec son devis",
      description:
        "Qu'est-ce que le scope creep ? Comment l'éviter ? Quelles clauses inclure dans votre devis ? Guide pratique pour freelances.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 6,
    carte: {
      titre: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
      resume:
        "Le scope creep est la première cause de perte de rentabilité en freelance. Découvrez comment il arrive, et les clauses pour vous en protéger.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "fixer-ses-tarifs-freelance"],
  },
  {
    slug: "gerer-impayes-freelance",
    categorie: "transverse",
    titre: "Gérer les impayés en freelance : les 4 étapes",
    description:
      "Récupérer une facture impayée en freelance : relance amiable, mise en demeure, injonction de payer. Étapes concrètes et protection dès le devis.",
    h1: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
    og: {
      titre: "Gérer les impayés en freelance : relance, mise en demeure, tribunal",
      description:
        "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 7,
    carte: {
      titre: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
      resume:
        "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées, étape par étape.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "scope-creep-freelance"],
  },
  {
    slug: "fixer-ses-tarifs-freelance",
    categorie: "transverse",
    titre: "Fixer ses tarifs en freelance : TJM et méthodes",
    description:
      "Calculer son TJM en freelance : 3 méthodes, les erreurs classiques, et comment augmenter ses tarifs sans perdre ses clients.",
    h1: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
    og: {
      titre: "Comment fixer ses tarifs en freelance : TJM, méthodes, erreurs à éviter",
      description:
        "Les 3 méthodes pour calculer son TJM, les erreurs classiques, et comment augmenter ses tarifs. Guide complet pour freelances.",
    },
    publieLe: "2026-06-29",
    misAJourLe: "2026-06-29",
    dureeLecture: 7,
    carte: {
      titre: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
      resume:
        "Les 3 méthodes pour calculer son TJM, les erreurs classiques (syndrome de l'imposteur, temps non facturables), et comment augmenter ses tarifs sans perdre ses clients.",
      badge: "Problème freelance",
    },
    lies: ["clauses-devis-freelance", "scope-creep-freelance"],
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
      `[blog] slug inconnu : « ${slug} ». Les slugs connus sont : ${ARTICLES.map((x) => x.slug).join(", ")}`
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

/** Les articles liés, résolus en objets — et donc vérifiés. */
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
