import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { ARTICLES, SITE, articlesDe, urlArticle } from "@/lib/blog/registre";
import {
  BarChart3, Camera, CircleCheck, Globe, GraduationCap, HardHat, Laptop, Link2,
  Palette, PenLine, RadioTower, Receipt, Smartphone, Target, Zap, type LucideIcon,
} from "lucide-react";

/**
 * L'index du blog, construit depuis le registre.
 *
 * Ce fichier portait sa propre copie des dix-neuf articles : titres, résumés,
 * durées de lecture, badges. Une troisième saisie, après les métadonnées de
 * chaque page et l'entrée du sitemap. Elle avait dérivé, comme toutes les
 * copies finissent par dériver : le résumé de l'article e-reporting annonçait ici
 * « Amendes : 250 €/transaction », un montant doublé depuis le 1er septembre 2026
 * par la loi de finances pour 2026.
 *
 * Il ne reste qu'une chose à tenir à la main : l'icône de chaque article. Elle
 * est ici, et pas dans le registre, pour que `app/sitemap.ts` n'ait pas à importer
 * `lucide-react` pour produire du XML.
 */

/** Une icône par slug. Un slug sans icône retombe sur une valeur par défaut. */
const ICONES: Record<string, LucideIcon> = {
  "facturation-electronique-2026": Zap,
  "reforme-facturation-micro-entrepreneur": Receipt,
  "choisir-plateforme-agreee-freelance": Link2,
  "e-reporting-freelance-2026": RadioTower,
  "checklist-reforme-facturation-2026": CircleCheck,
  "devis-graphiste-freelance": Palette,
  "devis-developpeur-web": Laptop,
  "devis-consultant-independant": BarChart3,
  "devis-photographe-freelance": Camera,
  "devis-redacteur-web": PenLine,
  "devis-formateur-independant": GraduationCap,
  "devis-artisan-btp": HardHat,
  "devis-community-manager": Smartphone,
  "devis-coach-freelance": Target,
  "devis-traducteur-freelance": Globe,
};

const reformeArticles = articlesDe("reforme");
const metierArticles = articlesDe("metier");
const autresArticles = articlesDe("transverse");

export const metadata: Metadata = {
  title: "Guides devis et facturation pour freelances",
  description:
    "Guides pratiques sur la facturation freelance en France : réforme 2026, mentions obligatoires, droits d'auteur, OPCO, Factur-X. Par métier et par sujet.",
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "Blog Deviso, guides devis et facturation pour freelances",
    description:
      "Guides pratiques sur la facturation freelance en France : réforme 2026, mentions obligatoires, droits d'auteur, Factur-X.",
    url: `${SITE}/blog`,
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "Blog Deviso" }],
  },
};

