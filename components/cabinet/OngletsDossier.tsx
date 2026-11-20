"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Onglets de la fiche d'un dossier client, côté cabinet.
 *
 * La fiche empilait six blocs sur près de cinq écrans de défilement : le
 * reproche fait à la page /experts-comptables, réglé sur le site par des
 * onglets (OngletsVitrine). Même principe ici : un sujet à la fois.
 * L'onglet ouvert est reflété dans l'adresse (#tva, #factures...) pour qu'un
 * retour arrière ou un lien partagé rouvre le même.
 *
 * Les contenus sont rendus par la page serveur et passés tels quels : ce
 * composant ne fait que choisir lequel afficher. Pas d'animation (règle de
 * l'app : transitions fonctionnelles seulement).
 */
export type Onglet = {
  id: string;
  libelle: string;
  /** Compteur discret à côté du libellé (anomalies, factures...). */
  compteur?: number;
  /** Le compteur signale quelque chose à faire : teinte d'alerte. */
  alerte?: boolean;
  contenu: ReactNode;
};

export function OngletsDossier({ onglets }: { onglets: Onglet[] }) {
  const [actif, setActif] = useState(onglets[0]?.id);

  useEffect(() => {
    const lireHash = () => {
      const h = window.location.hash.slice(1);
      if (onglets.some((o) => o.id === h)) setActif(h);
    };
    lireHash();
    window.addEventListener("hashchange", lireHash);
    return () => window.removeEventListener("hashchange", lireHash);
  }, [onglets]);

  const choisir = (id: string) => {
    setActif(id);
    history.replaceState(null, "", `#${id}`);
  };

  const courant = onglets.find((o) => o.id === actif) ?? onglets[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections du dossier"
        className="flex gap-1 mb-6 border-b border-ds-border overflow-x-auto [scrollbar-width:none]"
      >
        {onglets.map((o) => {
          const choisi = o.id === courant?.id;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              id={`onglet-${o.id}`}
              aria-selected={choisi}
              aria-controls={`panneau-${o.id}`}
              onClick={() => choisir(o.id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap ${
                choisi ? "border-indigo-500 text-ink" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {o.libelle}
              {typeof o.compteur === "number" && o.compteur > 0 && (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] leading-5 text-center tabular-nums ${
                    o.alerte ? "bg-amber-500/15 text-amber-400" : "bg-ink/8 text-gray-400"
                  }`}
                >
                  {o.compteur}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {courant && (
        <div role="tabpanel" id={`panneau-${courant.id}`} aria-labelledby={`onglet-${courant.id}`}>
          {courant.contenu}
        </div>
      )}
    </div>
  );
}
