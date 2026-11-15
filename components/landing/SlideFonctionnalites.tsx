"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Fonctionnalités de la page d'accueil, en une seule section qui défile :
 * une liste à gauche, un seul grand écran du produit à droite. L'écran change
 * tout seul toutes les 6 secondes, ou au clic. Le défilement automatique
 * s'arrête au survol, au clavier, après un clic, et si le visiteur a demandé
 * moins d'animations.
 *
 * Les écrans sont de vraies captures de l'application (compte de démo), en
 * clair et en sombre : on affiche celle du thème courant.
 */
const DIAPOS = [
  { cle: "nouveau", titre: "Devis par IA en 30 secondes", texte: "Tu décris ta mission, l'IA rédige le devis complet, chiffré, prêt à envoyer.", alt: "L'écran Nouveau devis de Deviso : tu décris ton projet, l'IA génère le devis" },
  { cle: "signature", titre: "Signature électronique", texte: "Ton client ouvre le devis sur son téléphone et signe en quelques secondes.", alt: "Un devis tel que le client le reçoit, prêt à être signé en ligne" },
  { cle: "relances", titre: "Relances automatiques", texte: "Après 3, 7 ou 14 jours sans réponse, Deviso relance ton client à ta place.", alt: "Les actions requises dans Deviso : factures en retard et devis sans réponse à relancer" },
  { cle: "factures", titre: "Factur-X et plateforme agréée", texte: "Factures conformes à la réforme 2026, émises et reçues via une plateforme agréée.", alt: "La liste des factures dans Deviso, avec leur statut et leur montant" },
  { cle: "tableau", titre: "Chiffre d'affaires URSSAF", texte: "Ton CA du mois et du trimestre, prêt à déclarer, sans calculer.", alt: "Le tableau de bord de Deviso : chiffre d'affaires encaissé, seuil de TVA, échéance URSSAF" },
  { cle: "catalogue", titre: "Catalogue et suivi du temps", texte: "Tes prestations réutilisables en un clic, à l'heure ou au forfait.", alt: "Le catalogue de prestations de Deviso" },
] as const;

const DUREE = 6000;

export function SlideFonctionnalites() {
  const [actif, setActif] = useState(0);
  const [auto, setAuto] = useState(false);
  const [pause, setPause] = useState(false);
  const [cycle, setCycle] = useState(0);
  const zone = useRef<HTMLDivElement>(null);

  // Défilement automatique : seulement si les animations sont permises et
  // quand la section est à l'écran.
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
      className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {/* ── La liste ── */}
      <div className="lg:col-span-4 order-2 lg:order-1" role="tablist" aria-label="Fonctionnalités de Deviso">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-5 px-5 sm:mx-0 sm:px-0 pb-1 lg:pb-0 [scrollbar-width:none]">
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
                className={`relative shrink-0 lg:shrink text-left rounded-xl border px-4 py-3 lg:px-5 lg:py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                  sel ? "bg-ds-surface border-ds-border shadow-ds-card" : "border-transparent hover:bg-ds-surface/60"
                }`}
              >
                <span className={`block text-[16px] lg:text-[18px] font-semibold tracking-[-0.01em] whitespace-nowrap lg:whitespace-normal ${sel ? "text-ink" : "text-gray-400"}`}>
                  {d.titre}
                </span>
                <span className={`hidden lg:block overflow-hidden transition-all duration-300 ${sel ? "max-h-24 mt-1.5 opacity-100" : "max-h-0 opacity-0"}`}>
                  <span className="block text-[15px] leading-relaxed text-gray-300">{d.texte}</span>
                </span>
                {sel && (
                  <span className="hidden lg:block absolute left-5 right-5 bottom-0 h-0.5 rounded-full overflow-hidden bg-ds-border" aria-hidden="true">
                    <span
                      key={`${actif}-${cycle}`}
                      className={`block h-full bg-indigo-500 ${enCours ? "barre-diapo" : ""}`}
                      style={{ width: enCours ? undefined : "0%", animationDuration: `${DUREE}ms` }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="lg:hidden mt-4 text-[16px] leading-relaxed text-gray-300">{DIAPOS[actif].texte}</p>
      </div>

      {/* ── L'écran ── */}
      <div className="lg:col-span-8 order-1 lg:order-2">
        <div
          id="ecran-fonctionnalite"
          role="tabpanel"
          aria-labelledby={`onglet-${DIAPOS[actif].cle}`}
          className="relative rounded-2xl border border-ds-border bg-ds-elevated p-2 sm:p-3 shadow-ds-leve"
        >
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-ds-surface">
            {DIAPOS.map((d, i) => (
              <div
                key={d.cle}
                aria-hidden={i !== actif}
                className={`absolute inset-0 transition-all duration-500 ease-out ${i === actif ? "opacity-100 scale-100" : "opacity-0 scale-[1.015]"}`}
              >
                <Image src={`/landing/${d.cle}-clair.jpg`} alt={i === actif ? d.alt : ""} fill sizes="(min-width: 1800px) 1900px, (min-width: 1024px) 1100px, 100vw" quality={90} className="capture-clair object-cover object-top" />
                <Image src={`/landing/${d.cle}-sombre.jpg`} alt="" fill sizes="(min-width: 1800px) 1900px, (min-width: 1024px) 1100px, 100vw" quality={90} className="capture-sombre object-cover object-top" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
