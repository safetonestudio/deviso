"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Proposal, ProposalItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("from_proposal");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Vendeur
  const [sellerCompany, setSellerCompany] = useState("");
  const [sellerSiren, setSellerSiren] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerTva, setSellerTva] = useState("");

  // Client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientSiren, setClientSiren] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Lignes
  const [items, setItems] = useState<ProposalItem[]>([
    { id: uuidv4(), description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 },
  ]);
  const [tvaRate, setTvaRate] = useState(20);

  // Mentions légales 2026
  const [operationCategory, setOperationCategory] = useState<"services" | "goods" | "mixed">("services");
  const [paymentOnDebit, setPaymentOnDebit] = useState(false);

  // Dates
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30 jours net");

  // Calculs
  const totalHt = items.reduce((sum, item) => sum + item.total, 0);
  const totalTtc = totalHt * (1 + tvaRate / 100);

  // Pré-remplissage depuis un devis
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
          setItems(p.items.length > 0 ? p.items : items);
          setTvaRate(p.tva_rate || 20);
          setPaymentTerms(p.payment_terms || "30 jours net");
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  // Pré-remplissage profil vendeur
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setSellerCompany(d.profile.company_name || d.profile.full_name || "");
          setSellerSiren(d.profile.siret || "");
          setSellerAddress(d.profile.address || "");
          setSellerTva(d.profile.tva_number || "");
        }
      })
      .catch(() => {});
  }, []);

  function updateItem(id: string, field: keyof ProposalItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          updated.total = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      })
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uuidv4(), description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 },
    ]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

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
      items,
      total_ht: totalHt,
      tva_rate: tvaRate,
      total_ttc: totalTtc,
      operation_category: operationCategory,
      payment_on_debit: paymentOnDebit,
      issue_date: issueDate,
      due_date: dueDate || null,
      payment_terms: paymentTerms || null,
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
            Générée depuis le devis : <span className="font-medium">{proposal.title}</span>
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

        {/* Lignes de facturation */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Lignes de facturation</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Description de la prestation"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="Qté"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                    placeholder="Prix HT"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="col-span-2 py-2 text-sm font-semibold text-slate-700 text-right">
                  {fmt(item.total)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none py-2">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">
            + Ajouter une ligne
          </button>

          {/* TVA + Totaux */}
          <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Taux TVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={tvaRate}
                onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="text-slate-500">Total HT : <span className="font-medium text-slate-800">{fmt(totalHt)}</span></div>
              <div className="text-slate-500">TVA {tvaRate}% : <span className="font-medium text-slate-800">{fmt(totalTtc - totalHt)}</span></div>
              <div className="font-bold text-base text-slate-900">Total TTC : <span className="text-brand-600">{fmt(totalTtc)}</span></div>
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
          <h2 className="font-semibold text-slate-800">Dates & conditions</h2>
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
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Conditions de paiement</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="30 jours net"
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
