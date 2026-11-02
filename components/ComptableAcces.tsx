"use client";

import { useEffect, useState, useCallback } from "react";

type Comptable = {
  id: string;
  email: string;
  status: "pending" | "active";
  invited_at: string;
  accepted_at: string | null;
} | null;

/**
 * Section « Expert-comptable » du profil (titulaire).
 *
 * Le client rattache son cabinet avec le code a usage unique que celui-ci lui a
 * transmis. La saisie du code vaut consentement : le cabinet obtient alors un
 * acces en LECTURE SEULE a ses devis, factures et exports, depuis le cockpit du
 * cabinet. Gratuit, hors siege, disponible des l'offre Solo. Le client peut se
 * detacher a tout moment. Toute la verification reste cote serveur.
 */
export function ComptableAcces() {
  const [comptable, setComptable] = useState<Comptable>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planBloque, setPlanBloque] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await fetch("/api/team/comptable");
      if (res.ok) {
        const d = await res.json();
        setComptable(d.comptable ?? null);
      }
    } catch {
      // Lecture best-effort : en cas d'echec reseau, on laisse l'ecran vide.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function rejoindre() {
    setBusy(true);
    setError("");
    setPlanBloque(false);
    try {
      const res = await fetch("/api/cabinet/rejoindre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setCode("");
        await charger();
      } else if (d.error === "PLAN_REQUIRED") {
        setPlanBloque(true);
      } else {
        setError(d.message || "Ce code est invalide ou a deja ete utilise.");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setBusy(false);
    }
  }

  async function retirer() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/team/comptable", { method: "DELETE" });
      if (res.ok) {
        setComptable(null);
      } else {
        setError("Le retrait a echoue.");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Chargement...</p>;
  }

  // Code canonique : 8 caracteres alphanumeriques (forme XXXX-XXXX).
  const codeValide = code.toUpperCase().replace(/[^A-Z0-9]/g, "").length >= 8;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Rattachez votre cabinet comptable avec le code qu&apos;il vous a transmis. Il accède alors à
        vos devis, factures et exports (FEC) en lecture seule, depuis sa propre interface. Il ne peut
        rien modifier, envoyer ni supprimer. C&apos;est gratuit et cela n&apos;occupe aucun siège.
      </p>

      {planBloque && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-300">
          Le rattachement à un cabinet est disponible à partir de l&apos;offre Solo.{" "}
          <a href="/billing" className="font-semibold underline hover:text-indigo-200">
            Choisir une offre
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {comptable === null && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="flex-1 rounded-lg border border-ds-border bg-ds-elevated px-3 py-2 text-sm font-mono tracking-widest text-ink placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !codeValide}
            onClick={rejoindre}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "..." : "Rattacher mon cabinet"}
          </button>
        </div>
      )}

      {comptable && (
        <div className="rounded-lg border border-ds-border bg-ds-elevated p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {comptable.email || "Votre cabinet comptable"}
              </p>
              <p className="text-xs text-gray-500">
                {comptable.status === "active"
                  ? "Accès actif, en lecture seule"
                  : "Invitation en attente"}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={retirer}
              className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Retirer l&apos;accès
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
