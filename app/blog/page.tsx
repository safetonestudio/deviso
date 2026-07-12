import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Blog Deviso, Guides devis et facturation pour freelances",
  description:
    "Guides pratiques sur la facturation freelance en France : mentions obligatoires, droits d'auteur, OPCO, Factur-X, Chorus Pro. Par métier et par sujet.",
  alternates: { canonical: "https://getdeviso.fr/blog" },
  openGraph: {
    title: "Blog Deviso, Guides devis et facturation pour freelances",
    description: "Guides pratiques sur la facturation freelance en France : mentions obligatoires, droits d'auteur, OPCO, Factur-X.",
    url: "https://getdeviso.fr/blog",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Blog Deviso, Guides devis et facturation pour freelances",
  description: "Guides pratiques sur la facturation freelance en France : mentions obligatoires, droits d'auteur, Factur-X, Chorus Pro. Par métier et par sujet.",
  url: "https://getdeviso.fr/blog",
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  hasPart: [
    { "@type": "Article", name: "Devis graphiste freelance : mentions obligatoires", url: "https://getdeviso.fr/blog/devis-graphiste-freelance" },
    { "@type": "Article", name: "Devis développeur web freelance", url: "https://getdeviso.fr/blog/devis-developpeur-web" },
    { "@type": "Article", name: "Devis consultant indépendant", url: "https://getdeviso.fr/blog/devis-consultant-independant" },
    { "@type": "Article", name: "Clauses essentielles pour un devis freelance", url: "https://getdeviso.fr/blog/clauses-devis-freelance" },
    { "@type": "Article", name: "Gérer les impayés en freelance", url: "https://getdeviso.fr/blog/gerer-impayes-freelance" },
    { "@type": "Article", name: "Fixer ses tarifs en freelance", url: "https://getdeviso.fr/blog/fixer-ses-tarifs-freelance" },
  ],
};

// Articles réforme 2026, cluster 5 articles
const reformeArticles = [
  {
    slug: "facturation-electronique-2026",
    title: "Guide complet réforme facturation électronique 2026",
    icon: "⚡",
    description: "PPF abandonné, PDP obligatoire, Factur-X, calendrier, tout ce que les freelances doivent savoir",
    readingTime: 10,
    badge: "Guide pilier",
  },
  {
    slug: "reforme-facturation-micro-entrepreneur",
    title: "Micro-entrepreneur : ce que la réforme change pour toi",
    icon: "🧾",
    description: "Franchise TVA ≠ exemption. Les 3 scénarios selon votre activité B2B/B2C",
    readingTime: 8,
    badge: "Micro-entrepreneur",
  },
  {
    slug: "choisir-plateforme-agreee-freelance",
    title: "Choisir sa plateforme agréée (PDP) : guide comparatif",
    icon: "🔗",
    description: "Le PPF est abandonné. 5 critères pour sélectionner la bonne PDP pour votre activité",
    readingTime: 8,
    badge: "PDP",
  },
  {
    slug: "e-reporting-freelance-2026",
    title: "E-reporting : l'obligation B2C dont personne ne parle",
    icon: "📡",
    description: "Si vous avez des clients particuliers, l'e-reporting TVA vous concerne aussi. Amendes : 250€/transaction",
    readingTime: 7,
    badge: "B2C",
  },
  {
    slug: "checklist-reforme-facturation-2026",
    title: "Checklist réforme 2026 : êtes-vous prêt ?",
    icon: "✅",
    description: "7 points à vérifier pour ne rien rater, à partager avec votre comptable",
    readingTime: 10,
    badge: "Checklist",
  },
];

// Articles regroupés sous l'accordéon "Devis par métier"
const metierArticles = [
  {
    slug: "devis-graphiste-freelance",
    label: "Graphiste freelance",
    icon: "🎨",
    description: "Droits de cession, révisions, formats livrés",
    readingTime: 6,
  },
  {
    slug: "devis-developpeur-web",
    label: "Développeur web",
    icon: "💻",
    description: "TJM vs forfait, scope creep, propriété du code",
    readingTime: 7,
  },
  {
    slug: "devis-consultant-independant",
    label: "Consultant indépendant",
    icon: "📊",
    description: "Propale efficace, régie vs forfait, grands comptes",
    readingTime: 6,
  },
  {
    slug: "devis-photographe-freelance",
    label: "Photographe freelance",
    icon: "📸",
    description: "Droits d'auteur, acompte, conditions d'annulation",
    readingTime: 5,
  },
  {
    slug: "devis-redacteur-web",
    label: "Rédacteur & copywriter",
    icon: "✍️",
    description: "Tarif au mot, révisions limitées, cession de droits",
    readingTime: 5,
  },
  {
    slug: "devis-formateur-independant",
    label: "Formateur indépendant",
    icon: "🎓",
    description: "Mentions OPCO, exonération TVA, Qualiopi",
    readingTime: 6,
  },
  {
    slug: "devis-artisan-btp",
    label: "Artisan BTP",
    icon: "🏗️",
    description: "TVA réduite, garantie décennale, acompte",
    readingTime: 7,
  },
  {
    slug: "devis-community-manager",
    label: "Community manager",
    icon: "📱",
    description: "Périmètre, forfait mensuel, résiliation",
    readingTime: 6,
  },
  {
    slug: "devis-coach-freelance",
    label: "Coach freelance",
    icon: "🎯",
    description: "TVA, conditions d'abandon de programme",
    readingTime: 6,
  },
  {
    slug: "devis-traducteur-freelance",
    label: "Traducteur freelance",
    icon: "🌐",
    description: "Tarif au mot, droits sur la traduction, urgences",
    readingTime: 7,
  },
];

