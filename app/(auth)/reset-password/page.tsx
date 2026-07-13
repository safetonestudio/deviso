"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PasswordChecklist, isPasswordValid } from "@/components/PasswordChecklist";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!isPasswordValid(password)) {
      setError("Le mot de passe ne respecte pas toutes les exigences ci-dessous.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Une erreur est survenue. Réessaie ou demande un nouveau lien.");
      setLoading(false);
      return;
    }
    router.push("/dashboard?reset=1");
  }

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold">D</span>
            </div>
            <span className="font-semibold text-xl text-white">Deviso</span>
          </Link>
        </div>

        <div className="bg-ds-surface rounded-2xl border border-ds-border p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Nouveau mot de passe</h1>
          <p className="text-gray-400 text-sm mb-6">
            Choisis un mot de passe robuste — toutes les cases doivent être vertes.
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
              <PasswordChecklist password={password} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-60 transition-all"
            >
              {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
