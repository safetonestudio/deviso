import type { LucideIcon } from "lucide-react";
import { BookOpenCheck, Briefcase, History, Landmark, LayoutGrid, Settings, ShieldCheck, UserPlus } from "lucide-react";

/**
 * Menu de l'espace cabinet, source unique de la barre latérale et du menu
 * mobile (comme lib/navigation.ts pour l'app du client). 20/11/2026 : l'espace
 * cabinet prend le même cadre que l'app du client, à la demande de Selim.
 */
export type LienCabinet = { href: string; label: string; icon: LucideIcon };
export type SectionCabinet = { section: string };
export type ElementCabinet = LienCabinet | SectionCabinet;

export const estSectionCabinet = (e: ElementCabinet): e is SectionCabinet => "section" in e;

export const NAVIGATION_CABINET: ElementCabinet[] = [
  { href: "/cabinet", label: "Accueil", icon: LayoutGrid },
  { section: "Dossiers" },
  { href: "/cabinet/dossiers", label: "Portefeuille", icon: Briefcase },
  { href: "/cabinet/inviter", label: "Inviter un client", icon: UserPlus },
  { section: "Déclarations" },
  { href: "/cabinet/tva", label: "TVA à déclarer", icon: Landmark },
  { href: "/cabinet/conformite", label: "Conformité réforme", icon: BookOpenCheck },
  { section: "Cabinet" },
  { href: "/cabinet/journal", label: "Journal des accès", icon: History },
  { href: "/cabinet/confiance", label: "Sécurité et confiance", icon: ShieldCheck },
  { href: "/cabinet/parametres", label: "Paramètres", icon: Settings },
];

const RESERVES = ["/cabinet/dossiers", "/cabinet/inviter", "/cabinet/tva", "/cabinet/conformite", "/cabinet/journal", "/cabinet/confiance", "/cabinet/comptes-fec", "/cabinet/parametres"];

/** Lien actif. Une fiche dossier (/cabinet/<id>) appartient au portefeuille. */
export function lienActifCabinet(href: string, chemin: string): boolean {
  if (href === "/cabinet") return chemin === "/cabinet";
  if (href === "/cabinet/dossiers") {
    if (chemin === href || chemin.startsWith(href + "/")) return true;
    return chemin.startsWith("/cabinet/") && !RESERVES.some((r) => chemin === r || chemin.startsWith(r + "/"));
  }
  return chemin === href || chemin.startsWith(href + "/");
}
