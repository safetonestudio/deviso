import Link from "next/link";
import { APPEL } from "@/lib/beta";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { Apparitions } from "@/components/landing/Apparitions";
import { MenuMobile } from "@/components/landing/MenuMobile";
import { ModeNuit } from "@/components/landing/ModeNuit";
import { policesApp } from "@/app/polices-app";

/**
 * Le cadre commun de tout le site public : page d'accueil, experts-comptables,
 * blog, pages métiers, conformité, simulateur, à propos, pages légales.
 *
 * Une seule source pour l'en-tête, le fond nuit, les polices et le pied de
 * page, pour que toutes les pages parlent la même langue visuelle que
 * l'accueil validé le 17/11/2026. Ne pas réécrire d'en-tête dans une page.
 *
 * Les jetons (CADRE, H2, BOUTON…) sont exportés pour que le contenu des pages
 * reprenne les mêmes largeurs, tailles et boutons.
 */
export const CADRE = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";
export const CADRE_LECTURE = "mx-auto w-full max-w-[760px] px-5 sm:px-8";
export const SECTION = "pt-28 sm:pt-36 lg:pt-44";
/* Bandes de section : fond du haut de page, puis un fond légèrement plus
   clair une section sur deux (classe bande-alt, app/globals.css), pour marquer
   où l'une finit et l'autre commence. Chaque bande pleine largeur porte un
   CADRE intérieur. */
export const BANDE = "py-20 sm:py-28 lg:py-32";
export const FOND_2 = "bande-alt";
export const H1 = "text-[clamp(34px,4.1vw,60px)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink";
export const H2 = "text-[clamp(26px,2.6vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em] text-ink";
export const LEAD = "text-[17px] sm:text-[20px] leading-relaxed text-gray-300";
export const BOUTON = "inline-flex items-center justify-center h-12 px-6 rounded-lg text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
export const BOUTON_PLEIN = `${BOUTON} bg-indigo-600 hover:bg-indigo-700 text-on-accent`;
export const BOUTON_DOUX = `${BOUTON} border border-ink/15 hover:border-ink/30 hover:bg-ink/5 text-ink`;

export const LIENS = [
  ["/#etapes", "Comment ça marche"],
  ["/#fonctionnalites", "Fonctionnalités"],
  ["/#tarifs", "Tarifs"],
  ["/experts-comptables", "Experts-comptables"],
  ["/blog", "Blog"],
] as const;

export function SiteHeader({ actif }: { actif?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-ds-bg border-b border-ink/5">
      <div className={`${CADRE} grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4 h-16 sm:h-[72px]`}>
        <Link href="/" aria-label="Deviso, accueil" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-indigo-600 text-on-accent grid place-items-center font-semibold text-[14px]" aria-hidden="true">D</span>
          <span className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Deviso</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium" aria-label="Navigation principale">
          {LIENS.map(([href, nom]) => (
            <Link
              key={href}
              href={href}
              aria-current={actif === href ? "page" : undefined}
              className={`transition-colors ${actif === href ? "text-ink" : "text-gray-400 hover:text-ink"}`}
            >
              {nom}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center h-10 px-4 rounded-lg text-[14px] font-semibold text-gray-300 hover:text-ink transition-colors">Connexion</Link>
          <Link href={APPEL.lien} className="inline-flex items-center h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[14px] font-semibold transition-colors">
            <span className="sm:hidden">{APPEL.libelleCourt}</span>
            <span className="hidden sm:inline">{APPEL.libelle}</span>
          </Link>
          <MenuMobile liens={[...LIENS, ["/login", "Connexion"] as const]} />
        </div>
      </div>
    </header>
  );
}

/** Enveloppe d'une page publique : nuit uniquement, polices de l'app, en-tête et pied communs. */
export function PageSite({ children, actif }: { children: ReactNode; actif?: string }) {
  return (
    <div className={`ds-app ${policesApp} page-pleine accueil min-h-screen bg-ds-bg text-ink`}>
      {/* Mode nuit uniquement : retire le thème clair avant le premier affichage. */}
      <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.remove("light")' }} />
      <ModeNuit />
      <Apparitions />
      <SiteHeader actif={actif} />
      {children}
      <SiteFooter />
    </div>
  );
}
