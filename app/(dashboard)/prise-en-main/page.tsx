"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  Check,
  FileText,
  Receipt,
  Package,
  Sparkles,
  Wallet,
  Palette,
  Bell,
  UsersRound,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  BarChart3,
  LayoutTemplate,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useGuidedTour } from "@/hooks/useGuidedTour";

/**
 * Icônes : `lucide-react` uniquement, jamais d'emoji.
 *
 * Les emoji sont rendus par la police du système : multicolores, et différents
 * sur chaque appareil. À côté d'une barre latérale en lucide (monochrome, trait
 * fin), ça fait deux identités visuelles dans la même page. Quand une entrée
 * correspond à une page du menu, on reprend **la même icône que
 * `lib/navigation.ts`** — l'utilisateur doit reconnaître la page au même dessin
 * des deux côtés.
 */

const GUIDES: {
  slug: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  time: number;
}[] = [
  {
    slug: "premier-devis",
    icon: FileText,
    title: "Créer son premier devis en 3 min",
    desc: "Étapes, raccourcis et bons réflexes pour un premier devis réussi.",
    time: 4,
  },
  {
    slug: "devis-a-facture",
    icon: Receipt,
    title: "Du devis à la facture : acompte et solde",
    desc: "Transforme un devis accepté en facturation pro en 2 clics.",
    time: 4,
  },
  {
    slug: "catalogue-prestations",
    icon: Package,
    title: "Maîtriser son catalogue de prestations",
    desc: "Crée tes forfaits et taux horaires une fois, réutilise-les partout.",
    time: 3,
  },
  {
    slug: "catalogue-ia",
    icon: Sparkles,
    title: "Catalogue & IA : pourquoi ça change tout",
    desc: "Un catalogue bien renseigné = des devis IA précis dès le premier jet.",
    time: 5,
  },
  {
    slug: "paiements-clients",
    icon: Wallet,
    title: "Configurer ses paiements clients",
    desc: "IBAN, lien de paiement : comment tes clients règlent depuis la facture.",
    time: 3,
  },
  {
    slug: "personnaliser-documents",
    icon: Palette,
    title: "Personnaliser son profil et ses documents",
    desc: "Logo, couleurs, CGV : soigne ton image à chaque devis envoyé.",
    time: 3,
  },
  {
    slug: "suivre-relancer-devis",
    icon: Bell,
    title: "Suivre et relancer ses devis",
    desc: "Sache exactement où en est chaque devis et relance au bon moment.",
    time: 4,
  },
  {
    slug: "gerer-equipe",
    icon: UsersRound,
    title: "Gérer son équipe sur Deviso",
    desc: "Inviter des membres, configurer les validations, comprendre les rôles.",
    time: 4,
  },
  {
    slug: "exports-comptables",
    icon: FileSpreadsheet,
    title: "Exporter sa comptabilité",
    desc: "FEC, CSV, récap mensuel : tout ce dont ton comptable a besoin.",
    time: 3,
  },
];

const STORAGE_KEY = "deviso_guides_read";

const PAGES: { icon: LucideIcon; label: string; desc: string }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", desc: "KPIs, alertes et vue d'ensemble de votre activité" },
  { icon: FileText, label: "Devis", desc: "Créer, envoyer et suivre vos devis" },
  { icon: Receipt, label: "Factures", desc: "Factures Factur-X, récurrentes et exports" },
  { icon: Wallet, label: "Paiements clients", desc: "Configurer vos moyens de paiement (IBAN, lien)" },
  { icon: Users, label: "Clients & Revenus", desc: "CRM automatique et suivi des revenus" },
  { icon: BarChart3, label: "Performance", desc: "Analytics et exports comptables" },
  { icon: LayoutTemplate, label: "Modèles de devis", desc: "Créer des devis types réutilisables (Pro)" },
  { icon: UsersRound, label: "Équipe", desc: "Multi-utilisateurs et validation (Pro)" },
  { icon: Settings, label: "Paramètres", desc: "Profil, apparence et domaine email personnalisé" },
];

export default function PriseEnMainPage() {
  const { enabled, toggle, mounted } = useGuidedTour();
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReadSlugs(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  if (!mounted) return null;

  const readCount = readSlugs.size;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight">Prise en main</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tout ce dont tu as besoin pour utiliser Deviso à 100 % de son potentiel.
        </p>
      </div>

      {/* ── Mode guidé ── */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="font-semibold text-white text-base">Mode guidé</h2>
            <p className="text-sm text-gray-400 mt-1">
              Quand activé, une carte explicative apparaît en haut de chaque page pour vous expliquer comment elle fonctionne. Désactivez-le quand vous n&apos;en avez plus besoin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle(!enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200 focus:outline-none ${
              enabled
                ? "bg-indigo-600 border-indigo-600"
                : "bg-ds-elevated border-ds-border"
            }`}
            aria-pressed={enabled}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="mt-4 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
            <Check size={16} className="text-indigo-400 shrink-0" />
            <span className="text-sm text-indigo-300">Mode guidé actif, des explications apparaissent sur toutes les pages</span>
          </div>
        )}
      </section>

      {/* ── Guides Deviso ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-white text-base">Guides Deviso</h2>
          {readCount > 0 && (
            <span className="text-xs text-gray-500">
              {readCount}/{GUIDES.length} lu{readCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Des guides pratiques pour maîtriser chaque fonctionnalité, avec les bonnes pratiques incluses.
        </p>

        <div className="space-y-2">
          {GUIDES.map((guide) => {
            const isRead = readSlugs.has(guide.slug);
            const Icon = guide.icon;
            return (
              <Link
                key={guide.slug}
                href={`/prise-en-main/${guide.slug}`}
                className="flex items-center gap-4 bg-ds-surface hover:bg-ds-elevated border border-ds-border hover:border-indigo-500/30 rounded-xl px-4 py-3.5 transition-all group"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ds-elevated border border-ds-border text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors leading-snug">
                    {guide.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{guide.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[11px] text-gray-600">
                    <Clock size={10} />
                    {guide.time} min
                  </span>
                  {isRead ? (
                    <CheckCircle size={14} className="text-indigo-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-ds-border" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {readCount === GUIDES.length && (
          <div className="mt-4 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2.5">
            <CheckCircle size={14} className="text-indigo-400 shrink-0" />
            <span className="text-sm text-indigo-300">Tu as lu tous les guides, tu maîtrises Deviso !</span>
          </div>
        )}
      </section>

      {/* ── Pages couvertes ── */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4 text-sm">Pages couvertes par le mode guidé</h2>
        <div className="space-y-3">
          {PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <div key={page.label} className="flex items-center gap-3 py-2 border-b border-ds-border last:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ds-elevated border border-ds-border text-gray-400">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{page.label}</p>
                  <p className="text-xs text-gray-500">{page.desc}</p>
                </div>
                {enabled && (
                  <span className="ml-auto text-xs text-indigo-400 font-medium shrink-0">Actif</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-gray-600 mt-4 text-center">
        Tes préférences sont enregistrées localement dans ton navigateur.
      </p>
    </div>
  );
}
