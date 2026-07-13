"use client";

import { useState } from "react";
import Link from "next/link";

const SOLO_FEATURES = [
  "Devis IA illimités en 30 secondes",
  "Signature électronique client",
  "Factures Factur-X conformes réforme 2026",
  "Factures récurrentes, acompte et solde",
  "Dépôt Chorus Pro B2G (marchés publics)",
  "Widget CA URSSAF mensuel / trimestriel",
  "Sans branding Deviso sur vos documents",
  "Historique et exports illimités",
];

const PRO_FEATURES = [
  "Tout Solo inclus",
  "Relances automatiques programmables",
  "Exports comptables FEC, CSV, récap mensuel",
  "CRM Clients & Revenus + Analytics",
  "Gestion d'équipe, rôles et validation devis",
  "Catalogue prestations : forfaits & suivi du temps",
  "Domaine d'envoi custom (devis@votredomaine.fr)",
  "Sous-domaine et couleur d'accent PDF",
  "3 utilisateurs inclus · +5€/utilisateur supp.",
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const soloPrice = billing === "annual" ? "14,40€" : "18€";
  const proPrice = billing === "annual" ? "27,20€" : "34€";
  const soloPeriod = billing === "annual" ? "facturé 172,80€/an" : "sans engagement";
  const proPeriod = billing === "annual" ? "facturé 326,40€/an" : "3 utilisateurs inclus";

  return (
    <section id="tarifs" className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
            Tarifs simples
          </h2>
          <p className="text-gray-500 mb-6">14 jours gratuits · Sans carte bancaire · Sans engagement.</p>

          {/* Toggle mensuel / annuel */}
          <div className="inline-flex items-center gap-1 bg-ds-surface border border-ds-border rounded-xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                billing === "monthly"
                  ? "bg-ds-elevated text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-ds-elevated text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Annuel
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">

          {/* ── Solo ── */}
          <div className="rounded-2xl p-7 border bg-indigo-950/30 border-indigo-500/30 ring-1 ring-indigo-500/10 flex flex-col">
            <div className="mb-5">
              <div className="inline-block bg-indigo-500/15 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                Le plus populaire
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Solo</h3>
              <p className="text-sm text-gray-400">Pour le freelance qui veut une image pro et zéro admin.</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-semibold text-white tabular-nums">{soloPrice}</span>
                <span className="text-gray-500 text-sm mb-1.5">/mois</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{soloPeriod}</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {SOLO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-indigo-400 mt-px shrink-0 font-semibold">✓</span>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=solo"
              className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-5 rounded-xl transition-all text-sm"
            >
              Essayer gratuitement 14 jours →
            </Link>
            <p className="text-center text-xs text-gray-600 mt-2">Sans carte bancaire</p>
          </div>

          {/* ── Pro ── */}
          <div className="rounded-2xl p-7 border bg-ds-surface border-white/[0.09] flex flex-col">
            <div className="mb-5">
              <div className="inline-block bg-violet-500/15 text-violet-300 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                Recommandé
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Pro</h3>
              <p className="text-sm text-gray-400">Pour le freelance pro et les petits studios jusqu'à 5 personnes.</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-semibold text-white tabular-nums">{proPrice}</span>
                <span className="text-gray-500 text-sm mb-1.5">/mois</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{proPeriod}</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-violet-400 mt-px shrink-0 font-semibold">✓</span>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=pro"
              className="w-full text-center bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.10] text-white font-semibold py-3 px-5 rounded-xl transition-all text-sm"
            >
              Essayer gratuitement 14 jours →
            </Link>
            <p className="text-center text-xs text-gray-600 mt-2">Sans carte bancaire</p>
          </div>

        </div>

        {/* Réassurance */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 14 jours gratuits, sans carte</span>
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Résiliable en 1 clic</span>
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Données chiffrées, hébergées en Europe</span>
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Support par chat inclus</span>
        </div>
      </div>
    </section>
  );
}
