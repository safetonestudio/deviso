"use client";

import { useState } from "react";
import { CreditCard, FolderOpen, TriangleAlert, Hourglass } from "lucide-react";

/**
 * Fin d'essai sans carte : ce que voit le titulaire en se reconnectant.
 *
 * Avant le 20/11/2026, il retombait sur un espace réduit sans un mot
 * d'explication. Deux formes :
 *   - `EcranEssaiTermine`, à la place du tableau de bord (là où mène la
 *     connexion et le lien du courriel de fin d'essai) ;
 *   - `BandeauEssaiTermine`, en tête des autres pages, qui restent ouvertes en
 *     consultation (les factures existantes restent lisibles sans formule,
 *     décision de Selim du 21/11/2026 ; seule la création est réservée).
 *
 * Le bouton appelle `/api/stripe/checkout` : l'abonnement d'essai est résilié,
 * la route ouvre donc un NOUVEL abonnement, carte exigée, sans second essai
 * (un essai par client Stripe). Aucune animation : app, pas site public.
 */

const PRIX = {
  monthly: { solo: "18 €", pro: "34 €" },
  annual: { solo: "14,40 €", pro: "27,20 €" },
} as const;
const TOTAL_ANNUEL = { solo: "172,80 €", pro: "326,40 €" } as const;

export function EcranEssaiTermine() {
  const [formule, setFormule] = useState<"solo" | "pro">("solo");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouterCarte() {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: formule, billing }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErreur(
        data.message ||
          "La page de paiement n'a pas pu s'ouvrir. Réessaie, ou écris-nous à support@getdeviso.fr."
      );
    } catch {
      setErreur("Erreur réseau. Réessaie dans quelques instants.");
    }
    setEnCours(false);
  }

  const prix = PRIX[billing];

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-8" data-ecran="essai-termine">
      <div className="carte p-6 sm:p-8">
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-5">
          <Hourglass size={22} className="text-amber-400" />
        </div>
        <h1 className="titre-page mb-3">Ton essai est terminé</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Tes 14 jours d&apos;essai sont passés et aucune carte n&apos;était enregistrée : les
          fonctions payantes sont suspendues.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Rien n&apos;a été supprimé : tes devis, tes factures et tes clients restent
          consultables. Pour continuer à facturer, un abonnement est nécessaire.
        </p>

        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs font-semibold text-gray-500">Ta formule</p>
          <div className="flex items-center gap-1 bg-ds-elevated rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              aria-pressed={billing === "monthly"}
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                billing === "monthly" ? "bg-ds-surface text-ink" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              aria-pressed={billing === "annual"}
              className={`text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                billing === "annual" ? "bg-ds-surface text-ink" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Annuel
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">−20%</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6" role="radiogroup" aria-label="Formule">
          {(["solo", "pro"] as const).map((f) => {
            const choisie = formule === f;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={choisie}
                onClick={() => setFormule(f)}
                className={`text-left rounded-xl border px-4 py-3 ${
                  choisie
                    ? "border-indigo-500/60 bg-indigo-500/10"
                    : "border-ds-border bg-ds-surface hover:bg-ds-elevated"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-ink">{f === "solo" ? "Solo" : "Pro"}</span>
                  <span className="text-sm text-ink">
                    {prix[f]}
                    <span className="text-gray-500 text-xs">/mois</span>
                  </span>
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {f === "solo"
                    ? "1 utilisateur · factures électroniques, IA devis, Chorus Pro"
                    : "3 utilisateurs inclus · tout Solo, équipe, CRM, catalogue"}
                  {billing === "annual" ? ` · ${TOTAL_ANNUEL[f]} par an` : ""}
                </span>
              </button>
            );
          })}
        </div>

        {erreur && (
          <p className="text-red-400 text-sm mb-4 flex items-start gap-2">
            <TriangleAlert size={16} className="shrink-0 mt-0.5" />
            {erreur}
          </p>
        )}

        <button
          type="button"
          onClick={ajouterCarte}
          disabled={enCours}
          className="w-full bg-indigo-600 text-ink text-sm font-semibold px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <CreditCard size={17} className="shrink-0" />
          {enCours ? "Un instant…" : "Ajouter une carte"}
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          Paiement sur la page sécurisée de Stripe · résiliable à tout moment
        </p>

        <div className="border-t border-ds-border mt-6 pt-4 text-center">
          <a
            href="/invoices"
            className="text-sm text-gray-400 hover:text-gray-300 inline-flex items-center gap-1.5"
          >
            <FolderOpen size={15} className="shrink-0" />
            Consulter mes factures
          </a>
        </div>

      </div>
    </div>
  );
}

export function BandeauEssaiTermine() {
  return (
    <div
      className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-bandeau="essai-termine"
    >
      <p className="text-sm text-amber-200 flex items-start gap-2">
        <Hourglass size={16} className="shrink-0 mt-0.5 text-amber-400" />
        Ton essai est terminé : un abonnement est nécessaire pour continuer à facturer. Tes documents restent consultables.
      </p>
      <a
        href="/dashboard"
        className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-ink hover:bg-indigo-700 text-center"
      >
        Ajouter une carte
      </a>
    </div>
  );
}
