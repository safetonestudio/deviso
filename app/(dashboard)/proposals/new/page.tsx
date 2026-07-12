"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedProposal, ProposalItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { UpgradeButton } from "@/components/UpgradeButton";
import { LayoutTemplate, ChevronDown, ChevronUp, Clock, Package } from "lucide-react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";

type Step = "brief" | "review" | "client";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  unit_price: number;
  type: "fixed" | "hourly";
}

interface ProposalTemplate {
  id: string;
  name: string;
  description: string | null;
  items: { description: string; quantity: number; unit: string; unit_price: number; total: number }[];
  tva_rate: number;
  payment_terms: string | null;
  notes: string | null;
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

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProposal | null>(null);
  const [defaultTvaRate, setDefaultTvaRate] = useState<number>(0);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);

  // Affinage IA
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);

  // Duration picker, pour les prestations au taux horaire
  const [pendingHourlyItem, setPendingHourlyItem] = useState<CatalogItem | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // Templates partagés
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientSiren, setClientSiren] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.tva_regime) {
          setDefaultTvaRate(REGIME_TO_RATE[d.profile.tva_regime] ?? 0);
        }
      })
      .catch(() => {});

    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => { if (d.items) setCatalog(d.items); })
      .catch(() => {});

    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => { if (d.templates) setTemplates(d.templates); })
      .catch(() => {});
  }, []);

  function applyTemplate(tpl: ProposalTemplate) {
    const items = tpl.items.map((i) => ({ ...i, id: uuidv4() }));
    const total_ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
    const tva = tpl.tva_rate;
    const total_ttc = Math.round(total_ht * (1 + tva / 100) * 100) / 100;
    setGenerated({
      title: tpl.name,
      items,
      total_ht,
      tva_rate: tva,
      total_ttc,
      valid_days: 30,
      payment_terms: tpl.payment_terms || "",
      notes: tpl.notes || "",
    });
    setShowTemplates(false);
    setStep("review");
  }

  const handleRefine = async () => {
    if (!generated || refineInput.trim().length < 3) return;
    setRefining(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingProposal: generated,
          refinement: refineInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const proposal = data.proposal as GeneratedProposal;
      // Préserve le tva_rate choisi par l'utilisateur
      const tva = generated.tva_rate;
      const total_ttc = Math.round(proposal.total_ht * (1 + tva / 100) * 100) / 100;
      setGenerated({ ...proposal, tva_rate: tva, total_ttc });
      setRefineInput("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'affinage.");
    } finally {
      setRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (brief.trim().length < 10) {
      setError("Décris ton projet en quelques mots au minimum.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const proposal = data.proposal as GeneratedProposal;
      const tva = defaultTvaRate;
      const total_ttc = Math.round(proposal.total_ht * (1 + tva / 100) * 100) / 100;
      setGenerated({ ...proposal, tva_rate: tva, total_ttc });
      setStep("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  };

  const updateItem = (idx: number, field: keyof ProposalItem, value: string | number) => {
    if (!generated) return;
    const items = [...generated.items];
    const item = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      item.total = Math.round(Number(item.quantity) * Number(item.unit_price) * 100) / 100;
    }
    items[idx] = item;
    const total_ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
    const total_ttc = Math.round(total_ht * (1 + generated.tva_rate / 100) * 100) / 100;
    setGenerated({ ...generated, items, total_ht, total_ttc });
  };

  const updateTvaRate = (rate: number) => {
    if (!generated) return;
    const total_ttc = Math.round(generated.total_ht * (1 + rate / 100) * 100) / 100;
    setGenerated({ ...generated, tva_rate: rate, total_ttc });
  };

  const addItem = () => {
    if (!generated) return;
    setGenerated({
      ...generated,
      items: [...generated.items, { description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 }],
    });
  };

  const addFromCatalog = (item: CatalogItem) => {
    if (!generated) return;
    setShowCatalog(false);
    if (item.type === "hourly") {
      // Ouvrir le sélecteur de durée
      setPendingHourlyItem(item);
      setDurationHours(1);
      setDurationMinutes(0);
      return;
    }
    insertCatalogItem(item, 1);
  };

  const insertCatalogItem = (item: CatalogItem, quantity: number) => {
    if (!generated) return;
    const newItem: ProposalItem = {
      id: uuidv4(),
      description: item.name + (item.description ? `, ${item.description}` : ""),
      quantity,
      unit: item.unit || "forfait",
      unit_price: item.unit_price,
      total: Math.round(quantity * item.unit_price * 100) / 100,
    };
    const items = [...generated.items, newItem];
    const total_ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
    const total_ttc = Math.round(total_ht * (1 + generated.tva_rate / 100) * 100) / 100;
    setGenerated({ ...generated, items, total_ht, total_ttc });
  };

  const confirmDuration = () => {
    if (!pendingHourlyItem) return;
    const quantity = durationHours + durationMinutes / 60;
    insertCatalogItem(pendingHourlyItem, Math.round(quantity * 100) / 100);
    setPendingHourlyItem(null);
  };

  const removeItem = (idx: number) => {
    if (!generated) return;
    const items = generated.items.filter((_, i) => i !== idx);
    const total_ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
    const total_ttc = Math.round(total_ht * (1 + generated.tva_rate / 100) * 100) / 100;
    setGenerated({ ...generated, items, total_ht, total_ttc });
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    setError(null);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + generated.valid_days);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generated.title,
          client_name: clientName || null,
          client_email: clientEmail || null,
          client_company: clientCompany || null,
          client_address: clientAddress || null,
          client_siren: clientSiren || null,
          items: generated.items.map((i) => ({ ...i, id: uuidv4() })),
          total_ht: generated.total_ht,
          tva_rate: generated.tva_rate,
          total_ttc: generated.total_ttc,
          valid_until: validUntil.toISOString().split("T")[0],
          payment_terms: generated.payment_terms,
          notes: generated.notes,
          ai_brief: brief,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "LIMIT_REACHED") {
        setError("LIMIT_REACHED");
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      router.push(`/proposals/${data.proposal.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde.");
      setSaving(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  const inputCls = "w-full text-sm px-3 py-2 rounded-lg border border-ds-border bg-ds-elevated text-white focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder:text-gray-600";

  return (
    <div className="max-w-3xl mx-auto">
      <GuidedTourBanner pageKey="proposals_new" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight">Nouveau devis</h1>
        <div className="flex items-center gap-4 mt-4">
          {(["brief", "review", "client"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                s === step ? "bg-indigo-600 text-white"
                : ["brief", "review", "client"].indexOf(step) > i ? "bg-green-500 text-white"
                : "bg-ds-elevated text-gray-400"
              }`}>
                {["brief", "review", "client"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium ${s === step ? "text-white" : "text-gray-500"}`}>
                {["Décrire", "Réviser", "Finaliser"][i]}
              </span>
              {i < 2 && <span className="text-gray-400 ml-2">→</span>}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
      )}

      {/* STEP 1: BRIEF */}
      {step === "brief" && (
        <div className="space-y-4">
          {/* Sélecteur de modèles partagés */}
          {templates.length > 0 && (
            <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTemplates((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-ds-elevated/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutTemplate size={15} className="text-indigo-400" />
                  <span className="text-sm font-medium text-white">Partir d&apos;un devis type</span>
                  <span className="text-xs text-gray-500 bg-ds-elevated px-2 py-0.5 rounded-full">{templates.length}</span>
                </div>
                {showTemplates ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </button>
              {showTemplates && (
                <div className="border-t border-ds-border divide-y divide-ds-border">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-indigo-500/10 transition-colors group"
                    >
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{tpl.name}</div>
                        {tpl.description && <div className="text-xs text-gray-500 mt-0.5">{tpl.description}</div>}
                        <div className="text-xs text-gray-600 mt-0.5">
                          {tpl.items.length} prestation{tpl.items.length > 1 ? "s" : ""}
                          {tpl.tva_rate > 0 ? ` · TVA ${tpl.tva_rate}%` : " · Franchise TVA"}
                        </div>
                      </div>
                      <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                        Utiliser →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Brief IA */}
          <div className="bg-ds-surface rounded-xl border border-ds-border p-6">
            <h2 className="font-semibold text-white mb-1 text-lg">Décris ton projet</h2>
            <p className="text-gray-400 text-sm mb-4">
              Parle normalement. L&apos;IA comprend le contexte et génère un devis complet.
            </p>
            <div className="bg-ds-elevated/50 rounded-xl p-4 mb-4 text-sm text-gray-400 border border-ds-border">
              <div className="font-semibold text-gray-300 mb-2">💡 Exemples de briefs</div>
              <ul className="space-y-1.5">
                <li>« Refonte site vitrine cabinet d&apos;avocats à Lyon, responsive, 5 pages, budget 4 500€, délai 3 semaines »</li>
                <li>« Identité visuelle complète pour une startup fintech : logo, charte graphique, business card »</li>
                <li>« Mission SEO 3 mois pour e-commerce mode, audit + rédaction 10 articles + suivi positions »</li>
              </ul>
            </div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              placeholder="Décris ici ton projet, la prestation, le client, le budget approximatif et le délai..."
              className="w-full px-4 py-3 rounded-xl border border-ds-border bg-ds-elevated text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition resize-none"
            />
            {catalog.length > 0 && (
              <p className="text-xs text-indigo-400/70 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {catalog.length} prestation{catalog.length > 1 ? "s" : ""} de ton catalogue disponibles, l&apos;IA utilisera tes vrais tarifs
              </p>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || brief.trim().length < 10}
              className="w-full mt-4 bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Génération en cours...</>
              ) : "⚡ Générer le devis avec l'IA"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW */}
      {step === "review" && generated && (
        <div className="space-y-4">
          <div className="bg-ds-surface rounded-xl border border-ds-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg">{generated.title}</h2>
                <p className="text-gray-500 text-sm mt-0.5">Modifie les lignes si nécessaire</p>
              </div>
              <button onClick={() => { setStep("brief"); setGenerated(null); }} className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                ↩ Recommencer
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-2 text-center">Unité</span>
                <span className="col-span-2 text-right">Prix HT</span>
                <span className="col-span-1" />
              </div>
              {generated.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className={`col-span-5 ${inputCls}`} value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                  <input type="number" className={`col-span-2 ${inputCls} text-center`} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value))} min={0} />
                  <input className={`col-span-2 ${inputCls} text-center`} value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                  <div className="col-span-2 text-right">
                    <input type="number" className={`w-full ${inputCls} text-right`} value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value))} min={0} />
                  </div>
                  <button onClick={() => removeItem(idx)} className="col-span-1 text-gray-400 hover:text-red-400 transition-colors text-center text-lg">×</button>
                </div>
              ))}
            </div>
            <div className={`grid gap-2 mt-1 ${catalog.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                onClick={addItem}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-ds-border text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
              >
                <span className="text-base leading-none">+</span> Ajouter une ligne
              </button>
              {catalog.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowCatalog((v) => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-ds-border text-sm font-medium text-gray-400 hover:text-gray-200 hover:border-gray-500/40 hover:bg-ds-elevated/50 transition-all"
                  >
                    <Package size={14} className="shrink-0" /> Depuis le catalogue
                  </button>
                  {showCatalog && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCatalog(false)} />
                      <div className="absolute left-0 top-full mt-1.5 w-80 bg-ds-surface rounded-xl border border-ds-border shadow-xl z-20 overflow-y-auto max-h-80">
                        {/* Section À l'acte */}
                        {catalog.filter(i => i.type === "fixed").length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-ds-surface border-b border-ds-border">
                              <Package size={10} /> À l&apos;acte
                            </div>
                            {catalog.filter(i => i.type === "fixed").map((item) => (
                              <button key={item.id} onClick={() => addFromCatalog(item)}
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
                        {/* Section Taux horaire */}
                        {catalog.filter(i => i.type === "hourly").length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-ds-surface border-b border-ds-border border-t border-ds-border">
                              <Clock size={10} /> Taux horaire
                            </div>
                            {catalog.filter(i => i.type === "hourly").map((item) => (
                              <button key={item.id} onClick={() => addFromCatalog(item)}
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

            <div className="border-t border-ds-border mt-4 pt-4">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Régime TVA</label>
                <select
                  value={generated.tva_rate}
                  onChange={(e) => updateTvaRate(parseFloat(e.target.value))}
                  className="w-full border border-ds-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 bg-ds-elevated text-white"
                >
                  {TVA_OPTIONS.map((opt) => (
                    <option key={opt.rate} value={opt.rate}>{opt.label}</option>
                  ))}
                </select>
                {generated.tva_rate === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                    Mention automatique : «&nbsp;TVA non applicable, art. 293 B du CGI&nbsp;»
                  </p>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Total HT</span><span className="font-medium text-gray-200">{fmt(generated.total_ht)}</span>
                </div>
                {generated.tva_rate > 0 ? (
                  <div className="flex justify-between text-gray-400">
                    <span>TVA {generated.tva_rate}%</span>
                    <span className="font-medium text-gray-200">{fmt(generated.total_ttc - generated.total_ht)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-500 text-xs italic">
                    <span>TVA non applicable (art. 293 B CGI)</span><span>—</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base text-white pt-1 border-t border-ds-border">
                  <span>Total {generated.tva_rate > 0 ? "TTC" : "net"}</span>
                  <span className="text-indigo-400">{fmt(generated.total_ttc)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section Affinage IA ── */}
          <div className="bg-ds-surface rounded-xl border border-indigo-500/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-indigo-400">⚡</span>
              <span className="text-sm font-semibold text-indigo-300">Affiner avec l&apos;IA</span>
              <span className="text-xs text-gray-500">— dis ce que tu veux changer</span>
            </div>

            {/* Chips de suggestions rapides */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "Réduire le budget de 20%",
                "Ajouter une phase de tests",
                "Passer en forfait global",
                "Ajouter 3 mois de maintenance",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setRefineInput(chip)}
                  className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRefine();
                  }
                }}
                placeholder="Ex : 'Réduis à 3 500€ max', 'Ajoute une clause de révisions illimitées 1 mois'..."
                className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-ds-border bg-ds-elevated text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
              <button
                onClick={handleRefine}
                disabled={refining || refineInput.trim().length < 3}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
              >
                {refining ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spinner" />
                    Affinage...
                  </>
                ) : (
                  "⚡ Affiner"
                )}
              </button>
            </div>
          </div>

          <div className="bg-ds-surface rounded-xl border border-ds-border p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Conditions de paiement</label>
              <input className={inputCls} value={generated.payment_terms} onChange={(e) => setGenerated({ ...generated, payment_terms: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes et mentions</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={generated.notes} onChange={(e) => setGenerated({ ...generated, notes: e.target.value })} />
            </div>
          </div>

          <button onClick={() => setStep("client")} className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-500 transition-all">
            Continuer → Informations client
          </button>
        </div>
      )}

      {/* STEP 3: CLIENT */}
      {step === "client" && generated && (
        <div className="bg-ds-surface rounded-xl border border-ds-border p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-white text-lg mb-1">Informations client</h2>
            <p className="text-gray-400 text-sm">Optionnel, tu pourras compléter après</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom du client</label>
              <input className={inputCls} placeholder="Jean Martin" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Entreprise</label>
              <input className={inputCls} placeholder="SARL Martin & Co" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email client</label>
              <input type="email" className={inputCls} placeholder="jean@exemple.fr" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">SIREN client <span className="text-blue-400 text-xs">(B2B 2026)</span></label>
              <input className={inputCls} placeholder="123 456 789" value={clientSiren} onChange={(e) => setClientSiren(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse du client</label>
              <input className={inputCls} placeholder="12 rue de la Paix, 75001 Paris" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
          </div>

          <div className="bg-ds-elevated/50 rounded-xl p-4 border border-ds-border text-sm">
            <div className="font-semibold text-gray-300 mb-2">Récapitulatif</div>
            <div className="text-gray-400 space-y-1">
              <div>{generated.title}</div>
              <div>{generated.items.length} ligne(s) · Total {generated.tva_rate > 0 ? "TTC" : "net"} {fmt(generated.total_ttc)}</div>
              <div>Validité : {generated.valid_days} jours · TVA : {generated.tva_rate === 0 ? "non applicable (franchise)" : `${generated.tva_rate}%`}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("review")} className="flex-1 border border-ds-border text-gray-300 font-semibold py-3 rounded-xl hover:bg-ds-elevated transition-all">← Retour</button>
            <button onClick={handleSave} disabled={saving} className="flex-grow bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Sauvegarde...</> : "💾 Enregistrer le devis"}
            </button>
          </div>
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
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-ds-bg border border-ds-border text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}h</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Minutes</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-ds-bg border border-ds-border text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m === 0 ? "00 min" : `${m} min`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Récap durée + montant */}
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
              <button
                onClick={() => setPendingHourlyItem(null)}
                className="flex-1 px-4 py-2 text-sm bg-ds-elevated hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDuration}
                disabled={durationHours === 0 && durationMinutes === 0}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
