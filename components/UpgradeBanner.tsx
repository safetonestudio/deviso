"use client";

import { useState } from "react";

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
      title: "Débloquez les factures, la signature électronique et le logo",
      sub: "Factures Factur-X, e-signature, relances auto, logo personnalisé, dès 18€/mois",
    },
    invoice_blocked: {
      title: "Les factures sont réservées au plan Solo",
      sub: "Passez Solo à 18€/mois pour créer des factures électroniques Factur-X conformes",
    },
    logo_blocked: {
      title: "L'upload de logo est réservé au plan Solo",
      sub: "Personnalisez vos devis avec votre logo en passant au plan Solo",
    },
  };

  const { title, sub } = messages[variant];

  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 flex items-center justify-between gap-4 text-white">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-indigo-200 mt-0.5">{sub}</div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        {loading ? "Redirection…" : "⚡ Passer Solo à 18€/mois"}
      </button>
    </div>
  );
}
