import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  delta?: { value: string; positive: boolean };
  color?: "indigo" | "emerald" | "amber" | "blue" | "zinc";
}

const colorMap = {
  indigo:  { bar: "bg-indigo-500" },
  emerald: { bar: "bg-emerald-500" },
  amber:   { bar: "bg-amber-500" },
  blue:    { bar: "bg-blue-500" },
  zinc:    { bar: "bg-ds-elevated" },
};

export function KpiCard({ label, value, icon: Icon, trend, delta, color = "indigo" }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
      {/* Barre accent colorée, unique usage de couleur dans la card */}
      <div className={`h-px ${c.bar}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-ds-elevated text-gray-500">
            <Icon size={14} />
          </div>
        </div>
        <div className="text-4xl font-semibold text-white leading-none tabular-nums tracking-tight">{value}</div>
        {trend && <div className="text-xs text-gray-600 mt-2">{trend}</div>}
        {delta && (
          <div className={`inline-flex items-center gap-0.5 text-xs mt-2 font-medium px-1.5 py-0.5 rounded-md ${
            delta.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {delta.positive ? "↑" : "↓"} {delta.value}
          </div>
        )}
      </div>
    </div>
  );
}
