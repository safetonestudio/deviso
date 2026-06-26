"use client";

import { useState } from "react";

export function UpgradeButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className || "bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"}
    >
      {loading ? "Redirection…" : "⚡ Passer Pro — 49€/mois"}
    </button>
  );
}
