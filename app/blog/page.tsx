import { PageSite } from "@/components/site/PageSite";
import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
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
  Zap, Clock, ShieldAlert, Building2, MapPin, type LucideIcon,
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
  "delais-paiement-penalites-retard": Clock,
  "fraude-faux-rib-faux-fournisseur": ShieldAlert,
  "choisir-statut-micro-ei-eurl-sasu": Building2,
  "cfe-cotisation-fonciere-entreprises": MapPin,
};

export const metadata: Metadata = {
  title: "Guides pour entreprendre : devis, factures, TVA et réforme 2026",
  description:
    "Guides pratiques pour les indépendants, freelances et petites entreprises en France : réforme 2026, documents obligatoires, TVA et seuils, se faire payer, devis par métier. Sourcés et datés.",
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "Blog Deviso, guides pour entreprendre en France",
    description:
      "Réforme 2026, documents, TVA et obligations, se faire payer, devis par métier. Des guides sourcés, datés et corrigés quand le droit change.",
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
      name: "Blog Deviso, guides pour entreprendre en France",
      description:
        "Guides pratiques pour les indépendants, freelances et petites entreprises en France : réforme 2026, documents obligatoires, TVA et seuils, devis par métier.",
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
      {/* ── Bandeau réforme 2026 ── */}
      <div
        className="bg-indigo-950/95 backdrop-blur-xs border-b border-indigo-500/20 py-2 px-4 text-center text-sm"
      >
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X, sans rien faire de votre côté.</span>
      </div>


      {/* ── Hero ── */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">
            Guides pratiques
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-ink leading-tight mb-4">
            Entreprendre en France&nbsp;:<br />
            <span className="bg-linear-to-r/srgb from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              les guides pratiques
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Devis, factures, TVA, réforme 2026, se faire payer&nbsp;: des guides sourcés pour les indépendants et les petites entreprises, quel que soit le statut.
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

      
    </PageSite>
  );
}
