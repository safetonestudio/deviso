"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proposal } from "@/types";

interface Props {
  proposal: Proposal;
  shareUrl: string;
  compact?: boolean;
  panel?: boolean;
  isOwner?: boolean;
  requireApproval?: boolean;
}

export default function ProposalActions({
  proposal,
  shareUrl,
  compact = false,
  panel = false,
  isOwner = true,
  requireApproval = false,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingOrRejecting, setApprovingOrRejecting] = useState(false);
  const [reminderCount, setReminderCount] = useState(proposal.reminder_count || 0);

  // Dropdown "Convertir en facture"
  const [convertOpen, setConvertOpen] = useState(false);
  const [acompteMode, setAcompteMode] = useState(false);
  const [acomptePct, setAcomptePct] = useState(30);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setConvertOpen(false);
        setAcompteMode(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const submitForApproval = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/proposals/${proposal.id}/submit-for-approval`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error || "Erreur lors de la soumission");
    }
    setSubmitting(false);
  };

  const handleApprove = async () => {
    setApprovingOrRejecting(true);
    const res = await fetch(`/api/proposals/${proposal.id}/approve`, { method: "POST" });
    if (res.ok) router.refresh();
    else alert("Erreur lors de l'approbation");
    setApprovingOrRejecting(false);
  };

  const handleReject = async () => {
    if (!confirm("Refuser ce devis ? Le collaborateur pourra le modifier et le soumettre à nouveau.")) return;
    setApprovingOrRejecting(true);
    const res = await fetch(`/api/proposals/${proposal.id}/reject`, { method: "POST" });
    if (res.ok) router.refresh();
    else alert("Erreur lors du refus");
    setApprovingOrRejecting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
    router.push("/proposals");
  };

  const handlePrint = () => window.print();

  const handleRemind = async () => {
    if (!proposal.client_email) { alert("Email client manquant sur ce devis"); return; }
    setReminding(true);
    const res = await fetch(`/api/proposals/${proposal.id}/remind`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setReminderCount(data.reminder_count);
      alert("Relance envoyée !");
    } else {
      alert(data.error || "Erreur lors de l'envoi");
    }
    setReminding(false);
  };

  const isDraft = proposal.status === "draft";
  const approvalStatus = proposal.approval_status;
  const showValidationFlow = isDraft && !isOwner && requireApproval;
  const showApprovalActions = isDraft && isOwner && approvalStatus === "pending_review";
  const canMarkSent = isDraft && (isOwner || !requireApproval || approvalStatus === "approved");
  const canConvert = ["signed", "sent", "viewed"].includes(proposal.status);
  const canRemind = ["sent", "viewed"].includes(proposal.status) && !!proposal.client_email;

  // ── Mode compact (usage futur) ──
  if (compact) {
    return (
      <button
        onClick={copyLink}
        className="whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
      >
        {copied ? "Copié !" : "Copier le lien"}
      </button>
    );
  }

  // ── Mode panel (colonne droite, layout deux colonnes) ──
  if (panel) {
    return (
      <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden sticky top-8">
        <div className="px-5 py-4 border-b border-ds-border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
        </div>

        <div className="p-4 space-y-2">
          {/* ── Groupe 1 : Approbation propriétaire ── */}
          {showApprovalActions && (
            <>
              <button
                onClick={handleApprove}
                disabled={approvingOrRejecting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2"
              >
                <span>✓</span>
                <span>{approvingOrRejecting ? "…" : "Approuver"}</span>
              </button>
              <button
                onClick={handleReject}
                disabled={approvingOrRejecting}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
              >
                <span>✗</span>
                <span>{approvingOrRejecting ? "…" : "Refuser"}</span>
              </button>
              <div className="h-px bg-ds-border my-1" />
            </>
          )}

          {/* ── Groupe 2 : Flow validation collaborateur ── */}
          {showValidationFlow && (
            <>
              {(approvalStatus === null || approvalStatus === "rejected") && (
                <button
                  onClick={submitForApproval}
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>{submitting ? "Envoi…" : approvalStatus === "rejected" ? "Soumettre à nouveau" : "Soumettre pour validation"}</span>
                </button>
              )}
              {approvalStatus === "pending_review" && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 text-sm">⏳</span>
                  <span className="text-xs text-amber-300 font-medium">En attente de validation</span>
                </div>
              )}
              {approvalStatus === "approved" && (
                <button
                  onClick={markAsSent}
                  disabled={sending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>{sending ? "…" : "Marquer envoyé"}</span>
                </button>
              )}
              <div className="h-px bg-ds-border my-1" />
            </>
          )}

          {/* ── Groupe 3 : Actions principales ── */}
          {canMarkSent && !showValidationFlow && (
            <button
              onClick={markAsSent}
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2"
            >
              <span>📤</span>
              <span>{sending ? "…" : "Marquer envoyé"}</span>
            </button>
          )}

          {canRemind && (
            <button
              onClick={handleRemind}
              disabled={reminding}
              className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
            >
              <span>🔔</span>
              <span>{reminding ? "Envoi…" : reminderCount > 0 ? `Relancer (${reminderCount}/3)` : "Relancer le client"}</span>
            </button>
          )}

          {/* ── Groupe 4 : Lien + impression ── */}
          <div className="h-px bg-ds-border my-3" />
          <button
            onClick={copyLink}
            className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-ds-border hover:bg-ds-elevated/60 text-gray-400 transition-colors text-left flex items-center gap-2"
          >
            <span>🔗</span>
            <span>{copied ? "✓ Lien copié !" : "Copier le lien client"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="w-full no-print text-sm font-medium px-4 py-2.5 rounded-lg border border-ds-border hover:bg-ds-elevated/60 text-gray-400 transition-colors text-left flex items-center gap-2"
          >
            <span>↓</span>
            <span>Imprimer / PDF</span>
          </button>

          {/* ── Groupe 5 : Convertir en facture ── */}
          {canConvert && (
            <>
              <div className="h-px bg-ds-border my-3" />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setConvertOpen(!convertOpen); setAcompteMode(false); }}
                  className="w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 transition-colors text-left flex items-center justify-between"
                >
                  <span>Convertir en facture</span>
                  <span className="text-xs">{convertOpen ? "▲" : "▼"}</span>
                </button>
                {convertOpen && (
                  <div className="mt-1 w-full bg-ds-surface border border-ds-border rounded-xl shadow-xl z-50 py-1 text-sm">
                    {!acompteMode ? (
                      <>
                        <Link
                          href={`/invoices/new?from_proposal=${proposal.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors"
                          onClick={() => setConvertOpen(false)}
                        >
                          <span>📄</span>
                          <div>
                            <div className="font-medium text-white">Facture standard</div>
                            <div className="text-xs text-gray-400">Règlement intégral</div>
                          </div>
                        </Link>
                        <button
                          onClick={() => setAcompteMode(true)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors text-left"
                        >
                          <span>💰</span>
                          <div>
                            <div className="font-medium text-white">Facture d'acompte</div>
                            <div className="text-xs text-gray-400">Versement partiel (AC-YYYY-NNN)</div>
                          </div>
                        </button>
                        <Link
                          href={`/invoices/new?from_proposal=${proposal.id}&type=solde`}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors"
                          onClick={() => setConvertOpen(false)}
                        >
                          <span>✅</span>
                          <div>
                            <div className="font-medium text-white">Facture de solde</div>
                            <div className="text-xs text-gray-400">Solde après acompte</div>
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="px-4 py-3">
                        <div className="font-medium text-white mb-2">Pourcentage d'acompte</div>
                        <div className="flex gap-2 mb-3">
                          {[30, 40, 50].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setAcomptePct(pct)}
                              className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                acomptePct === pct
                                  ? "bg-green-600 border-green-600 text-white"
                                  : "border-ds-border text-gray-300 hover:bg-ds-elevated"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-xs text-gray-400 shrink-0">Autre :</label>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={acomptePct}
                            onChange={(e) => setAcomptePct(Number(e.target.value))}
                            className="w-full bg-ds-elevated border border-ds-border rounded-lg px-2 py-1 text-sm text-white"
                          />
                          <span className="text-gray-400 text-sm">%</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAcompteMode(false)}
                            className="flex-1 py-1.5 rounded-lg border border-ds-border text-xs text-gray-400 hover:bg-ds-elevated"
                          >
                            ← Retour
                          </button>
                          <Link
                            href={`/invoices/new?from_proposal=${proposal.id}&type=acompte&pct=${acomptePct}`}
                            className="flex-1 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium text-center hover:bg-green-700 transition-colors"
                            onClick={() => setConvertOpen(false)}
                          >
                            Créer {acomptePct}%
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Zone danger ── */}
          <div className="h-px bg-ds-border my-3" />
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full text-xs text-gray-600 hover:text-red-400 px-4 py-2 text-left transition-colors"
            >
              Supprimer le devis
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs text-red-400 font-medium">Supprimer définitivement ?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-ds-border text-gray-400 hover:bg-ds-elevated transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? "…" : "Confirmer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mode horizontal classique (fallback) ──
  const BTN_BASE = "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg border border-ds-border hover:bg-ds-elevated/30 transition-colors";
  const BTN_PRIMARY = "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors";
  const BTN_GREEN = "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors";
  const BTN_RED = "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors";
  const BTN_AMBER = "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={copyLink} className={BTN_BASE}>{copied ? "Copié !" : "Copier le lien"}</button>
      <button onClick={handlePrint} className={`${BTN_BASE} no-print`}>Imprimer</button>

      {showApprovalActions && (
        <>
          <button onClick={handleApprove} disabled={approvingOrRejecting} className={BTN_GREEN}>{approvingOrRejecting ? "…" : "✓ Approuver"}</button>
          <button onClick={handleReject} disabled={approvingOrRejecting} className={BTN_RED}>{approvingOrRejecting ? "…" : "Refuser"}</button>
        </>
      )}
      {showValidationFlow && (
        <>
          {(approvalStatus === null || approvalStatus === "rejected") && (
            <button onClick={submitForApproval} disabled={submitting} className={BTN_AMBER}>{submitting ? "Envoi…" : approvalStatus === "rejected" ? "Soumettre à nouveau" : "Soumettre pour validation"}</button>
          )}
          {approvalStatus === "pending_review" && (
            <span className="whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ En attente</span>
          )}
          {approvalStatus === "approved" && (
            <button onClick={markAsSent} disabled={sending} className={BTN_PRIMARY}>{sending ? "…" : "Marquer envoyé"}</button>
          )}
        </>
      )}
      {canMarkSent && !showValidationFlow && (
        <button onClick={markAsSent} disabled={sending} className={BTN_PRIMARY}>{sending ? "…" : "Marquer envoyé"}</button>
      )}
      {canRemind && (
        <button onClick={handleRemind} disabled={reminding} className="whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white transition-colors">
          {reminding ? "Envoi…" : reminderCount > 0 ? `Relancer (${reminderCount}/3)` : "Relancer le client"}
        </button>
      )}
      {canConvert && (
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => { setConvertOpen(!convertOpen); setAcompteMode(false); }} className={BTN_GREEN}>Convertir en facture ▾</button>
          {convertOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-ds-surface border border-ds-border rounded-xl shadow-xl z-50 py-1 text-sm">
              {!acompteMode ? (
                <>
                  <Link href={`/invoices/new?from_proposal=${proposal.id}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors" onClick={() => setConvertOpen(false)}>
                    <span>📄</span><div><div className="font-medium text-white">Facture standard</div><div className="text-xs text-gray-400">Règlement intégral</div></div>
                  </Link>
                  <button onClick={() => setAcompteMode(true)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors text-left">
                    <span>💰</span><div><div className="font-medium text-white">Facture d'acompte</div><div className="text-xs text-gray-400">Versement partiel</div></div>
                  </button>
                  <Link href={`/invoices/new?from_proposal=${proposal.id}&type=solde`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-ds-elevated transition-colors" onClick={() => setConvertOpen(false)}>
                    <span>✅</span><div><div className="font-medium text-white">Facture de solde</div><div className="text-xs text-gray-400">Solde après acompte</div></div>
                  </Link>
                </>
              ) : (
                <div className="px-4 py-3">
                  <div className="font-medium text-white mb-2">Pourcentage d'acompte</div>
                  <div className="flex gap-2 mb-3">
                    {[30, 40, 50].map((pct) => (
                      <button key={pct} onClick={() => setAcomptePct(pct)} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${acomptePct === pct ? "bg-green-600 border-green-600 text-white" : "border-ds-border text-gray-300 hover:bg-ds-elevated"}`}>{pct}%</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs text-gray-400 shrink-0">Autre :</label>
                    <input type="number" min={1} max={99} value={acomptePct} onChange={(e) => setAcomptePct(Number(e.target.value))} className="w-full bg-ds-elevated border border-ds-border rounded-lg px-2 py-1 text-sm text-white" />
                    <span className="text-gray-400 text-sm">%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAcompteMode(false)} className="flex-1 py-1.5 rounded-lg border border-ds-border text-xs text-gray-400 hover:bg-ds-elevated">← Retour</button>
                    <Link href={`/invoices/new?from_proposal=${proposal.id}&type=acompte&pct=${acomptePct}`} className="flex-1 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium text-center hover:bg-green-700 transition-colors" onClick={() => setConvertOpen(false)}>Créer {acomptePct}%</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <button onClick={() => confirm("Supprimer ce devis ?") && handleDelete()} disabled={deleting} className={BTN_RED}>{deleting ? "…" : "Supprimer"}</button>
    </div>
  );
}
