import { PageSite, CADRE, H1, LEAD, BOUTON_PLEIN } from "@/components/site/PageSite";
import type { Metadata } from "next";
import Link from "next/link";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { MenuCategorie } from "@/components/blog/MenuCategorie";
import { ARTICLES, SITE, articlesDe, urlArticle } from "@/lib/blog/registre";
import { LISTE_CATEGORIES } from "@/lib/blog/categories";
import {
  BadgeEuro, BarChart3, BookOpen, Calculator, Camera, CircleCheck, CircleX, Coins, Expand,
  FileMinus, FilePlus, FileSignature, Globe, GraduationCap, HandCoins, HardHat,
  Hash, Laptop, Link2, ListChecks, Palette, PenLine, Plane, RadioTower, Receipt, ScrollText,
  ShieldCheck, Smartphone, Stamp, Target,
  Ban, FileCode, Gavel,
  Briefcase, CalendarDays, ClipboardList, Compass, Landmark, Percent, PiggyBank, Scale, Split, UserCheck,
  Zap, type LucideIcon,
} from "lucide-react";

/**
 * L'index du blog, entièrement dérivé du registre et des catégories.
 *
 * Ce fichier portait sa propre copie des dix-neuf articles, puis deux menus
 * dépliants écrits à la main et des cartes à plat pour le reste, trois
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
  "liste-plateformes-agreees": ListChecks,
  "e-reporting-freelance-2026": RadioTower,
  "checklist-reforme-facturation-2026": CircleCheck,
  "facturation-electronique-petit-chiffre-affaires": Coins,
  "pas-de-plateforme-gratuite-etat": Ban,
  "amendes-facturation-electronique-2026": Gavel,
  "factur-x-explique-freelance": FileCode,
  // Documents
  "facture-acompte-freelance": FilePlus,
  "facture-avoir-erreur-facture": FileMinus,
  "note-honoraires-ou-facture": FileSignature,
  "attestation-vigilance-urssaf-freelance": Stamp,
  // Obligations
  "refacturer-frais-client-freelance": BadgeEuro,
  "facturer-client-etranger-freelance": Plane,
  "numerotation-factures-freelance": Hash,
  "livre-des-recettes-micro-entrepreneur": BookOpen,
  "biens-ou-services-micro-entrepreneur": Split,
  "passer-a-la-tva-micro-entrepreneur": Percent,
  "declarer-chiffre-affaires-urssaf": Landmark,
  "versement-liberatoire-2026": PiggyBank,
  "obligations-comptables-micro-entrepreneur": ClipboardList,
  "micro-ou-reel-quand-basculer": Scale,
  "quand-prendre-expert-comptable-micro": UserCheck,
  "experts-comptables-equiper-clients-micro": Briefcase,
  "calendrier-fiscal-social-micro": CalendarDays,
  "deviso-solution-comptable-marche": Compass,
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
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLd} />

      {/* En-tête éditorial */}
      <header className={`${CADRE} pt-14 sm:pt-20 pb-14 sm:pb-20`}>
        <p className="text-[15px] font-medium text-indigo-300 mb-4">Guides pratiques</p>
        <h1 className={`${H1} max-w-4xl mb-6`}>Facturation freelance : des guides sourcés, par sujet et par métier</h1>
        <p className={`${LEAD} max-w-2xl`}>
          Mentions obligatoires, exemples concrets et erreurs à éviter, adaptés à la réforme de la facturation
          électronique 2026. Chaque guide porte sa date de mise à jour et ses sources.
        </p>
      </header>

      {/* Catégories */}
      <main className={`${CADRE} pb-24`}>
        <div className="space-y-20 sm:space-y-24">
          {LISTE_CATEGORIES.map((c) => (
            <MenuCategorie key={c.id} categorie={c} articles={articlesDe(c.id)} icones={ICONES} />
          ))}
        </div>

        <p className="text-[15px] text-gray-400 mt-16 leading-relaxed max-w-2xl">
          {ARTICLES.length} guides. Si vous y trouvez une information fausse,{" "}
          <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 transition-colors">
            dites-le nous
          </a>
          {" "}: nous corrigeons et nous datons la correction.
        </p>

        <div className="mt-14">
          <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
        </div>
      </main>
    </PageSite>
  );
}
