import Link from "next/link";
import { AUTEUR } from "@/lib/blog/auteur";

/**
 * La signature affichée en bas d'un article.
 *
 * Le `Person` du JSON-LD ne suffit pas : Google croise ce qu'il lit dans le
 * balisage avec ce que la page montre réellement. Une signature déclarée et
 * invisible est le même genre de décalage qu'un `FAQPage` dont les réponses
 * n'apparaissent nulle part.
 *
 * Elle sert aussi au lecteur, et c'est la raison la plus importante : sur un
 * article qui explique une obligation fiscale, savoir qui parle et pourquoi il
 * serait légitime change la façon de lire.
 */
export function Signature() {
  return (
    <section className="border-t border-ds-border pt-8 mt-12">
      <div className="flex gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white font-semibold text-sm">SA</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm">
            {AUTEUR.nom}
            <span className="text-gray-500 font-normal"> · {AUTEUR.role}</span>
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mt-1">{AUTEUR.resume}</p>
          <Link
            href={AUTEUR.urlPage}
            className="inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 transition-colors"
          >
            Comment je travaille, et comment me signaler une erreur →
          </Link>
        </div>
      </div>
    </section>
  );
}
