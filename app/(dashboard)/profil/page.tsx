"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types";

export default function ProfilPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { if (d.profile) setProfile(d.profile); })
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erreur"); setSaving(false); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Chargement…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ces informations apparaîtront automatiquement sur tes devis et factures.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Identité</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom & Nom</label>
              <input
                value={profile.full_name || ""}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Selim Martin"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom de l'entreprise</label>
              <input
                value={profile.company_name || ""}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Safetone Studio"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email professionnel</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
              <input
                value={profile.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
              <input
                value={profile.address || ""}
                onChange={(e) => set("address", e.target.value)}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </section>

        {/* Informations légales */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Informations légales</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                SIRET <span className="text-slate-400">(14 chiffres)</span>
              </label>
              <input
                value={profile.siret || ""}
                onChange={(e) => set("siret", e.target.value)}
                placeholder="123 456 789 00012"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                N° TVA intracommunautaire
              </label>
              <input
                value={profile.tva_number || ""}
                onChange={(e) => set("tva_number", e.target.value)}
                placeholder="FR12345678901"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            En micro-entreprise, si tu n'as pas encore de numéro de TVA, laisse ce champ vide et ajoute la mention
            "TVA non applicable — art. 293 B du CGI" dans les notes de tes devis.
          </p>
        </section>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer le profil"}
        </button>
      </form>
    </div>
  );
}
