import Link from "next/link";
import { FileText, type LucideIcon } from "lucide-react";
import { ACCENTS, type Categorie_ } from "@/lib/blog/categories";
import type { Article } from "@/lib/blog/registre";

/**
 * Un menu dépliant de catégorie, pour l'index du blog.
 *
 * Pourquoi ce composant existe. L'index portait deux menus écrits à la main —
 * un pour la réforme, un pour les métiers — chacun avec son titre, son résumé,
 * son compteur et ses couleurs codés en dur, plus des cartes à plat pour le
 * reste. Trois présentations pour une seule liste d'articles, et aucun endroit
 * où brancher une quatrième catégorie sans recopier trente lignes de JSX.
 *
 * Ici le comportement est un seul : un menu par catégorie, toujours le même.
 * Une catégorie ajoutée dans `lib/blog/categories.ts` apparaît sans qu'on
 * touche à l'index, et un article rattaché à une catégorie apparaît dans son
 * menu sans qu'on touche à rien.
 *
 * Le repli utilise `<details>`/`<summary>` plutôt qu'un état React : ça
 * fonctionne sans JavaScript, c'est accessible au clavier par défaut, et le
 * contenu replié reste dans le HTML — donc lisible par Google, ce qui n'est pas
 * le cas d'un accordéon qui monte son contenu à l'ouverture.
 */
export function MenuCategorie({
  categorie,
  articles,
  icones,
  ouvert,
}: {
  categorie: Categorie_;
  articles: Article[];
  /** Une icône par slug d'article. L'index les fournit, lui seul importe lucide. */
  icones: Record<string, LucideIcon>;
  ouvert?: boolean;
}) {
  // Une catégorie sans article ne s'affiche pas : un menu vide est un bug
  // visible. `check-blog` refuse par ailleurs une catégorie déclarée et vide,
  // donc ce garde-fou ne devrait jamais servir en production.
  if (articles.length === 0) return null;

  const a = ACCENTS[categorie.accent];
  const compte = `${articles.length} ${articles.length > 1 ? "guides" : "guide"}`;

  return (
    <details
      open={ouvert}
      className={`group bg-ds-surface border ${a.bordure} ${a.bordureActive} rounded-2xl overflow-hidden transition-all`}
    >
      <summary className="flex items-start justify-between gap-4 p-6 cursor-pointer list-none select-none">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${a.badge}`}>
              {categorie.badge}
            </span>
            <span className="text-xs text-gray-400">{compte}</span>
          </div>
          <h2 className={`text-white font-semibold text-lg leading-snug mb-2 ${a.texte} transition-colors`}>
            {categorie.titre}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">{categorie.resume}</p>
        </div>
        <span
          aria-hidden
          className="text-gray-600 flex-shrink-0 mt-1 text-xl transition-transform duration-200 group-open:rotate-90"
        >
          →
        </span>
      </summary>

      <div className="border-t border-ds-border divide-y divide-ds-border">
        {articles.map((art) => {
          const Icone = icones[art.slug] ?? FileText;
          return (
            <Link
              key={art.slug}
              href={`/blog/${art.slug}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-ds-elevated transition-colors group/item"
            >
              <span className="flex-shrink-0 w-8 flex justify-center text-indigo-400">
                <Icone size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-white text-sm font-medium ${a.survol} transition-colors`}>
                  {art.carte.titre}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">{art.carte.resume}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                {art.dureeLecture} min
              </span>
              <span
                aria-hidden
                className="text-gray-700 group-hover/item:text-gray-400 transition-colors flex-shrink-0 text-sm"
              >
                →
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
