"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Relance manuelle de la synchronisation.
 *
 * Elle fait double emploi avec les deux déclencheurs automatiques, et c'est
 * volontaire : quelqu'un qui attend une facture précise veut pouvoir vérifier
 * lui-même plutôt que se demander si le mécanisme a tourné. Le serveur impose
 * son propre délai minimal, donc ce bouton ne peut pas être abusé.
 */
export function SyncButton({ derniere }: { derniere: string | null }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const relire = async () => {
    setEnCours(true);
    setMessage(null);
    try {
      const r = await fetch("/api/superpdp/sync", { method: "POST" });
      const res = await r.json();

      if (res.raison === "trop_recent") {
        setMessage("Déjà vérifié il y a moins de 3 minutes.");
      } else if (res.raison === "verification_en_cours") {
        setMessage("Super PDP vérifie encore le rattachement de votre entreprise.");
      } else if (res.raison) {
        setMessage("La vérification a échoué. Réessayez dans un moment.");
      } else if (res.recuperees > 0) {
        setMessage(`${res.entrantes} facture${res.entrantes > 1 ? "s" : ""} reçue${res.entrantes > 1 ? "s" : ""}.`);
        router.refresh();
      } else {
        setMessage("Aucune nouvelle facture.");
      }
    } catch {
      setMessage("Vérification impossible, connexion interrompue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="text-right">
      <button
        onClick={relire}
        disabled={enCours}
        className="px-3 py-2 rounded-lg border border-ds-border text-gray-300 hover:text-white hover:bg-ds-elevated text-sm font-medium transition-colors disabled:opacity-60"
      >
        {enCours ? "Vérification…" : "Vérifier maintenant"}
      </button>
      <p className="text-xs text-gray-600 mt-1.5">
        {message ??
          (derniere
            ? `Dernière vérification à ${new Date(derniere).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
            : "Jamais vérifié")}
      </p>
    </div>
  );
}
