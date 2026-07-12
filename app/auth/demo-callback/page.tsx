"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Page dédiée au flow démo : gère le flux implicite Supabase (#access_token dans le hash)
// Les liens admin-générés (generateLink) utilisent le flux implicite, pas PKCE.
export default function DemoCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1); // retire le "#"
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      router.replace("/login?error=auth");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error("[demo-callback] setSession:", error);
          router.replace("/login?error=auth");
          return;
        }
        // Flag démo : sessionStorage uniquement → effacé automatiquement à la fermeture du navigateur/onglet
        // Le flag localStorage permet à SessionGuard de détecter la réouverture et de déconnecter
        try {
          localStorage.setItem("deviso_is_demo", "1");
          sessionStorage.setItem("deviso_is_demo", "1");
          // Réinitialise le tour guidé pour que la démo le montre toujours
          localStorage.removeItem("deviso_tour_v5");
        } catch {}
        router.replace("/dashboard");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Chargement de ta démo…</p>
      </div>
    </div>
  );
}
