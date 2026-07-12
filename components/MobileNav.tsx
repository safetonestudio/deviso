"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, FileText, Receipt,
  Package, Users, BarChart3,
  Sparkles, UsersRound, Settings, Wallet, BookOpen, CreditCard, LucideIcon,
  Menu, X,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

type NavItem =
  | { type: "section"; label: string; ownerOnly?: boolean }
  | { type: "link"; href: string; icon: LucideIcon; label: string; accent?: boolean; pro?: boolean; ownerOnly?: boolean };

const NAV: NavItem[] = [
  { type: "link", href: "/dashboard",     icon: LayoutDashboard, label: "Accueil" },
  { type: "section", label: "Facturation" },
  { type: "link", href: "/proposals",     icon: FileText,        label: "Devis" },
  { type: "link", href: "/proposals/new", icon: Sparkles,        label: "Nouveau devis", accent: true },
  { type: "link", href: "/invoices",      icon: Receipt,         label: "Factures" },
  { type: "link", href: "/paiements",     icon: Wallet,          label: "Paiements clients", ownerOnly: true },
  { type: "section", label: "Clients", ownerOnly: true },
  { type: "link", href: "/crm",           icon: Users,           label: "Mes clients",  ownerOnly: true },
  { type: "link", href: "/stats",         icon: BarChart3,       label: "Activité",     ownerOnly: true },
  { type: "section", label: "Pro" },
  { type: "link", href: "/catalogue",     icon: Package,         label: "Catalogue",    pro: true },
  { type: "link", href: "/team",          icon: UsersRound,      label: "Équipe",       pro: true },
  { type: "section", label: "Compte" },
  { type: "link", href: "/profil",        icon: Settings,        label: "Paramètres",   ownerOnly: true },
  { type: "link", href: "/billing",       icon: CreditCard,      label: "Abonnement",   ownerOnly: true },
  { type: "link", href: "/prise-en-main", icon: BookOpen,        label: "Prise en main" },
];

interface MobileNavProps {
  initials: string;
  userName: string;
  userEmail: string;
  isMember?: boolean;
}

export function MobileNav({ initials, userName, userEmail, isMember = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/proposals/new") return pathname === "/proposals/new";
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  const navLinkClass = (href: string, accent?: boolean) => {
    const active = isActive(href);
    if (accent) {
      return active
        ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white"
        : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all";
    }
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 pl-[10px]"
        : "text-gray-400 hover:text-white hover:bg-ds-elevated"
    }`;
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-ds-bg border-b border-ds-border flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">D</span>
          </div>
          <span className="font-semibold text-white text-sm">Deviso</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell placement="topbar" />
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-ds-elevated transition-colors" aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-[60] w-72 bg-ds-bg border-r border-ds-border flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-ds-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-white">Deviso</span>
          </Link>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-ds-elevated transition-colors" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            // Cacher les éléments réservés au propriétaire si c'est un membre
            if (isMember && item.ownerOnly) return null;

            if (item.type === "section") {
              return (
                <div key={i} className="pt-4 pb-1">
                  <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href, item.accent)}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.pro && !isMember && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Pro</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ds-border space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-sm flex items-center justify-center flex-shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{userName || "Mon compte"}</div>
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
