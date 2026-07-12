"use client";
import { useState } from "react";
import type { Proposal, Profile } from "@/types";

interface Props {
  proposal: Proposal;
  shareUrl: string;
  profile: Partial<Profile> | null;
}

export default function ShareSection({ proposal, shareUrl, profile }: Props) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailTo, setEmailTo] = useState(proposal.client_email || "");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState("");

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!emailTo) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/proposals/${proposal.id}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emailTo,
        shareUrl,
        senderName: profile?.company_name || profile?.full_name || "Votre prestataire",
        proposalTitle: proposal.title,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de l'envoi");
    } else {
      setSent(true);
      setShowEmailForm(false);
      setTimeout(() => setSent(false), 4000);
    }
    setSending(false);
  };

  return (
    <div className="bg-ds-surface rounded-xl border border-ds-border p-5 space-y-4 mt-4">
      {/* Lien de partage */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm mb-1">Lien de partage client</div>
          <div className="text-xs text-gray-500 font-mono truncate">{shareUrl}</div>
        </div>
        <button
          onClick={copyLink}
          className="shrink-0 text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
        >
          {copied ? "Copie !" : "Copier le lien"}
        </button>
      </div>

      {/* Separateur */}
      <div className="border-t border-ds-border" />

      {/* Envoi par email */}
      {!showEmailForm ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-white text-sm mb-0.5">Envoyer par email au client</div>
            <div className="text-xs text-gray-500">
              {proposal.client_email
                ? `Destinataire : ${proposal.client_email}`
                : "Saisissez l'email du client pour lui envoyer le lien directement"}
            </div>
          </div>
          <button
            onClick={() => setShowEmailForm(true)}
            className="shrink-0 text-sm border border-ds-border text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-ds-elevated transition-colors"
          >
            {sent ? "Envoye !" : "Envoyer"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="font-semibold text-white text-sm">Envoyer le devis par email</div>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="email@client.fr"
              className="flex-1 bg-ds-elevated border border-ds-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
            <button
              onClick={sendEmail}
              disabled={sending || !emailTo}
              className="shrink-0 text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {sending ? "Envoi..." : "Envoyer"}
            </button>
            <button
              onClick={() => setShowEmailForm(false)}
              className="shrink-0 text-sm border border-ds-border text-gray-400 px-3 py-2 rounded-lg hover:bg-ds-elevated transition-colors"
            >
              X
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Le client recevra un email avec le lien de signature et une explication simple du processus.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {sent && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-400 font-medium">
          Email envoye a {emailTo}. Le devis passe en statut &quot;Envoye&quot;
        </div>
      )}
    </div>
  );
}
