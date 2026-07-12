"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ProposalDocument } from "@/components/ProposalDocument";
import type { Proposal, Profile } from "@/types";

export default function PublicProposalPage() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [ownerPlan, setOwnerPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState<"signed" | "declined" | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  // Champs e-signature avec piste d'audit (Pro) — IP, user-agent, horodatage
  // serveur et hash SHA-256 capturés côté API. Pas « avancée » au sens eIDAS.
  const [signerName, setSignerName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`/api/public/proposals/${token}`)
      .then((r) => r.json())
      .then((d) => {
        setProposal(d.proposal ?? null);
        setProfile(d.profile ?? null);
        setOwnerPlan(d.plan ?? "free");
        if (d.proposal?.status === "signed") setDone("signed");
        if (d.proposal?.status === "declined") setDone("declined");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAction(action: "sign" | "decline") {
    setSignError(null);

    // Validation côté client pour signature Pro
    if (action === "sign" && ownerPlan === "pro") {
      if (!signerName.trim()) {
        setSignError("Veuillez saisir votre nom complet pour signer.");
        return;
      }
      if (!confirmed) {
        setSignError("Veuillez cocher la case de confirmation.");
        return;
      }
    }

    setActing(true);
    const res = await fetch(`/api/public/proposals/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        signer_name: action === "sign" && ownerPlan === "pro" ? signerName.trim() : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setDone(action === "sign" ? "signed" : "declined");
      setProposal(data.proposal);
    } else {
      setSignError(data.error || "Une erreur est survenue.");
    }
    setActing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ds-elevated/30 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Chargement du devis…</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-ds-elevated/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-400 font-medium">Devis introuvable</p>
          <p className="text-gray-500 text-sm mt-1">Ce lien est invalide ou a expiré.</p>
        </div>
      </div>
    );
  }

  const showBranding = ownerPlan === "free"; // Solo+ : pas de branding
  const isAdvancedSign = ownerPlan === "pro";
  const canSign = !isAdvancedSign || (signerName.trim().length > 0 && confirmed);

  return (
    <div className="min-h-screen bg-ds-elevated/30 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          {profile?.logo_url ? (
            <Image src={profile.logo_url} alt="Logo" width={120} height={48} className="object-contain max-h-12" unoptimized />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(profile?.company_name || profile?.full_name || "D")[0].toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-lg text-white">
                {profile?.company_name || profile?.full_name || "Deviso"}
              </span>
            </>
          )}
        </div>

        {/* Statut */}
        {done === "signed" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Devis signé</p>
              <p className="text-green-600 text-sm">
                Merci{proposal.signer_name ? `, ${proposal.signer_name}` : ""} ! Votre accord a bien été enregistré
                {proposal.signed_at ? ` le ${new Date(proposal.signed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} à ${new Date(proposal.signed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}.
              </p>
            </div>
          </div>
        )}
        {done === "declined" && (
          <div className="bg-red-500/10 border border-red-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold text-red-800">Devis refusé</p>
              <p className="text-red-400 text-sm">Votre réponse a bien été enregistrée.</p>
            </div>
          </div>
        )}

        {/* Document */}
        <ProposalDocument proposal={proposal} profile={profile} showBranding={showBranding} cgvText={profile?.cgv_text} />

        {/* Zone de signature */}
        {!done && (
          <div className="bg-white rounded-2xl border border-ds-border p-6 space-y-5">

            {isAdvancedSign ? (
              /* ── Signature avec piste d'audit (Pro) ── */
              <>
                <div>
                  <p className="text-slate-800 font-semibold text-base mb-0.5">Signature électronique</p>
                  <p className="text-slate-500 text-sm">
                    Saisissez votre nom et cochez la case pour valider votre accord.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nom complet du signataire <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Jean Martin"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      confirmed ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                    }`}>
                      {confirmed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 leading-snug">
                    Je certifie avoir lu et compris ce devis dans son intégralité, et j&apos;accepte les conditions mentionnées. Cette signature électronique a valeur d&apos;engagement contractuel.
                  </span>
                </label>

                {signError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{signError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => handleAction("decline")}
                    disabled={acting}
                    className="flex-1 border border-slate-200 text-slate-500 font-medium py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => handleAction("sign")}
                    disabled={acting || !canSign}
                    className="flex-grow bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {acting ? "Enregistrement…" : "✍️ Signer le devis"}
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  Signature horodatée · IP et date enregistrées
                </p>
              </>
            ) : (
              /* ── Signature simple Free / Solo ── */
              <>
                <div>
                  <p className="text-gray-300 font-medium mb-1">Votre réponse</p>
                  <p className="text-gray-500 text-sm mb-4">
                    En cliquant sur &quot;Accepter et signer&quot;, vous acceptez ce devis et autorisez le prestataire à démarrer les travaux.
                  </p>
                </div>
                {signError && (
                  <p className="text-sm text-red-500">{signError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("decline")}
                    disabled={acting}
                    className="flex-1 border border-ds-border text-gray-400 font-medium py-3 rounded-xl hover:bg-ds-elevated/30 disabled:opacity-50 transition-colors"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => handleAction("sign")}
                    disabled={acting}
                    className="flex-2 flex-grow bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {acting ? "Enregistrement…" : "✍️ Accepter et signer"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showBranding && (
          <p className="text-center text-xs text-gray-400 mt-8">
            Devis créé avec <a href="https://getdeviso.fr" className="text-indigo-400 hover:underline">Deviso</a>
          </p>
        )}
      </div>
    </div>
  );
}
