"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, TOUR_TARGETS, famillesVisibles, lienActif } from "@/lib/navigation";

/**
 * Barre latérale. Chaque famille (Facturation, Clients, Mon entreprise...) est
 * dessinée dans une zone légèrement creusée (`nav-famille`, globals.css), sans
 * cadre ni trait : la lumière seule distingue les familles (choix de Selim,
 * 24/11/2026). Le lien de la page ouverte ressort de ce creux, en relief.
 */
export function SidebarNav({ isMember = false, isComptable = false }: { isMember?: boolean; isComptable?: boolean }) {
  const pathname = usePathname();
  const familles = famillesVisibles(NAVIGATION, isMember, isComptable);

  return (
    <nav aria-label="Navigation principale" className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
      {familles.map((famille, i) => (
        <div key={famille.titre ?? `famille-${i}`} className="nav-famille p-1.5">
          {famille.titre && (
            <p className="px-2.5 pt-1 pb-1 text-[11.5px] font-semibold text-gray-500">{famille.titre}</p>
          )}
          {famille.liens.map((item) => {
            const active = lienActif(item.href, pathname);
            const Icon = item.icon;

            if (item.accent) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13.5px] font-semibold transition-colors ${
                    active ? "nav-lien-actif text-indigo-400" : "text-indigo-400 hover:bg-ds-elevated"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-tour={TOUR_TARGETS[item.href]}
                className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13.5px] transition-colors ${
                  active
                    ? "nav-lien-actif text-ink font-semibold"
                    : "text-gray-400 font-medium hover:text-ink hover:bg-ds-elevated"
                }`}
              >
                <Icon size={15} className={`shrink-0 ${active ? "text-indigo-400" : ""}`} />
                <span className="flex-1">{item.label}</span>
                {item.pro && !isMember && (
                  <span className="text-[10.5px] font-semibold text-indigo-400 bg-indigo-500/10 rounded-md px-1.5 py-px">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
