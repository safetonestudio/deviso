"use client";

import { useEffect, useRef, useState } from "react";
import { EcranApp } from "@/components/landing/EcransApp";

/**
 * Fonctionnalités de la page d'accueil, en une seule section qui défile :
 * une liste à gauche (élément actif marqué d'un trait vert qui se remplit),
 * un seul grand écran du produit à droite, posé à plat sur une surface.
 * L'écran change toutes les 6 secondes, ou au clic. Le défilement s'arrête
 * au survol, après un clic, et si le visiteur a demandé moins d'animations.
 *
 * Les écrans sont des aperçus composés en HTML (components/landing/EcransApp),
 * lisibles à toute taille et cohérents avec le parcours.
 */
const DIAPOS = [
  { cle: "tableau", titre: "Votre tableau de bord", texte: "Ce que vous avez encaissé, ce qui vous attend et les messages de votre comptable, en un coup d'œil.", alt: "Le tableau de bord de Deviso : message de l'expert-comptable, chiffre d'affaires encaissé et seuil de TVA" },
  { cle: "factures", titre: "Toutes vos factures", texte: "Encaissé, en attente, relancé : chaque facture et son statut, et l'export pour votre comptable en un clic.", alt: "La liste des factures de Deviso, avec les totaux encaissés et en attente" },
  { cle: "recues", titre: "Les factures de vos fournisseurs", texte: "Elles arrivent d'elles-mêmes par la plateforme agréée. Vous les retrouvez au même endroit, et vous en refusez une en un clic.", alt: "Les factures reçues des fournisseurs dans Deviso, avec leur échéance et leur statut" },
  { cle: "catalogue", titre: "Votre catalogue", texte: "Vos prestations et vos prix, au forfait, à la page ou à la journée, réutilisables en un clic. L'IA s'en sert pour chiffrer.", alt: "Le catalogue de prestations de Deviso" },
] as const;

const DUREE = 6000;

export function SlideFonctionnalites() {
  const [actif, setActif] = useState(0);
  const [auto, setAuto] = useState(false);
  const [pause, setPause] = useState(false);
  const [cycle, setCycle] = useState(0);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = zone.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(([e]) => setAuto(e.isIntersecting), { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || pause) return;
    const t = window.setTimeout(() => {
      setActif((a) => (a + 1) % DIAPOS.length);
      setCycle((c) => c + 1);
    }, DUREE);
    return () => window.clearTimeout(t);
  }, [auto, pause, actif, cycle]);

  function choisir(i: number) {
    setActif(i);
    setCycle((c) => c + 1);
    setPause(true);
  }

  const enCours = auto && !pause;

  return (
    <div
      ref={zone}
      className="grid grid-cols-1 gap-10 lg:gap-16 lg:grid-cols-12 items-start"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* ── Téléphone : les aperçus à la suite, sans onglets (rien ne saute). ── */}
      <div className="lg:hidden grid gap-12">
        {DIAPOS.map((d) => (
          <div key={d.cle}>
            <h3 className="text-[20px] leading-snug font-semibold tracking-[-0.015em] text-ink">{d.titre}</h3>
            <p className="mt-2 text-[17px] leading-relaxed text-gray-300">{d.texte}</p>
            <div role="img" aria-label={d.alt} className="mt-5 rounded-xl bg-ds-bg ring-1 ring-ink/10">
              <EcranApp cle={d.cle} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Ordinateur : la liste ── */}
      <div className="hidden lg:block min-w-0 lg:col-span-5" role="tablist" aria-label="Fonctionnalités de Deviso" aria-orientation="vertical">
        {DIAPOS.map((d, i) => {
          const sel = i === actif;
          return (
            <div key={d.cle}>
            <button
              type="button"
              role="tab"
              id={`onglet-${d.cle}`}
              aria-selected={sel}
              aria-controls="ecran-fonctionnalite"
              onClick={() => choisir(i)}
              className="group relative block w-full text-left pl-6 py-3.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {/* Repère vertical : sombre, puis vert qui se remplit sur l'élément actif. */}
              <span className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full bg-ds-surface overflow-hidden" aria-hidden="true">
                {sel && (
                  <span
                    key={`${actif}-${cycle}`}
                    className={`block w-full bg-indigo-500 ${enCours ? "barre-diapo" : "h-full"}`}
                    style={enCours ? { animationDuration: `${DUREE}ms` } : undefined}
                  />
                )}
              </span>
              <span className={`block text-[20px] leading-snug font-semibold tracking-[-0.015em] transition-colors ${sel ? "text-ink" : "text-gray-400 group-hover:text-ink"}`}>
                {d.titre}
              </span>
              <span className={`block overflow-hidden transition-all duration-300 ${sel ? "max-h-28 mt-2 opacity-100" : "max-h-0 opacity-0"}`}>
                <span className="block text-[17px] leading-relaxed text-gray-300">{d.texte}</span>
              </span>
            </button>
            </div>
          );
        })}
      </div>

      {/* ── L'écran ── */}
      <div className="hidden lg:block min-w-0 lg:col-span-7">
        <div
          id="ecran-fonctionnalite"
          role="tabpanel"
          aria-labelledby={`onglet-${DIAPOS[actif].cle}`}
          className="rounded-xl bg-ds-bg ring-1 ring-ink/10"
        >
          {/* Tous les aperçus dans la même case : la hauteur est celle du plus grand. */}
          <div className="grid">
            {DIAPOS.map((d, i) => (
              <div
                key={d.cle}
                aria-hidden={i !== actif}
                className={`[grid-area:1/1] transition-opacity duration-500 ease-out ${i === actif ? "opacity-100" : "opacity-0 invisible"}`}
              >
                <div role="img" aria-label={d.alt} className="h-full">
                  <EcranApp cle={d.cle} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
