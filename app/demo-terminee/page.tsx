import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Démonstration terminée",
  description: "Votre session de démonstration Deviso est terminée et les données fictives ont été supprimées.",
  robots: { index: false, follow: false },
};

/**
 * Page de sortie de démonstration.
 *
 * Elle joue deux rôles. D'abord confirmer la suppression : un visiteur qui a
 * saisi des informations, même fictives, doit savoir qu'il ne reste rien.
 * Ensuite proposer la suite — c'est le seul moment où l'on sait avec certitude
 * que la personne vient de terminer un essai complet.
 */
export default function DemoTerminee() {
  return (
    <main className="min-h-screen bg-ds-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">Démonstration terminée</h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Le compte de démonstration et toutes ses données fictives ont été supprimés.
          Il n&apos;en reste rien de votre côté comme du nôtre.
        </p>

        <div className="space-y-3">
          <Link
            href="/signup"
            className="block w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            Créer mon compte
          </Link>
          <Link
            href="/"
            className="block w-full px-4 py-3 rounded-xl border border-ds-border text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-8">
          Vous pouvez relancer une démonstration à tout moment depuis la page d&apos;accueil.
        </p>
      </div>
    </main>
  );
}
