"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/**
 * Exports comptables de l'année : un menu déroulant pour choisir le type
 * d'export et un seul bouton pour le télécharger, à la place de quatre boutons
 * empilés (retour Selim 04/11, téléphone).
 */
export function ExportsComptables({ annee }: { annee: number | string }) {
  const exports = [
    { id: "livre", label: "Livre des recettes (CSV)", href: `/api/export/livre-recettes?annee=${annee}` },
    { id: "fec", label: "Écritures comptables (FEC)", href: `/api/export/fec?year=${annee}` },
    { id: "factures", label: "Factures de l'année (CSV)", href: `/api/export/invoices-csv?year=${annee}` },
    { id: "recap", label: "Récapitulatif mensuel CA (CSV)", href: `/api/export/monthly-recap?year=${annee}` },
  ];
  const [choix, setChoix] = useState(exports[0].id);
  const courant = exports.find((e) => e.id === choix) ?? exports[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
      <select
        aria-label="Type d'export"
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
        className="w-full sm:w-auto sm:min-w-[280px] bg-ds-bg border border-ds-border text-ink rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
      >
        {exports.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>
      <a
        href={courant.href}
        className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-ink font-medium transition-colors"
      >
        <Download size={15} className="shrink-0" aria-hidden="true" />
        Télécharger
      </a>
    </div>
  );
}
