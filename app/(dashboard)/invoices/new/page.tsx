"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Proposal } from "@/types";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("from_proposal");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Infos vendeur
  const [sellerCompany, setSellerCompany] = useState("");
  const [sellerSiren, setSellerSiren] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerTva, setSellerTva] = useState("");

  // Infos client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientSiren, setClientSiren] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Mentions légales 2026
  const [operationCategory, setOperationCategory] = useState<"services" | "goods" | "mixed">("services");
  const [paymentOnDebit, setPaymentOnDebit] = useState(false);

  // Dates
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!proposalId) return;
    fetch(`/api/proposals/${proposalId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.proposal) {
          const p: Proposal = d.proposal;
          setProposal(p);
          setClientName(p.client_name || "");
          setClientEmail(p.client_email || "");
          setClientCompany(p.client_company || "");
        }
      });
  }, [proposalId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      proposal_id: proposalId || null,
      client_name: clientName,
      client_email: clientEmail,
      client_company: clientCompany,
      client_siren: clientSiren || null,
      client_address: clientAddress || null,
      seller_company: sellerCompany,
      seller_siren: sellerSiren || null,
      seller_address: sellerAddress || null,
      seller_tva_number: sellerTva || null,
      items: proposal?.items || [],
      total_ht: proposal?.total_ht || 0,
      tva_rate: proposal?.tva_rate || 20,
      total_ttc: proposal?.total_ttc || 0,
      operation_category: operationCategory,
      payment_on_debit: paymentOnDebit,
      issue_date: issueDate,
      due_date: dueDate || null,
      payment_terms: proposal?.payment_terms || null,
      notes: proposal?.notes || null,
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
      return;
    }
    router.push(`/invoices/${data.invoice.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle facture</h1>
        {proposal && (
          <p className="text-slate-500 text-sm mt-1">
            Générée depuis le devis&nbsp;: <span className="font-medium">{proposal.title}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendeur */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Vos informations</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Entreprise / Nom</label>
              <input value={sellerCompany} onChange={(e) => setSellerCompany(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SIREN</label>
              <input value={sellerSiren} onChange={(e) => setSellerSiren(e.target.value)}
                placeholder="123 456 789"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
              <input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">N° TVA intracommunautaire</label>
              <input value={sellerTva} onChange={(e) => setSellerTva(e.target.value)}
                placeholder="FR12345678901"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </section>

        {/* Client */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Client</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Entreprise</label>
              <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                SIREN client <span className="text-blue-500 text-xs">(obligatoire B2B sept. 2026)</span>
              </label>
              <input value={clientSiren} onChange={(e) => setClientSiren(e.target.value)}
                placeholder="123 456 789"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresse de facturation</label>
              <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </section>

        {/* Mentions légales 2026 */}
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-blue-900">Mentions obligatoires 2026</h2>
          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">Nature de l&apos;opération</label>
            <select value={operationCategory} onChange={(e) => setOperationCategory(e.target.value as "services" | "goods" | "mixed")}
              className="border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="services">Prestation de services</option>
              <option value="goods">Livraison de biens</option>
              <option value="mixed">Mixte (biens + services)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="payment_on_debit" checked={paymentOnDebit}
              onChange={(e) => setPaymentOnDebit(e.target.checked)}
              className="rounded text-brand-600" />
            <label htmlFor="payment_on_debit" className="text-sm text-blue-800">
              TVA acquittée sur les débits (art. 1693 bis CGI)
              <span className="text-blue-500 text-xs ml-1">— par défaut : sur encaissements</span>
            </label>
          </div>
        </section>

        {/* Dates */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Dates</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d&apos;émission</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d&apos;échéance</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </section>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
            {loading ? "Création…" : "Créer la facture"}
          </button>
        </div>
      </form>
    </div>
  );
}
