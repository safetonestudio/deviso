"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * SessionGuard, deux rôles :
 *
 * 1. "Rester connecté" : si l'utilisateur avait décoché la case, déconnecter
 *    automatiquement à la réouverture du navigateur.
 *    Logique : flag dans localStorage (persiste) + sessionStorage (effacé à la fermeture).
 *    Si local présent mais session absent → navigateur rouvert → sign out.
 *
 * 2. Comptes démo : la session démo ne doit PAS survivre à la fermeture du navigateur.
 *    Logique identique : si deviso_is_demo est dans localStorage mais pas dans
 *    sessionStorage → l'onglet a été fermé et rouvert → sign out immédiat.
 */
export function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // ── "Rester connecté" ───────────────────────────────────────────────────
    const noPersistLocal = localStorage.getItem("deviso_no_persist") === "1";
    const noPersistSession = sessionStorage.getItem("deviso_no_persist") === "1";

    if (noPersistLocal && !noPersistSession) {
      localStorage.removeItem("deviso_no_persist");
      supabase.auth.signOut().then(() => router.push("/login"));
      return;
    }

    // ── Session démo ────────────────────────────────────────────────────────
    // sessionStorage est effacé à la fermeture du navigateur/onglet.
    // Si le flag demo est dans localStorage mais plus dans sessionStorage,
    // l'utilisateur a rouvert le navigateur → on le déconnecte.
    const isDemoLocal = localStorage.getItem("deviso_is_demo") === "1";
    const isDemoSession = sessionStorage.getItem("deviso_is_demo") === "1";

    if (isDemoLocal && !isDemoSession) {
      localStorage.removeItem("deviso_is_demo");
      supabase.auth.signOut().then(() => router.push("/login"));
      return;
    }
  }, [router]);

  return null;
}
