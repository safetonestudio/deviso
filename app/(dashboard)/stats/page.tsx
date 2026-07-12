"use client";

import { useEffect, useState } from "react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { KpiCard } from "@/components/ui/KpiCard";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { TrendingUp, Target, Percent, FileText, BarChart3, Download, Info, Lock, Clock, Zap, Table2 } from "lucide-react";

interface MonthlyCa { month: string; ca: number; }
interface TopClient { name: string; ca: number; }
interface Funnel { created: number; sent: number; viewed: number; signed: number; declined: number; }
interface RemindersImpact { total_reminded: number; signed_after_reminder: number; rate: number; }

interface Stats {
  monthly_ca: MonthlyCa[];
  ca_ytd: number;
  ca_previsionnel: number;
  conversion_rate: number;
  proposals_total: number;
  proposals_signed: number;
  top_clients: TopClient[];
  avg_proposal: number;
  is_pro: boolean;
  funnel?: Funnel;
  avg_days_to_sign?: number | null;
  best_month?: { month: string; rate: number } | null;
  reminders_impact?: RemindersImpact | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isPro, setIsPro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exportYear, setExportYear] = useState(CURRENT_YEAR);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingRecap, setExportingRecap] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  async function downloadFile(url: string, fallbackName: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur export");
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="(.+?)"/);
    const filename = match ? match[1] : fallbackName;
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  async function handleExportFEC() {
    setExporting(true);
    try { await downloadFile(`/api/export/fec?year=${exportYear}`, `FEC_${exportYear}.txt`); }
    catch { alert("Erreur lors de la génération du FEC."); }
    finally { setExporting(false); }
  }

  async function handleExportCsv() {
    setExportingCsv(true);
    try { await downloadFile(`/api/export/invoices-csv?year=${exportYear}`, `Factures_${exportYear}.csv`); }
    catch { alert("Erreur lors de l'export CSV."); }
    finally { setExportingCsv(false); }
  }

  async function handleExportRecap() {
    setExportingRecap(true);
    try { await downloadFile(`/api/export/monthly-recap?year=${exportYear}`, `Recap_CA_${exportYear}.csv`); }
    catch { alert("Erreur lors du récapitulatif."); }
    finally { setExportingRecap(false); }
  }

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (r.status === 403) { setIsPro(false); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => { if (d) setStats(d); setLoading(false); });
  }, []);

  if (!isPro) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center space-y-4">
        <div className="w-12 h-12 bg-ds-elevated rounded-xl flex items-center justify-center mx-auto">
          <BarChart3 size={24} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Activité</h1>
        <p className="text-gray-400">Taux de conversion, CA prévisionnel et export comptable FEC, inclus dans les plans Solo et Pro.</p>
        <UpgradeButton plan="solo" label="Passer Solo" />
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div>
          <div className="h-6 w-32 bg-ds-elevated rounded mb-2" />
          <div className="h-4 w-48 bg-ds-elevated rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-ds-surface border border-ds-border rounded-xl p-5 h-28" />
          ))}
        </div>
        <div className="bg-ds-surface border border-ds-border rounded-xl h-64" />
      </div>
    );
  }

  const maxCa = Math.max(...stats.monthly_ca.map((m) => m.ca), 1);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <GuidedTourBanner pageKey="stats" />
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Activité</h1>
        <p className="text-sm text-gray-500 mt-1">CA, conversion et exports comptables</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="CA encaissé (année)" value={fmt(stats.ca_ytd)} icon={TrendingUp} color="emerald" />
        <KpiCard label="CA prévisionnel" value={fmt(stats.ca_previsionnel)} icon={Target} color="blue" />
        <KpiCard label="Taux de conversion" value={`${stats.conversion_rate}%`} icon={Percent} color="indigo" />
        <KpiCard label="Valeur moy. devis" value={fmt(stats.avg_proposal)} icon={FileText} color="zinc" />
      </div>

      {/* CA mensuel, SVG area chart */}
      <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">CA mensuel, 12 derniers mois</h2>
        {(() => {
          const data = stats.monthly_ca;
          const n = data.length;
          const CW = 600;
          const CH = 130;
          const BOTTOM = 22;
          const curMonthStr = new Date().toISOString().slice(0, 7);

          const pts: [number, number][] = data.map((d, i) => [
            n > 1 ? (i / (n - 1)) * CW : CW / 2,
            CH - (maxCa > 0 ? (d.ca / maxCa) * CH * 0.88 : 0),
          ]);

          function cPath(ps: [number, number][]): string {
            if (ps.length < 2) return ps.length === 1 ? `M ${ps[0][0]} ${ps[0][1]}` : "";
            let d = `M ${ps[0][0].toFixed(1)} ${ps[0][1].toFixed(1)}`;
            for (let i = 1; i < ps.length; i++) {
              const cpx = ((ps[i-1][0] + ps[i][0]) / 2).toFixed(1);
              d += ` C ${cpx} ${ps[i-1][1].toFixed(1)}, ${cpx} ${ps[i][1].toFixed(1)}, ${ps[i][0].toFixed(1)} ${ps[i][1].toFixed(1)}`;
            }
            return d;
          }

          const linePath = cPath(pts);
          const fillPath = pts.length >= 2
            ? `${linePath} L ${pts[pts.length-1][0].toFixed(1)} ${CH} L ${pts[0][0].toFixed(1)} ${CH} Z`
            : "";

          return (
            <svg viewBox={`0 0 ${CW} ${CH + BOTTOM}`} className="w-full" style={{ height: "164px" }}>
              <defs>
                <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Subtle horizontal grid */}
              {[0.33, 0.66].map((p) => (
                <line key={p} x1="0" y1={p * CH} x2={CW} y2={p * CH}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeOpacity={1} />
              ))}

              {/* Fill area */}
              {fillPath && <path d={fillPath} fill="url(#caGrad)" />}

              {/* Line */}
              {linePath && (
                <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Hover areas + dots + labels */}
              {data.map((d, i) => {
                const [x, y] = pts[i];
                const isHov = hoveredBar === i;
                const isCur = d.month === curMonthStr;
                const colW = CW / n;
                return (
                  <g key={d.month}>
                    <rect x={x - colW / 2} y={0} width={colW} height={CH} fill="transparent"
                      style={{ cursor: "crosshair" }}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)} />
                    {isHov && (
                      <line x1={x} y1={0} x2={x} y2={CH}
                        stroke="#6366f1" strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 3" />
                    )}
                    {(isHov || isCur) && (
                      <circle cx={x} cy={y} r={isCur ? 4.5 : 3.5}
                        fill={isCur ? "#818cf8" : "#6366f1"}
                        stroke={isCur ? "#1e1b4b" : "#3730a3"} strokeWidth={1.5} />
                    )}
                    <text x={x} y={CH + 16} textAnchor="middle" fill="#4b5563" fontSize={9}>
                      {monthLabel(d.month)}
                    </text>
                  </g>
                );
              })}

              {/* Tooltip */}
              {hoveredBar !== null && (() => {
                const d = data[hoveredBar];
                const [x, y] = pts[hoveredBar];
                const tw = 90; const th = 40;
                const tx = Math.min(Math.max(x - tw / 2, 4), CW - tw - 4);
                const ty = Math.max(y - th - 12, 4);
                return (
                  <g style={{ pointerEvents: "none" }}>
                    <rect x={tx} y={ty} width={tw} height={th} rx={7}
                      fill="#1F2937" stroke="#374151" strokeWidth={1} />
                    <text x={tx + tw / 2} y={ty + 15} textAnchor="middle" fill="#9ca3af" fontSize={9.5}>
                      {monthLabel(d.month)}
                    </text>
                    <text x={tx + tw / 2} y={ty + 30} textAnchor="middle" fill="white" fontSize={12} fontWeight="600">
                      {fmt(d.ca)}
                    </text>
                  </g>
                );
              })()}
            </svg>
          );
        })()}
      </div>

      {/* Top clients + Perf devis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Top clients, CA encaissé</h2>
          {stats.top_clients.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune facture payée pour l&apos;instant.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_clients.map((c, i) => {
                const maxClient = stats.top_clients[0].ca;
                const pct = Math.round((c.ca / maxClient) * 100);
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-300 truncate max-w-[160px]">
                        <span className="text-gray-500 mr-1.5">#{i + 1}</span>{c.name}
                      </span>
                      <span className="font-semibold text-white shrink-0">{fmt(c.ca)}</span>
                    </div>
                    <div className="w-full bg-ds-elevated rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Performance des devis</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Devis envoyés</span>
              <span className="font-semibold text-white">{stats.proposals_total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Signés</span>
              <span className="font-semibold text-emerald-400">{stats.proposals_signed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Taux de conversion</span>
              <span className="font-semibold text-indigo-400">{stats.conversion_rate}%</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-ds-elevated rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${stats.conversion_rate}%`,
                    background: stats.conversion_rate >= 60
                      ? "linear-gradient(90deg, #059669, #34d399)"
                      : stats.conversion_rate >= 30
                      ? "linear-gradient(90deg, #4f46e5, #818cf8)"
                      : "linear-gradient(90deg, #d97706, #fbbf24)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className={stats.conversion_rate >= 50 ? "text-emerald-400 font-medium" : "text-gray-500"}>
                  {stats.conversion_rate >= 60 ? "Excellent" :
                   stats.conversion_rate >= 40 ? "Bon" :
                   stats.conversion_rate >= 20 ? "À améliorer" : "Travaille ton pitch"}
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics Pro ── */}
      {stats.is_pro ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Analytics avancées</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
          </div>

          {stats.funnel && (
            <div className="bg-ds-surface border border-ds-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Funnel de conversion</h3>
              <div className="flex items-center gap-1">
                {[
                  { label: "Créés", value: stats.funnel.created, color: "bg-gray-600" },
                  { label: "Envoyés", value: stats.funnel.sent, color: "bg-blue-600" },
                  { label: "Vus", value: stats.funnel.viewed, color: "bg-indigo-500" },
                  { label: "Signés", value: stats.funnel.signed, color: "bg-emerald-500" },
                  { label: "Refusés", value: stats.funnel.declined, color: "bg-red-500/60" },
                ].map((stage, i, arr) => {
                  const max = arr[0].value || 1;
                  const pct = Math.round((stage.value / max) * 100);
                  return (
                    <div key={stage.label} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <div className="text-lg font-bold text-white">{stage.value}</div>
                        <div className={`w-full h-2 rounded-full ${stage.color} mt-1`} style={{ opacity: Math.max(pct / 100, 0.15) }} />
                        <div className="text-[10px] text-gray-500 mt-1.5 font-medium">{stage.label}</div>
                        {i < arr.length - 1 && stage.value > 0 && (
                          <div className="text-[10px] text-gray-600 mt-0.5">{Math.round((arr[i + 1].value / stage.value) * 100)}%</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-blue-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Délai moyen de signature</span>
              </div>
              {stats.avg_days_to_sign != null ? (
                <>
                  <div className="text-3xl font-bold text-white">{stats.avg_days_to_sign}<span className="text-sm text-gray-400 ml-1">j</span></div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.avg_days_to_sign <= 3 ? "🔥 Très rapide" : stats.avg_days_to_sign <= 7 ? "✓ Dans la moyenne" : stats.avg_days_to_sign <= 14 ? "Relance conseillée" : "⚠️ Long, optimise ton pitch"}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Pas encore de données</div>
              )}
            </div>

            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meilleur mois</span>
              </div>
              {stats.best_month ? (
                <>
                  <div className="text-3xl font-bold text-emerald-400">{stats.best_month.rate}%</div>
                  <div className="text-xs text-gray-500 mt-1">conversion en {monthLabel(stats.best_month.month)}</div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Données insuffisantes</div>
              )}
            </div>

            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Efficacité relances</span>
              </div>
              {stats.reminders_impact ? (
                <>
                  <div className="text-3xl font-bold text-amber-400">{stats.reminders_impact.rate}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.reminders_impact.signed_after_reminder} signés sur {stats.reminders_impact.total_reminded} relancés
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Aucune relance envoyée</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Analytics avancées</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <div className="filter blur-sm pointer-events-none select-none" aria-hidden>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-6 mb-4">
                <div className="h-4 w-40 bg-ds-elevated rounded mb-5" />
                <div className="flex items-center gap-1">
                  {[100, 78, 52, 34, 12].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-lg font-bold text-white">{v}</div>
                      <div className="w-full h-2 rounded-full bg-indigo-600" style={{ opacity: v / 100 }} />
                      <div className="text-[10px] text-gray-500">—</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Clock, color: "text-blue-400", val: "4j", label: "Délai moyen" },
                  { icon: TrendingUp, color: "text-emerald-400", val: "68%", label: "Meilleur mois" },
                  { icon: Zap, color: "text-amber-400", val: "42%", label: "Efficacité relances" },
                ].map(({ icon: Icon, color, val, label }) => (
                  <div key={label} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={14} className={color} />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-ds-bg/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
              <div className="text-center px-6 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
                  <Lock size={16} className="text-indigo-400" />
                </div>
                <p className="text-white font-semibold text-base mb-1">Analytics avancées, Plan Pro</p>
                <p className="text-gray-400 text-sm mb-4">Funnel de conversion, délai moyen de signature, meilleur mois et efficacité de vos relances.</p>
                <UpgradeButton plan="pro" label="Passer Pro, 34€/mois" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Exports comptables ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Exports comptables</h2>
          <select
            value={exportYear}
            onChange={(e) => setExportYear(Number(e.target.value))}
            className="bg-ds-elevated border border-ds-border text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* FEC, Solo+ */}
        <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Download size={15} className="text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Export FEC</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ds-elevated text-gray-400 border border-ds-border">Solo+</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fichier des Écritures Comptables, format DGFiP, à remettre à votre comptable ou en cas de contrôle fiscal.
                </p>
              </div>
            </div>
            <button onClick={handleExportFEC} disabled={exporting}
              className="flex items-center gap-2 bg-ds-elevated border border-ds-border hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
              <Download size={14} />
              {exporting ? "Génération…" : "Télécharger .txt"}
            </button>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 pt-3 border-t border-ds-border">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>Journaux VT (Ventes) et BQ (Banque) · Comptes 411, 706, 445710 · Format tabulé UTF-8</span>
          </div>
        </div>

        {/* Exports Pro */}
        {stats.is_pro ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* CSV Factures */}
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Table2 size={15} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Export CSV Factures</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toutes les factures de l&apos;année dans un tableur, client, montants HT/TVA/TTC, statut.
                  </p>
                </div>
              </div>
              <button onClick={handleExportCsv} disabled={exportingCsv}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 disabled:opacity-50 text-emerald-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                <Download size={14} />
                {exportingCsv ? "Génération…" : `Télécharger CSV ${exportYear}`}
              </button>
            </div>

            {/* Récapitulatif mensuel */}
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={15} className="text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Récapitulatif mensuel CA</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    CA mois par mois, HT, TVA, TTC, encaissé et en attente. Idéal pour votre comptable.
                  </p>
                </div>
              </div>
              <button onClick={handleExportRecap} disabled={exportingRecap}
                className="w-full flex items-center justify-center gap-2 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 disabled:opacity-50 text-violet-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                <Download size={14} />
                {exportingRecap ? "Génération…" : `Télécharger récap ${exportYear}`}
              </button>
            </div>
          </div>
        ) : (
          /* Solo, aperçu verrouillé des exports Pro */
          <div className="relative rounded-xl overflow-hidden">
            <div className="grid sm:grid-cols-2 gap-4 filter blur-sm pointer-events-none select-none" aria-hidden>
              {[
                { icon: Table2, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", label: "Export CSV Factures", desc: "Toutes les factures dans un tableur" },
                { icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/20", label: "Récapitulatif mensuel CA", desc: "CA mois par mois pour votre comptable" },
              ].map(({ icon: Icon, color, bg, label, desc }) => (
                <div key={label} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <div className="w-full h-9 bg-ds-elevated rounded-lg" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-ds-bg/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
              <div className="text-center px-4">
                <p className="text-white font-semibold text-sm mb-1">Exports avancés, Plan Pro</p>
                <p className="text-gray-400 text-xs mb-3">CSV factures et récapitulatif mensuel pour votre comptable.</p>
                <UpgradeButton plan="pro" label="Passer Pro" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
