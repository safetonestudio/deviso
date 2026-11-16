"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Fonctionnalités de la page d'accueil, en une seule section qui défile :
 * une liste à gauche (élément actif marqué d'un trait vert qui se remplit),
 * un seul grand écran du produit à droite, posé à plat sur une surface.
 * L'écran change toutes les 6 secondes, ou au clic. Le défilement s'arrête
 * au survol, après un clic, et si le visiteur a demandé moins d'animations.
 *
 * Les écrans sont de vraies captures de l'application (compte de démo).
 */
const DIAPOS = [
  { cle: "tableau", titre: "Ton tableau de bord", texte: "Chiffre d'affaires encaissé, seuils, échéances et messages de ton comptable, en un coup d'œil.", alt: "Le tableau de bord de Deviso : message de l'expert-comptable, chiffre d'affaires encaissé et seuil de TVA" },
  { cle: "factures", titre: "Toutes tes factures", texte: "Encaissé, en attente, à transmettre : chaque facture et son statut, avec l'export FEC à portée de clic.", alt: "La liste des factures de Deviso, avec les totaux encaissés et en attente" },
  { cle: "recues", titre: "Les factures de tes fournisseurs", texte: "Elles arrivent d'elles-mêmes par la plateforme agréée. Tu les retrouves au même endroit, et tu en refuses une en un clic.", alt: "Les factures reçues des fournisseurs dans Deviso, avec leur échéance et leur statut" },
  { cle: "equipe", titre: "Ton équipe", texte: "Chaque collaborateur a ses droits ; tu suis les devis de chacun et tu valides avant envoi.", alt: "L'écran Équipe de Deviso : chiffre d'affaires, devis en cours et taux de signature par membre" },
  { cle: "catalogue", titre: "Ton catalogue", texte: "Tes prestations et tes prix, réutilisables en un clic, à l'heure ou au forfait. L'IA s'en sert pour chiffrer.", alt: "Le catalogue de prestations de Deviso" },
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
      {/* ── La liste ── */}
      <div className="min-w-0 lg:col-span-5 order-2 lg:order-1" role="tablist" aria-label="Fonctionnalités de Deviso" aria-orientation="vertical">
        {DIAPOS.map((d, i) => {
          const sel = i === actif;
          return (
            <button
              key={d.cle}
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
              {sel && (
                <span className="lg:hidden mt-4 block relative aspect-[4/3] rounded-lg overflow-hidden bg-ds-elevated">
                  <Image src={`/landing/ecran-${d.cle}-mobile.jpg`} alt={d.alt} fill sizes="100vw" quality={90} className="object-cover object-top" />
                  <span className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-ds-bg to-transparent" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── L'écran ── */}
      <div className="hidden lg:block min-w-0 lg:col-span-7 order-1 lg:order-2">
        <div
          id="ecran-fonctionnalite"
          role="tabpanel"
          aria-labelledby={`onglet-${DIAPOS[actif].cle}`}
          className="rounded-xl bg-ds-surface p-2 sm:p-3"
        >
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-ds-elevated">
            {DIAPOS.map((d, i) => (
              <div
                key={d.cle}
                aria-hidden={i !== actif}
                className={`absolute inset-0 transition-opacity duration-500 ease-out ${i === actif ? "opacity-100" : "opacity-0"}`}
              >
                <Image src={`/landing/ecran-${d.cle}.jpg`} alt={i === actif ? d.alt : ""} fill sizes="(min-width: 1024px) 56vw, 100vw" quality={90} className="object-cover object-top" />
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-ds-surface to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
