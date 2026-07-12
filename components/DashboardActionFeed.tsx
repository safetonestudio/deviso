"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, Receipt, ArrowRight } from "lucide-react";

export type ActionItem = {
  type: "overdue_invoice" | "remind_proposal" | "to_invoice" | "remind_invoice";
  id: string;
  label: string;       // ex: "FAC-2025-003 · Studio Lumière"
  sublabel: string;    // ex: "En retard de 5 jours · 2 400 €"
  urgency: "high" | "medium" | "low";
  href: string;        // lien vers la page détail
  actionLabel: string;
  actionApi?: string;  // POST → relancer
  actionHref?: string; // navigate → facturer
};

const URGENCY_STYLE = {
  high:   "border-l-red-500/60   bg-red-500/[0.04]",
  medium: "border-l-amber-500/60 bg-amber-500/[0.04]",
  low:    "border-l-ds-border    bg-ds-surface",
};

const URGENCY_ICON = {
  high:   { icon: AlertCircle, cls: "text-red-400" },
  medium: { icon: Clock,       cls: "text-amber-400" },
  low:    { icon: Receipt,     cls: "text-gray-500" },
};

export function DashboardActionFeed({ items }: { items: ActionItem[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  if (items.length === 0) return null;

  const visible = items.filter((it) => !done.has(it.id));
  if (visible.length === 0) return null;

  async function handleAction(item: ActionItem) {
    if (item.actionApi) {
      setLoading((s) => new Set(s).add(item.id));
      try {
        const res = await fetch(item.actionApi, { method: "POST" });
        if (res.ok) setDone((s) => new Set(s).add(item.id));
      } finally {
        setLoading((s) => { const n = new Set(s); n.delete(item.id); return n; });
      }
    }
  }

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Actions requises
      </h2>
      <div className="space-y-2">
        {visible.map((item) => {
          const { icon: Icon, cls } = URGENCY_ICON[item.urgency];
          const isLoading = loading.has(item.id);

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 border border-ds-border border-l-2 rounded-xl px-4 py-3 transition-all ${URGENCY_STYLE[item.urgency]}`}
            >
              <Icon size={14} className={`${cls} shrink-0`} />

              <Link href={item.href} className="flex-1 min-w-0 group">
                <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors leading-snug truncate">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.sublabel}</p>
              </Link>

              {/* Action inline */}
              {item.actionApi && (
                <button
                  onClick={() => handleAction(item)}
                  disabled={isLoading}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                    item.urgency === "high"
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {isLoading ? "…" : item.actionLabel}
                </button>
              )}
              {item.actionHref && (
                <Link
                  href={item.actionHref}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors flex items-center gap-1"
                >
                  {item.actionLabel} <ArrowRight size={11} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
