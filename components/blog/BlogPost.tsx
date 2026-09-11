import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { article } from "@/lib/blog/registre";
import { jsonLdArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { metierDeLanding, METIERS_LANDING } from "@/lib/blog/metiers";

/**
 * Le gabarit d'un article « devis par métier ».
 *
 * Ce qui a changé, et pourquoi. Le composant recevait son titre, ses dates, son
 * métier et son libellé en propriétés, et chaque page d'article les redonnait
 * une deuxième fois dans son `export const metadata` et une troisième dans son
 * objet `jsonLd`. Trois copies de la même information par article, dix articles :
 * l'audit du 11/09/2026 a trouvé, sans surprise, qu'elles avaient divergé — des
 * `dateModified` figés à la date de publication, et aucun `BreadcrumbList` nulle
 * part, parce qu'ajouter un quatrième bloc de balisage à la main dans dix
 * fichiers ne se fait jamais.
 *
 * Le gabarit ne reçoit plus qu'un `slug`. Il lit le reste dans le registre, et
 * il émet lui-même ses données structurées.
 *
 * La conséquence la plus utile est invisible : le `FAQPage` est construit à
 * partir de la **même** liste `faq` que celle affichée. Il ne peut plus annoncer
 * à Google une réponse absente de la page — c'est exactement le genre de
 * décalage qui fait perdre l'affichage enrichi, et il était structurellement
 * possible avant.
 */

export interface BlogMandatoryItem {
  title: string;
  desc: string;
}

export interface BlogExampleLine {
  desc: string;
  qty: string;
  price: string;
}

export interface BlogMistake {
  title: string;
  desc: string;
}

export interface BlogFAQItem {
  q: string;
  a: string;
}

export interface BlogPostProps {
  /** Slug du registre. Tout le reste en découle. */
  slug: string;

  // Intro
  intro: string;

  // Mentions obligatoires
  mandatoryTitle: string;
  mandatoryIntro: string;
  mandatoryItems: BlogMandatoryItem[];

  // Exemple de devis
  exampleClient: string;
  exampleLines: BlogExampleLine[];
  exampleTotal: string;
  exampleNote: string;

  // Erreurs fréquentes
  mistakes: BlogMistake[];

  /** Affichée sur la page ET balisée en `FAQPage`. Une seule source. */
  faq: BlogFAQItem[];
}

export function BlogPost({
  slug,
  intro,
  mandatoryTitle,
  mandatoryIntro,
  mandatoryItems,
  exampleClient,
  exampleLines,
  exampleTotal,
  exampleNote,
  mistakes,
  faq,
}: BlogPostProps) {
  const a = article(slug);
  const m = a.metier;
  if (!m) {
    throw new Error(
      `[blog] « ${slug} » utilise <BlogPost> mais n'a pas de bloc \`metier\` dans le registre.`
    );
  }
  const { landing: landingHref, landingLabel, profession, professionPluriel } = m;
  const tarifs = metierDeLanding(landingHref)?.tarifs;
  const lectures = suggestionsDeLecture(slug);

  const formaterDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLdArticle(slug, faq)} />
      {/* ── Bandeau réforme 2026 ── */}
      <div
        className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm"
        style={{ zIndex: 60 }}
      >
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X.</span>
        <Link href={landingHref} className="ml-2 text-indigo-300 hover:text-white font-semibold transition-colors underline underline-offset-2">
          En savoir plus →
        </Link>
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
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            <Link href={landingHref} className="text-gray-400 hover:text-white transition-colors capitalize">
              Pour les {professionPluriel}
            </Link>
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

      {/* ── Article ── */}
      <main className="pt-36 pb-24 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-gray-400 truncate max-w-[200px] sm:max-w-none">{a.carte.titre}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4">
              Guide pratique · {profession}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              {a.h1}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {a.misAJourLe !== a.publieLe ? (
                <time dateTime={a.misAJourLe} className="text-gray-400">
                  Mis à jour le {formaterDate(a.misAJourLe)}
                </time>
              ) : (
                <time dateTime={a.publieLe}>{formaterDate(a.publieLe)}</time>
              )}
              <span aria-hidden>·</span>
              <span>{a.dureeLecture} min de lecture</span>
              <span aria-hidden>·</span>
              <Link href={landingHref} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {landingLabel} →
              </Link>
            </div>
          </header>

          {/* Intro */}
          <p className="text-lg text-gray-300 leading-relaxed mb-12 border-l-2 border-indigo-500/40 pl-5">
            {intro}
          </p>

          {/* ── Section 1 : Mentions obligatoires ── */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-3">{mandatoryTitle}</h2>
            <p className="text-gray-400 mb-6">{mandatoryIntro}</p>
            <ol className="space-y-5">
              {mandatoryItems.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-white font-medium mb-1">{item.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Section 2 : Exemple ── */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Exemple concret de devis pour un {profession}
            </h2>
            <div className="bg-ds-surface rounded-xl border border-ds-border overflow-hidden">
              {/* Table header */}
              <div className="px-5 py-4 border-b border-ds-border bg-ds-elevated/50">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Client</p>
                <p className="text-white font-medium mt-0.5">{exampleClient}</p>
              </div>
              <div className="divide-y divide-ds-border">
                {exampleLines.map((line, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-sm">{line.desc}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{line.qty}</p>
                    </div>
                    <p className="text-white text-sm font-medium flex-shrink-0">{line.price}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-ds-elevated/50 flex items-center justify-between border-t border-ds-border">
                <p className="text-gray-400 text-sm font-medium">Total HT</p>
                <p className="text-indigo-400 font-semibold text-lg">{exampleTotal}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">{exampleNote}</p>
          </section>

          {/* ── Section 3 : Erreurs fréquentes ── */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Les erreurs fréquentes sur un devis de {profession}
            </h2>
            <div className="space-y-4">
              {mistakes.map((m, i) => (
                <div key={i} className="flex gap-4 bg-red-950/20 border border-red-500/15 rounded-xl p-5">
                  <span className="text-red-400 text-lg flex-shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="text-white font-medium mb-1">{m.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA Deviso ── */}
          <section className="mb-12 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Créez votre devis de {profession} en 30 secondes
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Décrivez votre mission en quelques phrases. L&apos;IA Deviso génère un devis complet, structuré et conforme, prêt à envoyer. Essai gratuit, sans carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <WaitlistButton
                plan="free"
                label="Essayer gratuitement"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50"
              />
              <Link
                href={landingHref}
                className="w-full sm:w-auto text-indigo-400 hover:text-indigo-300 font-medium px-6 py-3 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-center"
              >
                Voir les fonctionnalités →
              </Link>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Questions fréquentes</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i} className="bg-ds-surface rounded-xl border border-ds-border p-6">
                  <h3 className="text-white font-medium mb-3">{item.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Combien facturer : la page tarifs du même métier ── */}
          {tarifs && (
            <section className="mb-12 bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                Et côté prix ?
              </p>
              <h2 className="text-xl font-semibold text-white mb-2">
                Combien facturer quand on est {profession} ?
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Fourchettes de TJM par niveau d&apos;expérience, spécialités qui se paient plus cher,
                et un simulateur pour savoir ce qu&apos;il vous reste après cotisations.
              </p>
              <Link
                href={tarifs.href}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
              >
                Voir les tarifs d&apos;un {tarifs.label} →
              </Link>
            </section>
          )}

          {/* ── À lire ensuite ── */}
          {lectures.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">À lire ensuite</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {lectures.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group bg-ds-surface border border-ds-border rounded-xl p-5 hover:border-indigo-500/40 transition-all"
                  >
                    <p className="text-white font-medium text-sm leading-snug mb-2 group-hover:text-indigo-200 transition-colors">
                      {l.titre}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{l.resume}</p>
                    <p className="text-gray-600 text-xs">{l.dureeLecture} min de lecture</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Autres métiers ── */}
          <section className="border-t border-ds-border pt-10">
            <p className="text-sm text-gray-500 mb-4 font-medium uppercase tracking-wider">Deviso par métier</p>
            <div className="flex flex-wrap gap-2">
              {METIERS_LANDING.filter((x) => x.landing !== landingHref).map((x) => (
                <Link
                  key={x.landing}
                  href={x.landing}
                  className="text-sm px-4 py-2 rounded-full border border-ds-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />

    </div>
  );
}
