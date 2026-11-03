"use client";

import { useRef, useState } from "react";
import { BarreRecherche } from "./BarreRecherche";

/**
 * Recherche locale par-dessus une liste rendue cote SERVEUR.
 *
 * Les cartes restent rendues par le serveur (formatage deterministe, volet
 * <details> natif, aucune rehydratation) : ce composant ne reformate rien, il
 * se contente de montrer ou cacher les elements porteurs d'un attribut
 * data-recherche selon la saisie. On evite ainsi l'ecart d'hydratation qui
 * avait casse la page des factures recues quand la liste etait un composant
 * client (erreur React #418).
 */
export function FiltreListe({
  placeholder,
  rienTrouve = "Aucun résultat",
  children,
}: {
  placeholder?: string;
  rienTrouve?: string;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [vide, setVide] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function filtrer(valeur: string) {
    setQ(valeur);
    const f = valeur.trim().toLowerCase();
    const racine = ref.current;
    if (!racine) return;
    let visibles = 0;
    racine.querySelectorAll<HTMLElement>("[data-recherche]").forEach((el) => {
      const ok = !f || (el.dataset.recherche ?? "").includes(f);
      el.style.display = ok ? "" : "none";
      if (ok) visibles++;
    });
    setVide(visibles === 0);
  }

  return (
    <>
      <div className="mt-4">
        <BarreRecherche value={q} onChange={filtrer} placeholder={placeholder} />
      </div>
      <div ref={ref} className="space-y-2.5 mt-4">
        {children}
      </div>
      {vide && (
        <p className="text-sm text-gray-500 text-center py-10">
          {rienTrouve} pour «&nbsp;{q}&nbsp;»
        </p>
      )}
    </>
  );
}
