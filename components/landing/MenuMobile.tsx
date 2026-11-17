"use client";

import { useRef, useState } from "react";
import Link from "next/link";

/**
 * Menu de la page d'accueil sur téléphone et tablette. Un <details> natif
 * (fonctionne sans JavaScript), qui se referme quand on choisit un lien ou
 * qu'on touche le voile, et dont le libellé suit l'état (Menu / Fermer).
 */
export function MenuMobile({ liens }: { liens: readonly (readonly [string, string])[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const fermer = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className="lg:hidden relative" onToggle={(e) => setOuvert((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="list-none [&::-webkit-details-marker]:hidden h-10 px-4 rounded-lg bg-ds-surface text-[14px] font-semibold text-ink flex items-center cursor-pointer">
        {ouvert ? "Fermer" : "Menu"}
      </summary>
      <div aria-hidden="true" onClick={fermer} className="fixed inset-x-0 top-16 sm:top-[72px] bottom-0 bg-ds-bg opacity-80" />
      <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-ds-elevated p-2 shadow-ds-leve">
        {liens.map(([href, nom]) => (
          <Link key={href} href={href} onClick={fermer} className="block px-3 py-3 rounded-lg text-[17px] font-medium text-ink hover:bg-ds-surface">
            {nom}
          </Link>
        ))}
      </div>
    </details>
  );
}
