"use client";

import { Search } from "lucide-react";

/**
 * Champ de recherche unique de l'app. Unifie l'aspect des recherches (Devis,
 * Factures, Mes clients, Achats) et garantit qu'il reste bien visible dans les
 * deux themes : fond de surface distinct du fond de page, bordure et legere
 * ombre, plutot qu'un champ qui se fondait dans le fond en mode clair.
 */
export function BarreRecherche({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative max-w-sm ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ds-surface border border-ds-border shadow-sm rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
      />
    </div>
  );
}
