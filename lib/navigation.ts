import {
  LayoutDashboard,
  FileText,
  Receipt,
  Package,
  Users,
  BarChart3,
  Sparkles,
  UsersRound,
  Settings,
  Wallet,
  BookOpen,
  CreditCard,
  Inbox,
  type LucideIcon,
} from "lucide-react";

/**
 * Source unique de la navigation du tableau de bord.
 *
 * Pourquoi ce fichier existe. La barre latérale et le menu mobile portaient
 * chacun leur propre liste, tenues à la main. Elles avaient silencieusement
 * divergé :
 *
 *   · « Paiements clients » — sous *Gestion* sur ordinateur, sous *Facturation*
 *     sur mobile ;
 *   · « Activité » — sous *Gestion* sur ordinateur, sous *Clients* sur mobile ;
 *   · « Nouveau devis » — raccourci hors section sur ordinateur, rangé dans
 *     *Facturation* sur mobile ;
 *   · la section *Gestion* n'existait pas du tout sur mobile ;
 *   · « Factures reçues » manquait purement et simplement sur mobile.
 *
 * Aucune de ces divergences n'était voulue. Elles se sont installées parce que
 * chaque ajout demandait de penser à deux endroits — et que rien ne le
 * rappelait. Un utilisateur qui passe du téléphone à l'ordinateur ne retrouve
 * pas ses repères, sans qu'on puisse lui dire pourquoi.
 *
 * La structure retenue est celle de l'ordinateur : *Paiements clients* et
 * *Activité* relèvent bien de la gestion et non de la facturation ni des
 * clients, et « Nouveau devis » gagne à rester un raccourci visible en haut
 * plutôt qu'une ligne parmi d'autres.
 *
 * ⚠️ Toute différence entre les deux supports doit désormais s'écrire ici, comme
 * une donnée. `scripts/check-nav.mjs` refuse toute divergence qui ne serait pas
 * déclarée.
 */

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Mise en avant visuelle : action principale, pas une simple page. */
  accent?: boolean;
  /** Réservé au plan Pro. */
  pro?: boolean;
  /** Masqué pour les membres invités d'un espace de travail. */
  ownerOnly?: boolean;
};

export type NavSection = { section: string; ownerOnly?: boolean };

export type NavItem = NavLink | NavSection;

export const estSection = (item: NavItem): item is NavSection => "section" in item;

export const NAVIGATION: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },

  // Hors section, juste sous l'accueil : c'est l'action que l'utilisateur vient
  // faire le plus souvent, pas une rubrique à parcourir.
  { href: "/proposals/new", label: "Nouveau devis", icon: Sparkles, accent: true },

  { section: "Facturation" },
  { href: "/proposals", label: "Devis", icon: FileText },
  { href: "/invoices", label: "Factures", icon: Receipt },
  // Même objet métier que « Factures », vu depuis l'autre bout : reçues plutôt
  // qu'émises. D'où la position immédiatement après.
  { href: "/factures-recues", label: "Factures reçues", icon: Inbox, ownerOnly: true },

  { section: "Clients", ownerOnly: true },
  { href: "/crm", label: "Mes clients", icon: Users, ownerOnly: true },

  { section: "Pro" },
  { href: "/catalogue", label: "Catalogue", icon: Package, pro: true },
  { href: "/team", label: "Équipe", icon: UsersRound, pro: true },

  { section: "Gestion", ownerOnly: true },
  { href: "/paiements", label: "Paiements clients", icon: Wallet, ownerOnly: true },
  { href: "/stats", label: "Activité", icon: BarChart3, ownerOnly: true },

  { section: "Compte" },
  { href: "/profil", label: "Paramètres", icon: Settings, ownerOnly: true },
  { href: "/billing", label: "Abonnement", icon: CreditCard, ownerOnly: true },
  { href: "/prise-en-main", label: "Prise en main", icon: BookOpen },
];

/** Cibles de la visite guidée, indexées par chemin. */
export const TOUR_TARGETS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/proposals": "proposals",
  "/invoices": "invoices",
  "/paiements": "paiements",
  "/crm": "crm",
  "/stats": "stats",
  "/catalogue": "catalogue",
  "/team": "team",
  "/profil": "profil",
  "/prise-en-main": "prise-en-main",
};

/**
 * Un lien est-il celui de la page courante ?
 *
 * Les pages de création sont traitées à part : `/proposals/new` commence par
 * `/proposals`, sans quoi les deux entrées s'allumeraient ensemble.
 */
export function lienActif(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/proposals/new") return pathname === "/proposals/new";
  if (href === "/invoices/new") return pathname === "/invoices/new";
  if (href === "/proposals") return pathname === "/proposals" || pathname.startsWith("/proposals/");
  return pathname === href || pathname.startsWith(href + "/");
}
