import { MetadataRoute } from "next";
import { ARTICLES, SITE, urlArticle } from "@/lib/blog/registre";
import { METIERS } from "@/lib/blog/metiers";

/**
 * Le sitemap, calculé depuis les mêmes sources que les pages.
 *
 * Pourquoi il a changé. Il listait quarante-trois URL écrites à la main, une par
 * une, sur deux cent soixante-dix lignes. Deux défauts, tous deux relevés par
 * l'audit du 11/09/2026 :
 *
 *   - **rien ne signalait un oubli.** Une page ajoutée sans son entrée ici reste
 *     invisible pour Google, et aucun test ne le disait. Le contrôle s'appelle
 *     maintenant `scripts/check-blog.mjs`, mais le vrai remède est qu'il n'y ait
 *     plus rien à oublier ;
 *   - **`lastModified` valait `new Date()` sur les quarante-trois entrées.** Les
 *     quarante-trois pages affirmaient donc avoir été modifiées à l'instant, à
 *     chaque déploiement, même un déploiement qui n'en touchait aucune. Un
 *     `lastmod` qui bouge toujours est un `lastmod` que Google cesse de lire —
 *     et ce signal, on en a précisément besoin le jour où on corrige un article
 *     réglementaire et qu'on veut que ça se sache vite.
 *
 * Désormais chaque article porte sa vraie date (`misAJourLe` du registre), et les
 * pages métier portent la date de la dernière révision des données de tarifs.
 * Les pages produit, dont le contenu évolue avec le produit, gardent la date du
 * build : pour elles, c'est la vérité.
 *
 * Sur les priorités : Google dit les ignorer, et c'est probablement vrai. Elles
 * sont conservées parce qu'elles servent de documentation — elles disent ce que
 * *nous* considérons comme important, ce qui se vérifie ensuite contre le
 * maillage réel. Le sitemap déclarait `/combien-facturer` en 0.9 pendant que le
 * site ne lui envoyait qu'un lien : l'écart entre les deux était le défaut.
 */

/** Dernière révision des données de TJM. À avancer quand `TARIFS_DATA` change. */
const REVISION_TARIFS = "2026-07-01";

/** Dernière révision du contenu des landing pages métier. */
const REVISION_LANDINGS = "2026-09-11";

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  const pagesProduit: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: maintenant, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/login`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Les pages légales sont indexables : pour un logiciel qui manipule de la
  // facturation, des mentions légales et une politique de confidentialité
  // consultables sont un signal de confiance, pas du contenu mince.
  const pagesLegales: MetadataRoute.Sitemap = ["/mentions-legales", "/cgu", "/confidentialite"].map(
    (chemin) => ({
      url: `${SITE}${chemin}`,
      lastModified: new Date(REVISION_LANDINGS),
      changeFrequency: "yearly",
      priority: 0.3,
    })
  );

  const landings: MetadataRoute.Sitemap = METIERS.map((m) => ({
    url: `${SITE}${m.landing}`,
    lastModified: new Date(REVISION_LANDINGS),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // La page de conformité : c'est le premier critère de tri des comparateurs
  // depuis le 1er septembre 2026, donc une page à haute priorité.
  const conformite: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/conformite`,
      lastModified: new Date(REVISION_LANDINGS),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      // La page auteur : elle porte l'autorité des dix-neuf articles, qui la
      // désignent tous par le même `@id`.
      url: `${SITE}/a-propos`,
      lastModified: new Date(REVISION_LANDINGS),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const hubTarifs: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/combien-facturer`,
      lastModified: new Date(REVISION_TARIFS),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  const pagesTarifs: MetadataRoute.Sitemap = METIERS.filter((m) => m.tarifs).map((m) => ({
    url: `${SITE}${m.tarifs!.href}`,
    lastModified: new Date(REVISION_TARIFS),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const indexBlog: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/blog`,
      // L'index change dès qu'un article change : on prend la plus récente.
      lastModified: new Date(
        ARTICLES.map((a) => a.misAJourLe).sort().at(-1) ?? REVISION_LANDINGS
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const articles: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: urlArticle(a.slug),
    lastModified: new Date(a.misAJourLe),
    changeFrequency: "monthly",
    // Le cluster réforme porte l'essentiel de la valeur et bouge le plus.
    priority: a.categorie === "reforme" ? 0.9 : 0.8,
  }));

  return [
    ...pagesProduit,
    ...conformite,
    ...hubTarifs,
    ...indexBlog,
    ...landings,
    ...pagesTarifs,
    ...articles,
    ...pagesLegales,
  ];
}
