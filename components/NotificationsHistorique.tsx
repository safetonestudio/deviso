"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const quand = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** Historique des notifications (signatures, refus, paiements...), meme source que la cloche. */
export function NotificationsHistorique() {
  const [liste, setListe] = useState<Notification[] | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((d) => setListe(d.notifications ?? []))
      .catch(() => setListe([]));
  }, []);

  async function toutLire() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setListe((l) => (l ?? []).map((n) => ({ ...n, read: true })));
  }

  const nonLues = (liste ?? []).filter((n) => !n.read).length;

  return (
    <section className="carte overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Historique</h2>
          <p className="text-[13px] text-gray-400">Signatures, refus, paiements et autres événements</p>
        </div>
        {nonLues > 0 && (
          <button onClick={toutLire} className="text-[13px] font-semibold text-indigo-400 hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>
      {liste === null ? (
        <p className="px-5 pb-5 text-sm text-gray-400">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-gray-400">Aucune notification pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-ds-border border-t border-ds-border">
          {liste.map((n) => {
            const contenu = (
              <div className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-indigo-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? "text-gray-400" : "text-ink font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="text-[13px] text-gray-400 mt-0.5 break-words">{n.body}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{quand(n.created_at)}</span>
              </div>
            );
            return (
              <li key={n.id} className={n.read ? "" : "bg-ds-elevated/60"}>
                {n.link ? <Link href={n.link} className="block hover:bg-ds-elevated transition-colors">{contenu}</Link> : contenu}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
