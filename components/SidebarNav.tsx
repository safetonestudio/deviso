"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Receipt,
  Package, Users, BarChart3,
  Sparkles, UsersRound, Settings, Wallet, BookOpen, CreditCard, LucideIcon,
} from "lucide-react";

type NavItem =
  | { href: string; label: string; icon: LucideIcon; accent?: boolean; pro?: boolean; ownerOnly?: boolean; section?: never }
  | { section: string; ownerOnly?: boolean; href?: never; label?: never; icon?: never; accent?: never; pro?: never; payment?: never };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",     label: "Accueil",           icon: LayoutDashboard },
  { href: "/proposals/new", label: "Nouveau devis",     icon: Sparkles, accent: true },
  { section: "Facturation" },
  { href: "/proposals",     label: "Devis",             icon: FileText },
  { href: "/invoices",      label: "Factures",          icon: Receipt },
  { section: "Clients", ownerOnly: true },
  { href: "/crm",           label: "Mes clients",       icon: Users,     ownerOnly: true },
  { section: "Pro" },
  { href: "/catalogue",     label: "Catalogue",         icon: Package,    pro: true },
  { href: "/team",          label: "Équipe",            icon: UsersRound, pro: true },
  { section: "Gestion", ownerOnly: true },
  { href: "/paiements",     label: "Paiements clients", icon: Wallet,    ownerOnly: true },
  { href: "/stats",         label: "Activité",          icon: BarChart3, ownerOnly: true },
  { section: "Compte" },
  { href: "/profil",        label: "Paramètres",        icon: Settings,    ownerOnly: true },
  { href: "/billing",       label: "Abonnement",        icon: CreditCard,  ownerOnly: true },
  { href: "/prise-en-main", label: "Prise en main",    icon: BookOpen },
];

const TOUR_TARGETS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/proposals": "proposals",
  "/invoices":  "invoices",
  "/paiements": "paiements",
  "/crm":       "crm",
  "/stats":     "stats",
  "/catalogue": "catalogue",
  "/team":      "team",
  "/profil":         "profil",
  "/prise-en-main":  "prise-en-main",
};

export function SidebarNav({ isMember = false }: { isMember?: boolean }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/proposals/new") return pathname === "/proposals/new";
    if (href === "/invoices/new") return pathname === "/invoices/new";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
      {NAV_ITEMS.map((item, i) => {
        // Cacher les éléments réservés au propriétaire si c'est un membre
        if (isMember && item.ownerOnly) return null;

        if ("section" in item && item.section) {
          return (
            <div key={i} className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                {item.section}
              </p>
            </div>
          );
        }

        if (!item.href) return null;

        const active = isActive(item.href);
        const Icon = item.icon!;

        if (item.accent) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
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
            data-tour={TOUR_TARGETS[item.href]}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 pl-[10px]"
                : "text-gray-400 hover:text-white hover:bg-ds-elevated"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.pro && !isMember && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Pro
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
