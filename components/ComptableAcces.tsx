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
 * Invite un comptable en LECTURE SEULE, gratuit et hors siege. Disponible des
 * l'offre Solo : sur le plan gratuit, l'API repond PLAN_REQUIRED et on affiche
 * une invitation a passer sur Solo. Toute la verification reste cote serveur.
 */
export function ComptableAcces() {
  const [comptable, setComptable] = useState<Comptable>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planBloque, setPlanBloque] = useState(false);
  const [lien, setLien] = useState("");
  const [copie, setCopie] = useState(false);

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

  async function inviter(adresse: string) {
    setBusy(true);
    setError("");
    setPlanBloque(false);
    setLien("");
    try {
      const res = await fetch("/api/team/comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adresse }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        if (d.inviteUrl) setLien(d.inviteUrl);
        setEmail("");
        await charger();
      } else if (d.error === "PLAN_REQUIRED") {
        setPlanBloque(true);
      } else {
        setError(d.message || "Une erreur est survenue.");
        await charger();
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
        setLien("");
      } else {
        setError("Le retrait a echoue.");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setBusy(false);
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : le lien reste affiche et selectionnable.
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Votre expert-comptable accede a vos devis, factures et exports (FEC) en lecture seule.
        Il ne peut rien modifier, envoyer ni supprimer. C&apos;est gratuit et cela n&apos;occupe aucun siege.
      </p>

      {planBloque && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-300">
          L&apos;acces expert-comptable est disponible a partir de l&apos;offre Solo.{" "}
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@cabinet-comptable.fr"
            className="flex-1 rounded-lg border border-ds-border bg-ds-elevated px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !email.includes("@")}
            onClick={() => inviter(email)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Envoi..." : "Inviter mon expert-comptable"}
          </button>
        </div>
      )}

      {comptable && (
        <div className="rounded-lg border border-ds-border bg-ds-elevated p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{comptable.email}</p>
              <p className="text-xs text-gray-500">
                {comptable.status === "active"
                  ? "Acces actif, en lecture seule"
                  : "Invitation envoyee, en attente d'acceptation"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {comptable.status === "pending" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inviter(comptable.email)}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  Renvoyer l&apos;invitation
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={retirer}
                className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Retirer l&apos;acces
              </button>
            </div>
          </div>

          {lien && comptable.status === "pending" && (
            <div className="mt-3 flex flex-col gap-2 border-t border-ds-border pt-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                Si le courriel n&apos;arrive pas, transmettez ce lien a votre comptable :
              </p>
              <div className="flex flex-1 items-center gap-2">
                <input
                  readOnly
                  value={lien}
                  className="flex-1 rounded-lg border border-ds-border bg-ds-surface px-2 py-1.5 text-xs text-gray-300"
                />
                <button
                  type="button"
                  onClick={copier}
                  className="shrink-0 rounded-lg bg-ds-surface px-3 py-1.5 text-xs font-medium text-white hover:bg-ds-border"
                >
                  {copie ? "Copie" : "Copier"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
