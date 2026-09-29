"use client";

import { useState } from "react";

interface Props {
  monthlyHT: number[];   // 12 valeurs HT indexées 0=Jan a 11=Déc, année en cours
  currentMonth: number;  // 0-indexed
  currentYear: number;
  /**
   * Vrai quand les échéances de déclaration URSSAF s'appliquent a ce compte.
   * Le CA par période intéresse toute entreprise ; les dates de dépot sont,
   * elles, celles du micro-entrepreneur. On ne les affiche que lorsqu'on peut
   * l'affirmer (franchise en base), et on se tait sinon.
   */
  echeancesUrssaf?: boolean;
  /**
   * Rendu sans carte ni en-tete de titre internes : utilisé quand le widget
   * est déja encapsulé dans un accordéon qui porte lui-meme le titre et
   * l'échéance. Le sélecteur de période reste affiché.
   */
  bare?: boolean;
}

const MONTHS_FR = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Aout", "Sept.", "Oct.", "Nov.", "Déc."];
const MONTHS_FULL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "décembre"];
const QUARTER_LABELS = ["T1", "T2", "T3", "T4"];
const URSSAF_DEADLINES = ["30 avril", "31 juillet", "31 octobre", "31 janvier"];

// Dernier jour du mois suivant (échéance mensuelle)
function monthlyDeadline(monthIdx: number, year: number): string {
  const nextMonth = (monthIdx + 1) % 12;
  const nextYear = monthIdx === 11 ? year + 1 : year;
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
  return `${lastDay} ${MONTHS_FULL[nextMonth]} ${nextYear}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CaUrssafWidget({ monthlyHT, currentMonth, currentYear, echeancesUrssaf = false, bare = false }: Props) {
  const [mode, setMode] = useState<"trimestre" | "mensuel">("trimestre");

  const currentQuarter = Math.floor(currentMonth / 3);
  const quarterlyHT = [0, 1, 2, 3].map((q) => monthlyHT[q * 3] + monthlyHT[q * 3 + 1] + monthlyHT[q * 3 + 2]);
  const yearTotal = monthlyHT.slice(0, currentMonth + 1).reduce((s, v) => s + v, 0);

  const series = mode === "trimestre" ? quarterlyHT : monthlyHT;
  const labels = mode === "trimestre" ? QUARTER_LABELS : MONTHS_FR;
  const currentIndex = mode === "trimestre" ? currentQuarter : currentMonth;
  const periodValue = series[currentIndex];
  const max = Math.max(...series.filter((_, i) => i <= currentIndex), 1);

  const caption =
    mode === "trimestre"
      ? `${QUARTER_LABELS[currentQuarter]} ${currentYear}${echeancesUrssaf ? ` · a déclarer avant le ${URSSAF_DEADLINES[currentQuarter]}` : ""}`
      : `${capitalize(MONTHS_FULL[currentMonth])} ${currentYear}${echeancesUrssaf ? ` · avant le ${monthlyDeadline(currentMonth, currentYear)}` : ""}`;

  return (
    <div className={bare ? "" : "bg-ds-surface border border-ds-border rounded-xl p-5"}>
      {/* Sélecteur de période (et titre, hors accordéon) */}
      <div className={`flex items-center gap-3 ${bare ? "justify-end px-5 pt-5 pb-1" : "justify-between mb-5"}`}>
        {!bare && (
          <div>
            <h2 className="text-sm font-semibold text-white">
              {echeancesUrssaf ? "Récap CA, URSSAF" : "Récap chiffre d'affaires"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">CA HT encaissé · {currentYear}</p>
          </div>
        )}
        {/* Sélecteur de période en menu déroulant : meilleure visibilité sur la page
            (décision Selim, 29/09/2026), et plus compact que deux boutons. */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "trimestre" | "mensuel")}
          aria-label="Période du récapitulatif"
          className="shrink-0 rounded-lg border border-ds-border bg-ds-elevated text-gray-300 text-xs font-medium px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="trimestre">Trimestriel</option>
          <option value="mensuel">Mensuel</option>
        </select>
      </div>

      <div className={bare ? "px-5 pb-5" : ""}>
        {/* Le chiffre de la période courante, en grand */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-white tabular-nums leading-none">
            {fmt(periodValue)} <span className="text-base font-normal text-gray-500">HT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{caption}</p>
        </div>

        {/* Barre fine : la période courante située sur l'ensemble de l'année */}
        <div className="flex items-end gap-1.5">
          {series.map((v, i) => {
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;
            const heightPct = isFuture ? 0 : Math.max(v > 0 ? 8 : 2, Math.round((v / max) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full h-14 flex items-end">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isFuture
                        ? "bg-ds-elevated/40"
                        : isCurrent
                          ? "bg-indigo-500"
                          : v > 0
                            ? "bg-gray-600"
                            : "bg-ds-elevated"
                    }`}
                    style={{ height: isFuture ? "2px" : `${heightPct}%` }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums truncate max-w-full ${isCurrent ? "text-indigo-400 font-semibold" : "text-gray-600"}`}>
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Total de l'année, et emplacement réservé au futur bouton de
            télétransmission URSSAF (API TDAE, voir docs/urssaf/tdae.md).
            Aucun bouton n'est rendu tant que l'habilitation n'existe pas :
            on n'affiche jamais une action qui ne fonctionne pas encore. */}
        <div className="mt-6 flex items-center justify-between border-t border-ds-border pt-4">
          <p className="text-xs text-gray-500">Total {currentYear} encaissé</p>
          <span className="text-sm font-semibold text-gray-200 tabular-nums">
            {fmt(yearTotal)} <span className="text-xs font-normal text-gray-500">HT</span>
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Basé sur les factures marquées payées · Vérifiez les montants avant déclaration.
        </p>
      </div>
    </div>
  );
}
