import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Conserve pour compatibilite : la carte ne l'affiche plus (maquette du 02/11/2026). */
  icon?: LucideIcon;
  trend?: string;
  /** Couleur du point devant `trend` : alerte, information, bonne nouvelle ou neutre. */
  point?: "alerte" | "info" | "bon" | "neutre";
  delta?: { value: string; positive: boolean };
  /** Occupation de colonnes dans la grille appelante (ex. `col-span-2`). */
  className?: string;
}

/**
 * Carte d'indicateur, implémentation unique.
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
 * distinction, emerald pour l'encaissé, amber pour le retard, qui ne
 * survivait déjà pas d'une page à l'autre, et que rien n'expliquait au
 * lecteur. Une seule couleur d'icône désormais, l'indigo de la barre latérale.
 * Ce qui doit alerter (un retard, un impayé) le fait par le texte de `trend`
 * ou par `delta`, pas par une nuance de bordure que personne ne décode.
 */
const POINT = {
  alerte: "bg-amber-500",
  info: "bg-sky-400",
  bon: "bg-emerald-500",
  neutre: "bg-gray-400",
} as const;

/** Separe le symbole euro final pour l'afficher plus petit que le montant. */
function montant(value: string | number) {
  const v = String(value);
  const m = v.match(/^(.*?)\s*€$/);
  return m ? { nombre: m[1], euro: true } : { nombre: v, euro: false };
}

export function KpiCard({ label, value, trend, point = "neutre", delta, className = "" }: KpiCardProps) {
  const { nombre, euro } = montant(value);
  return (
    <div className={`carte p-5 flex flex-col gap-2.5 min-w-0 ${className}`}>
      <div className="text-[14px] font-medium text-gray-400">{label}</div>
      <div className="font-display text-[28px] leading-none font-bold text-ink tabular-nums tracking-tight wrap-break-word">
        {nombre}
        {euro && <span className="text-[0.55em] text-gray-400 font-semibold ml-0.5">€</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-[13px] text-gray-400 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${POINT[point]}`} />
          <span className="truncate">{trend}</span>
        </div>
      )}
      {delta && (
        <div
          className={`inline-flex self-start items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
            delta.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {delta.positive ? "↑" : "↓"} {delta.value}
        </div>
      )}
    </div>
  );
}
