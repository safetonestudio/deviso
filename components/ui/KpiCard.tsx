import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  delta?: { value: string; positive: boolean };
  /** Occupation de colonnes dans la grille appelante (ex. `col-span-2`). */
  className?: string;
}

/**
 * Carte d'indicateur — implémentation unique.
 *
 * Il en existait trois pour le même objet : celle-ci (pastille 7x7, icône
 * 14 px en `text-gray-500`), une copie en ligne dans `crm/page.tsx` (pastille
 * 8x8, icône 18 px en `text-indigo-400`) et une troisième dans `team/page.tsx`
 * (pastille 6x6, icône 13 px grise, avec un champ `color` déclaré dans le
 * tableau et jamais lu à l'affichage). Trois pages, trois rendus.
 *
 * Signalé par Selim, capture à l'appui : « d'autres pages les ont en
 * noir/gris/blanc. Ce n'est juste pas uniforme ». Le rendu retenu est celui de
 * `crm`, parce que c'est celui qu'il a désigné.
 *
 * Ce qui a disparu au passage : la barre d'accent d'un pixel en haut de la
 * carte et la propriété `color` qui la pilotait. Cette couleur portait une
 * distinction — emerald pour l'encaissé, amber pour le retard — qui ne
 * survivait déjà pas d'une page à l'autre, et que rien n'expliquait au
 * lecteur. Une seule couleur d'icône désormais, l'indigo de la barre latérale.
 * Ce qui doit alerter (un retard, un impayé) le fait par le texte de `trend`
 * ou par `delta`, pas par une nuance de bordure que personne ne décode.
 */
export function KpiCard({ label, value, icon: Icon, trend, delta, className = "" }: KpiCardProps) {
  return (
    <div
      className={`bg-ds-surface border border-ds-border rounded-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 ${className}`}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-ds-elevated rounded-lg text-indigo-400 shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl sm:text-3xl font-semibold text-white tabular-nums tracking-tight break-words">
          {value}
        </div>
        {trend && <div className="text-xs text-gray-600 mt-2">{trend}</div>}
        {delta && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs mt-2 font-medium px-1.5 py-0.5 rounded-md ${
              delta.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}
          >
            {delta.positive ? "↑" : "↓"} {delta.value}
          </div>
        )}
      </div>
    </div>
  );
}
