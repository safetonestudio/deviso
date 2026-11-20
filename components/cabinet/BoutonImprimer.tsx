"use client";

/** Imprimer ou enregistrer en PDF la page en cours (fiche de confiance). */
export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print h-9 inline-flex items-center px-3.5 border border-ds-border text-gray-200 rounded-lg hover:bg-ink/5 text-sm font-medium transition-colors"
    >
      Imprimer ou enregistrer en PDF
    </button>
  );
}
