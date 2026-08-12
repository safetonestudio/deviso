"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Intervalle du battement de cœur. Le serveur tolère 10 minutes d'absence. */
const INTERVALLE_MS = 60_000;

/**
 * Termine la session de démonstration : suppression du compte factice côté
 * serveur, nettoyage des marqueurs locaux, déconnexion, puis redirection.
 *
 * Exporté parce que la déconnexion doit suivre exactement le même chemin que le
 * bouton « Quitter la démo ». Deux implémentations séparées finiraient par
 * diverger — c'est précisément le défaut qui a laissé le portail de facturation
 * sans garde-fou alors que le tunnel de paiement en avait un.
 */
export async function terminerDemo(destination = "/demo-terminee") {
  try {
    await fetch("/api/demo/end", { method: "POST" });
  } catch {
    // Réseau coupé : le compte partira par inactivité au bout de 10 minutes.
    // Ce n'est pas une raison pour bloquer l'utilisateur sur place.
  }

  localStorage.removeItem("deviso_no_persist");
  sessionStorage.removeItem("deviso_no_persist");
  localStorage.removeItem("deviso_is_demo");
  sessionStorage.removeItem("deviso_is_demo");

  try {
    await createClient().auth.signOut();
  } catch {
    // Le compte n'existe plus côté serveur : la session est de toute façon morte.
  }

  // Rechargement complet plutôt que navigation côté client : on veut être
  // certain qu'aucun état de la démo ne survive à la sortie.
  window.location.href = destination;
}

/**
 * Battement de cœur d'une session de démonstration, plus le bouton de sortie.
 *
 * Pourquoi un battement plutôt qu'une détection de fermeture. Il n'existe aucun
 * moyen fiable de savoir qu'un onglet vient d'être fermé : si le navigateur
 * plante ou si l'appareil s'éteint, aucun code ne s'exécute. `pagehide` +
 * `sendBeacon` fonctionnent souvent, mais partent aussi lors d'un simple
 * changement d'onglet sur mobile — supprimer le compte sur ce signal reviendrait
 * à couper la démo de quelqu'un en train de s'en servir. On inverse donc :
 * la session prouve régulièrement qu'elle est vivante, et le serveur conclut du
 * silence que le visiteur est parti.
 */
export function DemoSession() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const battementEnVol = useRef(false);

  useEffect(() => {
    let annule = false;

    const battre = async () => {
      // Onglet en arrière-plan : inutile de tenir le compte en vie, dix minutes
      // de tolérance suffisent largement à un aller-retour.
      if (document.visibilityState === "hidden") return;
      if (battementEnVol.current) return;
      battementEnVol.current = true;
      try {
        await fetch("/api/demo/heartbeat", { method: "POST" });
      } catch {
        // Coupure réseau passagère : le prochain battement rattrapera.
      } finally {
        if (!annule) battementEnVol.current = false;
      }
    };

    battre();
    const minuteur = setInterval(battre, INTERVALLE_MS);
    // Au retour d'un onglet mis de côté, on se signale sans attendre le tour
    // suivant : c'est le moment où le compte risque le plus d'être proche de
    // la limite d'inactivité.
    document.addEventListener("visibilitychange", battre);

    return () => {
      annule = true;
      clearInterval(minuteur);
      document.removeEventListener("visibilitychange", battre);
    };
  }, []);

  const quitter = useCallback(async () => {
    if (enCours) return;
    setEnCours(true);
    await terminerDemo();
    router.refresh();
  }, [enCours, router]);

  return (
    <button
      onClick={quitter}
      disabled={enCours}
      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-ds-border text-gray-400 hover:text-white hover:bg-ds-elevated text-xs font-medium transition-colors disabled:opacity-60"
    >
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
      {enCours ? "Fermeture…" : "Quitter la démo"}
    </button>
  );
}
