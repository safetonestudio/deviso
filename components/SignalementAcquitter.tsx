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
      className="shrink-0 text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold transition-colors disabled:opacity-50"
    >
      {busy ? "…" : "Marquer comme traité"}
    </button>
  );
}
