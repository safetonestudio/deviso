"use client";

import { LIBELLE_NATURE, LIBELLE_NATURE_COURT, type NatureLigne } from "@/lib/nature-operation";

/**
 * Choix bien / prestation, partagé par le catalogue et les lignes de devis et
 * de facture (lib/nature-operation.ts). Aucune valeur par défaut : `null`
 * s'affiche comme « à préciser », c'est voulu, la nature décide de la
 * déclaration et ne se suppose pas.
 */
export function ChoixNature({
  valeur,
  onChange,
  compact = false,
  libelle = "Nature",
  id,
}: {
  valeur: NatureLigne | null | undefined;
  onChange: (n: NatureLigne) => void;
  compact?: boolean;
  libelle?: string;
  id?: string;
}) {
  const options: NatureLigne[] = ["services", "goods"];
  const manquante = !valeur;
  return (
    <div
      role="radiogroup"
      aria-label={libelle}
      id={id}
      data-nature={valeur ?? "a-preciser"}
      className={`inline-flex rounded-lg border p-0.5 ${manquante ? "border-amber-500/60" : "border-ds-border"}`}
    >
      {options.map((n) => {
        const actif = valeur === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(n)}
            className={`rounded-md font-medium transition-colors ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} ${
              actif ? "bg-indigo-500/15 text-ink ring-1 ring-indigo-500/50" : "text-gray-400 hover:text-ink"
            }`}
          >
            {compact ? LIBELLE_NATURE_COURT[n] : LIBELLE_NATURE[n]}
          </button>
        );
      })}
    </div>
  );
}

/** Pastille de lecture : « Prestation », « Bien » ou « Nature à préciser ». */
export function PastilleNature({ nature }: { nature: NatureLigne | null | undefined }) {
  if (!nature) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400">
        Nature à préciser
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-ds-elevated border border-ds-border text-gray-400">
      {LIBELLE_NATURE_COURT[nature]}
    </span>
  );
}
