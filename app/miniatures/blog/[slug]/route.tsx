import { ARTICLES, article } from "@/lib/blog/registre";
import { categorie } from "@/lib/blog/categories";
import { miniatureArticle } from "@/lib/miniature";

/** Miniature de partage d'un article : son titre et sa rubrique. Générée au build. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = article(slug);
  return miniatureArticle(a.og?.titre ?? a.h1, categorie(a.categorie).badge);
}
