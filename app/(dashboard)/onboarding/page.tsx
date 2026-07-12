"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TvaRegime } from "@/types";

const TVA_REGIMES: { value: TvaRegime; label: string; description: string }[] = [
  { value: "franchise",     label: "Franchise, TVA non applicable (art. 293 B CGI)", description: "Micro-entrepreneur ou CA sous le seuil" },
  { value: "normal",        label: "TVA 20%, Taux normal",                           description: "La plupart des prestations de services" },
  { value: "intermediaire", label: "TVA 10%, Taux intermédiaire",                    description: "Restauration, travaux de rénovation…" },
  { value: "reduit",        label: "TVA 5,5%, Taux réduit",                         description: "Alimentation, livres, énergie…" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    siret: "",
    address: "",
    tva_regime: "franchise" as TvaRegime,
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erreur"); setSaving(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Bienvenue sur Deviso 👋</h1>
        <p className="text-gray-400 mt-2">
          Renseigne tes informations professionnelles, elles apparaîtront automatiquement sur tous tes devis et factures.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 border border-red-500/20">{error}</div>
      )}

      <form onSubmit={handleSaveProfile} className="bg-ds-surface rounded-2xl border border-ds-border p-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Prénom &amp; Nom</label>
            <input
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Thomas Dupont"
              className="w-full bg-ds-bg border border-ds-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nom de l&apos;entreprise <span className="text-red-500">*</span></label>
            <input
              required
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="Dupont Consulting"
              className="w-full bg-ds-bg border border-ds-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">SIRET <span className="text-gray-600">(14 chiffres)</span></label>
            <input
              value={form.siret}
              onChange={(e) => set("siret", e.target.value)}
              placeholder="123 456 789 00012"
              className="w-full bg-ds-bg border border-ds-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Adresse professionnelle</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="12 rue de la Paix, 75001 Paris"
              className="w-full bg-ds-bg border border-ds-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">Régime TVA</label>
          <div className="space-y-2">
            {TVA_REGIMES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  form.tva_regime === r.value
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-ds-border hover:border-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="tva"
                  value={r.value}
                  checked={form.tva_regime === r.value}
                  onChange={() => set("tva_regime", r.value)}
                  className="mt-0.5 accent-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-white">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Enregistrement…" : "Accéder au dashboard →"}
        </button>
      </form>

      <p className="text-xs text-gray-600 text-center mt-4">
        Tu pourras modifier ces informations à tout moment dans tes paramètres.
      </p>
    </div>
  );
}
