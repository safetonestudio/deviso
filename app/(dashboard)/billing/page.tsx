"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Profile = {
  plan: "free" | "solo" | "pro";
  stripe_customer_id: string | null;
  subscription_status: string | null;
};

const PLAN_INFO = {
  free: {
    label: "Non abonné",
    color: "bg-ds-elevated text-gray-400",
    description: "Aucun abonnement actif, commencez un essai gratuit de 14 jours",
  },
  solo: {
    label: "Solo",
    color: "bg-indigo-500/20 text-indigo-300",
    description: "1 utilisateur · IA génération devis, factures Factur-X, acompte/solde, factures récurrentes, Chorus Pro B2G",
  },
  pro: {
    label: "Pro",
    color: "bg-violet-500/20 text-violet-300",
    description: "3 utilisateurs inclus · Tout Solo + relances auto, FEC, CRM, Analytics, catalogue, domaine custom · +5€/utilisateur supplémentaire",
  },
};

const MONTHLY_PRICES = { solo: "18€", pro: "34€" };
const ANNUAL_PRICES = { solo: "14,40€", pro: "27,20€" };
const ANNUAL_TOTAL = { solo: "172,80€", pro: "326,40€" };

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: "solo" | "pro") {
    setActing(true);
    setPortalError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      setPortalError(data.error || "Erreur lors de la redirection vers le paiement.");
      setActing(false);
    }
  }

  async function handlePortal() {
    setActing(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Impossible d'accéder au portail. Contactez le support.");
        setActing(false);
      }
    } catch {
      setPortalError("Erreur réseau. Réessayez dans quelques instants.");
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-6">
        <div className="h-7 w-40 bg-ds-elevated rounded" />
        <div className="bg-ds-surface border border-ds-border rounded-xl p-6 h-32" />
        <div className="bg-ds-surface border border-ds-border rounded-xl p-6 h-48" />
      </div>
    );
  }

  const plan = profile?.plan ?? "free";
  const isTrialing = profile?.subscription_status === "trialing";
  const info = PLAN_INFO[plan];
  const prices = billing === "annual" ? ANNUAL_PRICES : MONTHLY_PRICES;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold text-white tracking-tight mb-1">Abonnement</h1>
      <p className="text-gray-500 text-sm mb-8">Gérez votre plan et votre facturation.</p>

      {searchParams.get("upgraded") === "1" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <p className="text-emerald-400 font-medium">Votre abonnement a bien été activé !</p>
        </div>
      )}

      {portalError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-red-400 text-sm font-medium">⚠️ {portalError}</p>
        </div>
      )}

      {/* Plan actuel */}
      <div className="bg-ds-surface border border-ds-border rounded-xl p-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Plan actuel</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>
                {info.label}
              </span>
              {isTrialing && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  Essai gratuit
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">{info.description}</p>
          </div>
          {plan !== "free" && (
            <button
              onClick={handlePortal}
              disabled={acting}
              className="shrink-0 text-sm bg-ds-elevated hover:bg-gray-700 text-gray-300 font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {acting ? "Redirection…" : "Gérer / Annuler →"}
            </button>
          )}
        </div>

        {/* Bandeau trial — incite à ajouter une carte avant expiration */}
        {isTrialing && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-200">
              <span className="font-semibold">⏳ Essai en cours.</span>{" "}
              Ajoutez une carte maintenant pour continuer automatiquement à la fin des 14 jours — sans interruption.
            </p>
            <button
              onClick={handlePortal}
              disabled={acting}
              className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {acting ? "Redirection…" : "Ajouter ma carte →"}
            </button>
          </div>
        )}
      </div>

      {plan !== "pro" && (
        <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {plan === "free" ? "Commencer votre essai gratuit" : "Passer à Pro"}
            </p>
            {/* Toggle mensuel / annuel */}
            <div className="flex items-center gap-1 bg-ds-elevated rounded-lg p-0.5">
              <button
                onClick={() => setBilling("monthly")}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  billing === "monthly" ? "bg-ds-surface text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  billing === "annual" ? "bg-ds-surface text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Annuel
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">−20%</span>
              </button>
            </div>
          </div>

          {/* Bandeau essai */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-indigo-400 text-lg">🎁</span>
            <p className="text-sm text-indigo-300">
              <span className="font-semibold">14 jours gratuits</span>, sans carte bancaire requise pour démarrer. Résiliable à tout moment.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {plan === "free" && (
              <div className="flex items-center justify-between border border-indigo-500/30 bg-indigo-950/50 rounded-xl px-5 py-4">
                <div>
                  <p className="font-semibold text-white">
                    Solo à {prices.solo}<span className="text-gray-400 font-normal text-sm">/mois</span>
                    {billing === "annual" && (
                      <span className="text-xs text-gray-500 ml-2">({ANNUAL_TOTAL.solo}/an)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">IA devis, factures Factur-X, acompte/solde, Chorus Pro</p>
                </div>
                <button
                  onClick={() => handleUpgrade("solo")}
                  disabled={acting}
                  className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors shrink-0 disabled:opacity-50"
                >
                  {acting ? "Redirection…" : "Essayer Solo →"}
                </button>
              </div>
            )}
            <div className="flex items-center justify-between border border-violet-500/30 bg-violet-950/50 rounded-xl px-5 py-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white">
                    Pro à {prices.pro}<span className="text-gray-400 font-normal text-sm">/mois</span>
                    {billing === "annual" && (
                      <span className="text-xs text-gray-500 ml-2">({ANNUAL_TOTAL.pro}/an)</span>
                    )}
                  </p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">RECOMMANDÉ</span>
                </div>
                <p className="text-sm text-gray-400">3 utilisateurs inclus · Catalogue, Équipe, CRM, Analytics, domaine custom</p>
                <p className="text-xs text-gray-500 mt-0.5">+5€/mois par utilisateur supplémentaire</p>
              </div>
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={acting}
                className="bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-500 transition-colors shrink-0 disabled:opacity-50"
              >
                {acting ? "Redirection…" : "Essayer Pro →"}
              </button>
            </div>
          </div>

          {billing === "annual" && (
            <p className="text-xs text-gray-600 mt-3 text-center">Facturation annuelle en une fois · Sans engagement au-delà</p>
          )}
        </div>
      )}
    </div>
  );
}
