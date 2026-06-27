"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proposal } from "@/types";

interface Props {
  proposal: Proposal;
  shareUrl: string;
  compact?: boolean;
}

export default function ProposalActions({ proposal, shareUrl, compact = false }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAsSent = async () => {
    setSending(true);
    await fetch(`/api/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });
    router.refresh();
    setSending(false);
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    setDeleting(true);
    await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
    router.push("/proposals");
  };

  const handlePrint = () => window.print();

  if (compact) {
    return (
      <button
        onClick={copyLink}
        className="shrink-0 text-sm bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
      >
        {copied ? "✓ Copié !" : "Copier le lien"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className="text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        {copied ? "✓ Copié !" : "🔗 Copier le lien"}
      </button>
      <button
        onClick={handlePrint}
        className="text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors no-print"
      >
        🖨 Imprimer
      </button>
      {proposal.status === "draft" && (
        <button
          onClick={markAsSent}
          disabled={sending}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {sending ? "..." : "📤 Marquer envoyé"}
        </button>
      )}
      {["signed", "sent", "viewed"].includes(proposal.status) && (
        <Link
          href={`/invoices/new?from_proposal=${proposal.id}`}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          🧾 Convertir en facture
        </Link>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm font-medium px-3 py-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
        title="Supprimer"
      >
        🗑
      </button>
    </div>
  );
}
