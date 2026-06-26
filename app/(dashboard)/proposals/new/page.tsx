"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedProposal, ProposalItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { UpgradeButton } from "@/components/UpgradeButton";

type Step = "brief" | "review" | "client";

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProposal | null>(null);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");

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
      setGenerated(data.proposal);
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

  const addItem = () => {
    if (!generated) return;
    setGenerated({
      ...generated,
      items: [...generated.items, { description: "", quantity: 1, unit: "forfait", unit_price: 0, total: 0 }],
    });
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Nouveau devis</h1>
        <div className="flex items-center gap-4 mt-4">
          {(["brief", "review", "client"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s === step
                    ? "bg-brand-600 text-white"
                    : ["brief", "review", "client"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {["brief", "review", "client"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium ${s === step ? "text-slate-900" : "text-slate-400"}`}>
                {["Décrire", "Réviser", "Finaliser"][i]}
              </span>
              {i < 2 && <span className="text-slate-200 ml-2">→</span>}
            </div>
          ))}
        </div>
      </div>

      {error === "LIMIT_REACHED" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-amber-900 text-sm">Limite atteinte — 3/3 devis utilisés</div>
            <div className="text-amber-700 text-xs mt-0.5">Passez Pro pour créer des devis illimités.</div>
          </div>
          <UpgradeButton className="shrink-0 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      ) : null}

      {/* ── STEP 1: BRIEF ── */}
      {step === "brief" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1 text-lg">Décris ton projet</h2>
          <p className="text-slate-500 text-sm mb-4">
            Parle normalement. L'IA comprend le contexte et génère un devis complet.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-500 border border-slate-100">
            <div className="font-semibold text-slate-700 mb-2">💡 Exemples de briefs</div>
            <ul className="space-y-1.5">
              <li>« Refonte site vitrine cabinet d'avocats à Lyon, responsive, 5 pages, budget 4 500€, délai 3 semaines »</li>
              <li>« Identité visuelle complète pour une startup fintech : logo, charte graphique, business card »</li>
              <li>« Mission SEO 3 mois pour e-commerce mode, audit + rédaction 10 articles + suivi positions »</li>
            </ul>
          </div>

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={5}
            placeholder="Décris ici ton projet, la prestation, le client, le budget approximatif et le délai..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={generating || brief.trim().length < 10}
            className="w-full mt-4 bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                Génération en cours...
              </>
            ) : (
              "⚡ Générer le devis avec l'IA"
            )}
          </button>
        </div>
      )}

      {/* ── STEP 2: REVIEW ── */}
      {step === "review" && generated && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">{generated.title}</h2>
                <p className="text-slate-400 text-sm mt-0.5">Modifie les lignes si nécessaire</p>
              </div>
              <button
                onClick={() => { setStep("brief"); setGenerated(null); }}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                ↩ Recommencer
              </button>
            </div>

            {/* Items table */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-2 text-center">Unité</span>
                <span className="col-span-2 text-right">Prix HT</span>
                <span className="col-span-1" />
              </div>

              {generated.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-5 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />
                  <input
                    type="number"
                    className="col-span-2 text-sm px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400 text-center"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value))}
                    min={0}
                  />
                  <input
                    className="col-span-2 text-sm px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400 text-center"
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                  />
                  <div className="col-span-2 text-right">
                    <input
                      type="number"
                      className="w-full text-sm px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-400 text-right"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value))}
                      min={0}
                    />
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="col-span-1 text-slate-300 hover:text-red-400 transition-colors text-center text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              + Ajouter une ligne
            </button>

            {/* Totaux */}
            <div className="border-t border-slate-100 mt-4 pt-4 space-y-1">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Total HT</span>
                <span>{fmt(generated.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>TVA {generated.tva_rate}%</span>
                <span>{fmt(generated.total_ttc - generated.total_ht)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Total TTC</span>
                <span className="text-brand-600">{fmt(generated.total_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Payment / notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Conditions de paiement
              </label>
              <input
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={generated.payment_terms}
                onChange={(e) => setGenerated({ ...generated, payment_terms: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes et mentions légales
              </label>
              <textarea
                rows={3}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                value={generated.notes}
                onChange={(e) => setGenerated({ ...generated, notes: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={() => setStep("client")}
            className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-all"
          >
            Continuer → Informations client
          </button>
        </div>
      )}

      {/* ── STEP 3: CLIENT ── */}
      {step === "client" && generated && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-lg mb-1">Informations client</h2>
            <p className="text-slate-500 text-sm">Optionnel — tu pourras compléter après</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du client</label>
              <input
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Jean Martin"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Entreprise</label>
              <input
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="SARL Martin & Co"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email client (pour signature)</label>
            <input
              type="email"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="jean@exemple.fr"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
            <div className="font-semibold text-slate-700 mb-2">Récapitulatif</div>
            <div className="text-slate-500 space-y-1">
              <div>{generated.title}</div>
              <div>{generated.items.length} ligne(s) · Total TTC {fmt(generated.total_ttc)}</div>
              <div>Validité : {generated.valid_days} jours</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("review")}
              className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              ← Retour
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-2 flex-grow bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                  Sauvegarde...
                </>
              ) : (
                "💾 Enregistrer le devis"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
