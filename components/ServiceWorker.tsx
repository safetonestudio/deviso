"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // En local (next dev), les fichiers /_next/static/ gardent le meme nom quand
    // leur contenu change. Le service worker, qui les sert depuis son cache, faisait
    // alors tourner l'ancien code face a un rendu serveur neuf : erreur
    // d'hydratation, puis rechargements. Hors production, on le desinstalle.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      if ("caches" in window) {
        caches.keys().then((keys) => keys.filter((k) => k.startsWith("deviso-")).forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return null;
}
