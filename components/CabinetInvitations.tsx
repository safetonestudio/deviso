"use client";

import { useCallback, useEffect, useState } from "react";

type Invitation = {
  id: string;
  code: string;
  libelle: string | null;
  status: string;
  created_at: string;
};

/**
 * Section « Inviter un client » du cockpit cabinet.
 *
 * Le cabinet genere un code a usage unique (avec un libelle optionnel) et le
 * transmet a son client. Le client le saisit une fois dans Deviso, son dossier
 * bascule alors dans la liste des clients actifs du cockpit.
 */
export function CabinetInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [libelle, setLibelle] = useState("");
  const [busy, setBusy] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const res = await fetch("/api/cabinet/invitations");
      if (res.ok) {
        const d = await res.json();
        setInvitations(d.invitations ?? []);
      }
    } catch {
      // Lecture best-effort.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function generer() {
    setBusy(true);
    try {
      const res = await fetch("/api/cabinet/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libelle: libelle.trim() || undefined }),
      });
      if (res.ok) {
        const d = await res.json();
        setInvitations((prev) => [d.invitation, ...prev]);
        setLibelle("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function annuler(id: string) {
    const res = await fetch(`/api/cabinet/invitations?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) setInvitations((prev) => prev.filter((i) => i.id !== id));
  }

  async function copier(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(code);
      setTimeout(() => setCopie(null), 1500);
    } catch {
      // Presse-papiers indisponible : le code reste lisible a l'ecran.
    }
  }

  return (
    <div className="carte p-5 mb-6">
      <h2 className="text-ink font-semibold mb-1">Inviter un client</h2>
      <p className="text-gray-500 text-sm mb-4">
        Générez un code et transmettez-le à votre client. Il le saisit une fois dans Deviso, son
        dossier apparaît ici. Chaque code ne sert qu&apos;une fois.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="Nom du client (optionnel)"
          className="flex-1 min-w-[200px] bg-ds-bg border border-ds-border rounded-lg px-3 py-2 text-sm text-ink placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={generer}
          disabled={busy}
          className="px-4 py-2 bg-indigo-600 text-ink rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {busy ? "..." : "Générer un code"}
        </button>
      </div>
      {loading ? null : invitations.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucun code en attente.</p>
      ) : (
        <ul className="space-y-2">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 bg-ds-bg border border-ds-border rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-xs text-gray-500">
                  {inv.libelle || "Client sans nom"} · en attente
                </div>
                <code className="text-lg font-mono tracking-widest text-ink">{inv.code}</code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copier(inv.code)}
                  className="text-xs px-2.5 py-1.5 border border-ds-border rounded-lg text-gray-300 hover:bg-ink/5 transition-colors"
                >
                  {copie === inv.code ? "Copié" : "Copier"}
                </button>
                <button
                  onClick={() => annuler(inv.id)}
                  className="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
