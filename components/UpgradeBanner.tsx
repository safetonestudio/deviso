"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { prix as grille } from "@/lib/grille-tarifaire";

type BannerVariant = "proposal_limit" | "invoice_blocked" | "logo_blocked";

interface UpgradeBannerProps {
  variant?: BannerVariant;
  count?: number;
}

export function UpgradeBanner({ variant = "proposal_limit", count = 0 }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "solo" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  const messages: Record<BannerVariant, { title: string; sub: string }> = {
    proposal_limit: {
      title: "Débloque les factures, la signature électronique et le logo",
      sub: `Factures électroniques, e-signature, relances auto, logo personnalisé, dès ${grille("solo").mensuel}€/mois`,
    },
    // Sans formule, les factures existantes restent consultables (21/11/2026) :
    // seule la CRÉATION est réservée, le texte ne doit pas dire le contraire.
    invoice_blocked: {
      title: "Un abonnement est nécessaire pour créer des factures",
      sub: `Tes factures existantes restent consultables. Solo à ${grille("solo").mensuel}€/mois pour en créer de nouvelles, conformes à la réforme`,
    },
    logo_blocked: {
      title: "L'upload de logo est réservé au plan Solo",
      sub: "Personnalise tes devis avec ton logo en passant au plan Solo",
    },
  };

  const { title, sub } = messages[variant];

  return (
    <div className="mb-6 bg-linear-to-r/srgb from-indigo-600 to-violet-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-ink">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        {/* Même couleur que le titre, atténuée : `text-indigo-200` disparaissait
            sur le fond vert du thème clair. */}
        <div className="text-xs opacity-85 mt-0.5">{sub}</div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 bg-white text-indigo-600 hover:opacity-90 disabled:opacity-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1.5">{!loading && <Zap size={16} className="shrink-0" />}{loading ? "Redirection…" : `Passer Solo à ${grille("solo").mensuel}€/mois`}</span>
      </button>
    </div>
  );
}
