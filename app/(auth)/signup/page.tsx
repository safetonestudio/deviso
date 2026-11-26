"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordChecklist, isPasswordValid } from "@/components/PasswordChecklist";
import { MailCheck } from "lucide-react";
import { BETA_OUVERTE, LIEN_CANDIDATURE } from "@/lib/beta";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextDemande = searchParams.get("next") || "/dashboard";
  const prefillEmail = searchParams.get("email") || "";
  const jetonBeta = searchParams.get("beta") || "";
  /*
   * Bêta ouverte (lib/beta.ts) : l'inscription n'est ouverte qu'aux invitations.
   *   - lien personnel d'un candidat accepté (?beta=...) : vérifié ici, puis
   *     consommé après la confirmation de l'adresse (/api/beta/activer) ;
   *   - invitation d'équipe ou d'expert-comptable (?next=/join/...) : inchangée.
   * Tout autre visiteur voit l'appel aux bêta-testeurs. Le serveur ne fait pas
   * confiance à cette page : un compte créé sans invitation n'obtient ni
   * formule ni essai (garde de /api/stripe/checkout).
   * Bêta fermée : la page redevient exactement celle d'avant.
   */
  const invitationEquipe = nextDemande.startsWith("/join/");
  const [acces, setAcces] = useState<"libre" | "verification" | "beta" | "lien_invalide" | "ferme">(() =>
    !BETA_OUVERTE || invitationEquipe ? "libre" : jetonBeta ? "verification" : "ferme"
  );
  const [emailBeta, setEmailBeta] = useState("");
  const nextUrl = acces === "beta" ? `/api/beta/activer?j=${encodeURIComponent(jetonBeta)}` : nextDemande;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (acces !== "verification") return;
    let annule = false;
    fetch(`/api/beta/jeton?j=${encodeURIComponent(jetonBeta)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (annule) return;
        if (r?.valide && typeof r.email === "string") {
          setEmailBeta(r.email);
          setEmail(r.email);
          setAcces("beta");
        } else {
          setAcces("lien_invalide");
        }
      })
      .catch(() => !annule && setAcces("lien_invalide"));
    return () => {
      annule = true;
    };
  }, [acces, jetonBeta]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError("Le mot de passe ne respecte pas toutes les exigences ci-dessous.");
      return;
    }
    if (acces === "beta" && email.trim().toLowerCase() !== emailBeta.toLowerCase()) {
      setError("Ce lien est lié à l'adresse " + emailBeta + " : créez votre compte avec cette adresse.");
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
      <div className="min-h-screen bg-site flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <MailCheck size={44} className="mx-auto mb-4 text-indigo-400" />
          <h2 className="text-2xl font-bold text-ink mb-2">Vérifiez vos emails</h2>
          <p className="text-gray-400 mb-6">
            Nous vous avons envoyé un lien de confirmation à <strong className="text-ink">{email}</strong>. Cliquez dessus pour
            activer votre compte.
          </p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  if (acces === "ferme" || acces === "lien_invalide" || acces === "verification") {
    return (
      <div className="min-h-screen bg-site flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-ink mb-3">
            {acces === "verification"
              ? "Vérification de votre lien..."
              : acces === "lien_invalide"
                ? "Ce lien n'est plus valable"
                : "Les inscriptions sont réservées aux bêta-testeurs"}
          </h1>
          {acces !== "verification" && (
            <>
              <p className="text-gray-400 mb-6">
                {acces === "lien_invalide"
                  ? "Il a déjà servi ou il a expiré. Écrivez à support@getdeviso.fr pour en recevoir un nouveau."
                  : "Deviso est en bêta : les comptes s'ouvrent sur invitation. Candidatez en une minute, je vous réponds sous 48 heures."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={LIEN_CANDIDATURE} className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-on-accent font-semibold">
                  Devenir bêta-testeur
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center h-11 px-5 rounded-xl border border-ds-border text-ink font-semibold hover:bg-ink/5">
                  Se connecter
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-site flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br/srgb from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-ink font-bold">D</span>
            </div>
            <span className="font-bold text-xl text-ink">Deviso</span>
          </Link>
        </div>

        <div className="bg-ds-surface rounded-2xl border border-ds-border p-8">
          <h1 className="text-2xl font-bold text-ink mb-1">Créer un compte</h1>
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Votre prénom et nom</label>
              <input aria-label="Votre prénom et nom"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Thomas Dupont"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-ink placeholder:text-gray-600 focus:outline-hidden focus:border-indigo-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse email</label>
              <input aria-label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={acces === "beta"}
                required
                placeholder="thomas@exemple.fr"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-ink placeholder:text-gray-600 focus:outline-hidden focus:border-indigo-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <input aria-label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="12 caractères minimum"
                className="w-full px-4 py-3 rounded-xl bg-ds-bg border border-ds-border text-ink placeholder:text-gray-600 focus:outline-hidden focus:border-indigo-500 text-sm transition"
              />
              <PasswordChecklist password={password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-ink font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? "Création du compte..." : "Créer mon compte →"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/cgu" className="underline hover:text-gray-400">CGU</Link> et notre{" "}
              <Link href="/confidentialite" className="underline hover:text-gray-400">politique de confidentialité</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Idem login : useSearchParams() force le rendu client, donc le HTML servi ne
 * contient que ce fallback. Il porte le H1 pour rester lisible par les crawlers.
 */
function SignupSkeleton() {
  return (
    <div className="min-h-screen bg-site flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-bold text-xl text-ink">Deviso</span>
        </div>
        <div className="bg-ds-surface rounded-2xl border border-ds-border p-8">
          <h1 className="text-2xl font-bold text-ink mb-1">Créer un compte</h1>
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}
