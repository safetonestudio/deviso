"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const prefillEmail = searchParams.get("email") || "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Transmet le next URL pour que les membres invités reviennent sur /join/[token]
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Vérifie tes emails</h2>
          <p className="text-gray-400 mb-6">
            On a envoyé un lien de confirmation à <strong className="text-white">{email}</strong>. Clique dessus pour
            activer ton compte.
          </p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="font-bold text-xl text-white">Deviso</span>
          </Link>
        </div>

        <div className="bg-ds-surface rounded-2xl border border-ds-border p-8">
          <h1 className="text-2xl font-extrabold text-white mb-1">Créer un compte</h1>
          <p className="text-gray-400 text-sm mb-6">
            Déjà inscrit ?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextUrl)}&email=${encodeURIComponent(email)}`}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Se connecter
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ton prénom et nom</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Thomas Dupont"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse email</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? "Création du compte..." : "Créer mon compte →"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              En créant un compte, tu acceptes nos{" "}
              <Link href="/cgu" className="underline hover:text-gray-400">CGU</Link> et notre{" "}
              <Link href="/confidentialite" className="underline hover:text-gray-400">politique de confidentialité</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ds-bg" />}>
      <SignupForm />
    </Suspense>
  );
}
