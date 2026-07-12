"use client";

import { useState, useCallback } from "react";
import { simulateTjm, simulateReverse } from "@/lib/tarifs-data";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " €";
}

interface TjmSimulatorProps {
  /** TJM de départ par défaut (confirmé médian du métier) */
  defaultTjm?: number;
  /** Jours facturables par défaut pour ce métier */
  defaultJours?: number;
}

export function TjmSimulator({ defaultTjm = 350, defaultJours = 15 }: TjmSimulatorProps) {
  const [mode, setMode] = useState<"tjm-to-revenu" | "revenu-to-tjm">("tjm-to-revenu");
  const [tjm, setTjm] = useState(defaultTjm);
  const [jours, setJours] = useState(defaultJours);
  const [netCible, setNetCible] = useState(Math.round(defaultTjm * defaultJours * 0.78 / 100) * 100);

  const r1 = simulateTjm({ tjm, joursParMois: jours });
  const r2 = simulateReverse({ netCible, joursParMois: jours });

  const handleTjm = useCallback((v: string) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) setTjm(n);
  }, []);
  const handleNet = useCallback((v: string) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) setNetCible(n);
  }, []);
  const handleJours = useCallback((v: string) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0 && n <= 23) setJours(n);
  }, []);

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Simulateur de revenus</h3>
        <p className="text-sm text-gray-500">Micro-entrepreneur BNC · Cotisations URSSAF 22 %</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl border border-ds-border">
        <button
          onClick={() => setMode("tjm-to-revenu")}
          className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
            mode === "tjm-to-revenu"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          TJM → Revenu net
        </button>
        <button
          onClick={() => setMode("revenu-to-tjm")}
          className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
            mode === "revenu-to-tjm"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Revenu cible → TJM
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {mode === "tjm-to-revenu" ? (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Votre TJM (€/jour)
            </label>
            <input
              type="number"
              min={50}
              max={5000}
              step={10}
              value={tjm}
              onChange={(e) => handleTjm(e.target.value)}
              className="w-full bg-gray-900/80 border border-ds-border rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-indigo-500 tabular-nums"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Revenu net cible / mois (avant impôt)
            </label>
            <input
              type="number"
              min={500}
              max={50000}
              step={100}
              value={netCible}
              onChange={(e) => handleNet(e.target.value)}
              className="w-full bg-gray-900/80 border border-ds-border rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-indigo-500 tabular-nums"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Jours facturables / mois
          </label>
          <input
            type="range"
            min={5}
            max={22}
            step={1}
            value={jours}
            onChange={(e) => handleJours(e.target.value)}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>5 j</span>
            <span className="text-indigo-400 font-semibold">{jours} j / mois</span>
            <span>22 j</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {mode === "tjm-to-revenu" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/60 rounded-xl p-4 border border-ds-border">
            <p className="text-xs text-gray-500 mb-1">CA mensuel</p>
            <p className="text-xl font-bold text-white tabular-nums">{fmt(r1.caMensuel)}</p>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-4 border border-ds-border">
            <p className="text-xs text-gray-500 mb-1">Cotisations URSSAF</p>
            <p className="text-xl font-bold text-red-400 tabular-nums">−{fmt(r1.urssaf)}</p>
          </div>
          <div className="bg-indigo-600/10 rounded-xl p-4 border border-indigo-500/30 col-span-2">
            <p className="text-xs text-indigo-300 mb-1">Revenu net / mois (avant impôt)</p>
            <p className="text-3xl font-bold text-indigo-300 tabular-nums">{fmt(r1.netAvantIr)}</p>
            <p className="text-xs text-gray-500 mt-1.5">≈ {fmt(r1.caAnnuel)} de CA/an</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-600/10 rounded-xl p-4 border border-indigo-500/30 col-span-2">
            <p className="text-xs text-indigo-300 mb-1">TJM à facturer</p>
            <p className="text-3xl font-bold text-indigo-300 tabular-nums">{fmt(r2.tjmRequis)}<span className="text-base font-normal">/j</span></p>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-4 border border-ds-border">
            <p className="text-xs text-gray-500 mb-1">CA mensuel requis</p>
            <p className="text-xl font-bold text-white tabular-nums">{fmt(r2.caMensuelRequis)}</p>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-4 border border-ds-border">
            <p className="text-xs text-gray-500 mb-1">Cotisations URSSAF</p>
            <p className="text-xl font-bold text-red-400 tabular-nums">−{fmt(r2.urssaf)}</p>
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-[11px] text-gray-600 leading-relaxed">
        Calcul indicatif en micro-BNC (22 % de cotisations sociales). Ne comprend pas l&apos;impôt sur le revenu
        (variable selon votre situation), la CFE (~500 €/an) ni les frais professionnels.
        Au-delà de 77&nbsp;700 €/CA annuel, passez en EURL ou SASU à l&apos;IS.
      </p>
    </div>
  );
}
