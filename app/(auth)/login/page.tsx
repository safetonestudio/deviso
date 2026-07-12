"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const prefillEmail = searchParams.get("email") || "";
  const isInvite = nextUrl.startsWith("/join/");

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Gestion "Rester connecté"
    if (!rememberMe) {
      // Flag dans les deux storages : localStorage persiste après fermeture du browser,
      // sessionStorage est effacé. La combinaison permet de détecter un redémarrage.
      localStorage.setItem("deviso_no_persist", "1");
      sessionStorage.setItem("deviso_no_persist", "1");
    } else {
      localStorage.removeItem("deviso_no_persist");
      sessionStorage.removeItem("deviso_no_persist");
    }

    router.push(nextUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4 relative" suppressHydrationWarning>
      <div className="absolute inset-0 bg-indigo-600/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold">D</span>
            </div>
            <span className="font-semibold text-xl text-white">Deviso</span>
          </Link>
        </div>

        <div className="bg-ds-surface rounded-2xl border border-ds-border p-8">
          {isInvite && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-indigo-300">
              Connecte-toi pour accepter l'invitation et rejoindre l'équipe.
            </div>
          )}

          <h1 className="text-2xl font-semibold text-white mb-1">Connexion</h1>
          <p className="text-gray-400 text-sm mb-6">
            Pas encore de compte ?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextUrl)}&email=${encodeURIComponent(email)}`}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isInvite ? "Créer un compte" : "S'inscrire gratuitement"}
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="thomas@exemple.fr"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  rememberMe
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-transparent border-ds-border"
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                className="text-sm text-gray-400"
                onClick={() => setRememberMe(!rememberMe)}
              >
                Rester connecté
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? "Connexion..." : isInvite ? "Se connecter et rejoindre →" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ds-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
