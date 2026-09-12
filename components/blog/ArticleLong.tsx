import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { ACCENTS, categorie } from "@/lib/blog/categories";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";

/**
 * Le gabarit des articles de fond.
 *
 * Pourquoi ce fichier existe. Les dix premiers articles « devis par métier »
 * passaient déjà par un gabarit (`BlogPost`), et ça se voyait : ils coûtaient
 * 90 lignes chacun. Les neuf articles de fond, eux, étaient écrits à la main —
 * entre 250 et 490 lignes de JSX par article, avec leur propre navbar, leur
 * propre fil d'Ariane, leur propre pied de page, leur propre mise en forme de
 * FAQ. C'est ce qui rendait la publication chère, et c'est ce qui a laissé
 * dériver quatre erreurs factuelles : corriger une information demandait
 * d'ouvrir quatre fichiers différents.
 *
 * Ici, un article de fond est **une liste de sections typées**. L'auteur décrit
 * son contenu ; la présentation, les données structurées, le fil d'Ariane, la
 * signature, les sources et les suggestions de lecture viennent du gabarit et du
 * registre.
 *
 * Ce que ça garantit, au-delà du confort : la FAQ affichée et le `FAQPage`
 * balisé sortent forcément de la même liste, la signature est forcément visible,
 * et les sources sont forcément en bas de page — trois choses qu'on oublie quand
 * on écrit chaque article à la main.
 */

export type Section =
  | { type: "texte"; titre?: string; paragraphes: string[] }
  | { type: "encadre"; ton: "info" | "alerte" | "succes"; titre: string; texte: string }
  | {
      type: "liste";
      titre?: string;
      intro?: string;
      numerotee?: boolean;
      items: { titre: string; texte: string }[];
    }
  | {
      type: "tableau";
      titre?: string;
      intro?: string;
      colonnes: string[];
      lignes: string[][];
      note?: string;
    }
  | {
      type: "comparaison";
      titre?: string;
      intro?: string;
      colonnes: { titre: string; sousTitre?: string; ton: "positif" | "negatif" | "neutre"; texte: string }[];
    }
  | { type: "citation"; texte: string; source?: string };

export type Source = { libelle: string; url: string; precision?: string };

export interface ArticleLongProps {
  /** Slug du registre. Le titre, les dates, la catégorie et le balisage en découlent. */
  slug: string;
  /** Le chapeau, sous le H1. Deux ou trois phrases, pas plus. */
  chapeau: string;
  /** L'encadré de tête : la réponse tout de suite, pour qui est pressé. */
  enBref?: string[];
  sections: Section[];
  /** Affichée sur la page ET balisée en `FAQPage`. Une seule source. */
  faq: { q: string; a: string }[];
  sources?: Source[];
  /** L'appel à l'action de fin, s'il a du sens sur ce sujet. */
  cta?: { titre: string; texte: string };
}

const TONS = {
  info: { cadre: "bg-ds-surface border-ds-border", titre: "text-white", Icone: Info, couleur: "text-indigo-400" },
  alerte: { cadre: "bg-amber-500/[0.06] border-amber-500/25", titre: "text-white", Icone: TriangleAlert, couleur: "text-amber-400" },
  succes: { cadre: "bg-emerald-500/[0.05] border-emerald-500/20", titre: "text-white", Icone: CircleCheck, couleur: "text-emerald-400" },
} as const;

const TONS_COLONNE = {
  positif: "bg-emerald-500/[0.05] border-emerald-500/20",
  negatif: "bg-rose-950/20 border-rose-500/20",
  neutre: "bg-ds-surface border-ds-border",
} as const;

/**
 * Tout texte écrit par l'auteur passe par ici.
 *
 * Pourquoi. Les paragraphes étaient rendus en HTML (pour autoriser `<strong>`,
 * `<em>`, `&rsquo;`) mais les *titres* étaient interpolés en texte brut : un
 * `&rsquo;` écrit dans un titre de section s'affichait littéralement sur la
 * page. Deux chemins de rendu pour un même type de contenu, et rien pour le
 * signaler — l'erreur est allée en production.
 *
 * Le contenu vient des fichiers d'article et du registre, jamais d'une saisie
 * utilisateur : `dangerouslySetInnerHTML` est ici le comportement voulu, pas un
 * raccourci.
 */
function Riche({
  t,
  as: Tag = "span",
  className,
}: {
  t: string;
  as?: "h2" | "h3" | "p" | "span";
  className?: string;
}) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: t }} />;
}

