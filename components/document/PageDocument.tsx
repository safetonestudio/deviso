"use client";

/**
 * Cadre commun des pages de détail d'un devis et d'une facture.
 *
 * Une seule structure pour les deux (validée par Selim le 24/11/2026) :
 *   en-tête (titre, numéro, statut, dates)
 *   au plus un bandeau, quand quelque chose demande une réponse
 *   la feuille au centre, identique au document que reçoit le client
 *   à droite, toujours dans cet ordre : Actions, Suivi, Informations.
 *
 * Sur téléphone, une colonne : en-tête, bandeau, actions (le geste attendu
 * avant le document, le reste replié sous « Autres actions »), feuille, puis
 * Suivi et Informations. L'ordre du DOM est celui du téléphone ; la grille
 * replace les blocs sur ordinateur.
 *
 * Aucune animation (décision de Selim) : seules les transitions de couleur
 * des boutons, comme partout dans l'app.
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";

export type Ton = "neutre" | "info" | "succes" | "attention" | "danger";

const PASTILLE: Record<Ton, string> = {
  neutre: "bg-ds-elevated text-gray-400",
  info: "bg-blue-500/10 text-blue-400",
  succes: "bg-emerald-500/10 text-emerald-400",
  attention: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
};

export function Pastille({ ton = "neutre", children }: { ton?: Ton; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold ${PASTILLE[ton]}`}>
      {children}
    </span>
  );
}

interface PageDocumentProps {
  retour: { href: string; libelle: string };
  titre: ReactNode;
  numero?: string | null;
  pastilles?: ReactNode;
  /** Ligne de dates sous le titre. */
  dates?: ReactNode;
  /** Ligne complémentaire (document lié). */
  sousLigne?: ReactNode;
  /** Au plus un bandeau : l'appelant choisit le plus urgent. */
  bandeau?: ReactNode;
  feuille: ReactNode;
  /**
   * Pages suivantes du document (annexe CGV d'un devis), placées sous la
   * feuille : la colonne de droite s'arrête au bas de la première page.
   */
  suiteFeuille?: ReactNode;
  actions: ReactNode;
  suivi: ReactNode;
  informations: ReactNode;
  titreInformations: string;
  avantPage?: ReactNode;
}

