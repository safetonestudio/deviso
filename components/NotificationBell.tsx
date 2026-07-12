"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  /** "sidebar" → dropdown à droite du bouton, aligné en bas
   *  "topbar"  → dropdown en dessous, aligné à droite */
  placement?: "sidebar" | "topbar";
}

function typeIcon(type: string) {
  switch (type) {
    case "proposal_signed":   return "✍️";
    case "proposal_viewed":   return "👁️";
    case "proposal_declined": return "✕";
    case "invoice_paid":      return "💰";
    default:                  return "🔔";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

export function NotificationBell({ placement = "sidebar" }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    setNotifications((prev) =>
      id
        ? prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        : prev.map((n) => ({ ...n, read: true }))
    );
  }

  async function handleClickNotif(n: Notification) {
    if (!n.read) await markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // sidebar : dropdown à droite du bouton, aligné en bas, décalé vers le haut pour centrer
  // topbar  : dropdown en dessous, aligné à droite
  const dropdownPos =
    placement === "sidebar"
      ? "bottom-0 left-full ml-4"
      : "top-full mt-2 right-0";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-ds-elevated transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${dropdownPos} w-[420px] bg-ds-surface border border-ds-border rounded-xl shadow-2xl z-50 overflow-hidden`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border">
            <span className="text-base font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markRead()}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="py-14 text-center text-sm text-gray-500">Chargement…</div>
            ) : notifications.length === 0 ? (
              <div className="py-14 text-center">
                <Bell size={28} className="text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune notification</p>
                <p className="text-xs text-gray-600 mt-1">Les événements apparaîtront ici</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  className={`w-full flex items-start gap-4 px-5 py-4 border-b border-ds-border last:border-0 hover:bg-ds-elevated transition-colors text-left ${
                    !n.read ? "bg-indigo-500/5" : ""
                  }`}
                >
                  <span className="text-xl mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        n.read ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
