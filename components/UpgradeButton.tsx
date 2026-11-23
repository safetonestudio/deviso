"use client";

import { useState } from "react";
import { prix as grille } from "@/lib/grille-tarifaire";

interface UpgradeButtonProps {
  plan?: "solo" | "pro";
  label?: string;
  className?: string;
}

export function UpgradeButton({ plan = "solo", label, className }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLabel = plan === "pro" ? `Passer Pro à ${grille("pro").mensuel}€/mois` : `Passer Solo à ${grille("solo").mensuel}€/mois`;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Erreur lors de la redirection vers le paiement.");
        setLoading(false);
      }
    } catch {
      setError("Erreur réseau. Réessaie dans quelques secondes.");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={className || "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-ink text-sm font-semibold px-4 py-2 rounded-lg transition-colors"}
      >
        {loading ? "Redirection…" : (label || defaultLabel)}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
