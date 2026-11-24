"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { terminerDemo } from "@/components/DemoSession";
import { Menu, X } from "lucide-react";
import { NAVIGATION, famillesVisibles, lienActif } from "@/lib/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggleIcone } from "@/components/DashboardTheme";


interface MobileNavProps {
  initials: string;
  userName: string;
  userEmail: string;
  isMember?: boolean;
  isComptable?: boolean;
  isDemo?: boolean;
}

export function MobileNav({ initials, userName, userEmail, isMember = false, isComptable = false, isDemo = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    // Même règle que dans la barre latérale : quitter une démo supprime le
    // compte factice. Le menu mobile est un chemin de sortie à part entière,
    // pas une variante d'affichage.
    if (isDemo) {
      await terminerDemo();
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // `lienActif` est partagé avec la barre latérale. La version locale, ici,
  // testait `pathname.startsWith(href)` sans barre finale : « /invoices »
  // s'allumait aussi pour « /invoices-autre-chose ». Une divergence de plus,
  // invisible tant qu'aucune route ne se ressemblait.
  const navLinkClass = (href: string, accent?: boolean) => {
    const active = lienActif(href, pathname);
    const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors";
    if (accent) {
      return `${base} font-semibold text-indigo-400 ${active ? "nav-lien-actif" : "hover:bg-ds-elevated"}`;
    }
    return `${base} ${
      active
        ? "nav-lien-actif text-ink font-semibold [&>svg]:text-indigo-400"
        : "font-medium text-gray-400 hover:text-ink hover:bg-ds-elevated"
    }`;
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-ds-bg border-b border-ds-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 min-h-10">
            <div className="w-7 h-7 rounded-[7px] bg-indigo-600 flex items-center justify-center">
              <span className="text-ink font-display font-semibold text-[15px]">D</span>
            </div>
            <span className="font-display font-semibold text-[17px] tracking-tight text-ink">Deviso</span>
          </Link>
          <ThemeToggleIcone />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell placement="topbar" />
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-ds-elevated transition-colors" aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-60 bg-black/60 backdrop-blur-xs" onClick={() => setOpen(false)} />}

      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-60 w-72 nav-panneau border-r border-ds-border flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-linear-to-br/srgb from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-ink font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-ink">Deviso</span>
          </Link>
          <button onClick={() => setOpen(false)} className="p-2.5 -m-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-ds-elevated transition-colors" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Mêmes familles en creux que la barre latérale (voir SidebarNav). */}
        <nav aria-label="Navigation principale" className="flex-1 p-3 space-y-2 overflow-y-auto">
          {famillesVisibles(NAVIGATION, isMember, isComptable).map((famille, i) => (
            <div key={famille.titre ?? `famille-${i}`} className="nav-famille p-1.5">
              {famille.titre && (
                <p className="px-3 pt-1 pb-1 text-xs font-semibold text-gray-500">{famille.titre}</p>
              )}
              {famille.liens.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={lienActif(item.href, pathname) ? "page" : undefined}
                    className={navLinkClass(item.href, item.accent)}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.pro && !isMember && <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">Pro</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-1 space-y-2">
          <div className="nav-famille flex items-center gap-3 p-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-sm flex items-center justify-center shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink truncate">{userName || "Mon compte"}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full text-xs text-gray-600 hover:text-gray-400 text-left px-2 py-1 transition-colors">
            Se déconnecter →
          </button>
        </div>
      </div>
    </>
  );
}
