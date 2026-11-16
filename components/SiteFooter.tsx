import Link from "next/link";
import { METIERS_LANDING } from "@/lib/blog/metiers";

/**
 * Le pied de page du site public, en un seul exemplaire.
 *
 * Pourquoi ce fichier existe. Il y avait trois pieds de page écrits à la main -
 * dans `app/page.tsx`, `components/blog/BlogPost.tsx` et
 * `components/landing/FreelanceLanding.tsx`, et ils ne contenaient pas les
 * mêmes liens. C'est exactement comme ça que le hub `/combien-facturer`, onze
 * pages déclarées en priorité 0.9 dans le sitemap, a fini par ne recevoir qu'un
 * seul lien interne venant de l'extérieur de son propre cluster : il avait été
 * ajouté dans un pied de page sur trois.
 *
 * Un composant partagé rend ce genre de dérive impossible : un lien ajouté ici
 * apparaît partout, et un lien oublié est oublié nulle part.
 *
 * La colonne « Ressources » est celle qui compte pour le référencement. Elle
 * relie les trois familles de pages entre elles, produit, blog, tarifs, et
 * c'est ce maillage, pas le chiffre écrit dans le sitemap, qui dit à Google
 * quelles pages comptent.
 */
export function SiteFooter() {
  return (
    <footer className="py-16 text-gray-400">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                <span className="text-on-accent font-semibold text-xs">D</span>
              </div>
              <span className="font-semibold text-ink">Deviso</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">
              Devis, factures conformes 2026 et relances, pour les indépendants et les petites entreprises en France.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="text-ink font-semibold mb-3">Produit</div>
              <ul className="sm:space-y-1.5">
                <li><Link href="/#fonctionnalites" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/#tarifs" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Tarifs</Link></li>
                <li><Link href="/experts-comptables" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Experts-comptables</Link></li>
                <li><Link href="/login" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Connexion</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-ink font-semibold mb-3">Ressources</div>
              <ul className="sm:space-y-1.5">
                <li><Link href="/conformite" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Conformité 2026</Link></li>
                <li><Link href="/a-propos" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">À propos</Link></li>
                <li><Link href="/blog" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Guides et blog</Link></li>
                <li><Link href="/combien-facturer" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Combien facturer</Link></li>
                <li>
                  <Link href="/blog/facturation-electronique-2026" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">
                    Guide de la facture électronique
                  </Link>
                </li>
                <li>
                  <Link href="/blog/clauses-devis-freelance" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">
                    Clauses d&apos;un devis
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-ink font-semibold mb-3">Exemples de métiers</div>
              <ul className="sm:space-y-1.5">
                {METIERS_LANDING.map((m) => (
                  <li key={m.landing}>
                    <Link href={m.landing} className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">{m.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-ink font-semibold mb-3">Légal</div>
              <ul className="sm:space-y-1.5">
                <li><Link href="/cgu" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">CGU</Link></li>
                <li><Link href="/confidentialite" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Confidentialité</Link></li>
                <li><Link href="/mentions-legales" className="inline-block py-2.5 sm:py-0.5 hover:text-gray-300 transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-10 text-sm">
          © {new Date().getFullYear()} Deviso, conçu en France.
        </div>
      </div>
    </footer>
  );
}
