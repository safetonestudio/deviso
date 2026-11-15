"use client";

import { useEffect } from "react";

/**
 * La page d'accueil est en mode nuit uniquement (décision de Selim, 15/11/2026).
 * Le choix de thème de l'application (classe `.light` sur <html>) peut rester
 * posé quand on revient de l'app sans recharger : on le retire ici. L'app le
 * repose elle-même à son retour, le choix du visiteur n'est pas modifié.
 */
export function ModeNuit() {
  useEffect(() => {
    document.documentElement.classList.remove("light");
  }, []);
  return null;
}
