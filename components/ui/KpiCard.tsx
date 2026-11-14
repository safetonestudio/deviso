import Link from "next/link";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Affichee seulement en variante `dense` (pastille discrete en haut a droite). */
  icon?: LucideIcon;
  trend?: string;
  /** Couleur du point devant `trend` : alerte, information, bonne nouvelle ou neutre. */
  point?: "alerte" | "info" | "bon" | "neutre";
  delta?: { value: string; positive: boolean };
  /** Occupation de colonnes dans la grille appelante (ex. `col-span-2`). */
  className?: string;
  /** Rend toute la tuile cliquable vers la liste concernee. */
  href?: string;
  /** Variante compacte du tableau de bord (pilote du 14/11/2026) : chiffre
      plus petit, icone, evolution en pastille. Les autres pages gardent le
      rendu d'origine tant que le pilote n'est pas valide. */
  dense?: boolean;
}

/**
 * Carte d'indicateur, implémentation unique.
 *
 * Il en existait trois pour le même objet : celle-ci, une copie en ligne dans
 * `crm/page.tsx` et une troisième dans `team/page.tsx`. Trois pages, trois
 * rendus, signalé par Selim. Une seule implémentation désormais.
 *
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

export function KpiCard({ label, value, icon: Icon, trend, point = "neutre", delta, className = "", href, dense = false }: KpiCardProps) {
  const { nombre, euro } = montant(value);

  const pastilleDelta = delta && (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
        delta.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {delta.positive ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />}
      {delta.value}
    </span>
  );

  const contenu = dense ? (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-medium text-gray-300 min-w-0 break-words">{label}</div>
        {Icon && (
          <span className="shrink-0 w-7 h-7 rounded-lg bg-ds-elevated border border-ds-border flex items-center justify-center text-gray-400">
            <Icon size={14} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
        <span className="text-[24px] leading-none font-semibold text-ink tabular-nums tracking-tight">
          {nombre}
          {euro && <span className="text-[0.6em] text-gray-400 font-medium ml-1">€</span>}
        </span>
        {pastilleDelta}
      </div>
      {trend && (
        <div className="flex items-start sm:items-center gap-2 text-[13px] text-gray-400 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 sm:mt-0 ${POINT[point]}`} />
          <span className="break-words sm:truncate">{trend}</span>
        </div>
      )}
    </>
  ) : (
    <>
      <div className="text-[14px] font-medium text-gray-400">{label}</div>
      <div className="font-display text-[28px] leading-none font-bold text-ink tabular-nums tracking-tight wrap-break-word">
        {nombre}
        {euro && <span className="text-[0.55em] text-gray-400 font-semibold ml-0.5">€</span>}
      </div>
      {trend && (
        <div className="flex items-start sm:items-center gap-2 text-[13px] text-gray-400 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 sm:mt-0 ${POINT[point]}`} />
          <span className="break-words sm:truncate">{trend}</span>
        </div>
      )}
      {delta && <div className="self-start">{pastilleDelta}</div>}
    </>
  );

  const classes = `carte ${dense ? "p-4 gap-3" : "p-5 gap-2.5"} flex flex-col min-w-0 ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${label} : ${String(value)}`}
        className={`${classes} hover:border-indigo-500/40 focus-visible:outline-2 focus-visible:outline-indigo-500 transition-colors`}
      >
        {contenu}
      </Link>
    );
  }
  return <div className={classes}>{contenu}</div>;
}
