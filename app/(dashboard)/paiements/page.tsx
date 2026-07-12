"use client";

import { useEffect, useState } from "react";
import { Wallet, Link2, Building2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import type { Profile } from "@/types";

// ── Providers supportés ────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: "stripe",
    label: "Stripe",
    description: "Paiement par carte bancaire via votre propre compte Stripe",
    placeholder: "https://buy.stripe.com/xxxx",
    hint: "Créez un Payment Link dans votre dashboard Stripe → Produits → Payment Links",
    docsUrl: "https://stripe.com/docs/payment-links",
    color: "indigo",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Lien PayPal.me ou bouton de paiement PayPal",
    placeholder: "https://paypal.me/votre-nom/montant",
    hint: "Créez votre lien sur paypal.me ou utilisez un bouton de demande de paiement PayPal",
    docsUrl: "https://paypal.me",
    color: "blue",
  },
  {
    id: "wise",
    label: "Wise",
    description: "Demande de paiement Wise (frais très bas pour l'international)",
    placeholder: "https://wise.com/pay/r/xxxx",
    hint: "Dans Wise : Compte → Demander de l'argent → Créer un lien de paiement",
    docsUrl: "https://wise.com",
    color: "green",
  },
  {
    id: "sumeria",
    label: "Sumeria",
    description: "Anciennement Orange Bank, lien de demande de paiement Sumeria",
    placeholder: "https://sumeria.eu/pay/xxxx",
    hint: "Dans l'app Sumeria : Payer → Demander de l'argent → Créer un lien",
    docsUrl: "https://sumeria.eu",
    color: "orange",
  },
  {
    id: "lydia",
    label: "Lydia / Sumeria",
    description: "Lien de paiement Lydia (désormais intégré à Sumeria)",
    placeholder: "https://lydia-app.com/pay?to=xxxx",
    hint: "Dans l'app Lydia : Demander → Créer un lien de paiement",
    docsUrl: "https://lydia-app.com",
    color: "purple",
  },
  {
    id: "sumup",
    label: "SumUp",
    description: "Lien de paiement SumUp, idéal pour les petits commerçants",
    placeholder: "https://pay.sumup.com/b2c/xxxx",
    hint: "Dans SumUp : Créer un lien de paiement depuis votre compte",
    docsUrl: "https://sumup.fr",
    color: "teal",
  },
  {
    id: "helloasso",
    label: "HelloAsso",
    description: "Pour les associations, collecte de paiement sans frais",
    placeholder: "https://www.helloasso.com/associations/xxxx",
    hint: "Créez un formulaire de paiement sur HelloAsso",
    docsUrl: "https://www.helloasso.com",
    color: "pink",
  },
  {
    id: "other",
    label: "Autre lien",
    description: "N'importe quel autre service de paiement en ligne",
    placeholder: "https://...",
    hint: "Collez directement l'URL de votre page de paiement",
    docsUrl: null,
    color: "gray",
  },
];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false;
  return true;
}

