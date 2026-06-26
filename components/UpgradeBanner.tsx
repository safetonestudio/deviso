"use client";

import { useState } from "react";

export function UpgradeBanner({ count }: { count: number }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-brand-600 to-indigo-500 rounded-2xl p-5 flex items-center justify-between gap-4 text-white">
      <div>
        <div className="font-bold text-sm">Plan gratuit — {count}/3 devis utilisés</div>
        <div className="text-xs text-indigo-100 mt-0.5">
          Passez Pro pour des devis illimités + factures Factur-X
        </div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 bg-white text-brand-600 hover:bg-indigo-50 disabled:opacity-50 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? "Redirection…" : "⚡ Passer Pro — 49€/mois"}
      </button>
    </div>
  );
}
