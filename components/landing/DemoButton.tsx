"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DemoButtonProps {
  className?: string;
  label?: string;
}

export function DemoButton({ className, label = "Voir la démo" }: DemoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDemo = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/start", { method: "POST" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // On affiche le message renvoyé par l'API tel quel : le masquer derrière
        // un « réessaie dans quelques secondes » générique donnait une consigne
        // fausse en cas de limite horaire, et laissait croire à un blocage.
        setError(
          body.error ||
            (res.status === 429
              ? "Trop de démos lancées depuis cette connexion. Réessayez dans une heure."
              : "La démo n'a pas pu démarrer. Réessayez dans quelques instants.")
        );
        setLoading(false);
        return;
      }

      const { access_token, refresh_token } = await res.json();

      // Passer les tokens dans le hash → demo-callback les lit et initialise la session
      router.push(
        `/auth/demo-callback#access_token=${access_token}&refresh_token=${refresh_token}&token_type=bearer`
      );
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDemo}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Préparation…
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
