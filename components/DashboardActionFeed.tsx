"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, Receipt, ArrowRight, CircleCheck } from "lucide-react";

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

// Une seule carte, des lignes calmes : l'urgence se lit dans la pastille
// d'icone (couleur et forme), pas dans un fond colore ni une barre laterale,
// qui criaient plus fort que le contenu (refonte visuelle, 02/11/2026).
const URGENCY_ICON = {
  high:   { icon: AlertCircle, cls: "bg-red-500/10 text-red-400" },
  medium: { icon: Clock,       cls: "bg-amber-500/10 text-amber-400" },
  low:    { icon: Receipt,     cls: "bg-indigo-500/10 text-indigo-400" },
};

export function DashboardActionFeed({ items }: { items: ActionItem[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const visible = items.filter((it) => !done.has(it.id));

  // Rien en attente : on rassure explicitement au lieu de disparaître.
  // Un fil qui s'efface se lit comme une page vide, pas comme une confirmation.
  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-3 border border-ds-border rounded-xl px-4 py-3.5 bg-(--urgency-ok-bg)">
        <CircleCheck size={16} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink leading-snug">Tout est à jour</p>
          <p className="text-xs text-gray-500 mt-0.5">Rien ne réclame ton attention pour l&apos;instant.</p>
        </div>
      </div>
    );
  }

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
      <h2 className="text-xs font-semibold text-gray-500 mb-3">
        Actions requises
      </h2>
      <div className="carte divide-y divide-ds-border overflow-hidden">
        {visible.map((item) => {
          const { icon: Icon, cls } = URGENCY_ICON[item.urgency];
          const isLoading = loading.has(item.id);

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${cls}`}>
                <Icon size={15} />
              </span>

              <Link href={item.href} className="flex-1 min-w-0 group">
                <p className="text-sm font-semibold text-ink group-hover:text-indigo-400 transition-colors leading-snug truncate">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.sublabel}</p>
              </Link>

              {/* Action inline */}
              {item.actionApi && (
                <button
                  onClick={() => handleAction(item)}
                  disabled={isLoading}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                    item.urgency === "high"
                      ? "bg-ds-surface hover:bg-ds-elevated text-red-400 border border-ds-border"
                      : "bg-ds-surface hover:bg-ds-elevated text-amber-400 border border-ds-border"
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
