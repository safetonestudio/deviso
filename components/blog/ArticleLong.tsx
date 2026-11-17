import { PageSite, CADRE_LECTURE, BOUTON_PLEIN } from "@/components/site/PageSite";
import { H1_ARTICLE, H2_ARTICLE, CORPS, LIEN, CARTE, CARTE_LIEN, ENCADRE } from "@/components/blog/styles";
import Link from "next/link";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { categorie } from "@/lib/blog/categories";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";

/**
 * Le gabarit des articles de fond.
 *
 * Pourquoi ce fichier existe. Les dix premiers articles « devis par métier »
 * passaient déjà par un gabarit (`BlogPost`), et ça se voyait : ils coûtaient
 * 90 lignes chacun. Les neuf articles de fond, eux, étaient écrits à la main -
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
 * et les sources sont forcément en bas de page, trois choses qu'on oublie quand
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
  info: { cadre: ENCADRE.info, titre: "text-ink", Icone: Info, couleur: "text-sky-400" },
  alerte: { cadre: ENCADRE.alerte, titre: "text-ink", Icone: TriangleAlert, couleur: "text-amber-400" },
  succes: { cadre: ENCADRE.conseil, titre: "text-ink", Icone: CircleCheck, couleur: "text-indigo-400" },
} as const;

const TONS_COLONNE = {
  positif: ENCADRE.conseil,
  negatif: ENCADRE.alerte,
  neutre: CARTE,
} as const;

/**
 * Tout texte écrit par l'auteur passe par ici.
 *
 * Pourquoi. Les paragraphes étaient rendus en HTML (pour autoriser `<strong>`,
 * `<em>`, `&rsquo;`) mais les *titres* étaient interpolés en texte brut : un
 * `&rsquo;` écrit dans un titre de section s'affichait littéralement sur la
 * page. Deux chemins de rendu pour un même type de contenu, et rien pour le
 * signaler, l'erreur est allée en production.
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
          {section.titre && <Riche as="h2" className={H2_ARTICLE} t={section.titre} />}
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
          <div className={`flex gap-3 p-5 ${t.cadre}`}>
            <t.Icone size={18} className={`shrink-0 mt-0.5 ${t.couleur}`} />
            <div>
              <Riche as="p" className={`font-semibold mb-1 ${t.titre}`} t={section.titre} />
              <p className="text-gray-300" dangerouslySetInnerHTML={{ __html: section.texte }} />
            </div>
          </div>
        </section>
      );
    }

    case "liste":
      return (
        <section>
          {section.titre && <Riche as="h2" className={H2_ARTICLE} t={section.titre} />}
          {section.intro && (
            <p className="mb-6" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          {section.numerotee ? (
            <ol className="space-y-4">
              {section.items.map((item, i) => (
                <li key={item.titre} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <Riche as="p" className="text-ink font-medium mb-1" t={item.titre} />
                    <p className="text-gray-300" dangerouslySetInnerHTML={{ __html: item.texte }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.titre} className={`${CARTE} p-5`}>
                  <Riche as="p" className="text-ink font-medium mb-1" t={item.titre} />
                  <p className="text-gray-300" dangerouslySetInnerHTML={{ __html: item.texte }} />
                </div>
              ))}
            </div>
          )}
        </section>
      );

    case "tableau":
      return (
        <section>
          {section.titre && <Riche as="h2" className={H2_ARTICLE} t={section.titre} />}
          {section.intro && (
            <p className="mb-6" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          {/* Le tableau défile dans son propre conteneur : la page ne doit
              jamais défiler horizontalement sur mobile. */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-lg">
              <thead>
                <tr className="border-b border-ds-border">
                  {section.colonnes.map((c) => (
                    <th
                      key={c}
                      className="py-3 pr-4 last:pr-0 text-sm font-semibold text-gray-400 align-bottom"
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
                        className={`py-3 pr-4 last:pr-0 align-top ${j === 0 ? "text-ink font-medium" : "text-gray-400"}`}
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
          {section.titre && <Riche as="h2" className={H2_ARTICLE} t={section.titre} />}
          {section.intro && (
            <p className="mb-6" dangerouslySetInnerHTML={{ __html: section.intro }} />
          )}
          <div className={`grid gap-4 ${section.colonnes.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {section.colonnes.map((c) => (
              <div key={c.titre} className={`p-5 ${TONS_COLONNE[c.ton]}`}>
                <Riche as="p" className="text-sm font-semibold mb-2 text-gray-400" t={c.titre} />
                {c.sousTitre && <Riche as="p" className="text-ink font-medium mb-2" t={c.sousTitre} />}
                <p className="text-gray-300" dangerouslySetInnerHTML={{ __html: c.texte }} />
              </div>
            ))}
          </div>
        </section>
      );

    case "citation":
      return (
        <section>
          <blockquote className="border-l-[3px] border-indigo-400 pl-5 py-1 text-gray-200 italic">
            <span dangerouslySetInnerHTML={{ __html: section.texte }} />
            {section.source && (
              <footer className="text-xs text-gray-500 not-italic mt-2">, <Riche t={section.source} /></footer>
            )}
          </blockquote>
        </section>
      );
  }
}

export function ArticleLong({ slug, chapeau, enBref, sections, faq, sources, cta }: ArticleLongProps) {
  const a = article(slug);
  const cat = categorie(a.categorie);
    const lectures = suggestionsDeLecture(slug);

  const formaterDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLdArticle(slug, faq)} />


      <article className="pt-12 sm:pt-16 pb-24">
        <div className={CADRE_LECTURE}>

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span aria-hidden>/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
            <span aria-hidden>/</span>
            <span className="text-gray-400 truncate max-w-[16rem] sm:max-w-none">{a.carte.titre}</span>
          </nav>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm font-medium text-indigo-300">
                {cat.badge}
              </span>
              <span className="text-sm text-gray-400">
                {a.misAJourLe !== a.publieLe ? (
                  <>Mis à jour le {formaterDate(a.misAJourLe)}</>
                ) : (
                  formaterDate(a.publieLe)
                )}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className={`${H1_ARTICLE} mb-5`}>{a.h1}</h1>
            <p className="text-[19px] leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: chapeau }} />
          </header>

          <div className={`space-y-14 ${CORPS}`}>

            {enBref && enBref.length > 0 && (
              <section className={`${ENCADRE.info} p-6`}>
                <p className="text-sm font-semibold text-sky-300 mb-3">
                  La réponse en bref
                </p>
                <ul className="space-y-2">
                  {enBref.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="text-sky-400 shrink-0">→</span>
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
              <section className={`${CARTE} p-8 sm:p-10`}>
                <Riche as="h2" className={H2_ARTICLE} t={cta.titre} />
                <Riche as="p" className="text-gray-300 mb-6 max-w-lg" t={cta.texte} />
                <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
              </section>
            )}

            <section>
              <h2 className={H2_ARTICLE}>Questions fréquentes</h2>
              <div className="space-y-4">
                {faq.map(({ q, a: reponse }) => (
                  <div key={q} className={`${CARTE} p-6`}>
                    <h3 className="text-ink font-semibold mb-3">{q}</h3>
                    <p className="text-gray-300 text-[16px] leading-relaxed">{reponse}</p>
                  </div>
                ))}
              </div>
            </section>

            {sources && sources.length > 0 && (
              <section>
                <h2 className={H2_ARTICLE}>Sources</h2>
                <ul className="space-y-2 text-gray-400">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={LIEN}
                      >
                        {s.libelle}
                      </a>
                      {s.precision && <span>, {s.precision}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {lectures.length > 0 && (
              <section>
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
          </div>

          <Signature />
        </div>
      </article>

          </PageSite>
  );
}

/** Les métadonnées d'un article de fond se dérivent du registre, comme le reste. */
export { metadonneesArticle };
