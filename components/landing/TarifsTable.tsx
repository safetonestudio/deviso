"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { planFeatures, proOnlyFeatures } from "@/lib/plans";

/**
 * Tarifs de la page d'accueil : deux formules côte à côte, en cartes.
 * Les fonctionnalités viennent de lib/plans.ts (source unique). Solo et Pro
 * ne diffèrent que par l'équipe : la carte Pro le dit en trois lignes au lieu
 * de répéter toute la liste.
 */
const COMMUNES = planFeatures("solo");
const PRO_SEUL = proOnlyFeatures();
/** Les premières lignes de la liste Solo, visibles sans déplier. */
const EN_AVANT = COMMUNES.slice(0, 7);
const LE_RESTE = COMMUNES.slice(7);

function Ligne({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[16px] leading-snug text-ink">
      <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 grid place-items-center" aria-hidden="true">
        <Check size={13} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

export function TarifsTable() {
  const [annuel, setAnnuel] = useState(false);

  const formules = [
    {
      nom: "Solo",
      pour: "Pour le freelance qui veut une image pro et zéro admin.",
      prix: annuel ? "14,40" : "18",
      note: annuel ? "Facturé 172,80 € par an" : "Sans engagement",
      lien: "/signup?plan=solo",
      enAvant: true,
    },
    {
      nom: "Pro",
      pour: "Pour le freelance pro et les petits studios jusqu'à 5 personnes.",
      prix: annuel ? "27,20" : "34",
      note: annuel ? "Facturé 326,40 € par an" : "Sans engagement",
      lien: "/signup?plan=pro",
      enAvant: false,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-[clamp(30px,3.6vw,54px)] leading-[1.05] font-semibold tracking-[-0.03em] text-ink">Tarifs simples</h2>
          <p className="mt-4 text-[19px] leading-relaxed text-gray-300">14 jours gratuits, sans carte bancaire, sans engagement.</p>
        </div>
        <div className="inline-flex gap-1 p-1 rounded-xl bg-ds-surface border border-ds-border shadow-ds-sm" role="group" aria-label="Périodicité de facturation">
          {[
            { libelle: "Mensuel", valeur: false },
            { libelle: "Annuel", valeur: true },
          ].map((o) => (
            <button
              key={o.libelle}
              type="button"
              onClick={() => setAnnuel(o.valeur)}
              aria-pressed={annuel === o.valeur}
              className={`h-10 px-5 rounded-lg text-[15px] font-semibold transition-colors inline-flex items-center gap-2 ${
                annuel === o.valeur ? "bg-indigo-600 text-on-accent" : "text-gray-300 hover:text-ink"
              }`}
            >
              {o.libelle}
              {o.valeur && (
                <span className={`text-[12px] font-semibold px-1.5 py-0.5 rounded-md ${annuel ? "bg-ds-surface text-gray-50" : "bg-indigo-500/15 text-indigo-400"}`}>
                  20 % de moins
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2 items-start">
        {formules.map((f) => (
          <div
            key={f.nom}
            className={`relative rounded-2xl bg-ds-surface p-7 sm:p-10 flex flex-col ${
              f.enAvant ? "border-2 border-indigo-500 shadow-ds-leve" : "border border-ds-border shadow-ds-card"
            }`}
          >
            <h3 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{f.nom}</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-gray-300 max-w-[40ch]">{f.pour}</p>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-[clamp(48px,4.4vw,64px)] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink">{f.prix}</span>
              <span className="text-[22px] font-semibold text-ink">€</span>
              <span className="text-[16px] text-gray-400">par mois, hors taxes</span>
            </div>
            <p className="mt-2 text-[15px] text-gray-400">{f.note}</p>

            <Link
              href={f.lien}
              className={`mt-8 inline-flex items-center justify-center h-13 rounded-xl text-[16px] font-semibold transition-colors ${
                f.enAvant
                  ? "bg-indigo-600 hover:bg-indigo-700 text-on-accent shadow-ds-card"
                  : "bg-ds-elevated border border-ds-border hover:bg-ds-bg text-ink"
              }`}
            >
              Essayer {f.nom} gratuitement 14 jours
            </Link>
            <p className="mt-3 text-center text-[14px] text-gray-400">Sans carte bancaire</p>

            <div className="mt-8 pt-8 border-t border-ds-border">
              {f.nom === "Solo" ? (
                <ul className="space-y-3.5">
                  {EN_AVANT.map((x) => (
                    <Ligne key={x}>{x}</Ligne>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3.5">
                  <Ligne><strong className="font-semibold">Tout ce que contient Solo</strong></Ligne>
                  {PRO_SEUL.map((x) => (
                    <Ligne key={x}>{x}</Ligne>
                  ))}
                  <Ligne>3 utilisateurs inclus, puis 5 € par utilisateur supplémentaire</Ligne>
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {LE_RESTE.length > 0 && (
        <details className="group mt-6 rounded-2xl bg-ds-surface border border-ds-border shadow-ds-card">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 px-7 sm:px-10 py-5 text-[17px] font-semibold text-ink">
            Voir tout ce qui est compris dans les deux formules
            <span className="shrink-0 w-8 h-8 rounded-full bg-ds-elevated border border-ds-border grid place-items-center text-[18px] leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <ul className="px-7 sm:px-10 pb-8 grid gap-x-10 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNES.map((x) => (
              <Ligne key={x}>{x}</Ligne>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
