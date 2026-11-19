"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Onglets de vitrine : une liste à gauche (trait vert qui se remplit sur
 * l'élément actif), un seul écran à droite. Défilement automatique toutes les
 * 6 secondes quand la section est visible, arrêté au survol, après un clic, et
 * si le visiteur demande moins d'animations. Sur téléphone, les écrans
 * s'affichent à la suite, sans onglets (rien ne saute).
 *
 * Même comportement que SlideFonctionnalites (accueil), mais les écrans sont
 * passés en paramètre : utilisé par la page experts-comptables.
 */
export type Diapo = { cle: string; titre: string; texte: string; alt: string; ecran: ReactNode };

const DUREE = 6000;

export function OngletsVitrine({ diapos, nom }: { diapos: Diapo[]; nom: string }) {
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
      setActif((a) => (a + 1) % diapos.length);
      setCycle((c) => c + 1);
    }, DUREE);
    return () => window.clearTimeout(t);
  }, [auto, pause, actif, cycle, diapos.length]);

  function choisir(i: number) {
    setActif(i);
    setCycle((c) => c + 1);
    setPause(true);
  }

  const enCours = auto && !pause;
  const panneau = `ecran-${nom}`;

  return (
    <div
      ref={zone}
      className="grid grid-cols-1 gap-10 lg:gap-16 lg:grid-cols-12 items-start"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* Téléphone : les écrans à la suite. */}
      <div className="lg:hidden grid gap-12">
        {diapos.map((d) => (
          <div key={d.cle}>
            <h3 className="text-[20px] leading-snug font-semibold tracking-[-0.015em] text-ink">{d.titre}</h3>
            <p className="mt-2 text-[17px] leading-relaxed text-gray-300">{d.texte}</p>
            <div role="img" aria-label={d.alt} className="mt-5 rounded-xl bg-ds-bg ring-1 ring-ink/10">
              {d.ecran}
            </div>
          </div>
        ))}
      </div>

      {/* Ordinateur : la liste. */}
      <div className="hidden lg:block min-w-0 lg:col-span-5" role="tablist" aria-label={nom} aria-orientation="vertical">
        {diapos.map((d, i) => {
          const sel = i === actif;
          return (
            <button
              key={d.cle}
              type="button"
              role="tab"
              id={`onglet-${nom}-${d.cle}`}
              aria-selected={sel}
              aria-controls={panneau}
              onClick={() => choisir(i)}
              className="group relative block w-full text-left pl-6 py-3.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
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
              <span className={`block overflow-hidden transition-all duration-300 ${sel ? "max-h-40 mt-2 opacity-100" : "max-h-0 opacity-0"}`}>
                <span className="block text-[17px] leading-relaxed text-gray-300">{d.texte}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Ordinateur : l'écran. Tous dans la même case, hauteur du plus grand. */}
      <div className="hidden lg:block min-w-0 lg:col-span-7">
        <div id={panneau} role="tabpanel" aria-labelledby={`onglet-${nom}-${diapos[actif].cle}`} className="rounded-xl bg-ds-bg ring-1 ring-ink/10">
          <div className="grid">
            {diapos.map((d, i) => (
              <div
                key={d.cle}
                aria-hidden={i !== actif}
                className={`[grid-area:1/1] transition-opacity duration-500 ease-out ${i === actif ? "opacity-100" : "opacity-0 invisible"}`}
              >
                <div role="img" aria-label={d.alt} className="h-full">
                  {d.ecran}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