export function PageDocument({
  retour, titre, numero, pastilles, dates, sousLigne, bandeau,
  feuille, suiteFeuille, actions, suivi, informations, titreInformations, avantPage,
}: PageDocumentProps) {
  // Un seul bloc centré (retour de Selim, 24/11) : la feuille (820 px au plus)
  // et le panneau (320 px) côte à côte, 40 px entre eux. Le titre, les dates
  // et le bandeau s'alignent sur le bord gauche de la feuille ; le bandeau a
  // la largeur de la feuille. Les deux colonnes partagent la même ligne de
  // départ : un intitulé au-dessus de la feuille répond à « Actions ».
  return (
    <div className="max-w-[1180px] mx-auto">
      {avantPage}
      <Link href={retour.href} className="text-sm text-gray-500 hover:text-gray-400 transition-colors mb-4 inline-block">
        ← {retour.libelle}
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink tracking-tight min-w-0 break-words">{titre}</h1>
          {numero && (
            <span className="shrink-0 text-xs font-mono font-semibold text-gray-400 bg-ds-elevated border border-ds-border px-2 py-0.5 rounded-sm">
              {numero}
            </span>
          )}
          {pastilles}
        </div>
        {dates && <p className="text-sm text-gray-500 mt-1.5">{dates}</p>}
        {sousLigne && <div className="text-sm mt-1">{sousLigne}</div>}
      </header>

      <div
        className={`grid grid-cols-1 lg:grid-cols-[minmax(0,820px)_320px] gap-x-10 gap-y-6 items-start ${
          bandeau
            ? suiteFeuille ? "lg:grid-rows-[auto_auto_1fr_auto]" : "lg:grid-rows-[auto_auto_1fr]"
            : suiteFeuille ? "lg:grid-rows-[auto_1fr_auto]" : "lg:grid-rows-[auto_1fr]"
        }`}
      >
        {bandeau && <div className="lg:col-start-1 lg:row-start-1 min-w-0">{bandeau}</div>}

        <aside className={`lg:col-start-2 min-w-0 ${bandeau ? "lg:row-start-2" : "lg:row-start-1"}`} aria-label="Actions">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Actions</h2>
          {actions}
        </aside>

        <div className={`lg:col-start-1 lg:row-span-2 min-w-0 ${bandeau ? "lg:row-start-2" : "lg:row-start-1"}`}>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Le document, tel que le reçoit le client</h2>
          {feuille}
        </div>

        {suiteFeuille && (
          <div className={`lg:col-start-1 min-w-0 ${bandeau ? "lg:row-start-4" : "lg:row-start-3"}`}>{suiteFeuille}</div>
        )}

        {/* La colonne de droite fait EXACTEMENT la hauteur du document (retours
            de Selim, 24/11) : sur ordinateur, ce bloc est posé en absolu dans sa
            cellule, il ne peut donc pas allonger la grille ; c'est la feuille qui
            la dimensionne. Le dernier bloc prend la place restante et, si son
            contenu est plus long, il défile dans son cadre au lieu de dépasser. */}
        <div className={`lg:col-start-2 min-w-0 lg:relative lg:self-stretch lg:min-h-[240px] ${bandeau ? "lg:row-start-3" : "lg:row-start-2"}`}>
          <div className="flex flex-col gap-6 lg:absolute lg:inset-0">
            <section className="shrink-0">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Suivi</h2>
              <div className="carte p-5">{suivi}</div>
            </section>
            <section className="flex flex-col lg:flex-1 lg:min-h-0">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">{titreInformations}</h2>
              <div
                className="carte p-5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto overscroll-contain focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                tabIndex={0}
                aria-label={titreInformations}
              >
                {informations}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Panneau d'actions ─────────────────────────────────────────────────────── */

/**
 * Un bouton principal (le geste attendu à ce statut), la liste des autres
 * actions, puis la zone de suppression. Sur téléphone, la liste se replie
 * derrière « Autres actions » pour que le document arrive vite.
 */
export function PanneauActions({
  principal, autres, danger,
}: {
  principal?: ReactNode;
  autres?: ReactNode;
  danger?: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="carte p-3 space-y-2">
      {principal}
      {autres && (
        <>
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            className="lg:hidden w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-ds-border text-sm font-medium text-gray-300 hover:bg-ds-elevated/60 transition-colors"
          >
            Autres actions
            <ChevronDown size={16} className={`shrink-0 ${ouvert ? "rotate-180" : ""}`} />
          </button>
          <div className={`${ouvert ? "flex" : "hidden"} lg:flex flex-col gap-0.5 ${principal ? "pt-1" : ""}`}>
            {autres}
          </div>
        </>
      )}
      {danger && <div className="border-t border-ds-border pt-2 mt-1">{danger}</div>}
    </div>
  );
}

/** Le bouton plein : un seul par page. */
export function BoutonPrincipal({
  icone: Icone, children, onClick, disabled, sous,
}: {
  icone?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Une ligne sous le bouton (destinataire, conséquence). */
  sous?: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-ink text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2.5"
      >
        {Icone && <Icone size={17} className="shrink-0" />}
        <span className="min-w-0">{children}</span>
      </button>
      {sous && <p className="text-xs text-gray-500 mt-1.5 px-1 break-words">{sous}</p>}
    </div>
  );
}

/** Une action de la liste : ligne sobre, icône grise, même hauteur pour toutes. */
export function BoutonListe({
  icone: Icone, children, onClick, disabled, ton = "neutre", ariaExpanded, droite,
}: {
  icone?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ton?: "neutre" | "succes" | "attention";
  ariaExpanded?: boolean;
  droite?: ReactNode;
}) {
  const couleur =
    ton === "succes" ? "text-emerald-400" : ton === "attention" ? "text-amber-400" : "text-gray-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={ariaExpanded}
      className={`w-full min-h-10 text-sm font-medium px-3 py-2 rounded-lg hover:bg-ds-elevated disabled:opacity-50 transition-colors text-left flex items-center gap-2.5 ${couleur}`}
    >
      {Icone && <Icone size={16} className="shrink-0 opacity-80" />}
      <span className="min-w-0 flex-1">{children}</span>
      {droite}
    </button>
  );
}

/** Sous-titre de groupe dans la liste d'actions (ex. Facture électronique). */
export function GroupeActions({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="pt-2 mt-1 border-t border-ds-border flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-gray-500 px-3 pb-1">{titre}</p>
      {children}
    </div>
  );
}

/** Retour d'une action, sous elle (erreur, confirmation, rapport). */
export function Retour({ ton = "neutre", children }: { ton?: Ton; children: ReactNode }) {
  const c =
    ton === "danger" ? "bg-red-500/10 border-red-500/20 text-red-400"
    : ton === "attention" ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
    : ton === "succes" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-ds-elevated border-ds-border text-gray-400";
  return <div className={`rounded-lg border px-3 py-2.5 text-sm ${c}`}>{children}</div>;
}

/** Suppression : discrète, en bas, avec confirmation en deux temps. */
export function ZoneSuppression({
  libelle, onConfirmer, enCours,
}: {
  libelle: string;
  onConfirmer: () => void;
  enCours: boolean;
}) {
  const [confirmer, setConfirmer] = useState(false);
  if (!confirmer) {
    return (
      <button
        type="button"
        onClick={() => setConfirmer(true)}
        className="w-full text-xs text-gray-500 hover:text-red-400 px-3 py-2 text-left transition-colors"
      >
        {libelle}
      </button>
    );
  }
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
      <p className="text-xs text-red-400 font-medium">Supprimer définitivement ?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmer(false)}
          className="flex-1 text-xs py-2 rounded-lg border border-ds-border text-gray-400 hover:bg-ds-elevated transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirmer}
          disabled={enCours}
          className="flex-1 text-xs py-2 rounded-lg bg-red-600 hover:bg-red-700 text-ink font-medium transition-colors disabled:opacity-50"
        >
          {enCours ? "…" : "Confirmer"}
        </button>
      </div>
    </div>
  );
}

