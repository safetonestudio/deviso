"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError("Une erreur est survenue. Vérifie ton adresse email.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
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
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h1 className="text-xl font-semibold text-white mb-2">Email envoyé !</h1>
              <p className="text-gray-400 text-sm mb-6">
                Un lien de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>. Vérifie ta boîte mail.
              </p>
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">Mot de passe oublié</h1>
              <p className="text-gray-400 text-sm mb-6">
                Saisis ton email et on t&apos;envoie un lien pour réinitialiser ton mot de passe.
              </p>

              {error && (
                <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-60 transition-all"
                >
                  {loading ? "Envoi…" : "Envoyer le lien"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-5">
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
