"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIONS_DESTINATAIRE } from "@/lib/superpdp-cycle";

/**
 * Les réponses possibles à une facture reçue, autres que le refus.
 *
 * Jusqu'ici l'écran n'offrait qu'une action, et c'était la plus grave : le
 * refus, « définitif et global », qui oblige le fournisseur à passer un avoir.
 * Quelqu'un qui voulait signaler une erreur de montant n'avait pas d'autre
 * choix que d'annuler la facture entière. Contester (`fr:207`) et suspendre
 * (`fr:208`) existent exactement pour ça.
 *
 * Le menu reste replié : ces actions sont utiles mais rares, et les étaler
 * ferait passer la contestation pour la conduite normale.
 */
export function ActionsCycle({
  factureId,
  statutActuel,
}: {
  factureId: number;
  statutActuel: string | null;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const poser = async (code: string) => {
    setEnCours(code);
    setMessage(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${factureId}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, note: note.trim() || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage(d.message || d.error || "Action impossible.");
        return;
      }
      setMessage(d.dejaPose ? "C'était déjà fait." : "Envoyé à votre fournisseur.");
      setNote("");
      router.refresh();
    } catch {
      setMessage("Action impossible : connexion interrompue.");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="inline-block text-left">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="text-xs text-gray-400 hover:text-white font-medium whitespace-nowrap transition-colors"
      >
        Répondre
      </button>

      {ouvert && (
        <div className="mt-2 bg-ds-elevated border border-ds-border rounded-lg p-3 space-y-2 max-w-xs">
          {/* Le commentaire libre accompagne l'action : sans lui, le
              fournisseur reçoit un code et doit deviner ce qui ne va pas. */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Précision pour votre fournisseur (facultatif)"
            rows={2}
            maxLength={500}
            className="w-full text-xs bg-ds-surface border border-ds-border rounded-md px-2 py-1.5 text-gray-200 placeholder:text-gray-600"
          />
          {ACTIONS_DESTINATAIRE.map((a) => (
            <button
              key={a.code}
              onClick={() => poser(a.code)}
              disabled={enCours !== null || statutActuel === a.code}
              title={a.effet}
              className="block w-full text-left text-xs px-2 py-1.5 rounded-md text-gray-300 hover:bg-ds-surface disabled:opacity-40 transition-colors"
            >
              {enCours === a.code ? "Envoi…" : a.libelle}
              {statutActuel === a.code && " · déjà fait"}
            </button>
          ))}
          {message && <p className="text-[11px] text-gray-400 pt-1">{message}</p>}
        </div>
      )}
    </div>
  );
}
