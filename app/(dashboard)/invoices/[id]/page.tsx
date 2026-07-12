"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import type { Invoice } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-ds-elevated text-gray-400",
  sent: "bg-blue-500/10 text-blue-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function ActionPanel({ invoice, id, router, hasChorusPro }: {
  invoice: Invoice;
  id: string;
  router: ReturnType<typeof useRouter>;
  hasChorusPro: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [depositingChorus, setDepositingChorus] = useState(false);
  const [chorusRef, setChorusRef] = useState<string | null>(invoice.chorus_pro_ref || null);
  const [chorusError, setChorusError] = useState<string | null>(null);
  const CHORUS_STATUS_MAP: Record<string, { label: string; color: string }> = {
    DEPOSEE:             { label: "Déposée",               color: "blue" },
    EN_COURS_TRAITEMENT: { label: "En cours de traitement", color: "amber" },
    COMPLETEE:           { label: "Complétée",              color: "amber" },
    MISE_EN_PAIEMENT:    { label: "Mise en paiement",       color: "indigo" },
    MANDATEE:            { label: "Mandatée",               color: "emerald" },
    VALIDEE:             { label: "Validée",                color: "emerald" },
    SUSPENDUE:           { label: "Suspendue",              color: "amber" },
    REJETEE:             { label: "Rejetée",                color: "red" },
    ANNULEE:             { label: "Annulée",                color: "red" },
  };
  const [chorusStatus, setChorusStatus] = useState<{ label: string; color: string; motifRejet?: string | null } | null>(
    invoice.chorus_pro_status
      ? (CHORUS_STATUS_MAP[invoice.chorus_pro_status] ?? { label: invoice.chorus_pro_status, color: "blue" })
      : null
  );
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inv, setInv] = useState(invoice);

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch(`/api/invoices/${id}/download`);
    if (!res.ok) { alert("Erreur lors de la génération"); setDownloading(false); return; }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "facture.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    const data = await res.json();
    if (res.ok) setInv(data.invoice);
    setMarkingPaid(false);
  }

  async function handlePaymentLink() {
    setGeneratingLink(true);
    const res = await fetch(`/api/invoices/${id}/payment-link`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      await navigator.clipboard.writeText(data.url);
      setInv((prev) => prev ? { ...prev, payment_link_url: data.url, status: "sent" } : prev);
      alert("Lien de paiement copié !");
    } else if (data.error === "PAYMENT_NOT_CONFIGURED") {
      if (confirm("Moyen de paiement non configuré.\n\nAller dans Paiements pour le configurer ?")) {
        window.location.href = "/paiements";
      }
    } else {
      alert(data.error || "Erreur");
    }
    setGeneratingLink(false);
  }

  async function handleSendEmail() {
    if (!inv.client_email) { alert("Email client manquant"); return; }
    setSendingEmail(true);
    const res = await fetch(`/api/invoices/${id}/send-email`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setEmailSent(true);
      setInv((prev) => prev && prev.status === "draft" ? { ...prev, status: "sent" } : prev);
      setTimeout(() => setEmailSent(false), 4000);
    } else {
      alert(data.error || "Erreur lors de l'envoi");
    }
    setSendingEmail(false);
  }

  async function handleSendReminder() {
    if (!inv.client_email) { alert("Email client manquant"); return; }
    setSendingReminder(true);
    const res = await fetch(`/api/invoices/${id}/send-reminder`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setInv((prev) => prev ? { ...prev, reminder_count: data.reminder_count, last_reminder_sent_at: new Date().toISOString() } : prev);
      alert("Relance envoyée !");
    } else {
      alert(data.error || "Erreur");
    }
    setSendingReminder(false);
  }

  async function handleChorusDeposit() {
    setDepositingChorus(true);
    setChorusError(null);
    const res = await fetch(`/api/invoices/${id}/chorus-pro`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ref) {
      setChorusRef(data.ref);
      // Récupère le statut initial après dépôt
      setTimeout(() => handleFetchStatus(), 2000);
    } else {
      setChorusError(data.error || "Erreur lors du dépôt");
    }
    setDepositingChorus(false);
  }

  async function handleFetchStatus() {
    setFetchingStatus(true);
    const res = await fetch(`/api/invoices/${id}/chorus-pro/status`);
    const data = await res.json();
    if (res.ok) {
      setChorusStatus({ label: data.label, color: data.color, motifRejet: data.motifRejet });
    }
    setFetchingStatus(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  }

  const canSendEmail = !!inv.client_email && inv.status !== "cancelled";
  const canPaymentLink = inv.status !== "paid" && inv.status !== "cancelled";
  const canMarkPaid = inv.status !== "paid" && inv.status !== "cancelled";
  const canRemind = inv.status === "sent" && !!inv.client_email;
  const canChorus = inv.status === "sent" && !chorusRef && hasChorusPro;

  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden sticky top-8">
      {/* En-tête du panel */}
      <div className="px-5 py-4 border-b border-ds-border">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
      </div>

      <div className="p-4 space-y-2">
        {/* ── Groupe 1 : Envoi ── */}
        {canSendEmail && (
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left flex items-center gap-2"
          >
            <span>📤</span>
            <span>{emailSent ? "✓ Envoyée !" : sendingEmail ? "Envoi en cours…" : "Envoyer au client"}</span>
          </button>
        )}

        {/* ── Groupe 2 : Paiement ── */}
        {(canPaymentLink || canMarkPaid || canRemind) && (
          <>
            <div className="h-px bg-ds-border my-3" />
            {canPaymentLink && (
              <button
                onClick={handlePaymentLink}
                disabled={generatingLink}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-ds-border hover:bg-ds-elevated/60 text-gray-300 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
              >
                <span>💳</span>
                <span>{generatingLink ? "Génération…" : inv.payment_link_url ? "Copier lien paiement" : "Lien de paiement"}</span>
              </button>
            )}
            {canMarkPaid && (
              <button
                onClick={handleMarkPaid}
                disabled={markingPaid}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
              >
                <span>✓</span>
                <span>{markingPaid ? "Mise à jour…" : "Marquer comme payée"}</span>
              </button>
            )}
            {canRemind && (
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
              >
                <span>🔔</span>
                <span>{sendingReminder ? "Envoi…" : inv.reminder_count > 0 ? `Relancer (${inv.reminder_count}/3)` : "Relancer le client"}</span>
              </button>
            )}
          </>
        )}

        {/* ── Groupe 3 : Document ── */}
        <div className="h-px bg-ds-border my-3" />
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-ds-border hover:bg-ds-elevated/60 text-gray-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
        >
          <span>↓</span>
          <span>{downloading ? "Génération…" : "Télécharger Factur-X PDF"}</span>
        </button>

        {canChorus && (
          <button
            onClick={handleChorusDeposit}
            disabled={depositingChorus}
            className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 text-blue-400 disabled:opacity-50 transition-colors text-left flex items-center gap-2"
          >
            <span>🏛</span>
            <span>{depositingChorus ? "Dépôt en cours…" : "Déposer sur Chorus Pro"}</span>
          </button>
        )}

        {chorusRef && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <span className="text-blue-400 text-sm">🏛</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-300 font-medium">Chorus Pro #{chorusRef}</p>
                {chorusStatus && (
                  <p className={`text-[11px] mt-0.5 font-semibold ${
                    chorusStatus.color === "emerald" ? "text-emerald-400" :
                    chorusStatus.color === "amber"   ? "text-amber-400" :
                    chorusStatus.color === "red"     ? "text-red-400" :
                    chorusStatus.color === "indigo"  ? "text-indigo-400" :
                    "text-blue-400"
                  }`}>
                    {chorusStatus.label}
                  </p>
                )}
                {chorusStatus?.motifRejet && (
                  <p className="text-[10px] text-red-400 mt-0.5 leading-snug">{chorusStatus.motifRejet}</p>
                )}
              </div>
              <button
                onClick={handleFetchStatus}
                disabled={fetchingStatus}
                title="Actualiser le statut"
                className="text-blue-400/60 hover:text-blue-300 transition-colors disabled:opacity-30 shrink-0"
              >
                <svg className={`w-3.5 h-3.5 ${fetchingStatus ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {chorusError && (
          <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{chorusError}</p>
          </div>
        )}

        {/* ── Groupe 4 : Zone danger ── */}
        <div className="h-px bg-ds-border my-3" />
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-xs text-gray-600 hover:text-red-400 px-4 py-2 text-left transition-colors"
          >
            Supprimer la facture
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [hasChorusPro, setHasChorusPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch(`/api/profile`).then((r) => r.json()),
    ]).then(([invoiceData, profileData]) => {
      setInvoice(invoiceData.invoice);
      // Le bouton Chorus Pro n'apparaît que si le fournisseur ID est configuré
      const p = profileData.profile;
      setHasChorusPro(!!(p?.chorus_pro_fournisseur_id || p?.chorus_pro_login));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-500">Chargement…</div>;
  if (!invoice) return <div className="text-center py-16 text-gray-400">Facture introuvable</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <GuidedTourBanner pageKey="invoices_detail" />
      {/* Retour */}
      <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-400 transition-colors mb-5 inline-block">
        ← Retour aux factures
      </Link>

      {/* Layout deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">

        {/* ── Colonne gauche : document ── */}
        <div className="min-w-0">
          {/* Header : numéro + statut + dates */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-semibold text-white tracking-tight font-mono">{invoice.invoice_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[invoice.status] || ""}`}>
                {STATUS_LABEL[invoice.status] || invoice.status}
              </span>
              {invoice.invoice_type === "acompte" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  ACOMPTE {invoice.deposit_percentage ? `${invoice.deposit_percentage}%` : ""}
                </span>
              )}
              {invoice.invoice_type === "solde" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  SOLDE
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Émise le {fmtDate(invoice.issue_date)}
              {invoice.due_date && ` · Échéance le ${fmtDate(invoice.due_date)}`}
            </p>
            {invoice.invoice_type === "solde" && invoice.linked_invoice_number && (
              <p className="text-sm text-indigo-400 mt-1">
                Acompte versé ·{" "}
                <Link href={`/invoices?ref=${invoice.linked_invoice_number}`} className="underline hover:text-indigo-300">
                  Réf. {invoice.linked_invoice_number}
                </Link>
              </p>
            )}
            {invoice.invoice_type === "acompte" && (
              <p className="text-sm text-emerald-400/80 mt-1">
                Acompte {invoice.deposit_percentage}% · numérotation indépendante
              </p>
            )}
          </div>

          {/* Parties émetteur / client */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-ds-surface rounded-xl border border-ds-border p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Émetteur</p>
              <p className="font-semibold text-white">{invoice.seller_company || invoice.seller_name}</p>
              {invoice.seller_address && <p className="text-sm text-gray-400 mt-1">{invoice.seller_address}</p>}
              {invoice.seller_siren && <p className="text-xs text-gray-500 mt-1">SIREN : {invoice.seller_siren}</p>}
              {invoice.seller_tva_number && <p className="text-xs text-gray-500">N° TVA : {invoice.seller_tva_number}</p>}
            </div>
            <div className="bg-ds-surface rounded-xl border border-ds-border p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Client</p>
              <p className="font-semibold text-white">{invoice.client_company || invoice.client_name}</p>
              {invoice.client_name && invoice.client_company && <p className="text-sm text-gray-400">{invoice.client_name}</p>}
              {invoice.client_address && <p className="text-sm text-gray-400 mt-1">{invoice.client_address}</p>}
              {invoice.client_siren && <p className="text-xs text-gray-500 mt-1">SIREN : {invoice.client_siren}</p>}
            </div>
          </div>

          {/* Lignes */}
          <div className="bg-ds-surface rounded-xl border border-ds-border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ds-elevated/50 border-b border-ds-border text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Prestation</th>
                  <th className="text-center px-4 py-3">Qté</th>
                  <th className="text-right px-4 py-3">P.U. HT</th>
                  <th className="text-right px-5 py-3">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-ds-border last:border-0">
                    <td className="px-5 py-3 text-gray-300 font-medium">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{fmt(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              {invoice.invoice_type === "solde" && (invoice.deposit_percentage ?? 0) > 0 && (() => {
                const pct = invoice.deposit_percentage!;
                const originalTtc = invoice.total_ttc / (1 - pct / 100);
                const depositTtc = originalTtc - invoice.total_ttc;
                return (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>Prestation totale</span><span>{fmt(originalTtc)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Acompte versé{invoice.linked_invoice_number ? ` (${invoice.linked_invoice_number})` : ""}</span>
                      <span>-{fmt(depositTtc)}</span>
                    </div>
                    <div className="h-px bg-ds-border" />
                  </>
                );
              })()}
              <div className="flex justify-between text-gray-400">
                <span>Total HT</span><span>{fmt(invoice.total_ht)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TVA {invoice.tva_rate}%</span>
                <span>{fmt(invoice.total_ttc - invoice.total_ht)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white text-base border-t border-ds-border pt-2">
                <span>{invoice.invoice_type === "solde" ? "Solde à payer" : invoice.invoice_type === "acompte" ? "Acompte à payer" : "Total TTC"}</span>
                <span>{fmt(invoice.total_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Badge Factur-X */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-indigo-400 text-lg">✦</span>
            <div>
              <p className="text-sm font-semibold text-indigo-300">Factur-X BASIC · Conforme réforme 2026</p>
              <p className="text-xs text-indigo-400">
                PDF/A-3 avec XML CII embarqué ·{" "}
                {invoice.payment_on_debit ? "TVA sur débits" : "TVA sur encaissements"} ·{" "}
                {invoice.operation_category === "services" ? "Prestations de services" :
                 invoice.operation_category === "goods" ? "Livraison de biens" : "Mixte"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Colonne droite : panel d'actions ── */}
        <ActionPanel invoice={invoice} id={id} router={router} hasChorusPro={hasChorusPro} />
      </div>
    </div>
  );
}
