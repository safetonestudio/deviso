import { PageSite, CADRE_LECTURE, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import { H1_ARTICLE, H2_ARTICLE, CORPS, LIEN, CARTE, CARTE_LIEN, ENCADRE } from "@/components/blog/styles";
import Link from "next/link";
import { Signature } from "@/components/blog/Signature";
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
 * l'audit du 11/09/2026 a trouvé, sans surprise, qu'elles avaient divergé, des
 * `dateModified` figés à la date de publication, et aucun `BreadcrumbList` nulle
 * part, parce qu'ajouter un quatrième bloc de balisage à la main dans dix
 * fichiers ne se fait jamais.
 *
 * Le gabarit ne reçoit plus qu'un `slug`. Il lit le reste dans le registre, et
 * il émet lui-même ses données structurées.
 *
 * La conséquence la plus utile est invisible : le `FAQPage` est construit à
 * partir de la **même** liste `faq` que celle affichée. Il ne peut plus annoncer
 * à Google une réponse absente de la page, c'est exactement le genre de
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
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLdArticle(slug, faq)} />


      {/* ── Article ── */}
      <main className="pt-12 sm:pt-16 pb-24">
        <article className={`${CADRE_LECTURE} ${CORPS}`}>

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
            <p className="text-sm font-medium text-indigo-300 mb-4">
              Guide pratique · {profession}
            </p>
            <h1 className={`${H1_ARTICLE} mb-5`}>
              {a.h1}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
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
              <Link href={landingHref} className={LIEN}>
                {landingLabel} →
              </Link>
            </div>
          </header>

          {/* Intro */}
          <p className={`text-[19px] text-gray-200 leading-relaxed mb-14 p-5 ${ENCADRE.info}`}>
            {intro}
          </p>

          {/* ── Section 1 : Mentions obligatoires ── */}
          <section className="mb-14">
            <h2 className={H2_ARTICLE}>{mandatoryTitle}</h2>
            <p className="text-gray-300 mb-6">{mandatoryIntro}</p>
            <ol className="space-y-5">
              {mandatoryItems.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-ink font-medium mb-1">{item.title}</p>
                    <p className="text-gray-300 text-[16px] leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Section 2 : Exemple ── */}
          <section className="mb-14">
            <h2 className={H2_ARTICLE}>
              Exemple concret de devis pour un {profession}
            </h2>
            <div className={`${CARTE} overflow-hidden`}>
              {/* Table header */}
              <div className="px-5 py-4 border-b border-ds-border bg-ds-elevated">
                <p className="text-sm text-gray-400 font-medium">Client</p>
                <p className="text-ink font-medium mt-0.5">{exampleClient}</p>
              </div>
              <div className="divide-y divide-ds-border">
                {exampleLines.map((line, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200">{line.desc}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{line.qty}</p>
                    </div>
                    <p className="text-ink font-medium shrink-0">{line.price}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-ds-elevated flex items-center justify-between">
                <p className="text-gray-300 font-medium">Total HT</p>
                <p className="text-indigo-400 font-semibold text-lg">{exampleTotal}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3 italic">{exampleNote}</p>
          </section>

          {/* ── Section 3 : Erreurs fréquentes ── */}
          <section className="mb-14">
            <h2 className={H2_ARTICLE}>
              Les erreurs fréquentes sur un devis de {profession}
            </h2>
            <div className="space-y-4">
              {mistakes.map((m, i) => (
                <div key={i} className={`flex gap-4 p-5 ${ENCADRE.alerte}`}>
                  <span aria-hidden className="text-amber-400 text-lg shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="text-ink font-medium mb-1">{m.title}</p>
                    <p className="text-gray-300 text-[16px] leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA Deviso ── */}
          <section className={`mb-14 ${CARTE} p-8 sm:p-10`}>
            <h2 className={H2_ARTICLE}>
              Créez votre devis de {profession} en 30 secondes
            </h2>
            <p className="text-gray-300 mb-6 max-w-lg">
              Décrivez votre mission en quelques phrases. L&apos;IA Deviso génère un devis complet, structuré et conforme, prêt à envoyer. Essai gratuit, sans carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
              <Link href={landingHref} className={BOUTON_DOUX}>Voir les fonctionnalités →</Link>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="mb-14">
            <h2 className={H2_ARTICLE}>Questions fréquentes</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i} className={`${CARTE} p-6`}>
                  <h3 className="text-ink font-semibold mb-3">{item.q}</h3>
                  <p className="text-gray-300 text-[16px] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Combien facturer : la page tarifs du même métier ── */}
          {tarifs && (
            <section className={`mb-14 p-6 ${ENCADRE.info}`}>
              <p className="text-sm text-sky-300 font-medium mb-2">
                Et côté prix ?
              </p>
              <h2 className="text-xl font-semibold text-ink mb-2">
                Combien facturer quand on est {profession} ?
              </h2>
              <p className="text-gray-300 text-[16px] leading-relaxed mb-4">
                Fourchettes de TJM par niveau d&apos;expérience, spécialités qui se paient plus cher,
                et un simulateur pour savoir ce qu&apos;il vous reste après cotisations.
              </p>
              <Link
                href={tarifs.href}
                className={`inline-flex items-center gap-2 font-medium ${LIEN}`}
              >
                Voir les tarifs d&apos;un {tarifs.label} →
              </Link>
            </section>
          )}

          {/* ── À lire ensuite ── */}
          {lectures.length > 0 && (
            <section className="mb-14">
              <h2 className={H2_ARTICLE}>À lire ensuite</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {lectures.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`group ${CARTE_LIEN} p-5`}
                  >
                    <p className="text-ink font-medium leading-snug mb-2">
                      {l.titre}
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">{l.resume}</p>
                    <p className="text-gray-500 text-sm">{l.dureeLecture} min de lecture</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Signature />

          {/* ── Autres métiers ── */}
          <section className="pt-10">
            <p className="text-sm text-gray-400 mb-4 font-medium">Deviso par métier</p>
            <div className="flex flex-wrap gap-2">
              {METIERS_LANDING.filter((x) => x.landing !== landingHref).map((x) => (
                <Link
                  key={x.landing}
                  href={x.landing}
                  className="text-sm px-4 py-2 rounded-full bg-ds-surface text-gray-300 hover:text-ink hover:bg-ds-elevated transition-colors"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

      
    </PageSite>
  );
}
