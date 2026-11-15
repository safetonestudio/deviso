"use client";

import { useEffect } from "react";

/**
 * Fait apparaître en douceur les blocs marqués `.reveal` quand ils entrent
 * dans l'écran (site public uniquement, jamais dans l'app). Sans JavaScript ou
 * avec « réduire les animations », la CSS laisse tout visible d'emblée.
 */
export function Apparitions() {
  useEffect(() => {
    const blocs = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      blocs.forEach((b) => b.classList.add("vu"));
      return;
    }
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) {
            e.target.classList.add("vu");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    blocs.forEach((b) => obs.observe(b));
    // Filet de sécurité : rien ne doit rester invisible.
    const secours = window.setTimeout(() => blocs.forEach((b) => b.classList.add("vu")), 4000);
    return () => {
      obs.disconnect();
      window.clearTimeout(secours);
    };
  }, []);
  return null;
}