// Articles cross-profession : hub clauses + problèmes freelance
const autresArticles = [
  {
    slug: "clauses-devis-freelance",
    title: "Les clauses indispensables dans un devis freelance (avec formulations)",
    description: "Périmètre, acompte, révisions, propriété intellectuelle, résiliation, les 9 clauses à mettre dans tout devis freelance, avec des formulations prêtes à l'emploi.",
    profession: "Tous métiers",
    readingTime: 8,
  },
  {
    slug: "scope-creep-freelance",
    title: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
    description: "Le scope creep est la première cause de perte de rentabilité en freelance. Découvrez comment il arrive, et les clauses pour vous en protéger.",
    profession: "Problème freelance",
    readingTime: 6,
  },
  {
    slug: "gerer-impayes-freelance",
    title: "Gérer les impayés en freelance : de la relance à l'injonction de payer",
    description: "Relance amiable, mise en demeure LRAR, injonction de payer, le guide complet pour récupérer vos factures impayées, étape par étape.",
    profession: "Problème freelance",
    readingTime: 7,
  },
  {
    slug: "fixer-ses-tarifs-freelance",
    title: "Comment fixer ses tarifs en freelance : TJM, méthodes et erreurs à éviter",
    description: "Les 3 méthodes pour calculer son TJM, les erreurs classiques (syndrome de l'imposteur, temps non facturables), et comment augmenter ses tarifs sans perdre ses clients.",
    profession: "Problème freelance",
    readingTime: 7,
  },
];

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Photographe freelance", href: "/freelance-photographe" },
  { label: "Rédacteur & copywriter", href: "/freelance-redacteur" },
  { label: "Formateur indépendant", href: "/freelance-formateur" },
  { label: "Artisan BTP", href: "/freelance-artisan" },
  { label: "Community manager", href: "/freelance-community-manager" },
  { label: "Coach freelance", href: "/freelance-coach" },
  { label: "Traducteur freelance", href: "/freelance-traducteur" },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                    <span className="text-xs text-gray-600">5 guides · urgent</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg leading-snug mb-2 group-open:text-amber-200 transition-colors">
                    Facturation électronique 2026 : tout ce que les freelances doivent savoir
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    PPF abandonné, PDP obligatoires, e-reporting B2C, checklist de conformité, le cluster complet sur la réforme en vigueur dès septembre 2026.
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
                    <span className="text-xl flex-shrink-0 w-8 text-center">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white text-sm font-medium group-hover/item:text-amber-200 transition-colors">{article.title}</p>
                      </div>
                      <p className="text-gray-600 text-xs">{article.description}</p>
                    </div>
                    <span className="text-xs text-gray-700 flex-shrink-0 whitespace-nowrap">{article.readingTime} min</span>
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
                    <span className="text-xs text-gray-600">10 guides</span>
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
                    <span className="text-xl flex-shrink-0 w-8 text-center">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium group-hover/item:text-indigo-200 transition-colors">{article.label}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{article.description}</p>
                    </div>
                    <span className="text-xs text-gray-700 flex-shrink-0">{article.readingTime} min</span>
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
                      article.profession === "Tous metiers"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    }`}>
                      {article.profession}
                    </span>
                    <span className="text-xs text-gray-600">{article.readingTime} min</span>
                  </div>
                  <h3 className="text-white font-semibold leading-snug mb-2 group-hover:text-indigo-200 transition-colors text-sm">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {article.description}
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

      {/* Footer links */}
      <footer className="border-t border-ds-border py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition-colors">Accueil</Link>
            <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
            <Link href="/combien-facturer" className="hover:text-gray-400 transition-colors">Tarifs freelance</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Connexion</Link>
            <Link href="/cgu" className="hover:text-gray-400 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-gray-400 transition-colors">Confidentialite</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
