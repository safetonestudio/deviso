"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation de l'espace cabinet. Avant le 20/11/2026, tout tenait sur une
 * seule page (portefeuille, conformité, calendrier de TVA, invitations) :
 * une page par sujet, comme dans l'app du client.
 */
const LIENS = [
  { href: "/cabinet", libelle: "Portefeuille" },
  { href: "/cabinet/tva", libelle: "TVA à déclarer" },
  { href: "/cabinet/conformite", libelle: "Conformité réforme" },
  { href: "/cabinet/journal", libelle: "Journal des accès" },
];

export function CabinetNav() {
  const chemin = usePathname();
  // Une fiche dossier (/cabinet/<id>) appartient au portefeuille.
  const actif = (href: string) =>
    href === "/cabinet"
      ? chemin === "/cabinet" || !LIENS.some((l) => l.href !== "/cabinet" && chemin.startsWith(l.href))
      : chemin.startsWith(href);

  return (
    <nav aria-label="Espace cabinet" className="flex gap-1 overflow-x-auto [scrollbar-width:none] -mb-px">
      {LIENS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={actif(l.href) ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            actif(l.href) ? "border-indigo-500 text-ink" : "border-transparent text-gray-400 hover:text-ink"
          }`}
        >
          {l.libelle}
        </Link>
      ))}
    </nav>
  );
}
