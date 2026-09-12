import type { Metadata } from "next";
import { SITE, article, articlesLies, urlArticle, type Article } from "./registre";
import { AUTEUR_JSONLD } from "./auteur";
import { categorie } from "./categories";

/**
 * Métadonnées et données structurées, dérivées du registre.
 *
 * Pourquoi ce fichier existe. Chaque article portait seize lignes de
 * `export const metadata` et vingt à quarante lignes d'objet `jsonLd`, recopiées
 * d'un article à l'autre. Deux conséquences mesurées par l'audit du 11/09/2026 :
 *
 *   - les `dateModified` étaient figés à la date de publication sur les dix-neuf
 *     articles, parce que personne ne pense à modifier deux lignes en dur quand
 *     il corrige un paragraphe ;
 *   - aucun article ne portait de `BreadcrumbList`, parce qu'ajouter un
 *     quatrième bloc de balisage à la main dans dix-neuf fichiers ne se fait
 *     jamais.
 *
 * Ici, les deux sont automatiques. Un article écrit
 * `export const metadata = metadonneesArticle("mon-slug")`, et c'est tout.
 *
 * Le fil d'Ariane est produit pour tous les articles d'un coup, ce qui fait
 * afficher le chemin de la page dans les résultats Google au lieu de l'URL
 * brute.
 */

export function metadonneesArticle(slug: string): Metadata {
  const a = article(slug);
  const url = urlArticle(slug);
  const ogTitre = a.og?.titre ?? a.h1;
  const ogDescription = a.og?.description ?? a.description;

  return {
    title: a.titre,
    description: a.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: ogTitre,
      description: ogDescription,
      url,
      publishedTime: a.publieLe,
      modifiedTime: a.misAJourLe,
      images: [
        {
          url: `${SITE}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: a.h1,
        },
      ],
    },
    twitter: { title: ogTitre, description: ogDescription },
  };
}

export type QuestionFaq = { q: string; a: string };

/** Le libellé du fil d'Ariane : court, c'est ce que Google affiche. */
function miette(a: Article): string {
  return a.carte.titre;
}

/**
 * Le JSON-LD complet d'un article : `Article`, le `FAQPage` s'il y a des
 * questions, et le `BreadcrumbList`.
 *
 * Les questions passées ici doivent être **les mêmes** que celles affichées sur
 * la page. Un `FAQPage` qui annonce une réponse absente du contenu visible est
 * une déclaration fausse, et Google sanctionne de plus en plus ce décalage.
 * C'est pour ça que le gabarit `BlogPost` passe sa propre liste `faq` : une
 * seule source, affichée et balisée.
 */
export function jsonLdArticle(slug: string, faq?: QuestionFaq[]) {
  const a = article(slug);
  const url = urlArticle(slug);

  const noeudArticle: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.h1,
    description: a.description,
    datePublished: a.publieLe,
    dateModified: a.misAJourLe,
    // L'auteur est une personne, l'éditeur reste la marque. C'est la structure
    // que Google attend, et c'était l'inverse avant : les dix-neuf articles
    // étaient signés par une organisation inconnue.
    author: AUTEUR_JSONLD,
    publisher: { "@type": "Organization", name: "Deviso", url: SITE },
    inLanguage: "fr",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "Blog", "@id": `${SITE}/blog#blog`, name: "Blog Deviso" },
  };

  if (faq && faq.length > 0) {
    noeudArticle.mainEntity = {
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };
  }

  const filDAriane = {
    "@type": "BreadcrumbList",
    "@id": `${url}#ariane`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: miette(a) },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [noeudArticle, filDAriane] };
}

/**
 * Un fil d'Ariane pour une page qui n'est pas un article — les pages tarifs,
 * par exemple, qui ont la même profondeur et le même besoin.
 */
export function jsonLdFilDAriane(etapes: { nom: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: etapes.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.nom,
      ...(e.url ? { item: e.url } : {}),
    })),
  };
}

/** Le badge de catégorie d'un article, pour l'afficher en tête de page. */
export function badgeCategorie(slug: string) {
  const c = categorie(article(slug).categorie);
  return { badge: c.badge, accent: c.accent };
}

/** Les articles liés, prêts à afficher : chemin, titre court, durée. */
export function suggestionsDeLecture(slug: string) {
  return articlesLies(slug).map((a) => ({
    href: `/blog/${a.slug}`,
    titre: a.carte.titre,
    resume: a.carte.resume,
    dureeLecture: a.dureeLecture,
  }));
}
