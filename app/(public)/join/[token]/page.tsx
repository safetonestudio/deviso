"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { UsersRound, ArrowRight, LogIn, AlertCircle } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "accepting" }
  | { status: "ready"; ownerName: string; inviteeEmail: string }
  | { status: "wrong_account"; currentEmail: string; inviteeEmail: string; ownerName: string }
  | { status: "error"; message: string }
  | { status: "already_accepted" };

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    async function init() {
      // 1. Récupère les infos publiques de l'invitation
      const res = await fetch(`/api/team/invite-info/${token}`);
      if (res.status === 409) { setState({ status: "already_accepted" }); return; }
      if (!res.ok) { setState({ status: "error", message: "Cette invitation est invalide ou a expiré." }); return; }
      const info = await res.json();

      // 2. Vérifie si l'utilisateur est déjà connecté
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Vérifie que l'email connecté correspond à l'invitation
        const emailMatch = user.email?.toLowerCase() === info.invitee_email?.toLowerCase();
        if (emailMatch) {
          // Bon compte → accepte directement
          setState({ status: "accepting" });
          window.location.href = `/api/team/accept/${token}`;
        } else {
          // Mauvais compte → demande de choisir
          setState({
            status: "wrong_account",
            currentEmail: user.email ?? "",
            inviteeEmail: info.invitee_email,
            ownerName: info.owner_name,
          });
        }
        return;
      }

      // Pas connecté → affiche la page d'invitation
      setState({ status: "ready", ownerName: info.owner_name, inviteeEmail: info.invitee_email });
    }

    init();
  }, [token]);

  if (state.status === "loading" || state.status === "accepting") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 text-sm">
            {state.status === "accepting" ? "Rejoindre l'équipe…" : "Chargement…"}
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "already_accepted") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
        <div className="bg-[#111827] border border-[#2B3444] rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <UsersRound size={22} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invitation déjà acceptée</h1>
          <p className="text-gray-400 text-sm mb-6">Tu fais déjà partie de cette équipe.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Accéder au dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
        <div className="bg-[#111827] border border-[#2B3444] rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <UsersRound size={22} className="text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invitation invalide</h1>
          <p className="text-gray-400 text-sm mb-6">{state.message}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#2B3444] text-gray-300 hover:text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Mauvais compte connecté
  if (state.status === "wrong_account") {
    const signoutUrl = `/join/${token}`;
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
        <div className="bg-[#111827] border border-[#2B3444] rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Mauvais compte connecté</h1>
          <p className="text-gray-400 text-sm mb-1">
            Cette invitation est destinée à
          </p>
          <p className="text-white font-medium text-sm mb-4">{state.inviteeEmail}</p>
          <p className="text-gray-500 text-xs mb-6">
            Tu es actuellement connecté avec <span className="text-gray-400">{state.currentEmail}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Se déconnecter et rejoindre avec {state.inviteeEmail.split("@")[0]}
            </button>
            <button
              onClick={() => {
                setState({ status: "accepting" });
                window.location.href = `/api/team/accept/${token}`;
              }}
              className="w-full py-3 border border-[#2B3444] text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
            >
              Rejoindre avec mon compte actuel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État principal : invitation prête
  const signupUrl = `/signup?next=/join/${token}&email=${encodeURIComponent(state.inviteeEmail)}`;
  const loginUrl = `/login?next=/join/${token}&email=${encodeURIComponent(state.inviteeEmail)}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
      <div className="bg-[#111827] border border-[#2B3444] rounded-2xl p-10 text-center max-w-md w-full">

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">D</span>
        </div>

        {/* Message d'invitation */}
        <div className="mb-8">
          <p className="text-gray-400 text-sm mb-1">Tu as été invité par</p>
          <p className="text-white font-semibold text-lg">{state.ownerName}</p>
          <p className="text-gray-400 text-sm mt-3">
            à rejoindre son équipe sur <span className="text-white font-medium">Deviso</span>.
          </p>
          {state.inviteeEmail && (
            <p className="text-xs text-gray-500 mt-2">
              Invitation envoyée à <span className="text-gray-400">{state.inviteeEmail}</span>
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href={signupUrl}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Créer mon compte et rejoindre <ArrowRight size={15} />
          </Link>
          <Link
            href={loginUrl}
            className="flex items-center justify-center gap-2 w-full py-3 border border-[#2B3444] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl font-semibold text-sm transition-colors"
          >
            <LogIn size={15} />
            J'ai déjà un compte
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-6">
          En rejoignant, tu auras accès aux devis, factures et clients partagés de l'équipe.
        </p>
      </div>
    </div>
  );
}
