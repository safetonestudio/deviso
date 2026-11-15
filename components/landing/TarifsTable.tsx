"use client";

import { useState } from "react";
import Link from "next/link";
import { planFeatures, proOnlyFeatures } from "@/lib/plans";

/**
 * Tarifs de la page d'accueil, en tableau à grands caractères : les deux
 * formules côte à côte, des réponses en mots plutôt qu'en coches.
 * Les fonctionnalités viennent de lib/plans.ts (source unique) : Solo et Pro
 * ne diffèrent que par l'équipe, le tableau le dit au lieu de le masquer.
 */
const COMMUNES = planFeatures("solo");
const PRO_SEUL = proOnlyFeatures();

export function TarifsTable() {
  const [annuel, setAnnuel] = useState(false);

  const solo = annuel ? "14,40 €" : "18 €";
  const pro = annuel ? "27,20 €" : "34 €";
  const lignes: [string, string, string][] = [
    ["Facturation", annuel ? "172,80 € par an" : "Chaque mois, sans engagement", annuel ? "326,40 € par an" : "Chaque mois, sans engagement"],
    ["Utilisateurs", "1", "3 inclus, puis 5 € par utilisateur"],
    ...PRO_SEUL.map((f): [string, string, string] => [f, "Non inclus", "Inclus"]),
    ["Essai gratuit", "14 jours, sans carte", "14 jours, sans carte"],
  ];

  return (
    <div className="rounded-2xl bg-ds-surface border border-ds-border shadow-ds-card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-8">
        <div>
          <h2 className="text-[clamp(30px,3.6vw,54px)] leading-[1.05] font-semibold tracking-[-0.03em] text-ink">Tarifs simples</h2>
          <p className="mt-3 text-[19px] text-gray-300">14 jours gratuits, sans carte bancaire, sans engagement.</p>
        </div>
        <div className="inline-flex gap-1 p-1 rounded-lg bg-ds-elevated" role="group" aria-label="Périodicité de facturation">
          <button
            type="button"
            onClick={() => setAnnuel(false)}
            aria-pressed={!annuel}
            className={`h-11 px-4 rounded-lg text-[15px] font-semibold transition-colors ${!annuel ? "bg-ink text-(color:--ds-bg)" : "text-ink hover:bg-ds-surface"}`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setAnnuel(true)}
            aria-pressed={annuel}
            className={`h-11 px-4 rounded-lg text-[15px] font-semibold transition-colors ${annuel ? "bg-ink text-(color:--ds-bg)" : "text-ink hover:bg-ds-surface"}`}
          >
            Annuel, 20 % de moins
          </button>
        </div>
      </div>

      {/* Ordinateur : un vrai tableau. */}
      <table className="hidden md:table w-full table-fixed text-[18px]">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[33%]" />
          <col className="w-[33%]" />
        </colgroup>
        <thead>
          <tr className="text-left align-bottom">
            <th className="px-8 pb-6 font-normal text-[17px] text-gray-400">Prix par mois, hors taxes</th>
            <th className="px-8 pb-6 bg-indigo-950">
              <div className="text-[clamp(28px,3vw,44px)] leading-none font-semibold tracking-[-0.02em] text-ink">Solo</div>
              <div className="mt-2 text-[clamp(28px,3vw,44px)] leading-none font-normal tabular-nums text-ink">{solo}</div>
            </th>
            <th className="px-8 pb-6">
              <div className="text-[clamp(28px,3vw,44px)] leading-none font-semibold tracking-[-0.02em] text-ink">Pro</div>
              <div className="mt-2 text-[clamp(28px,3vw,44px)] leading-none font-normal tabular-nums text-ink">{pro}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map(([quoi, a, b], i) => (
            <tr key={quoi} className={i % 2 === 0 ? "bg-ds-elevated" : ""}>
              <th scope="row" className="px-8 py-5 text-left font-normal text-ink">{quoi}</th>
              <td className="px-8 py-5 bg-indigo-950 text-ink font-medium">{a}</td>
              <td className="px-8 py-5 text-ink font-medium">{b}</td>
            </tr>
          ))}
          <tr>
            <td />
            <td className="px-8 py-6 bg-indigo-950">
              <Link href="/signup?plan=solo" className="inline-flex items-center h-12 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[16px] font-semibold transition-colors">
                Essayer Solo
              </Link>
            </td>
            <td className="px-8 py-6">
              <Link href="/signup?plan=pro" className="inline-flex items-center h-12 px-6 rounded-lg bg-ink text-(color:--ds-bg) text-[16px] font-semibold hover:opacity-90 transition-opacity">
                Essayer Pro
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Téléphone : deux blocs empilés. */}
      <div className="md:hidden">
        {[
          { nom: "Solo", prix: solo, col: 1, lien: "/signup?plan=solo", fond: "bg-indigo-950" },
          { nom: "Pro", prix: pro, col: 2, lien: "/signup?plan=pro", fond: "bg-ds-elevated" },
        ].map((p) => (
          <div key={p.nom} className={`${p.fond} p-5`}>
            <div className="text-[9vw] leading-none font-semibold tracking-[-0.02em] text-ink">{p.nom}</div>
            <div className="mt-1 text-[9vw] leading-none tabular-nums text-ink">{p.prix} <span className="text-[16px]">par mois</span></div>
            <dl className="mt-5 space-y-3 text-[17px]">
              {lignes.map((l) => (
                <div key={l[0]}>
                  <dt className="text-gray-400">{l[0]}</dt>
                  <dd className="text-ink font-medium">{l[p.col]}</dd>
                </div>
              ))}
            </dl>
            <Link href={p.lien} className="mt-5 flex items-center justify-center h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[16px] font-semibold transition-colors">
              Essayer {p.nom}
            </Link>
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-8">
        <h3 className="text-[22px] font-semibold text-ink">Compris dans les deux formules</h3>
        <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-[16px] text-ink">
          {COMMUNES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
