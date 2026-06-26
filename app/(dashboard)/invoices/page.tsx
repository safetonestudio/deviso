"use client";

import { useEffect, useState } from "react";
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
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const res = await fetch(`/api/invoices/${id}/download`);
    if (!res.ok) return alert("Erreur lors de la génération du PDF");
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "facture.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes factures</h1>
          <p className="text-slate-500 text-sm mt-1">
            Factur-X BASIC — PDF/A-3 conforme réforme 2026
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nouvelle facture
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Chargement…</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500 font-medium">Aucune facture pour l&apos;instant</p>
          <p className="text-slate-400 text-sm mt-1">
            Créez votre première facture depuis un devis signé ou manuellement.
          </p>
          <Link
            href="/invoices/new"
            className="mt-4 inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Créer une facture
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">N°</th>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Montant TTC</th>
                <th className="text-center px-5 py-3">Statut</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                    {inv.invoice_number}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    <div className="font-medium">{inv.client_company || inv.client_name}</div>
                    {inv.client_email && (
                      <div className="text-slate-400 text-xs">{inv.client_email}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{fmtDate(inv.issue_date)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                    {fmt(inv.total_ttc)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status] || ""}`}>
                      {STATUS_LABEL[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-slate-500 hover:text-brand-600 text-xs font-medium transition-colors"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={(e) => handleDownload(inv.id, e)}
                        className="text-brand-600 hover:text-brand-700 text-xs font-medium transition-colors"
                      >
                        Télécharger
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
