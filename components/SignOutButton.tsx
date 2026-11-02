"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { terminerDemo } from "@/components/DemoSession";

export function SignOutButton({ isDemo = false, compact = false }: { isDemo?: boolean; compact?: boolean }) {
  const router = useRouter();

  const handleSignOut = async () => {
    // Se déconnecter d'une démo, c'est la quitter. Sans cela le compte factice
    // resterait en base jusqu'à expiration alors que l'utilisateur a clairement
    // signifié son départ. On passe par le même chemin que le bouton dédié,
    // plutôt que d'écrire une seconde fois la même logique.
    if (isDemo) {
      await terminerDemo();
      return;
    }

    // Nettoyer tous les flags de session
    localStorage.removeItem("deviso_no_persist");
    sessionStorage.removeItem("deviso_no_persist");
    localStorage.removeItem("deviso_is_demo");
    sessionStorage.removeItem("deviso_is_demo");

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className={
        compact
          ? "inline-flex items-center gap-2 rounded-lg border border-ds-border bg-ds-elevated px-3 py-2 text-sm font-medium text-gray-400 hover:text-ink hover:bg-ds-surface transition-colors whitespace-nowrap"
          : "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-400 hover:text-ink hover:bg-ds-elevated text-sm transition-colors"
      }
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
      Se déconnecter
    </button>
  );
}
