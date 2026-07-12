"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/types";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { RefreshCw, Trash2, Plus, X, ChevronDown } from "lucide-react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { usePlan } from "@/components/PlanContext";

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

const INTERVAL_LABEL: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  yearly: "Annuelle",
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

type RecurringInvoice = {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  items: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  tva_rate: number;
  interval: string;
  day_of_month: number;
  next_billing_date: string;
  active: boolean;
  last_billed_at: string | null;
};

const EMPTY_ITEM = { description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 };

export default function InvoicesPage() {
  const router = useRouter();
  const plan = usePlan(); // plan workspace depuis le layout, instantané, zéro fetch
  const [tab, setTab] = useState<"invoices" | "recurring">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNewDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [paymentConfigured, setPaymentConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  // Recurring state
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [recurringMsg, setRecurringMsg] = useState("");

  // Form state
  const [rClientName, setRClientName] = useState("");
  const [rClientEmail, setRClientEmail] = useState("");
  const [rClientCompany, setRClientCompany] = useState("");
  const [rClientAddress, setRClientAddress] = useState("");
  const [rItems, setRItems] = useState([{ ...EMPTY_ITEM }]);
  const [rTva, setRTva] = useState(20);
  const [rPaymentTerms, setRPaymentTerms] = useState("30 jours");
  const [rNotes, setRNotes] = useState("");
  const [rInterval, setRInterval] = useState("monthly");
  const [rDayOfMonth, setRDayOfMonth] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]).then(([invoiceData, profileData]) => {
      setInvoices(invoiceData.invoices || []);
      const pm = profileData.profile?.payment_method;
      setPaymentConfigured(!!pm && pm !== "none");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "recurring" && plan === "pro") {
      loadRecurring();
    }
  }, [tab, plan]);

  async function loadRecurring() {
    setRecurringLoading(true);
    const r = await fetch("/api/recurring").then((x) => x.json());
    setRecurring(r.recurring || []);
    setRecurringLoading(false);
  }

  async function handleExportFEC() {
    setExporting(true);
    const res = await fetch(`/api/export/fec?year=${exportYear}`);
    if (!res.ok) { alert("Erreur lors de l'export"); setExporting(false); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FEC_${exportYear}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

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

  function updateRItem(i: number, field: string, value: string | number) {
    const updated = rItems.map((item, idx) => {
      if (idx !== i) return item;
      const next = { ...item, [field]: value };
      next.total = Number(next.quantity) * Number(next.unit_price);
      return next;
    });
    setRItems(updated);
  }

  async function handleSaveRecurring() {
    if (!rClientName || rItems.some((it) => !it.description)) {
      setRecurringMsg("Remplissez le nom client et la description de chaque article.");
      return;
    }
    setSavingRecurring(true);
    setRecurringMsg("");
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: rClientName,
        client_email: rClientEmail || null,
        client_company: rClientCompany || null,
        client_address: rClientAddress || null,
        items: rItems,
        tva_rate: rTva,
        payment_terms: rPaymentTerms,
        notes: rNotes || null,
        interval: rInterval,
        day_of_month: rDayOfMonth,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRecurringMsg(data.error || "Erreur lors de la création.");
    } else {
      setRecurring((prev) => [data.recurring, ...prev]);
      setShowRecurringForm(false);
      resetRForm();
    }
    setSavingRecurring(false);
  }

  function resetRForm() {
    setRClientName(""); setRClientEmail(""); setRClientCompany(""); setRClientAddress("");
    setRItems([{ ...EMPTY_ITEM }]); setRTva(20); setRPaymentTerms("30 jours");
    setRNotes(""); setRInterval("monthly"); setRDayOfMonth(1); setRecurringMsg("");
  }

  async function handleToggleRecurring(id: string, active: boolean) {
    await fetch(`/api/recurring?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active } : r));
  }

  async function handleDeleteRecurring(id: string) {
    if (!confirm("Supprimer cette facture récurrente ?")) return;
    await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }

  const isFree = plan === "free";
  const isPro = plan === "pro";

  const inputCls = "w-full bg-ds-elevated border border-ds-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500";

  return (
    <div className="max-w-5xl mx-auto">
      <GuidedTourBanner pageKey="invoices" />
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Mes factures</h1>
          <p className="text-gray-400 text-sm mt-1">Factur-X BASIC, PDF/A-3 conforme réforme 2026</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isPro && tab === "invoices" && (
            <div className="flex items-center gap-1.5 border border-ds-border rounded-lg overflow-hidden">
              <select
                value={exportYear}
                onChange={(e) => setExportYear(Number(e.target.value))}
                className="text-sm text-gray-300 px-2 py-2 bg-ds-bg border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleExportFEC}
                disabled={exporting}
                className="text-sm font-medium px-3 py-2 bg-ds-elevated hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors border-l border-ds-border"
              >
                {exporting ? "Export…" : "⬇ FEC"}
              </button>
            </div>
          )}

          {tab === "invoices" && (
            isFree ? (
              <div className="relative group">
                <button disabled className="bg-ds-elevated text-gray-500 cursor-not-allowed text-sm font-medium px-4 py-2 rounded-lg">
                  + Nouvelle facture
                </button>
                <div className="absolute right-0 top-10 hidden group-hover:block bg-ds-elevated text-white text-xs rounded-lg px-3 py-2 w-52 z-10">
                  Disponible à partir du plan Solo
                </div>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNewDropdownOpen((v) => !v)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  + Nouvelle facture
                  <ChevronDown size={14} className={`transition-transform ${newDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {newDropdownOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-ds-surface border border-ds-border rounded-xl shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => { setNewDropdownOpen(false); router.push("/invoices/new"); }}
                      className="w-full text-left px-4 py-3 hover:bg-ds-elevated transition-colors"
                    >
                      <div className="text-sm font-medium text-white">Facture standard</div>
                      <div className="text-xs text-gray-500 mt-0.5">Facturation classique</div>
                    </button>
                    <div className="border-t border-ds-border" />
                    <button
                      onClick={() => { setNewDropdownOpen(false); router.push("/invoices/new?type=acompte"); }}
                      className="w-full text-left px-4 py-3 hover:bg-ds-elevated transition-colors"
                    >
                      <div className="text-sm font-medium text-emerald-400">💰 Facture d&apos;acompte</div>
                      <div className="text-xs text-gray-500 mt-0.5">% du montant d&apos;un devis</div>
                    </button>
                    <div className="border-t border-ds-border" />
                    <button
                      onClick={() => { setNewDropdownOpen(false); router.push("/invoices/new?type=solde"); }}
                      className="w-full text-left px-4 py-3 hover:bg-ds-elevated transition-colors"
                    >
                      <div className="text-sm font-medium text-indigo-400">✅ Facture de solde</div>
                      <div className="text-xs text-gray-500 mt-0.5">Solde restant après acompte</div>
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {tab === "recurring" && isPro && (
            <button
              onClick={() => setShowRecurringForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> Nouvelle récurrente
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-ds-border">
        <button
          onClick={() => setTab("invoices")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "invoices" ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
        >
          Factures
        </button>
        <button
          onClick={() => setTab("recurring")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${tab === "recurring" ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
        >
          <RefreshCw size={13} />
          Récurrentes
          {!isPro && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>}
        </button>
      </div>

      {/* Banner paiement non configuré */}
      {!isFree && !paymentConfigured && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl px-4 py-4 mb-5 flex items-start gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-300 text-sm">Vos clients ne savent pas comment vous payer</p>
            <p className="text-xs text-amber-400/80 mt-0.5 mb-3">Configurez votre moyen de paiement pour débloquer la création de factures.</p>
            <Link href="/paiements" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Configurer mes paiements →
            </Link>
          </div>
        </div>
      )}

      {/* ── TAB FACTURES ── */}
      {tab === "invoices" && (
        <>
          {isFree && <UpgradeBanner variant="invoice_blocked" />}

          {loading ? (
            <div className="text-center py-16 text-gray-500">Chargement…</div>
          ) : isFree ? (
            <div className="text-center py-16 border border-dashed border-ds-border rounded-xl bg-ds-surface">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-white font-semibold">Les factures sont réservées au plan Solo</p>
              <p className="text-gray-500 text-sm mt-1">Passez Solo pour créer des factures électroniques Factur-X conformes.</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-ds-border rounded-xl bg-ds-surface">
              <p className="text-gray-400 font-medium">Aucune facture pour l&apos;instant</p>
              <p className="text-gray-500 text-sm mt-1">Créez votre première facture depuis un devis signé ou manuellement.</p>
              <Link href="/invoices/new" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Créer une facture
              </Link>
            </div>
          ) : (
            <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-ds-border text-gray-500 text-xs uppercase tracking-wide">
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
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="border-b border-ds-border hover:bg-ds-elevated/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-medium text-white">{inv.invoice_number}</div>
                        {inv.invoice_type === "acompte" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">ACOMPTE</span>
                        )}
                        {inv.invoice_type === "solde" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">SOLDE</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">
                        <div className="font-medium">{inv.client_company || inv.client_name}</div>
                        {inv.client_email && <div className="text-gray-500 text-xs">{inv.client_email}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{fmtDate(inv.issue_date)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{fmt(inv.total_ttc)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status] || ""}`}>
                          {STATUS_LABEL[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => handleDownload(inv.id, e)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                        >
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── TAB RÉCURRENTES ── */}
      {tab === "recurring" && (
        <>
          {!isPro ? (
            <div className="text-center py-16 border border-dashed border-ds-border rounded-xl bg-ds-surface">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-white font-semibold">Factures récurrentes, Pro exclusif</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                Automatisez vos abonnements et contrats. Deviso génère et envoie les factures à la bonne date, chaque mois.
              </p>
              <Link href="/billing" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Passer Pro
              </Link>
            </div>
          ) : (
            <>
              {/* Form modal */}
              {showRecurringForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-black/60">
                  <div className="bg-ds-surface border border-ds-border rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-white">Nouvelle facture récurrente</h2>
                      <button onClick={() => { setShowRecurringForm(false); resetRForm(); }} className="text-gray-500 hover:text-white">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Nom client *</label>
                          <input value={rClientName} onChange={(e) => setRClientName(e.target.value)} className={inputCls} placeholder="Jean Dupont" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Email client</label>
                          <input value={rClientEmail} onChange={(e) => setRClientEmail(e.target.value)} className={inputCls} placeholder="jean@exemple.fr" type="email" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Société</label>
                          <input value={rClientCompany} onChange={(e) => setRClientCompany(e.target.value)} className={inputCls} placeholder="Acme SAS" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">TVA (%)</label>
                          <input value={rTva} onChange={(e) => setRTva(Number(e.target.value))} className={inputCls} type="number" min={0} max={100} />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Adresse client</label>
                        <input value={rClientAddress} onChange={(e) => setRClientAddress(e.target.value)} className={inputCls} placeholder="12 rue de la Paix, 75001 Paris" />
                      </div>

                      {/* Articles */}
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Articles</label>
                        <div className="space-y-2">
                          {rItems.map((item, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input
                                value={item.description}
                                onChange={(e) => updateRItem(i, "description", e.target.value)}
                                className={`${inputCls} flex-1`}
                                placeholder="Description"
                              />
                              <input
                                value={item.quantity}
                                onChange={(e) => updateRItem(i, "quantity", Number(e.target.value))}
                                className="w-16 bg-ds-elevated border border-ds-border rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500"
                                type="number" min={1}
                              />
                              <input
                                value={item.unit_price}
                                onChange={(e) => updateRItem(i, "unit_price", Number(e.target.value))}
                                className="w-24 bg-ds-elevated border border-ds-border rounded-lg px-2 py-2 text-sm text-white text-right focus:outline-none focus:border-indigo-500"
                                type="number" min={0} placeholder="Prix HT"
                              />
                              {rItems.length > 1 && (
                                <button onClick={() => setRItems((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-400">
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setRItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus size={12} /> Ajouter un article
                        </button>
                      </div>

                      {/* Récurrence */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Fréquence</label>
                          <select value={rInterval} onChange={(e) => setRInterval(e.target.value)} className={inputCls}>
                            <option value="monthly">Mensuelle</option>
                            <option value="quarterly">Trimestrielle</option>
                            <option value="yearly">Annuelle</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Jour du mois</label>
                          <input
                            value={rDayOfMonth}
                            onChange={(e) => setRDayOfMonth(Math.min(28, Math.max(1, Number(e.target.value))))}
                            className={inputCls}
                            type="number" min={1} max={28}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Conditions de paiement</label>
                          <input value={rPaymentTerms} onChange={(e) => setRPaymentTerms(e.target.value)} className={inputCls} placeholder="30 jours" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                        <textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} className={`${inputCls} resize-none h-16`} placeholder="Mentions particulières…" />
                      </div>
                    </div>

                    {recurringMsg && <p className="text-red-400 text-xs mt-3">{recurringMsg}</p>}

                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => { setShowRecurringForm(false); resetRForm(); }} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveRecurring}
                        disabled={savingRecurring}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                      >
                        {savingRecurring ? "Création…" : "Créer"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {recurringLoading ? (
                <div className="text-center py-16 text-gray-500">Chargement…</div>
              ) : recurring.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-ds-border rounded-xl bg-ds-surface">
                  <RefreshCw size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 font-medium">Aucune facture récurrente</p>
                  <p className="text-gray-500 text-sm mt-1">Automatisez vos abonnements et contrats mensuels.</p>
                  <button
                    onClick={() => setShowRecurringForm(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Créer ma première récurrente
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurring.map((rec) => {
                    const total_ht = rec.items.reduce((s, it) => s + it.total, 0);
                    const total_ttc = total_ht * (1 + rec.tva_rate / 100);
                    return (
                      <div key={rec.id} className="bg-ds-surface border border-ds-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{rec.client_company || rec.client_name || "Client sans nom"}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-ds-elevated text-gray-500"}`}>
                              {rec.active ? "Active" : "En pause"}
                            </span>
                            <span className="text-xs text-gray-500 bg-ds-elevated px-2 py-0.5 rounded-full">
                              {INTERVAL_LABEL[rec.interval] || rec.interval}
                            </span>
                          </div>
                          {rec.client_email && <div className="text-xs text-gray-500 mt-0.5">{rec.client_email}</div>}
                          <div className="mt-1 text-sm text-gray-400">
                            <span className="font-semibold text-white">{fmt(total_ttc)}</span>
                            {" · "}Prochain envoi : <span className="text-indigo-400">{fmtDate(rec.next_billing_date)}</span>
                            {rec.last_billed_at && <span className="text-gray-600"> · Dernier : {fmtDate(rec.last_billed_at)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRecurring(rec.id, !rec.active)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${rec.active ? "border-ds-border text-gray-400 hover:text-white" : "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"}`}
                          >
                            {rec.active ? "Mettre en pause" : "Réactiver"}
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(rec.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