/**
 * Le `CollectionPage` liste désormais les dix-neuf articles, et non six choisis à
 * la main — un `hasPart` partiel déclare à Google une collection plus pauvre
 * qu'elle ne l'est. Le `BreadcrumbList` est ajouté : aucune page du site n'en
 * portait.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE}/blog#blog`,
      name: "Blog Deviso, guides devis et facturation pour freelances",
      description:
        "Guides pratiques sur la facturation freelance en France : réforme 2026, mentions obligatoires, droits d'auteur, Factur-X, par métier et par sujet.",
      url: `${SITE}/blog`,
      publisher: { "@type": "Organization", name: "Deviso", url: SITE },
      inLanguage: "fr",
      hasPart: ARTICLES.map((a) => ({
        "@type": "Article",
        name: a.h1,
        url: urlArticle(a.slug),
        datePublished: a.publieLe,
        dateModified: a.misAJourLe,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog" },
      ],
    },
  ],
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLd} />
      {/* ── Bandeau réforme 2026 ── */}
      <div
        className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm"
        style={{ zIndex: 60 }}
      >
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X, sans rien faire de votre côté.</span>
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
            <Link href="/#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Connexion
            </Link>
            <WaitlistButton
              plan="free"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">
            Guides pratiques
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white leading-tight mb-4">
            Facturation freelance :<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              guides par métier
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Mentions obligatoires, exemples concrets et erreurs à éviter, par profession et adapté à la réforme Factur-X 2026.
          </p>
        </div>
      </section>

      {/* ── Articles ── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-5">

            {/* ── Accordéon "Réforme 2026" ── */}
            <details className="group bg-ds-surface border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all open:border-amber-500/40">
              <summary className="flex items-start justify-between gap-4 p-6 cursor-pointer list-none select-none">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium border bg-amber-500/10 text-amber-300 border-amber-500/20">
                      Réforme 2026
                    </span>
                    <span className="text-xs text-gray-400">{reformeArticles.length} guides · en vigueur</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg leading-snug mb-2 group-open:text-amber-200 transition-colors">
                    Facturation électronique 2026 : tout ce que les freelances doivent savoir
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    La réforme est entrée en application le 1<sup>er</sup> septembre 2026. Ce qui s&apos;applique déjà, ce qui arrive en 2027, les plateformes agréées, l&apos;e-reporting et les amendes réelles.
                  </p>
                </div>
                <span className="text-gray-600 flex-shrink-0 mt-1 text-xl transition-transform duration-200 group-open:rotate-90">→</span>
              </summary>

              {/* Liste des articles réforme */}
              <div className="border-t border-ds-border divide-y divide-ds-border">
                {reformeArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-ds-elevated transition-colors group/item"
                  >
                    <span className="flex-shrink-0 w-8 flex justify-center text-indigo-400">{(() => { const I = ICONES[article.slug] ?? Zap; return <I size={18} />; })()}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white text-sm font-medium group-hover/item:text-amber-200 transition-colors">{article.carte.titre}</p>
                      </div>
                      <p className="text-gray-600 text-xs">{article.carte.resume}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{article.dureeLecture} min</span>
                    <span className="text-gray-700 group-hover/item:text-amber-400 transition-colors flex-shrink-0 text-sm">→</span>
                  </Link>
                ))}
              </div>
            </details>

            {/* ── Accordéon "Devis par métier" ── */}
            <details className="group bg-ds-surface border border-ds-border rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all open:border-indigo-500/30">
              <summary className="flex items-start justify-between gap-4 p-6 cursor-pointer list-none select-none">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium border bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                      Devis par métier
                    </span>
                    <span className="text-xs text-gray-400">{metierArticles.length} guides</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg leading-snug mb-2 group-open:text-indigo-200 transition-colors">
                    Devis par métier : guide complet par profession
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Mentions obligatoires, exemples concrets et clauses spécifiques, un guide dédié pour chaque profession freelance.
                  </p>
                </div>
                <span className="text-gray-600 flex-shrink-0 mt-1 text-xl transition-transform duration-200 group-open:rotate-90">→</span>
              </summary>

              {/* Liste des articles métier */}
              <div className="border-t border-ds-border divide-y divide-ds-border">
                {metierArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-ds-elevated transition-colors group/item"
                  >
                    <span className="flex-shrink-0 w-8 flex justify-center text-indigo-400">{(() => { const I = ICONES[article.slug] ?? Zap; return <I size={18} />; })()}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium group-hover/item:text-indigo-200 transition-colors">{article.carte.titre}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{article.carte.resume}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{article.dureeLecture} min</span>
                    <span className="text-gray-700 group-hover/item:text-indigo-400 transition-colors flex-shrink-0 text-sm">→</span>
                  </Link>
                ))}
              </div>
            </details>

            {/* ── Articles cross-profession ── */}
            {autresArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group bg-ds-surface border border-ds-border rounded-2xl p-6 hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      article.carte.badge === "Tous métiers"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    }`}>
                      {article.carte.badge}
                    </span>
                    <span className="text-xs text-gray-400">{article.dureeLecture} min</span>
                  </div>
                  <h3 className="text-white font-semibold leading-snug mb-2 group-hover:text-indigo-200 transition-colors text-sm">
                    {article.carte.titre}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {article.carte.resume}
                  </p>
                </div>
                <span className="text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 text-xl mt-1">
                  &#8594;
                </span>
              </div>
            </Link>
          ))}
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
