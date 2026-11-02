"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Bouton par lequel le client marque un signalement de son cabinet comme traite. */
export function SignalementAcquitter({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function traiter() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/signalements/traiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (r.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={traiter}
      disabled={busy}
      className="shrink-0 text-xs px-2.5 py-1.5 border border-ds-border text-gray-300 rounded-lg hover:bg-ink/5 font-medium transition-colors disabled:opacity-50"
    >
      {busy ? "…" : "Marquer traité"}
    </button>
  );
}
