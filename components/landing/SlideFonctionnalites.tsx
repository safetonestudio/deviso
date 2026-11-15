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
  { cle: "nouveau", teinte: "bg-indigo-500", titre: "Devis par IA en 30 secondes", texte: "Tu décris ta mission, l'IA rédige le devis complet, chiffré, prêt à envoyer.", alt: "L'écran Nouveau devis de Deviso : tu décris ton projet, l'IA génère le devis" },
  { cle: "signature", teinte: "bg-blue-400", titre: "Signature électronique", texte: "Ton client ouvre le devis sur son téléphone et signe en quelques secondes.", alt: "Un devis tel que le client le reçoit, prêt à être signé en ligne" },
  { cle: "relances", teinte: "bg-amber-400", titre: "Relances automatiques", texte: "Après 3, 7 ou 14 jours sans réponse, Deviso relance ton client à ta place.", alt: "Les actions requises dans Deviso : factures en retard et devis sans réponse à relancer" },
  { cle: "factures", teinte: "bg-indigo-500", titre: "Factur-X et plateforme agréée", texte: "Factures conformes à la réforme 2026, émises et reçues via une plateforme agréée.", alt: "La liste des factures dans Deviso, avec leur statut et leur montant" },
  { cle: "tableau", teinte: "bg-blue-400", titre: "Chiffre d'affaires et déclarations", texte: "Ton chiffre d'affaires, ta TVA et tes échéances, calculés selon ton statut.", alt: "Le tableau de bord de Deviso : chiffre d'affaires encaissé, TVA et prochaine échéance" },
  { cle: "catalogue", teinte: "bg-amber-400", titre: "Catalogue et suivi du temps", texte: "Tes prestations réutilisables en un clic, à l'heure ou au forfait.", alt: "Le catalogue de prestations de Deviso" },
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
      className="grid grid-cols-1 gap-10 lg:gap-16 lg:grid-cols-12 items-center"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* ── La liste ── */}
      <div className="min-w-0 lg:col-span-4 order-2 lg:order-1" role="tablist" aria-label="Fonctionnalités de Deviso" aria-orientation="vertical">
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
              className="group relative block w-full text-left pl-6 py-3.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {/* Repère vertical : sombre, puis vert qui se remplit sur l'élément actif. */}
              <span className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full bg-ds-surface overflow-hidden" aria-hidden="true">
                {sel && (
                  <span
                    key={`${actif}-${cycle}`}
                    className={`block w-full ${d.teinte} ${enCours ? "barre-diapo" : "h-full"}`}
                    style={enCours ? { animationDuration: `${DUREE}ms` } : undefined}
                  />
                )}
              </span>
              <span className={`block text-[20px] leading-snug font-semibold tracking-[-0.015em] transition-colors ${sel ? "text-ink" : "text-gray-500 group-hover:text-gray-300"}`}>
                {d.titre}
              </span>
              <span className={`block overflow-hidden transition-all duration-300 ${sel ? "max-h-28 mt-2 opacity-100" : "max-h-0 opacity-0"}`}>
                <span className="block text-[17px] leading-relaxed text-gray-300">{d.texte}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── L'écran ── */}
      <div className="min-w-0 lg:col-span-8 order-1 lg:order-2">
        <div
          id="ecran-fonctionnalite"
          role="tabpanel"
          aria-labelledby={`onglet-${DIAPOS[actif].cle}`}
          className="rounded-lg bg-ds-surface p-2 sm:p-4"
        >
          <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-ds-elevated">
            {DIAPOS.map((d, i) => (
              <div
                key={d.cle}
                aria-hidden={i !== actif}
                className={`absolute inset-0 transition-opacity duration-500 ease-out ${i === actif ? "opacity-100" : "opacity-0"}`}
              >
                <Image src={`/landing/${d.cle}-sombre.jpg`} alt={i === actif ? d.alt : ""} fill sizes="(min-width: 1800px) 1700px, (min-width: 1024px) 900px, 100vw" quality={90} className="object-cover object-top" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
