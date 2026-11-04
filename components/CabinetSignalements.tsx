"use client";

import { useState } from "react";

// Forme locale : aucun import du code serveur cabinet (check:cabinet, regle 7).
type Signalement = {
  id: string;
  message: string;
  statut: "ouvert" | "traite";
  created_at: string;
};

const horodatage = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

/**
 * Signalements au client, cote cabinet (fiche dossier). Le comptable pointe une
 * anomalie precise ; le client la voit dans son tableau de bord et la clot. Le
 * cockpit reste en lecture seule sur le dossier : un signalement est un message,
 * pas une modification des donnees du client.
 */
export function CabinetSignalements({ clientId, initiaux }: { clientId: string; initiaux: Signalement[] }) {
  const [liste, setListe] = useState<Signalement[]>(initiaux);
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    const texte = message.trim();
    if (!texte || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await fetch("/api/cabinet/signalement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: texte }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Envoi impossible");
      if (data.signalement) setListe((l) => [data.signalement as Signalement, ...l]);
      setMessage("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setEnvoi(false);
    }
  }

  const badge = "text-xs px-2 py-0.5 rounded-full border";

  return (
    <div className="carte mb-6 overflow-hidden">
      <div className="p-4 border-b border-ds-border">
        <h2 className="text-ink font-semibold">Signaler au client</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Un message ciblé que le client verra dans son tableau de bord Deviso. Vous ne modifiez pas son dossier.
        </p>
      </div>
      <div className="p-4 border-b border-ds-border">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Ex. : la facture 2026-012 n'a pas de SIREN client, pouvez-vous le compléter ?"
          className="w-full bg-ds-bg border border-ds-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-gray-600 focus:outline-hidden focus:border-indigo-500 resize-y"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          {erreur ? <span className="text-xs text-red-400">{erreur}</span> : <span />}
          <button
            onClick={envoyer}
            disabled={!message.trim() || envoi}
            className="px-3 py-1.5 bg-indigo-600 text-ink rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {envoi ? "Envoi…" : "Signaler au client"}
          </button>
        </div>
      </div>
      {liste.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Aucun signalement pour ce dossier.</p>
      ) : (
        <ul className="divide-y divide-ds-border">
          {liste.map((s) => (
            <li key={s.id} className="p-4 flex items-start gap-3">
              <span
                className={`${badge} shrink-0 ${
                  s.statut === "traite"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {s.statut === "traite" ? "Traité" : "Ouvert"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 whitespace-pre-wrap wrap-break-word">{s.message}</p>
                <p className="text-xs text-gray-500 mt-1">{horodatage(s.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
