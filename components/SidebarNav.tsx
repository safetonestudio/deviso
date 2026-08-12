"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, TOUR_TARGETS, estSection, lienActif } from "@/lib/navigation";

export function SidebarNav({ isMember = false }: { isMember?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
      {NAVIGATION.map((item, i) => {
        // Cacher les éléments réservés au propriétaire si c'est un membre
        if (isMember && item.ownerOnly) return null;

        if (estSection(item)) {
          return (
            <div key={i} className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                {item.section}
              </p>
            </div>
          );
        }

        const active = lienActif(item.href, pathname);
        const Icon = item.icon;

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
