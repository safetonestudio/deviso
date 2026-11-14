"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, TOUR_TARGETS, estSection, lienActif, lienVisible, sectionVisible } from "@/lib/navigation";

export function SidebarNav({ isMember = false, isComptable = false }: { isMember?: boolean; isComptable?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {NAVIGATION.map((item, i) => {
        if (estSection(item)) {
          if (!sectionVisible(i, NAVIGATION, isMember, isComptable)) return null;
          return (
            <div key={i} className="pt-5 pb-1.5">
              <p className="px-3 text-[11px] font-medium text-gray-400">
                {item.section}
              </p>
            </div>
          );
        }

        if (!lienVisible(item, isMember, isComptable)) return null;

        const active = lienActif(item.href, pathname);
        const Icon = item.icon;

        if (item.accent) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13.5px] font-semibold transition-colors ${
                active
                  ? "bg-indigo-600 text-ink"
                  : "text-indigo-400 hover:bg-indigo-500/10"
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
            className={`relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13.5px] transition-colors ${
              active
                ? "lien-actif bg-ds-elevated text-ink font-semibold"
                : "text-gray-400 font-medium hover:text-ink hover:bg-ds-elevated"
            }`}
          >
            <Icon size={15} className={`shrink-0 ${active ? "text-indigo-400" : ""}`} />
            <span className="flex-1">{item.label}</span>
            {item.pro && !isMember && (
              <span className="text-[10px] font-medium text-gray-400">
                Pro
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
