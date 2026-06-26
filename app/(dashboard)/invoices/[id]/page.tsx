"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Invoice } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((d) => setInvoice(d.invoice))
      .finally(() => setLoading(false));
  }, [id]);

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
    if (res.ok) setInvoice(data.invoice);
    setMarkingPaid(false);
  }

  async function handlePaymentLink() {
    setGeneratingLink(true);
    const res = await fetch(`/api/invoices/${id}/payment-link`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      await navigator.clipboard.writeText(data.url);
      setInvoice((prev) => prev ? { ...prev, payment_link_url: data.url, status: "sent" } : prev);
      alert("Lien de paiement copié dans le presse-papier !");
    } else {
      alert("Erreur lors de la création du lien");
    }
    setGeneratingLink(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette facture définitivement ?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Chargement…</div>;
  if (!invoice) return <div className="text-center py-16 text-slate-500">Facture introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">
              {invoice.invoice_number}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[invoice.status] || ""}`}>
              {STATUS_LABEL[invoice.status] || invoice.status}
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Émise le {fmtDate(invoice.issue_date)}
            {invoice.due_date && ` · Échéance le ${fmtDate(invoice.due_date)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={handlePaymentLink} disabled={generatingLink}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              {generatingLink ? "Génération…" : invoice.payment_link_url ? "🔗 Copier le lien" : "💳 Lien de paiement"}
            </button>
          )}
          {invoice.status === "draft" && (
            <button onClick={handleMarkPaid} disabled={markingPaid}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              Marquer payée
            </button>
          )}
          <button onClick={handleDownload} disabled={downloading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            {downloading ? "Génération…" : "↓ Factur-X PDF"}
          </button>
          <button onClick={handleDelete}
            className="border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            Supprimer
          </button>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Émetteur</p>
          <p className="font-semibold text-slate-900">{invoice.seller_company || invoice.seller_name}</p>
          {invoice.seller_address && <p className="text-sm text-slate-500 mt-1">{invoice.seller_address}</p>}
          {invoice.seller_siren && <p className="text-xs text-slate-400 mt-1">SIREN : {invoice.seller_siren}</p>}
          {invoice.seller_tva_number && <p className="text-xs text-slate-400">N° TVA : {invoice.seller_tva_number}</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Client</p>
          <p className="font-semibold text-slate-900">{invoice.client_company || invoice.client_name}</p>
          {invoice.client_name && invoice.client_company && <p className="text-sm text-slate-500">{invoice.client_name}</p>}
          {invoice.client_address && <p className="text-sm text-slate-500 mt-1">{invoice.client_address}</p>}
          {invoice.client_siren && <p className="text-xs text-slate-400 mt-1">SIREN : {invoice.client_siren}</p>}
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3">Prestation</th>
              <th className="text-center px-4 py-3">Qté</th>
              <th className="text-right px-4 py-3">P.U. HT</th>
              <th className="text-right px-5 py-3">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 text-slate-700 font-medium">{item.description}</td>
                <td className="px-4 py-3 text-center text-slate-500">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-right text-slate-500">{fmt(item.unit_price)}</td>
                <td className="px-5 py-3 text-right font-semibold text-slate-900">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="flex justify-end mb-6">
        <div className="w-56 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Total HT</span><span>{fmt(invoice.total_ht)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>TVA {invoice.tva_rate}%</span>
            <span>{fmt(invoice.total_ttc - invoice.total_ht)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2">
            <span>Total TTC</span><span>{fmt(invoice.total_ttc)}</span>
          </div>
        </div>
      </div>

      {/* Badge Factur-X */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="text-brand-600 text-lg">✦</span>
        <div>
          <p className="text-sm font-semibold text-brand-800">Factur-X BASIC</p>
          <p className="text-xs text-brand-600">
            PDF/A-3 avec XML CII embarqué · Conforme réforme facturation électronique France 2026 ·{" "}
            {invoice.payment_on_debit ? "TVA sur débits" : "TVA sur encaissements"} ·{" "}
            {invoice.operation_category === "services" ? "Prestations de services" :
             invoice.operation_category === "goods" ? "Livraison de biens" : "Mixte"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/invoices" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Retour aux factures
        </Link>
      </div>
    </div>
  );
}
