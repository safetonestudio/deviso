"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Proposal, ProposalItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Clock, Package } from "lucide-react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  unit_price: number;
  type: "fixed" | "hourly";
}

const TVA_OPTIONS = [
  { label: "Franchise en base, TVA non applicable (art. 293 B CGI)", rate: 0 },
  { label: "TVA 20%, Taux normal",                                   rate: 20 },
  { label: "TVA 10%, Taux intermédiaire",                            rate: 10 },
  { label: "TVA 5,5%, Taux réduit",                                  rate: 5.5 },
  { label: "TVA 2,1%, Taux super réduit",                            rate: 2.1 },
];

const REGIME_TO_RATE: Record<string, number> = {
  franchise:    0,
  normal:       20,
  intermediaire:10,
  reduit:       5.5,
  super_reduit: 2.1,
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

type ProposalSummary = {
  id: string;
  proposal_number: string | null;
  title: string;
  client_name: string | null;
  total_ttc: number;
  status: string;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProposalParam = searchParams.get("from_proposal");
  const fromTime = searchParams.get("from_time");
  const invoiceTypeParam = (searchParams.get("type") || "standard") as "standard" | "acompte" | "solde";
  const pctParam = parseInt(searchParams.get("pct") || "30", 10);

  // Type & deposit, now fully stateful and changeable
  const [invoiceType, setInvoiceType] = useState<"standard" | "acompte" | "solde">(invoiceTypeParam);
  const [depositPct, setDepositPct] = useState<number>(pctParam);

  // Linked proposal
  const [linkedProposalId, setLinkedProposalId] = useState<string | null>(fromProposalParam);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  // Proposals list for picker
  const [proposalsList, setProposalsList] = useState<ProposalSummary[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Acompte / Solde link
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string | null>(null);
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState<string | null>(null);
  const [soldeFromDeposit, setSoldeFromDeposit] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentConfigured, setPaymentConfigured] = useState<boolean | null>(null);

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

  // Catalogue
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [pendingHourlyItem, setPendingHourlyItem] = useState<CatalogItem | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // Lignes
  const [items, setItems] = useState<ProposalItem[]>([
    { id: uuidv4(), description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 },
  ]);
  const [tvaRate, setTvaRate] = useState(0);

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

  const inputCls = "w-full border border-ds-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 bg-ds-elevated text-white placeholder:text-gray-600";

  // Pré-remplissage profil vendeur + catalogue
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setSellerCompany(d.profile.company_name || d.profile.full_name || "");
          setSellerSiren(d.profile.siret || "");
          setSellerAddress(d.profile.address || "");
          setSellerTva(d.profile.tva_number || "");
          if (d.profile.tva_regime) {
            setTvaRate(REGIME_TO_RATE[d.profile.tva_regime] ?? 0);
          }
          setPaymentConfigured(d.profile.payment_method && d.profile.payment_method !== "none");
        }
      });

    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => { if (d.items) setCatalog(d.items); })
      .catch(() => {});
  }, []);

  // Pré-remplissage depuis le time tracking
  useEffect(() => {
    if (!fromTime) return;
    const cn = searchParams.get("client_name");
    const ce = searchParams.get("client_email");
    const rawItems = searchParams.get("items");
    if (cn) setClientName(cn);
    if (ce) setClientEmail(ce);
    if (rawItems) {
      try {
        const parsed = JSON.parse(rawItems);
        setItems(parsed.map((i: Omit<ProposalItem, "id">) => ({ ...i, id: uuidv4() })));
      } catch { /* ignore */ }
    }
    setPaymentTerms("30 jours net");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTime]);

  // Charger la liste des devis quand type = acompte ou solde et pas de devis lié par URL
  useEffect(() => {
    if ((invoiceType === "acompte" || invoiceType === "solde") && !fromProposalParam) {
      setProposalsLoading(true);
      fetch("/api/proposals")
        .then((r) => r.json())
        .then((d) => setProposalsList(
          (d.proposals || []).filter((p: ProposalSummary) => p.status !== "draft")
        ))
        .finally(() => setProposalsLoading(false));
    }
  }, [invoiceType, fromProposalParam]);

  // Pré-remplissage depuis un devis (appelé quand linkedProposalId change)
  const loadProposalData = useCallback(async (pId: string, type: string, pct: number) => {
    const d = await fetch(`/api/proposals/${pId}`).then((r) => r.json());
    if (!d.proposal) return;
    const p: Proposal = d.proposal;
    setProposal(p);
    setClientName(p.client_name || "");
    setClientEmail(p.client_email || "");
    setClientCompany(p.client_company || "");
    setClientSiren(p.client_siren || "");
    setClientAddress(p.client_address || "");
    setTvaRate(p.tva_rate ?? 0);
    setPaymentTerms(p.payment_terms || "30 jours net");

    if (type === "acompte") {
      const fullHt = p.items.reduce((s: number, i: ProposalItem) => s + i.total, 0);
      const acompteHt = Math.round(fullHt * pct) / 100;
      setItems([{
        id: uuidv4(),
        description: `Acompte ${pct}%, ${p.title}`,
        quantity: 1,
        unit: "forfait",
        unit_price: acompteHt,
        total: acompteHt,
      }]);
    } else if (type === "solde") {
      const invRes = await fetch("/api/invoices");
      const invData = await invRes.json();
      const acompteInv = (invData.invoices || []).find(
        (inv: { proposal_id: string | null; invoice_type: string }) =>
          inv.proposal_id === pId && inv.invoice_type === "acompte"
      );
      if (acompteInv) {
        setLinkedInvoiceId(acompteInv.id);
        setLinkedInvoiceNumber(acompteInv.invoice_number);
        setSoldeFromDeposit(acompteInv.total_ht);
        const fullHt = p.items.reduce((s: number, i: ProposalItem) => s + i.total, 0);
        const soldeHt = Math.round((fullHt - acompteInv.total_ht) * 100) / 100;
        const foundPct = acompteInv.deposit_percentage ?? Math.round((acompteInv.total_ht / fullHt) * 100);
        setItems([{
          id: uuidv4(),
          description: `Solde ${100 - foundPct}%, ${p.title}`,
          quantity: 1,
          unit: "forfait",
          unit_price: soldeHt,
          total: soldeHt,
        }]);
      } else {
        setLinkedInvoiceId(null);
        setLinkedInvoiceNumber(null);
        setSoldeFromDeposit(0);
        setItems(p.items.length > 0 ? p.items : items);
      }
    } else {
      setItems(p.items.length > 0 ? p.items : items);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger le devis si linkedProposalId change
  useEffect(() => {
    if (linkedProposalId) {
      loadProposalData(linkedProposalId, invoiceType, depositPct);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedProposalId]);

  // Quand le type change, réinitialiser le devis lié (sauf si venu d'une URL avec devis)
  function handleTypeChange(newType: "standard" | "acompte" | "solde") {
    setInvoiceType(newType);
    if (!fromProposalParam) {
      setLinkedProposalId(null);
      setProposal(null);
      setLinkedInvoiceId(null);
      setLinkedInvoiceNumber(null);
      setSoldeFromDeposit(0);
      if (newType === "standard") {
        setItems([{ id: uuidv4(), description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 }]);
      }
    }
  }

  // Quand le devis est sélectionné dans le picker
  function handleProposalPick(pId: string) {
    setLinkedProposalId(pId);
  }

  // Quand le % d'acompte change, recalculer si un devis est lié
  function handleDepositPctChange(newPct: number) {
    setDepositPct(newPct);
    if (proposal && invoiceType === "acompte") {
      const fullHt = proposal.items.reduce((s, i) => s + i.total, 0);
      const acompteHt = Math.round(fullHt * newPct) / 100;
      setItems([{
        id: uuidv4(),
        description: `Acompte ${newPct}%, ${proposal.title}`,
        quantity: 1,
        unit: "forfait",
        unit_price: acompteHt,
        total: acompteHt,
      }]);
    }
  }

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

  function addFromCatalog(item: CatalogItem) {
    setShowCatalog(false);
    if (item.type === "hourly") {
      setPendingHourlyItem(item);
      setDurationHours(1);
      setDurationMinutes(0);
      return;
    }
    insertCatalogItem(item, 1);
  }

  function insertCatalogItem(item: CatalogItem, quantity: number) {
    const newItem: ProposalItem = {
      id: uuidv4(),
      description: item.name + (item.description ? `, ${item.description}` : ""),
      quantity,
      unit: item.unit || "forfait",
      unit_price: item.unit_price,
      total: Math.round(quantity * item.unit_price * 100) / 100,
    };
    setItems((prev) => [...prev, newItem]);
  }

  function confirmDuration() {
    if (!pendingHourlyItem) return;
    const quantity = durationHours + durationMinutes / 60;
    insertCatalogItem(pendingHourlyItem, Math.round(quantity * 100) / 100);
    setPendingHourlyItem(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal_id: linkedProposalId || null,
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
        invoice_type: invoiceType,
        deposit_percentage: invoiceType !== "standard" ? depositPct : null,
        linked_invoice_id: linkedInvoiceId || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
      return;
    }

    // Marquer les entrées time tracking comme facturées
    const timeIds = searchParams.get("time_ids");
    if (fromTime && timeIds) {
      await fetch("/api/time-entries/mark-billed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: timeIds.split(","), invoice_id: data.invoice.id }),
      });
    }

    router.push(`/invoices/${data.invoice.id}`);
  }

  const needsProposalPicker = (invoiceType === "acompte" || invoiceType === "solde") && !fromProposalParam;
  const proposalPickerReady = needsProposalPicker && linkedProposalId;

  return (
    <div className="max-w-2xl mx-auto">
      <GuidedTourBanner pageKey="invoices_new" />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          {invoiceType === "acompte" ? "Nouvelle facture d'acompte" : invoiceType === "solde" ? "Nouvelle facture de solde" : "Nouvelle facture"}
        </h1>
        {proposal && (
          <p className="text-gray-400 text-sm mt-1">
            Devis : <span className="font-medium text-white">{proposal.title}</span>
            {proposal.client_name && <span className="text-gray-500"> · {proposal.client_name}</span>}
          </p>
        )}
      </div>

      {/* ── Sélecteur de type (masqué si venu depuis un devis avec type) ── */}
      {!fromProposalParam && (
        <div className="bg-ds-surface border border-ds-border rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Type de facture</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: "standard" as const, label: "Standard", desc: "Facturation classique", icon: "📄" },
              { type: "acompte" as const,  label: "Acompte",  desc: "% d'un devis",          icon: "💰" },
              { type: "solde" as const,    label: "Solde",    desc: "Reste après acompte",   icon: "✅" },
            ].map(({ type, label, desc, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  invoiceType === type
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-ds-border hover:border-gray-600 hover:bg-ds-elevated"
                }`}
              >
                <div className="text-lg mb-1">{icon}</div>
                <div className={`text-sm font-semibold ${invoiceType === type ? "text-indigo-300" : "text-white"}`}>{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Picker de devis pour acompte / solde ── */}
      {needsProposalPicker && (
        <div className={`rounded-xl border p-4 mb-5 ${proposalPickerReady ? "bg-ds-surface border-ds-border" : "bg-amber-500/5 border-amber-500/30"}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {invoiceType === "acompte" ? "Devis à facturer en acompte" : "Devis à solder"}
          </p>
          {proposalsLoading ? (
            <div className="text-sm text-gray-500 py-2">Chargement des devis…</div>
          ) : proposalsList.length === 0 ? (
            <div className="text-sm text-amber-400 py-1">
              Aucun devis envoyé trouvé.{" "}
              <Link href="/proposals" className="underline">Créez d&apos;abord un devis</Link>.
            </div>
          ) : (
            <select
              value={linkedProposalId || ""}
              onChange={(e) => handleProposalPick(e.target.value)}
              className="w-full bg-ds-elevated border border-ds-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Choisir un devis —</option>
              {proposalsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.proposal_number ? `${p.proposal_number} · ` : ""}{p.title}{p.client_name ? ` (${p.client_name})` : ""}, {fmt(p.total_ttc)}
                </option>
              ))}
            </select>
          )}

          {/* % acompte éditable */}
          {invoiceType === "acompte" && linkedProposalId && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-gray-400 whitespace-nowrap">Pourcentage d&apos;acompte</label>
              <div className="flex items-center gap-2">
                {[20, 30, 40, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleDepositPctChange(p)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                      depositPct === p
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-ds-border text-gray-400 hover:text-white"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={depositPct}
                    onChange={(e) => handleDepositPctChange(Math.min(99, Math.max(1, Number(e.target.value))))}
                    className="w-16 bg-ds-elevated border border-ds-border rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          )}

          {!proposalPickerReady && proposalsList.length > 0 && (
            <p className="text-xs text-amber-400 mt-2">
              {invoiceType === "acompte"
                ? "Sélectionnez un devis pour calculer automatiquement le montant de l'acompte."
                : "Sélectionnez le devis pour lequel une facture d'acompte a déjà été émise."}
            </p>
          )}
        </div>
      )}

      {/* ── Bannières contextuelles ── */}
      {invoiceType === "acompte" && (linkedProposalId || fromProposalParam) && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-lg">💰</span>
          <div>
            <p className="text-emerald-300 font-medium text-sm">Facture d'acompte, {depositPct}% de la prestation</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">Numérotée AC-YYYY-NNN, indépendamment de la séquence standard.</p>
          </div>
        </div>
      )}

      {invoiceType === "solde" && (linkedProposalId || fromProposalParam) && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-indigo-300 font-medium text-sm">
              Facture de solde
              {linkedInvoiceNumber ? `, Acompte Réf. ${linkedInvoiceNumber}` : ""}
            </p>
            {soldeFromDeposit > 0 && (
              <p className="text-indigo-400/70 text-xs mt-0.5">
                Acompte déjà réglé : {fmt(soldeFromDeposit)} HT · Solde restant à facturer.
              </p>
            )}
            {!linkedInvoiceNumber && linkedProposalId && (
              <p className="text-amber-400 text-xs mt-0.5">
                ⚠️ Aucune facture d'acompte trouvée pour ce devis, créez d'abord un acompte.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Blocage si paiement non configuré */}
      {paymentConfigured === false && (
        <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-300 mb-1">Configurez votre moyen de paiement avant de facturer</p>
              <p className="text-sm text-amber-400/80 mb-4">
                Sans cette étape, vos clients ne sauront pas comment vous payer.
                Cela ne prend que 2 minutes.
              </p>
              <Link
                href="/paiements"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Configurer mes paiements →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulaire principal ── */}
      {/* Masqué pour acompte/solde tant qu'aucun devis n'est sélectionné */}
      {(invoiceType === "standard" || !needsProposalPicker || proposalPickerReady) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendeur */}
          <section className="bg-ds-surface rounded-xl border border-ds-border p-5 space-y-4">
            <h2 className="font-semibold text-gray-200">Vos informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Entreprise / Nom</label>
                <input value={sellerCompany} onChange={(e) => setSellerCompany(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">SIREN</label>
                <input value={sellerSiren} onChange={(e) => setSellerSiren(e.target.value)} placeholder="123 456 789" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Adresse</label>
                <input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">N° TVA intracommunautaire</label>
                <input value={sellerTva} onChange={(e) => setSellerTva(e.target.value)} placeholder="FR12345678901"
                  disabled={tvaRate === 0}
                  className={`${inputCls} disabled:opacity-50`} />
              </div>
            </div>
          </section>

          {/* Client */}
          <section className="bg-ds-surface rounded-xl border border-ds-border p-5 space-y-4">
            <h2 className="font-semibold text-gray-200">Client</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nom</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Entreprise</label>
                <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  SIREN client <span className="text-blue-400 text-xs">(B2B 2026)</span>
                </label>
                <input value={clientSiren} onChange={(e) => setClientSiren(e.target.value)} placeholder="123 456 789" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Adresse de facturation</label>
                <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Lignes */}
          <section className="bg-ds-surface rounded-xl border border-ds-border p-5 space-y-4">
            <h2 className="font-semibold text-gray-200">Lignes de facturation</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Description de la prestation" required className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Qté" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                      placeholder="Prix HT" className={inputCls} />
                  </div>
                  <div className="col-span-2 py-2 text-sm font-semibold text-gray-300 text-right">{fmt(item.total)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-400 text-lg leading-none py-2">×</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`grid gap-2 mt-1 ${catalog.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-ds-border text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
              >
                <span className="text-base leading-none">+</span> Ajouter une ligne
              </button>
              {catalog.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCatalog((v) => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-ds-border text-sm font-medium text-gray-400 hover:text-gray-200 hover:border-gray-500/40 hover:bg-ds-elevated/50 transition-all"
                  >
                    <Package size={14} className="shrink-0" /> Depuis le catalogue
                  </button>
                  {showCatalog && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCatalog(false)} />
                      <div className="absolute left-0 top-full mt-1.5 w-80 bg-ds-surface rounded-xl border border-ds-border shadow-xl z-20 overflow-y-auto max-h-80">
                        {catalog.filter(i => i.type === "fixed").length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-ds-surface border-b border-ds-border">
                              <Package size={10} /> À l&apos;acte
                            </div>
                            {catalog.filter(i => i.type === "fixed").map((item) => (
                              <button key={item.id} type="button" onClick={() => addFromCatalog(item)}
                                className="w-full text-left px-4 py-2.5 hover:bg-indigo-500/10 transition-colors">
                                <div className="text-sm font-medium text-gray-200">{item.name}</div>
                                <div className="flex justify-between items-center mt-0.5">
                                  <span className="text-xs text-gray-500">{item.unit || "forfait"}</span>
                                  <span className="text-xs font-semibold text-gray-300">{fmt(item.unit_price)}</span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                        {catalog.filter(i => i.type === "hourly").length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5 bg-ds-surface border-b border-ds-border border-t border-ds-border">
                              <Clock size={10} /> Taux horaire
                            </div>
                            {catalog.filter(i => i.type === "hourly").map((item) => (
                              <button key={item.id} type="button" onClick={() => addFromCatalog(item)}
                                className="w-full text-left px-4 py-2.5 hover:bg-violet-500/10 transition-colors">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-gray-200">{item.name}</span>
                                  <Clock size={10} className="text-violet-400 shrink-0" />
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                  <span className="text-xs text-violet-400/70">Choisir la durée →</span>
                                  <span className="text-xs font-semibold text-gray-300">{fmt(item.unit_price)}/h</span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* TVA + Totaux */}
            <div className="border-t border-ds-border pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Régime TVA</label>
                <select
                  value={tvaRate}
                  onChange={(e) => setTvaRate(parseFloat(e.target.value))}
                  className="w-full border border-ds-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 bg-ds-elevated text-white"
                >
                  {TVA_OPTIONS.map((opt) => (
                    <option key={opt.rate} value={opt.rate}>{opt.label}</option>
                  ))}
                </select>
                {tvaRate === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                    Mention automatique : «&nbsp;TVA non applicable, art. 293 B du CGI&nbsp;»
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <div className="text-right space-y-1 text-sm">
                  <div className="text-gray-400">Total HT : <span className="font-medium text-gray-200">{fmt(totalHt)}</span></div>
                  {tvaRate > 0 ? (
                    <div className="text-gray-400">TVA {tvaRate}% : <span className="font-medium text-gray-200">{fmt(totalTtc - totalHt)}</span></div>
                  ) : (
                    <div className="text-gray-500 text-xs italic">TVA non applicable (art. 293 B CGI)</div>
                  )}
                  <div className="font-semibold text-base text-white">
                    Total {tvaRate > 0 ? "TTC" : "net"} : <span className="text-indigo-400">{fmt(totalTtc)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mentions légales 2026 */}
          <section className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-blue-200">Mentions obligatoires 2026</h2>
            <div>
              <label className="block text-xs font-medium text-blue-300 mb-1">Nature de l&apos;opération</label>
              <select value={operationCategory} onChange={(e) => setOperationCategory(e.target.value as "services" | "goods" | "mixed")}
                className="border border-ds-border rounded-lg px-3 py-2 text-sm bg-ds-elevated text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500">
                <option value="services">Prestation de services</option>
                <option value="goods">Livraison de biens</option>
                <option value="mixed">Mixte (biens + services)</option>
              </select>
            </div>
            {tvaRate > 0 && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="payment_on_debit" checked={paymentOnDebit} onChange={(e) => setPaymentOnDebit(e.target.checked)} className="rounded text-indigo-600" />
                <label htmlFor="payment_on_debit" className="text-sm text-blue-300">
                  TVA acquittée sur les débits (art. 1693 bis CGI)
                  <span className="text-blue-400 text-xs ml-1">— par défaut : sur encaissements</span>
                </label>
              </div>
            )}
          </section>

          {/* Dates */}
          <section className="bg-ds-surface rounded-xl border border-ds-border p-5 space-y-4">
            <h2 className="font-semibold text-gray-200">Dates & conditions</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Date d&apos;émission</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Date d&apos;échéance</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Conditions de paiement</label>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="30 jours net" className={inputCls} />
              </div>
            </div>
          </section>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 border border-ds-border text-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-ds-elevated transition-colors">Annuler</button>
            <button
              type="submit"
              disabled={loading || paymentConfigured === false}
              title={paymentConfigured === false ? "Configurez d'abord vos paiements" : undefined}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {loading ? "Création…" : invoiceType === "acompte" ? `Créer l'acompte ${depositPct}%` : invoiceType === "solde" ? "Créer la facture de solde" : "Créer la facture"}
            </button>
          </div>
        </form>
      )}

      {/* Message d'attente si acompte/solde sans devis sélectionné */}
      {needsProposalPicker && !proposalPickerReady && proposalsList.length > 0 && (
        <div className="text-center py-10 text-gray-500 text-sm">
          Sélectionnez un devis ci-dessus pour continuer.
        </div>
      )}

      {/* ── Modal sélecteur de durée (taux horaire) ── */}
      {pendingHourlyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPendingHourlyItem(null)} />
          <div className="relative bg-ds-surface border border-violet-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={15} className="text-violet-400" />
              <h3 className="font-semibold text-white text-sm">Durée de la prestation</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              <span className="text-gray-300 font-medium">{pendingHourlyItem.name}</span> · {fmt(pendingHourlyItem.unit_price)}/h
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Heures</label>
                <select value={durationHours} onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-ds-bg border border-ds-border text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30">
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Minutes</label>
                <select value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-ds-bg border border-ds-border text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30">
                  {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{m === 0 ? "00 min" : `${m} min`}</option>)}
                </select>
              </div>
            </div>
            {(durationHours > 0 || durationMinutes > 0) && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-violet-300 text-xs">
                    {durationHours > 0 && `${durationHours}h`}{durationMinutes > 0 && `${durationMinutes}min`}
                    {" "}× {fmt(pendingHourlyItem.unit_price)}/h
                  </span>
                  <span className="font-semibold text-white">
                    {fmt((durationHours + durationMinutes / 60) * pendingHourlyItem.unit_price)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPendingHourlyItem(null)}
                className="flex-1 px-4 py-2 text-sm bg-ds-elevated hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                Annuler
              </button>
              <button type="button" onClick={confirmDuration} disabled={durationHours === 0 && durationMinutes === 0}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
