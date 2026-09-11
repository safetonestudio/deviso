import Link from "next/link";
import { Heart } from "lucide-react";
import { METIERS_LANDING } from "@/lib/blog/metiers";

/**
 * Le pied de page du site public, en un seul exemplaire.
 *
 * Pourquoi ce fichier existe. Il y avait trois pieds de page écrits à la main —
 * dans `app/page.tsx`, `components/blog/BlogPost.tsx` et
 * `components/landing/FreelanceLanding.tsx` — et ils ne contenaient pas les
 * mêmes liens. C'est exactement comme ça que le hub `/combien-facturer`, onze
 * pages déclarées en priorité 0.9 dans le sitemap, a fini par ne recevoir qu'un
 * seul lien interne venant de l'extérieur de son propre cluster : il avait été
 * ajouté dans un pied de page sur trois.
 *
 * Un composant partagé rend ce genre de dérive impossible : un lien ajouté ici
 * apparaît partout, et un lien oublié est oublié nulle part.
 *
 * La colonne « Ressources » est celle qui compte pour le référencement. Elle
 * relie les trois familles de pages entre elles — produit, blog, tarifs — et
 * c'est ce maillage, pas le chiffre écrit dans le sitemap, qui dit à Google
 * quelles pages comptent.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 py-12 px-4 sm:px-6 text-gray-400">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">D</span>
              </div>
              <span className="font-semibold text-white">Deviso</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">
              Du devis à la facture Factur-X, pour les freelances et petites équipes en France. 🇫🇷
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="text-white font-semibold mb-3">Produit</div>
              <ul className="space-y-2">
                <li><Link href="/#fonctionnalites" className="hover:text-gray-300 transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/#tarifs" className="hover:text-gray-300 transition-colors">Tarifs</Link></li>
                <li><Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Ressources</div>
              <ul className="space-y-2">
                <li><Link href="/blog" className="hover:text-gray-300 transition-colors">Guides et blog</Link></li>
                <li><Link href="/combien-facturer" className="hover:text-gray-300 transition-colors">Combien facturer</Link></li>
                <li>
                  <Link href="/blog/facturation-electronique-2026" className="hover:text-gray-300 transition-colors">
                    Réforme 2026
                  </Link>
                </li>
                <li>
                  <Link href="/blog/clauses-devis-freelance" className="hover:text-gray-300 transition-colors">
                    Clauses d&apos;un devis
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Métiers</div>
              <ul className="space-y-2">
                {METIERS_LANDING.map((m) => (
                  <li key={m.landing}>
                    <Link href={m.landing} className="hover:text-gray-300 transition-colors">{m.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Légal</div>
              <ul className="space-y-2">
                <li><Link href="/cgu" className="hover:text-gray-300 transition-colors">CGU</Link></li>
                <li><Link href="/confidentialite" className="hover:text-gray-300 transition-colors">Confidentialité</Link></li>
                <li><Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 text-xs text-center">
          © {new Date().getFullYear()} Deviso. Fait avec{" "}
          <Heart size={12} className="inline-block align-[-1px] fill-current text-red-500" aria-label="amour" /> en France.
        </div>
      </div>
    </footer>
  );
}