/* ── Suivi et informations ─────────────────────────────────────────────────── */

export interface EtapeSuivi {
  libelle: ReactNode;
  date?: string | null;
  faite: boolean;
  ton?: "succes" | "attention" | "danger";
}

/** L'historique du document : ce qui s'est passé, daté quand on le sait. */
export function Suivi({ etapes }: { etapes: EtapeSuivi[] }) {
  return (
    <ol className="space-y-2.5">
      {etapes.map((e, i) => {
        const point =
          !e.faite ? "bg-ds-border"
          : e.ton === "danger" ? "bg-red-500"
          : e.ton === "attention" ? "bg-amber-500"
          : "bg-emerald-500";
        return (
          <li key={i} className="grid grid-cols-[8px_1fr_auto] gap-x-3 items-baseline text-sm">
            <span className={`w-2 h-2 rounded-full ${point} translate-y-[-1px]`} aria-hidden="true" />
            <span className={e.faite ? "text-gray-300" : "text-gray-500"}>{e.libelle}</span>
            <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{e.date ?? ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Une ligne libellé / valeur du bloc Informations. */
export function Info({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm leading-relaxed py-3 first:pt-0 last:pb-0 border-b border-ds-border last:border-0">
      <span className="text-xs text-gray-500">{libelle}</span>
      <div className="text-gray-300 min-w-0 break-words">{children}</div>
    </div>
  );
}

/** Le bandeau unique, au-dessus de la feuille. */
export function Bandeau({ ton, children }: { ton: "attention" | "danger" | "info"; children: ReactNode }) {
  const c =
    ton === "danger" ? "border-red-500/25 bg-red-500/10"
    : ton === "attention" ? "border-amber-500/30 bg-amber-500/10"
    : "border-ds-border bg-ds-elevated";
  return <div className={`rounded-xl border px-4 py-3 ${c}`}>{children}</div>;
}
