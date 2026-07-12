import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ds-elevated/30 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-semibold text-indigo-600 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Page introuvable</h1>
        <p className="text-gray-400 text-sm mb-8">
          La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all text-sm"
          >
            Retour au dashboard
          </Link>
          <Link
            href="/"
            className="bg-white text-gray-300 font-semibold px-6 py-3 rounded-xl border border-ds-border hover:bg-slate-100 transition-all text-sm"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
