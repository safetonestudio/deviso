"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Liste "cartes alignees", rendu partage des pages de liste (Devis, Factures,
 * Mes clients, Achats a l'etranger). Chaque ligne est une carte separee avec
 * surbrillance au survol, sur le modele de Factures recues mais SANS volet
 * deplie. En-tete et lignes partagent le meme gabarit de colonnes (gridCols)
 * pour rester alignes tout en etant visuellement separes.
 *
 * Source unique du rendu : on modifie l'aspect "pro" ici, il change partout.
 */

export type Colonne = { cle: string; libelle: string; align?: "left" | "right" | "center" };

const ALIGN = {
  left: "justify-start text-left",
  right: "justify-end text-right",
  center: "justify-center text-center",
} as const;

export function EnteteListe({ gridCols, colonnes }: { gridCols: string; colonnes: Colonne[] }) {
  return (
    <div
      className="grid gap-4 items-center px-5 py-3 mb-2.5 rounded-xl bg-ds-elevated border border-ds-border shadow-xs text-[11px] font-semibold uppercase tracking-widest text-gray-400"
      style={{ gridTemplateColumns: gridCols }}
    >
      {colonnes.map((c) => (
        <div key={c.cle} className={`flex items-center ${ALIGN[c.align ?? "left"]}`}>
          {c.libelle}
        </div>
      ))}
    </div>
  );
}

export function LigneListe({
  gridCols,
  colonnes,
  cells,
  href,
}: {
  gridCols: string;
  colonnes: Colonne[];
  cells: ReactNode[];
  href: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-4 items-center px-5 py-3.5 carte shadow-xs transition-all duration-150 hover:border-indigo-500/50 hover:shadow-md hover:bg-ds-elevated/40"
      style={{ gridTemplateColumns: gridCols }}
    >
      {cells.map((cell, i) => (
        <div key={colonnes[i].cle} className={`min-w-0 flex items-center ${ALIGN[colonnes[i].align ?? "left"]}`}>
          {cell}
        </div>
      ))}
    </Link>
  );
}
