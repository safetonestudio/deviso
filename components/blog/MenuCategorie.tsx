import Link from "next/link";
import { FileText, type LucideIcon } from "lucide-react";
import type { Categorie_ } from "@/lib/blog/categories";
import type { Article } from "@/lib/blog/registre";
import { CARTE_LIEN } from "@/components/blog/styles";
import { H2 } from "@/components/site/PageSite";

/**
 * Une catégorie de l'index du blog : un titre, son résumé, puis les cartes de
 * ses articles. Toujours dans le HTML (lisible par Google, sans JavaScript).
 *
 * Une catégorie ajoutée dans `lib/blog/categories.ts` apparaît sans qu'on
 * touche à l'index, et un article rattaché à une catégorie apparaît dans sa
 * section sans qu'on touche à rien. Une catégorie sans article ne s'affiche pas.
 */
export function MenuCategorie({
  categorie,
  articles,
  icones,
}: {
  categorie: Categorie_;
  articles: Article[];
  /** Une icône par slug d'article. L'index les fournit, lui seul importe lucide. */
  icones: Record<string, LucideIcon>;
  /** Conservé pour compatibilité : les catégories sont toutes déployées. */
  ouvert?: boolean;
}) {
  if (articles.length === 0) return null;
  const compte = `${articles.length} ${articles.length > 1 ? "guides" : "guide"}`;

  return (
    <section aria-labelledby={`cat-${categorie.id}`}>
      <p className="text-[15px] font-medium text-indigo-300 mb-2">
        {categorie.badge} · {compte}
      </p>
      <h2 id={`cat-${categorie.id}`} className={`${H2} mb-3`}>{categorie.titre}</h2>
      <p className="text-[17px] leading-relaxed text-gray-300 max-w-2xl mb-8">{categorie.resume}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((art) => {
          const Icone = icones[art.slug] ?? FileText;
          return (
            <Link
              key={art.slug}
              href={`/blog/${art.slug}`}
              className={`${CARTE_LIEN} flex flex-col gap-3 p-6`}
            >
              <Icone size={20} className="text-indigo-400" aria-hidden />
              <p className="text-ink text-[17px] font-semibold leading-snug">{art.carte.titre}</p>
              <p className="text-[15px] leading-relaxed text-gray-400">{art.carte.resume}</p>
              <p className="mt-auto pt-1 text-sm text-gray-500">{art.dureeLecture} min de lecture</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
