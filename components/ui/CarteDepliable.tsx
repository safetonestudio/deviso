"use client";

import type { ReactNode } from "react";

/**
 * Carte depliable partagee, recopie fidele du rendu de Factures recues : memes
 * classes, memes tailles de police, meme espacement, meme survol et meme volet
 * <details> natif. Source unique pour Devis, Factures, Mes clients et Achats a
 * l'etranger, afin que les pages aient EXACTEMENT le meme comportement.
 *
 * Replie : titre + sous-titre a gauche, PASTILLES dans leur propre colonne a
 * largeur fixe (alignees d'une ligne a l'autre, bien espacees du texte),
 * montant a droite, chevron. Deplie : le contenu passe en children.
 */

export type Ton = "neutre" | "attention" | "bien";

export function Puce({ ton, texte }: { ton: Ton; texte: string }) {
  const couleur =
    ton === "bien"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : ton === "attention"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-ds-elevated text-gray-300 border-ds-border";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${couleur}`}
    >
      {texte}
    </span>
  );
}

/** Pastille a couleur libre (pour des etats qui ne tiennent pas dans les 3 tons). */
export function PuceCouleur({ classe, texte }: { classe: string; texte: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${classe}`}
    >
      {texte}
    </span>
  );
}

export function TuileSynthese({
  libelle,
  valeur,
  alerte,
}: {
  libelle: string;
  valeur: string;
  alerte?: boolean;
}) {
  return (
    <div className="carte px-4 py-3">
      <p className="text-xs text-gray-400">{libelle}</p>
      <p className={`text-xl font-semibold mt-0.5 ${alerte ? "text-red-400" : "text-ink"}`}>{valeur}</p>
    </div>
  );
}

export function Champ({ libelle, valeur, mono }: { libelle: string; valeur: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{libelle}</dt>
      <dd className={mono ? "text-gray-300 font-mono text-xs" : "text-gray-300"}>{valeur}</dd>
    </div>
  );
}

export function CarteDepliable({
  titre,
  pastilles,
  sousTitre,
  montant,
  children,
}: {
  titre: ReactNode;
  pastilles?: ReactNode;
  sousTitre?: ReactNode;
  montant: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group carte overflow-hidden shadow-xs transition-colors hover:border-gray-600 open:border-indigo-500/40 open:shadow-md">
      <summary className="flex items-center gap-4 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-ds-elevated/40 transition-colors">
        <div className="min-w-0 max-w-[55%]">
          <span className="text-ink font-medium truncate block">{titre}</span>
          {sousTitre && <div className="text-xs mt-0.5">{sousTitre}</div>}
        </div>
        <div className="shrink-0 flex flex-wrap items-center gap-2">{pastilles}</div>
        <div className="flex-1" />
        <span className="text-ink font-semibold whitespace-nowrap shrink-0 tabular-nums">{montant}</span>
        <svg
          className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1 bg-ds-bg">{children}</div>
    </details>
  );
}
