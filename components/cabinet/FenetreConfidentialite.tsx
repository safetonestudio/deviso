"use client";

import { useEffect, useRef, useState } from "react";
import { PolitiqueConfidentialiteTexte } from "@/components/legal/PolitiqueConfidentialiteTexte";

/**
 * Politique de confidentialité ouverte dans une fenêtre, sans quitter l'espace
 * cabinet (20/11/2026, demande de Selim : le lien menait au site public). Le
 * texte est celui de la page /confidentialite (source unique). Pas
 * d'animation : règle de l'app.
 */
export function FenetreConfidentialite({ libelle = "politique de confidentialité" }: { libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", surTouche);
    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    boite.current?.focus();
    const retour = declencheur.current;
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = defilement;
      retour?.focus();
    };
  }, [ouvert]);

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert(true)}
        className="text-indigo-400 hover:text-indigo-300"
      >
        {libelle}
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOuvert(false)} aria-hidden="true" />
          <div
            ref={boite}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-confidentialite"
            className="relative carte carte-lg w-full sm:max-w-3xl max-h-[90vh] flex flex-col outline-hidden rounded-b-none sm:rounded-b-[18px]"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ds-border">
              <h2 id="titre-confidentialite" className="text-lg font-semibold text-ink">
                Politique de confidentialité
              </h2>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="px-6 pt-5 pb-2 overflow-y-auto text-left">
              <PolitiqueConfidentialiteTexte />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-ds-border">
              <a href="/confidentialite" target="_blank" rel="noopener" className="text-sm text-gray-400 hover:text-ink">
                Ouvrir dans un nouvel onglet
              </a>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="h-10 px-4 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
