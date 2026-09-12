import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { MenuCategorie } from "@/components/blog/MenuCategorie";
import { ARTICLES, SITE, articlesDe, urlArticle } from "@/lib/blog/registre";
import { LISTE_CATEGORIES } from "@/lib/blog/categories";
import {
  BadgeEuro, BarChart3, Calculator, Camera, CircleCheck, CircleX, Coins, Expand,
  FileMinus, FilePlus, FileSignature, Globe, GraduationCap, HandCoins, HardHat,
  Hash, Laptop, Link2, Palette, PenLine, Plane, RadioTower, Receipt, ScrollText,
  ShieldCheck, Smartphone, Stamp, Target,
  Zap, type LucideIcon,
} from "lucide-react";

/**
 * L'index du blog, entièrement dérivé du registre et des catégories.
 *
 * Ce fichier portait sa propre copie des dix-neuf articles, puis deux menus
 * dépliants écrits à la main et des cartes à plat pour le reste — trois
 * présentations pour une seule liste. Ajouter une catégorie demandait d'écrire
 * un troisième bloc de JSX ; un article rattaché à une catégorie sans bloc
 * n'apparaissait nulle part.
 *
 * Il ne reste que deux choses à tenir à la main : l'icône de chaque article, et
 * l'ordre des catégories (qui vit dans `categories.ts`). Tout le reste suit.
 */

/** Une icône par slug. Un slug sans icône retombe sur une valeur par défaut. */
const ICONES: Record<string, LucideIcon> = {
  // Réforme
  "facturation-electronique-2026": Zap,
  "facture-electronique-refusee-que-faire": CircleX,
  "plateforme-agreee-ou-solution-compatible": ShieldCheck,
  "reforme-facturation-micro-entrepreneur": Receipt,
  "choisir-plateforme-agreee-freelance": Link2,
  "e-reporting-freelance-2026": RadioTower,
  "checklist-reforme-facturation-2026": CircleCheck,
  "facturation-electronique-petit-chiffre-affaires": Coins,
  // Documents
  "facture-acompte-freelance": FilePlus,
  "facture-avoir-erreur-facture": FileMinus,
  "note-honoraires-ou-facture": FileSignature,
  "attestation-vigilance-urssaf-freelance": Stamp,
  // Obligations
  "refacturer-frais-client-freelance": BadgeEuro,
  "facturer-client-etranger-freelance": Plane,
  "numerotation-factures-freelance": Hash,
  "plafonds-micro-entreprise-2026": Coins,
  // Métier
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
  // Transverse
  "clauses-devis-freelance": ScrollText,
  "scope-creep-freelance": Expand,
  "gerer-impayes-freelance": HandCoins,
  "fixer-ses-tarifs-freelance": Calculator,
};

export const metadata: Metadata = {
  title: "Guides devis et facturation pour freelances",
  description:
    "Guides pratiques sur la facturation freelance en France : réforme 2026, documents obligatoires, TVA et seuils, devis par métier. Sourcés et datés.",
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "Blog Deviso, guides devis et facturation pour freelances",
    description:
      "Réforme 2026, documents du freelance, TVA et obligations, devis par métier. Des guides sourcés, datés et corrigés quand le droit change.",
    url: `${SITE}/blog`,
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "Blog Deviso" }],
  },
};

/**
 * Le `CollectionPage` liste tous les articles, et le `BreadcrumbList` est
 * présent : aucune page du site n'en portait avant le 11/09/2026.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE}/blog#blog`,
      name: "Blog Deviso, guides devis et facturation pour freelances",
      description:
        "Guides pratiques sur la facturation freelance en France : réforme 2026, documents obligatoires, TVA et seuils, devis par métier.",
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
            {LISTE_CATEGORIES.map((c) => (
              <MenuCategorie
                key={c.id}
                categorie={c}
                articles={articlesDe(c.id)}
                icones={ICONES}
                ouvert={c.ouverteParDefaut}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-8 leading-relaxed">
            {ARTICLES.length} guides. Chacun porte sa date de dernière mise à jour et ses sources.
            Si vous y trouvez une information fausse,{" "}
            <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              dites-le nous
            </a>{" "}
            : nous corrigeons et nous datons la correction.
          </p>
        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
