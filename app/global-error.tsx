"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808", color: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Une erreur est survenue</h1>
          <p style={{ color: "#9ca3af", marginTop: "0.5rem" }}>Le probleme a ete signale. Tu peux reessayer.</p>
          <button onClick={() => reset()} style={{ marginTop: "1.25rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
