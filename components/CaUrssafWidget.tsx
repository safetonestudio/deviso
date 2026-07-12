"use client";

import { useState } from "react";

interface Props {
  monthlyHT: number[];   // 12 valeurs HT indexées 0=Jan … 11=Déc, année en cours
  currentMonth: number;  // 0-indexed
  currentYear: number;
}

const MONTHS_FR = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const MONTHS_FULL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const QUARTER_LABELS = ["T1", "T2", "T3", "T4"];
const QUARTER_MONTHS = [
  ["Janv.", "Févr.", "Mars"],
  ["Avr.", "Mai", "Juin"],
  ["Juil.", "Août", "Sept."],
  ["Oct.", "Nov.", "Déc."],
];

// Dernier jour du mois suivant (deadline mensuelle)
function monthlyDeadline(monthIdx: number, year: number): string {
  const nextMonth = (monthIdx + 1) % 12;
  const nextYear = monthIdx === 11 ? year + 1 : year;
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
  return `${lastDay} ${MONTHS_FULL[nextMonth]} ${nextYear}`;
}

// Deadline trimestrielle (fin du mois suivant la fin du trimestre)
const URSSAF_DEADLINES = ["30 avril", "31 juillet", "31 octobre", "31 janvier"];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function CaUrssafWidget({ monthlyHT, currentMonth, currentYear }: Props) {
  const [mode, setMode] = useState<"trimestre" | "mensuel">("trimestre");

  const currentQuarter = Math.floor(currentMonth / 3);
  const quarterlyHT = [0, 1, 2, 3].map((q) =>
    monthlyHT[q * 3] + monthlyHT[q * 3 + 1] + monthlyHT[q * 3 + 2]
  );
  const qTotal = quarterlyHT[currentQuarter];
  const qMonthsCA = [0, 1, 2].map((offset) => monthlyHT[currentQuarter * 3 + offset]);
  const maxQMonth = Math.max(...qMonthsCA, 1);
  const maxQuarter = Math.max(...quarterlyHT.filter((_, i) => i <= currentQuarter), 1);
  const maxMonth = Math.max(...monthlyHT.slice(0, currentMonth + 1), 1);

  const deadline = mode === "trimestre"
    ? `Dépôt ${URSSAF_DEADLINES[currentQuarter]}`
    : `Dépôt ${monthlyDeadline(currentMonth, currentYear)}`;

  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Récap CA, URSSAF</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chiffre d&apos;affaires HT encaissé · {currentYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            {deadline}
          </span>
          {/* Toggle */}
          <div className="flex rounded-lg border border-ds-border overflow-hidden text-xs font-medium">
            <button
              onClick={() => setMode("trimestre")}
              className={`px-3 py-1.5 transition-colors ${mode === "trimestre" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-ds-elevated"}`}
            >
              Trimestriel
            </button>
            <button
              onClick={() => setMode("mensuel")}
              className={`px-3 py-1.5 transition-colors ${mode === "mensuel" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-ds-elevated"}`}
            >
              Mensuel
            </button>
          </div>
        </div>
      </div>

      {/* ── VUE TRIMESTRIELLE ── */}
      {mode === "trimestre" && (
        <>
          {/* 4 blocs trimestriels */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {QUARTER_LABELS.map((label, q) => {
              const isCurrent = q === currentQuarter;
              const ca = quarterlyHT[q];
              const isFuture = q > currentQuarter;
              return (
                <div
                  key={q}
                  className={`rounded-xl p-3 border ${isCurrent ? "bg-indigo-500/10 border-indigo-500/30" : "bg-ds-elevated border-ds-border"}`}
                >
                  <div className={`text-xs font-semibold mb-1 flex items-center gap-1 ${isCurrent ? "text-indigo-400" : "text-gray-500"}`}>
                    {label}
                    {isCurrent && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded">en cours</span>}
                  </div>
                  <div className={`text-sm font-bold ${isFuture ? "text-gray-600" : isCurrent ? "text-white" : "text-gray-300"}`}>
                    {isFuture ? "—" : fmt(ca)}
                  </div>
                  {!isFuture && (
                    <div className="mt-2 h-1.5 rounded-full bg-ds-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCurrent ? "bg-indigo-500" : "bg-gray-600"}`}
                        style={{ width: `${Math.max(4, (ca / maxQuarter) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Détail mensuel du trimestre courant */}
          <div className="border-t border-ds-border pt-4">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
              {QUARTER_LABELS[currentQuarter]} en détail, {QUARTER_MONTHS[currentQuarter].join(" · ")}
            </p>
            <div className="space-y-2">
              {qMonthsCA.map((ca, offset) => {
                const monthIdx = currentQuarter * 3 + offset;
                const isFutureMonth = monthIdx > currentMonth;
                return (
                  <div key={offset} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-10 shrink-0">{MONTHS_FR[monthIdx]}</span>
                    <div className="flex-1 h-2 bg-ds-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isFutureMonth ? "bg-transparent" : ca === 0 ? "bg-gray-700" : "bg-indigo-500"}`}
                        style={{ width: isFutureMonth ? "0%" : `${Math.max(4, (ca / maxQMonth) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-20 text-right shrink-0 ${isFutureMonth ? "text-gray-700" : ca === 0 ? "text-gray-600" : "text-gray-300"}`}>
                      {isFutureMonth ? "—" : fmt(ca)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Total {QUARTER_LABELS[currentQuarter]} à déclarer</p>
              <span className="text-sm font-bold text-white">
                {fmt(qTotal)} <span className="text-xs font-normal text-gray-500">HT</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── VUE MENSUELLE, grille 4×3 de cartes (même style que trimestriel) ── */}
      {mode === "mensuel" && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {monthlyHT.map((ca, m) => {
              const isCurrent = m === currentMonth;
              const isFuture = m > currentMonth;
              return (
                <div
                  key={m}
                  className={`rounded-xl p-3 border ${
                    isCurrent
                      ? "bg-indigo-500/10 border-indigo-500/30"
                      : "bg-ds-elevated border-ds-border"
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 flex items-center gap-1 flex-wrap ${
                    isCurrent ? "text-indigo-400" : "text-gray-500"
                  }`}>
                    {MONTHS_FR[m]}
                    {isCurrent && (
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded leading-tight">
                        en cours
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-bold ${
                    isFuture ? "text-gray-600" : isCurrent ? "text-white" : "text-gray-300"
                  }`}>
                    {isFuture ? "—" : fmt(ca)}
                  </div>
                  {!isFuture && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-ds-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCurrent ? "bg-indigo-500" : "bg-gray-600"}`}
                        style={{ width: `${Math.max(ca > 0 ? 5 : 0, (ca / maxMonth) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CA du mois courant + deadline */}
          <div className="border-t border-ds-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">CA {MONTHS_FULL[currentMonth]} à déclarer</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Avant le {monthlyDeadline(currentMonth, currentYear)}
                </p>
              </div>
              <span className="text-sm font-bold text-white">
                {fmt(monthlyHT[currentMonth])} <span className="text-xs font-normal text-gray-500">HT</span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">Total {currentYear} encaissé</p>
              <span className="text-sm font-semibold text-gray-300">
                {fmt(monthlyHT.slice(0, currentMonth + 1).reduce((s, v) => s + v, 0))}{" "}
                <span className="text-xs font-normal text-gray-500">HT</span>
              </span>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Basé sur les factures marquées payées · Vérifiez les montants avant déclaration.
      </p>
    </div>
  );
}