function Bloc({ section }: { section: Section }) {
  switch (section.type) {
    case "texte":
      return (
        <section>
          {section.titre && <Riche as="h2" className="text-xl font-semibold text-white mb-4" t={section.titre} />}
          {section.paragraphes.map((p, i) => (
            <p
              key={i}
              className={i < section.paragraphes.length - 1 ? "mb-4" : undefined}
              // Le contenu vient du registre et des fichiers d'article, jamais
              // d'une saisie : on autorise donc <strong>, <em> et <code> pour
              // que l'auteur puisse insister sans écrire du JSX.
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </section>
      );

    case "encadre": {
      const t = TONS[section.ton];
      return (
        <section>
          <div className={`flex gap-3 border rounded-xl p-5 ${t.cadre}`}>
            <t.Icone size={18} className={`shrink-0 mt-0.5 ${t.couleur}`} />
            <div>
              <Riche as="p" className={`font-semibold mb-1 ${t.titre}`} t={section.titre} />
              <p className="text-gray-400" dangerouslySetInnerHTML={{ __html: section.texte }} />
            </div>
          </div>
        </section>
      );
    }

    case "liste":
      return (
        <section>
          {section.titre && <Riche as="h2" className="text-xl font-semibold text-white mb-4" t={section.titre} />}
          {section.intro && (
            <p className="mb-5" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          {section.numerotee ? (
            <ol className="space-y-4">
              {section.items.map((item, i) => (
                <li key={item.titre} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <Riche as="p" className="text-white font-medium mb-1" t={item.titre} />
                    <p className="text-gray-400" dangerouslySetInnerHTML={{ __html: item.texte }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.titre} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <Riche as="p" className="text-white font-medium mb-1" t={item.titre} />
                  <p className="text-gray-400" dangerouslySetInnerHTML={{ __html: item.texte }} />
                </div>
              ))}
            </div>
          )}
        </section>
      );

    case "tableau":
      return (
        <section>
          {section.titre && <Riche as="h2" className="text-xl font-semibold text-white mb-4" t={section.titre} />}
          {section.intro && (
            <p className="mb-5" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          {/* Le tableau défile dans son propre conteneur : la page ne doit
              jamais défiler horizontalement sur mobile. */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[32rem]">
              <thead>
                <tr className="border-b border-ds-border">
                  {section.colonnes.map((c) => (
                    <th
                      key={c}
                      className="py-3 pr-4 last:pr-0 text-xs font-semibold text-gray-400 uppercase tracking-wider align-bottom"
                      dangerouslySetInnerHTML={{ __html: c }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.lignes.map((ligne, i) => (
                  <tr key={i} className="border-b border-ds-border last:border-0">
                    {ligne.map((cellule, j) => (
                      <td
                        key={j}
                        className={`py-3 pr-4 last:pr-0 align-top ${j === 0 ? "text-white font-medium" : "text-gray-400"}`}
                        dangerouslySetInnerHTML={{ __html: cellule }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.note && (
            <p className="text-xs text-gray-500 mt-3" dangerouslySetInnerHTML={{ __html: section.note }} />
          )}
        </section>
      );

    case "comparaison":
      return (
        <section>
          {section.titre && <Riche as="h2" className="text-xl font-semibold text-white mb-4" t={section.titre} />}
          {section.intro && (
            <p className="mb-5" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          <div className={`grid gap-4 ${section.colonnes.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {section.colonnes.map((c) => (
              <div key={c.titre} className={`border rounded-xl p-5 ${TONS_COLONNE[c.ton]}`}>
                <Riche as="p" className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400" t={c.titre} />
                {c.sousTitre && <Riche as="p" className="text-white font-medium mb-2" t={c.sousTitre} />}
                <p className="text-gray-400" dangerouslySetInnerHTML={{ __html: c.texte }} />
              </div>
            ))}
          </div>
        </section>
      );

    case "citation":
      return (
        <section>
          <blockquote className="border-l-2 border-indigo-500/50 pl-5 py-1 text-gray-300 italic">
            <span dangerouslySetInnerHTML={{ __html: section.texte }} />
            {section.source && (
              <footer className="text-xs text-gray-500 not-italic mt-2">— <Riche t={section.source} /></footer>
            )}
          </blockquote>
        </section>
      );
  }
}

export function ArticleLong({ slug, chapeau, enBref, sections, faq, sources, cta }: ArticleLongProps) {
  const a = article(slug);
  const cat = categorie(a.categorie);
  const accent = ACCENTS[cat.accent];
  const lectures = suggestionsDeLecture(slug);

  const formaterDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLdArticle(slug, faq)} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
            <Link href="/conformite" className="text-gray-400 hover:text-white transition-colors">Conformité</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton
              plan="free"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <article className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span aria-hidden>/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
            <span aria-hidden>/</span>
            <span className="text-gray-400 truncate max-w-[16rem] sm:max-w-none">{a.carte.titre}</span>
          </nav>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${accent.badge}`}>
                {cat.badge}
              </span>
              <span className="text-xs text-gray-400">
                {a.misAJourLe !== a.publieLe ? (
                  <>Mis à jour le {formaterDate(a.misAJourLe)}</>
                ) : (
                  formaterDate(a.publieLe)
                )}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">{a.h1}</h1>
            <p className="text-lg text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: chapeau }} />
          </header>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {enBref && enBref.length > 0 && (
              <section className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                  L&apos;essentiel
                </p>
                <ul className="space-y-2">
                  {enBref.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="text-indigo-400 shrink-0">→</span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {sections.map((s, i) => (
              <Bloc key={i} section={s} />
            ))}

            {cta && (
              <section className="bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
                <Riche as="h2" className="text-xl font-semibold text-white mb-3" t={cta.titre} />
                <Riche as="p" className="text-gray-400 mb-6 max-w-lg mx-auto" t={cta.texte} />
                <WaitlistButton
                  plan="free"
                  label="Essayer gratuitement"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50"
                />
              </section>
            )}

            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Questions fréquentes</h2>
              <div className="space-y-4">
                {faq.map(({ q, a: reponse }) => (
                  <div key={q} className="bg-ds-surface rounded-xl border border-ds-border p-6">
                    <h3 className="text-white font-medium mb-3">{q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{reponse}</p>
                  </div>
                ))}
              </div>
            </section>

            {sources && sources.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Sources</h2>
                <ul className="space-y-2 text-gray-400">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {s.libelle}
                      </a>
                      {s.precision && <span> — {s.precision}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {lectures.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-6">À lire ensuite</h2>
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
          </div>

          <Signature />
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}

/** Les métadonnées d'un article de fond se dérivent du registre, comme le reste. */
export { metadonneesArticle };
