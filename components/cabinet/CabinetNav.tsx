"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAVIGATION_CABINET, estSectionCabinet, lienActifCabinet } from "@/lib/navigation-cabinet";
import { ThemeToggleIcone } from "@/components/DashboardTheme";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * Navigation de l'espace cabinet : barre latérale (ordinateur) et menu tiroir
 * (téléphone), mêmes classes que SidebarNav / MobileNav de l'app du client,
 * pour que les deux espaces se lisent comme un seul produit.
 */
export function CabinetSidebarNav() {
  const chemin = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Espace cabinet">
      {NAVIGATION_CABINET.map((item, i) => {
        if (estSectionCabinet(item)) {
          return (
            <div key={i} className="pt-5 pb-1.5">
              <p className="px-3 text-[11px] font-medium text-gray-400">{item.section}</p>
            </div>
          );
        }
        const actif = lienActifCabinet(item.href, chemin);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={actif ? "page" : undefined}
            className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13.5px] transition-colors ${
              actif ? "lien-actif bg-ds-elevated text-ink font-semibold" : "text-gray-400 font-medium hover:text-ink hover:bg-ds-elevated"
            }`}
          >
            <Icon size={15} className={`shrink-0 ${actif ? "text-indigo-400" : ""}`} />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function CabinetMobileNav({ nomCabinet, email, initiales }: { nomCabinet: string; email: string; initiales: string }) {
  const [ouvert, setOuvert] = useState(false);
  const chemin = usePathname();

  useEffect(() => { setOuvert(false); }, [chemin]);
  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [ouvert]);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-ds-bg border-b border-ds-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <Link href="/cabinet" className="flex items-center gap-2 min-h-10">
            <div className="w-7 h-7 rounded-[7px] bg-indigo-600 flex items-center justify-center">
              <span className="text-on-accent font-display font-semibold text-[15px]">D</span>
            </div>
            <span className="font-display font-semibold text-[17px] tracking-tight text-ink">Deviso</span>
            <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-sm">Cabinet</span>
          </Link>
          <ThemeToggleIcone />
        </div>
        <button onClick={() => setOuvert(true)} className="p-2 rounded-lg text-gray-500 hover:bg-ds-elevated transition-colors" aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
      </div>

      {ouvert && <div className="lg:hidden fixed inset-0 z-60 bg-black/60 backdrop-blur-xs" onClick={() => setOuvert(false)} />}

      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-60 w-72 bg-ds-bg border-r border-ds-border flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-ds-border flex items-center justify-between">
          <span className="font-semibold text-ink">Espace cabinet</span>
          <button onClick={() => setOuvert(false)} className="p-2.5 -m-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-ds-elevated transition-colors" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <CabinetSidebarNav />
        <div className="p-4 border-t border-ds-border">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-sm flex items-center justify-center shrink-0">{initiales}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink truncate">{nomCabinet}</div>
              <div className="text-xs text-gray-500 truncate">{email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