function formatIBAN(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

export default function PaiementsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [method, setMethod] = useState<"none" | "link" | "bank" | "both">("none");
  const [provider, setProvider] = useState("stripe");
  const [linkUrl, setLinkUrl] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile as Profile;
          setProfile(p);
          setMethod(p.payment_method || "none");
          setProvider(p.payment_link_provider || "stripe");
          setLinkUrl(p.payment_link_profile || "");
          setIban(p.bank_iban ? formatIBAN(p.bank_iban) : "");
          setBic(p.bank_bic || "");
          setAccountName(p.bank_account_name || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const needsLink = method === "link" || method === "both";
  const needsBank = method === "bank" || method === "both";
  const selectedProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  const linkValid = !needsLink || isValidUrl(linkUrl);
  const ibanValid = !needsBank || isValidIBAN(iban);
  const bicValid = !needsBank || bic.trim().length >= 8;
  const canSave = linkValid && ibanValid && bicValid;

  async function handleSave() {
    setError("");
    if (!canSave) {
      if (!linkValid) setError("Le lien de paiement doit commencer par https://");
      else if (!ibanValid) setError("L'IBAN saisi n'est pas valide");
      else if (!bicValid) setError("Le BIC/SWIFT doit contenir au moins 8 caractères");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_method: method,
        payment_link_provider: needsLink ? provider : null,
        payment_link_profile: needsLink ? linkUrl.trim() : null,
        bank_iban: needsBank ? iban.replace(/\s/g, "").toUpperCase() : null,
        bank_bic: needsBank ? bic.trim().toUpperCase() : null,
        bank_account_name: needsBank ? accountName.trim() || null : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de la sauvegarde");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputCls = "w-full bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

  if (loading) return <div className="text-center py-16 text-gray-500">Chargement…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <GuidedTourBanner pageKey="paiements" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Wallet size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Paiements clients</h1>
            <p className="text-gray-500 text-sm mt-1">
              Comment vos clients vous paient, ces infos apparaîtront sur chaque facture envoyée.
            </p>
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6 flex gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-300 leading-relaxed">
          <strong>Important :</strong> les paiements de vos clients vous arrivent <strong>directement</strong>, Deviso n'intervient à aucun moment dans la transaction et ne perçoit aucune commission.
        </p>
      </div>

      {/* Méthode */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-white mb-4">Comment souhaitez-vous être payé ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: "none",  icon: "—",  label: "Aucun", desc: "Ne pas afficher d'info de paiement" },
            { value: "link",  icon: "🔗", label: "Lien en ligne", desc: "Stripe, PayPal, Wise, Sumeria…" },
            { value: "bank",  icon: "🏦", label: "Virement IBAN", desc: "Le client fait un virement bancaire" },
            { value: "both",  icon: "✦",  label: "Les deux", desc: "Lien en ligne + coordonnées bancaires" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMethod(opt.value as typeof method)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                method === opt.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-ds-border hover:border-zinc-600"
              }`}
            >
              <div className="text-xl mb-1">{opt.icon}</div>
              <div className="font-semibold text-white text-sm">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
              {method === opt.value && (
                <CheckCircle2 size={14} className="text-emerald-400 mt-2" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Lien de paiement */}
      {needsLink && (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-white">Lien de paiement en ligne</h2>
          </div>

          {/* Sélection provider */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-400 mb-2 block">Votre service de paiement</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                    provider === p.id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-ds-border text-gray-400 hover:border-zinc-600 hover:text-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description du provider */}
          <div className="bg-ds-elevated/50 border border-ds-border rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-300 font-medium mb-1">{selectedProvider.description}</p>
            <p className="text-xs text-gray-500">{selectedProvider.hint}</p>
            {selectedProvider.docsUrl && (
              <a
                href={selectedProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2"
              >
                Voir le site <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Champ URL */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">
              Votre lien de paiement *
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={selectedProvider.placeholder}
              className={`${inputCls} ${linkUrl && !linkValid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
            {linkUrl && !linkValid && (
              <p className="text-xs text-red-400 mt-1">Le lien doit commencer par https://</p>
            )}
            {linkUrl && linkValid && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Lien valide
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1.5">
              Ce lien génère un bouton "Payer en ligne" dans l'email de facture envoyée à votre client.
            </p>
          </div>
        </section>
      )}

      {/* Coordonnées bancaires */}
      {needsBank && (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-white">Coordonnées bancaires (virement)</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Titulaire du compte *
              </label>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={profile.company_name || profile.full_name || "Nom ou raison sociale"}
                className={inputCls}
              />
              <p className="text-xs text-gray-600 mt-1">Exactement comme sur votre relevé bancaire</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                IBAN *
              </label>
              <input
                value={iban}
                onChange={(e) => setIban(formatIBAN(e.target.value))}
                placeholder="FR76 3000 6000 0112 3456 7890 189"
                className={`${inputCls} font-mono tracking-wide ${iban && !ibanValid ? "border-red-500" : iban && ibanValid ? "border-emerald-500/50" : ""}`}
                maxLength={42}
              />
              {iban && !ibanValid && <p className="text-xs text-red-400 mt-1">IBAN invalide, vérifiez le format</p>}
              {iban && ibanValid && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> IBAN valide</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                BIC / SWIFT *
              </label>
              <input
                value={bic}
                onChange={(e) => setBic(e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="BNPAFRPP"
                className={`${inputCls} font-mono tracking-wide`}
                maxLength={11}
              />
              <p className="text-xs text-gray-600 mt-1">8 ou 11 caractères, visible sur votre RIB</p>
            </div>
          </div>

          {/* RIB reminder */}
          <div className="bg-ds-elevated/50 border border-ds-border rounded-lg px-4 py-3 mt-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              💡 <strong className="text-gray-300">Où trouver ces informations ?</strong> Sur votre RIB (Relevé d'Identité Bancaire) disponible dans votre application bancaire sous "Mes comptes" → "Voir le RIB".
            </p>
          </div>
        </section>
      )}

      {/* Prévisualisation */}
      {method !== "none" && (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-white mb-3 text-sm">Aperçu sur vos factures</h2>
          <div className="bg-ds-elevated/50 border border-ds-border rounded-lg p-4 text-xs text-gray-400 space-y-2">
            <p className="font-semibold text-gray-300 text-xs uppercase tracking-wide">Modalités de paiement</p>
            {needsBank && (
              <div className="space-y-0.5">
                <p>Virement bancaire</p>
                <p className="text-gray-300 font-mono">{iban || "FR76 XXXX XXXX XXXX XXXX XXXX XXX"}</p>
                <p>BIC : <span className="font-mono">{bic || "XXXXXXXX"}</span></p>
                {accountName && <p>Titulaire : {accountName}</p>}
              </div>
            )}
            {needsLink && (
              <div>
                <p>Paiement en ligne disponible via {selectedProvider.label}</p>
                {linkUrl && <p className="text-emerald-400 truncate">{linkUrl}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer les paramètres de paiement"}
      </button>

      {saved && (
        <p className="text-center text-xs text-emerald-400 mt-3">
          Ces informations apparaîtront désormais sur toutes vos nouvelles factures.
        </p>
      )}
    </div>
  );
}