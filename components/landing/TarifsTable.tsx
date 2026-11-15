"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { planFeatures, proOnlyFeatures } from "@/lib/plans";

/**
 * Tarifs de la page d'accueil : deux formules côte à côte, sur deux surfaces
 * de même hauteur. Les fonctionnalités viennent de lib/plans.ts (source
 * unique). Solo et Pro ne diffèrent que par l'équipe : la carte Pro le dit
 * en quelques lignes, la liste complète se déplie dessous.
 */
const COMMUNES = planFeatures("solo");
const PRO_SEUL = proOnlyFeatures();
const EN_AVANT = COMMUNES.slice(0, 4);

const BOUTON = "inline-flex items-center justify-center h-12 rounded-md text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

function Ligne({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[17px] leading-snug text-ink">
      <Check size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-indigo-400" aria-hidden="true" />
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
      plein: true,
      lignes: EN_AVANT,
    },
    {
      nom: "Pro",
      pour: "Pour le freelance pro et les petits studios jusqu'à 5 personnes.",
      prix: annuel ? "27,20" : "34",
      note: annuel ? "Facturé 326,40 € par an" : "Sans engagement",
      lien: "/signup?plan=pro",
      plein: false,
      lignes: ["Tout Solo, et en plus :", ...PRO_SEUL, "3 utilisateurs inclus, puis 5 € par utilisateur supplémentaire"],
    },
  ];

  return (
    <div>
      <div className="reveal flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-[760px]">
          <h2 className="text-[clamp(32px,3.4vw,52px)] leading-[1.06] font-semibold tracking-[-0.035em] text-ink">Tarifs simples</h2>
          <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed text-gray-300">14 jours gratuits, sans carte bancaire, sans engagement.</p>
        </div>
        <div className="inline-flex gap-1 p-1 rounded-md bg-ds-surface" role="group" aria-label="Périodicité de facturation">
          {[
            { libelle: "Mensuel", valeur: false },
            { libelle: "Annuel, 20 % de moins", valeur: true },
          ].map((o) => (
            <button
              key={o.libelle}
              type="button"
              onClick={() => setAnnuel(o.valeur)}
              aria-pressed={annuel === o.valeur}
              className={`h-10 px-4 rounded-[6px] text-[14px] font-semibold transition-colors ${
                annuel === o.valeur ? "bg-ds-elevated text-ink" : "text-gray-400 hover:text-ink"
              }`}
            >
              {o.libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 sm:mt-16 grid gap-2 lg:grid-cols-2 items-stretch">
        {formules.map((f) => (
          <div key={f.nom} className="reveal rounded-lg bg-ds-surface p-7 sm:p-10 flex flex-col">
            <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">{f.nom}</h3>
            <p className="mt-2 text-[17px] leading-relaxed text-gray-300 max-w-[40ch]">{f.pour}</p>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-[clamp(44px,4vw,60px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">{f.prix} €</span>
              <span className="text-[17px] text-gray-400">par mois, HT</span>
            </div>
            <p className="mt-2 text-[14px] text-gray-400">{f.note}</p>

            <ul className="mt-8 space-y-3.5 flex-1">
              {f.lignes.map((x, i) =>
                f.nom === "Pro" && i === 0 ? (
                  <li key={x} className="text-[17px] font-semibold text-ink">{x}</li>
                ) : (
                  <Ligne key={x}>{x}</Ligne>
                )
              )}
            </ul>

            <Link
              href={f.lien}
              className={`mt-10 ${BOUTON} ${f.plein ? "bg-indigo-600 hover:bg-indigo-700 text-on-accent" : "bg-ds-elevated hover:bg-ds-bg text-ink"}`}
            >
              Essayer {f.nom} 14 jours gratuitement
            </Link>
          </div>
        ))}
      </div>

      <details className="group mt-2 rounded-lg bg-ds-surface">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 px-7 sm:px-10 py-6 text-[17px] font-semibold text-ink">
          Tout ce qui est compris dans les deux formules
          <span className="shrink-0 text-[24px] leading-none text-gray-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <ul className="px-7 sm:px-10 pb-10 grid gap-x-10 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNES.map((x) => (
            <Ligne key={x}>{x}</Ligne>
          ))}
        </ul>
      </details>
    </div>
  );
}
