"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { Profile, TvaRegime } from "@/types";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";

const TVA_REGIMES: { value: TvaRegime; label: string; rate: number; description: string }[] = [
  { value: "franchise",    label: "Franchise en base : TVA non applicable (art. 293 B CGI)", rate: 0,    description: "Micro-entrepreneur ou CA sous le seuil (36 800 €/an services)" },
  { value: "normal",       label: "TVA 20% : Taux normal",                                   rate: 20,   description: "La plupart des prestations de services et ventes" },
  { value: "intermediaire",label: "TVA 10% : Taux intermédiaire",                            rate: 10,   description: "Restauration, travaux de rénovation, transport de personnes" },
  { value: "reduit",       label: "TVA 5,5% : Taux réduit",                                  rate: 5.5,  description: "Alimentation, livres, abonnements énergie, équipements handicap" },
  { value: "super_reduit", label: "TVA 2,1% : Taux super réduit",                            rate: 2.1,  description: "Médicaments remboursés, presse, spectacles vivants" },
];

export default function ProfilPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Email domain state (Pro)
  type DnsRecord = { record: string; name: string; value: string; type: string; ttl: string; status: string; priority?: number };
  const [emailDomain, setEmailDomain] = useState<string | null>(null);
  const [emailDomainInput, setEmailDomainInput] = useState("");
  const [emailDomainVerified, setEmailDomainVerified] = useState(false);
  const [emailDomainStatus, setEmailDomainStatus] = useState<string>("");
  const [emailDomainRecords, setEmailDomainRecords] = useState<DnsRecord[]>([]);
  const [emailDomainLoading, setEmailDomainLoading] = useState(false);
  const [emailDomainSaving, setEmailDomainSaving] = useState(false);
  const [emailDomainVerifying, setEmailDomainVerifying] = useState(false);
  const [emailDomainMsg, setEmailDomainMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Subdomain state
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [savingSubdomain, setSavingSubdomain] = useState(false);
  const [subdomainSaved, setSubdomainSaved] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reminder config state (Pro)
  const [reminderIntervals, setReminderIntervals] = useState<number[]>([]);
  const [intervalInput, setIntervalInput] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [savingReminders, setSavingReminders] = useState(false);

  // Chorus Pro state
  const [chorusLogin, setChorusLogin] = useState("");
  const [chorusPassword, setChorusPassword] = useState("");
  const [chorusFournisseurId, setChorusFournisseurId] = useState("");
  const [chorusBankCode, setChorusBankCode] = useState("");
  const [chorusUserId, setChorusUserId] = useState("");
  const [savingChorus, setSavingChorus] = useState(false);
  const [chorusSaved, setChorusSaved] = useState(false);
  const [remindersSaved, setRemindersSaved] = useState(false);

  // CGV state
  const [cgvText, setCgvText] = useState("");
  const [savingCgv, setSavingCgv] = useState(false);
  const [cgvSaved, setCgvSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setIsOwner(d.is_owner ?? true);
        if (d.profile) {
          setProfile(d.profile);
          setSubdomainInput(d.profile.subdomain || "");
          setReminderIntervals(d.profile.reminder_intervals ?? [3, 7]);
          setReminderMessage(d.profile.reminder_message || "");
          if (d.profile.plan === "pro" && d.profile.email_domain) {
            setEmailDomain(d.profile.email_domain);
            setEmailDomainInput(d.profile.email_domain);
            setEmailDomainVerified(d.profile.email_domain_verified ?? false);
          }
          // CGV
          setCgvText(d.profile.cgv_text || "");
          // Chorus Pro
          if (d.profile.chorus_pro_login) setChorusLogin(d.profile.chorus_pro_login);
          if (d.profile.chorus_pro_password) setChorusPassword(d.profile.chorus_pro_password);
          if (d.profile.chorus_pro_fournisseur_id) setChorusFournisseurId(String(d.profile.chorus_pro_fournisseur_id));
          if (d.profile.chorus_pro_bank_code) setChorusBankCode(String(d.profile.chorus_pro_bank_code));
          if (d.profile.chorus_pro_user_id) setChorusUserId(String(d.profile.chorus_pro_user_id));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadEmailDomainRecords() {
    setEmailDomainLoading(true);
    const res = await fetch("/api/profile/email-domain").then((r) => r.json());
    setEmailDomainRecords(res.records ?? []);
    setEmailDomainVerified(res.verified ?? false);
    setEmailDomainStatus(res.status ?? "");
    setEmailDomainLoading(false);
  }

  async function handleSaveEmailDomain() {
    setEmailDomainSaving(true);
    setEmailDomainMsg(null);
    const res = await fetch("/api/profile/email-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: emailDomainInput.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEmailDomainMsg({ type: "err", text: data.error || "Erreur." });
    } else {
      setEmailDomain(data.domain);
      setEmailDomainRecords(data.records ?? []);
      setEmailDomainVerified(data.verified ?? false);
      setEmailDomainStatus(data.status ?? "");
      setEmailDomainMsg({ type: "ok", text: "Domaine enregistré. Ajoutez les enregistrements DNS ci-dessous." });
    }
    setEmailDomainSaving(false);
  }

  async function handleVerifyEmailDomain() {
    setEmailDomainVerifying(true);
    setEmailDomainMsg(null);
    const res = await fetch("/api/profile/email-domain?action=verify", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setEmailDomainMsg({ type: "err", text: data.error || "Vérification échouée." });
    } else {
      setEmailDomainVerified(data.verified ?? false);
      setEmailDomainStatus(data.status ?? "");
      setEmailDomainRecords(data.records ?? []);
      setEmailDomainMsg({
        type: data.verified ? "ok" : "err",
        text: data.verified ? "✓ Domaine vérifié ! Vos emails partiront depuis votre domaine." : "DNS pas encore propagés. Attendez quelques minutes puis réessayez.",
      });
    }
    setEmailDomainVerifying(false);
  }

  async function handleDeleteEmailDomain() {
    if (!confirm("Supprimer ce domaine ? Vos emails repartiront depuis noreply@getdeviso.fr.")) return;
    await fetch("/api/profile/email-domain", { method: "DELETE" });
    setEmailDomain(null);
    setEmailDomainInput("");
    setEmailDomainVerified(false);
    setEmailDomainRecords([]);
    setEmailDomainStatus("");
    setEmailDomainMsg(null);
  }

  function set(field: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    // N'envoyer QUE les champs du formulaire principal — pas reminder_intervals, subdomain, chorus_pro_*
    // qui déclenchent des checks de plan dans le backend et bloquent la sauvegarde pour les non-Pro
    const mainFields = {
      full_name: profile.full_name ?? null,
      company_name: profile.company_name ?? null,
      siret: profile.siret ?? null,
      address: profile.address ?? null,
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      tva_number: profile.tva_number ?? null,
      tva_regime: profile.tva_regime ?? null,
      proposal_template: profile.proposal_template ?? null,
      proposal_color: profile.proposal_color ?? null,
      require_approval: profile.require_approval ?? null,
    };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mainFields),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erreur"); setSaving(false); return; }
    setProfile((p) => ({ ...p, ...data.profile }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/logo", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setProfile((p) => ({ ...p, logo_url: data.logo_url }));
    else alert(data.error || "Erreur upload");
    setUploadingLogo(false);
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error || "Erreur"); setPortalLoading(false); }
  }

  async function handleUpgrade(plan: "solo" | "pro") {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleLogoDelete() {
    await fetch("/api/profile/logo", { method: "DELETE" });
    setProfile((p) => ({ ...p, logo_url: null }));
  }

  // ── Subdomain ──────────────────────────────────────────────────────────────
  const checkSubdomain = useCallback(async (slug: string) => {
    const clean = slug.trim().toLowerCase();
    if (!clean) { setSubdomainStatus("idle"); return; }
    if (clean === profile.subdomain) { setSubdomainStatus("idle"); return; }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(clean)) { setSubdomainStatus("invalid"); return; }
    setSubdomainStatus("checking");
    const res = await fetch(`/api/profile/subdomain-check?slug=${encodeURIComponent(clean)}`);
    const data = await res.json();
    setSubdomainStatus(data.available ? "available" : "taken");
  }, [profile.subdomain]);

  function handleSubdomainChange(val: string) {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomainInput(clean);
    setSubdomainStatus("idle");
    setSubdomainSaved(false);
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    if (clean.length >= 3) checkTimerRef.current = setTimeout(() => checkSubdomain(clean), 600);
  }

  async function handleSaveSubdomain() {
    setSavingSubdomain(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain: subdomainInput.trim().toLowerCase() || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile((p) => ({ ...p, subdomain: data.profile.subdomain }));
      setSubdomainStatus("idle");
      setSubdomainSaved(true);
      setTimeout(() => setSubdomainSaved(false), 4000);
    } else {
      setSubdomainStatus("taken");
    }
    setSavingSubdomain(false);
  }

  // ── Reminders ──────────────────────────────────────────────────────────────
  function addInterval() {
    const val = parseInt(intervalInput.trim(), 10);
    if (isNaN(val) || val < 1 || val > 365) return;
    if (reminderIntervals.includes(val)) { setIntervalInput(""); return; }
    if (reminderIntervals.length >= 10) return;
    setReminderIntervals((prev) => [...prev, val].sort((a, b) => a - b));
    setIntervalInput("");
  }

  function removeInterval(day: number) {
    setReminderIntervals((prev) => prev.filter((d) => d !== day));
  }

  async function handleSaveReminders() {
    setSavingReminders(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminder_intervals: reminderIntervals,
        reminder_message: reminderMessage || null,
      }),
    });
    if (res.ok) {
      setRemindersSaved(true);
      setTimeout(() => setRemindersSaved(false), 3000);
    }
    setSavingReminders(false);
  }

  async function handleSaveCgv() {
    setSavingCgv(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cgv_text: cgvText || null }),
    });
    if (res.ok) {
      setCgvSaved(true);
      setTimeout(() => setCgvSaved(false), 3000);
    }
    setSavingCgv(false);
  }

  const DEFAULT_CGV = `ARTICLE 1, PÉRIMÈTRE
Les prestations sont définies dans le devis accepté. Toute demande de modification hors périmètre fera l'objet d'un avenant chiffré et accepté avant exécution.

ARTICLE 2, ACOMPTE ET PAIEMENT
Un acompte de 30 % est exigible à la commande. Le solde est dû à réception de la facture. En cas de retard, des pénalités de 3× le taux légal sont dues de plein droit, ainsi qu'une indemnité forfaitaire de 40 € (art. L441-6 C.Com.).

ARTICLE 3, PROPRIÉTÉ INTELLECTUELLE
Les droits de propriété intellectuelle sur les livrables sont cédés au client à compter du paiement intégral de la prestation. En cas de non-paiement, le prestataire conserve l'intégralité des droits.

ARTICLE 4, RÉVISIONS
Le nombre de révisions incluses est précisé dans le devis. Toute modification supplémentaire sera facturée au tarif horaire en vigueur.

ARTICLE 5, RESPONSABILITÉ
Le prestataire est tenu à une obligation de moyens. Sa responsabilité ne peut excéder le montant total de la prestation facturée.

ARTICLE 6, CONFIDENTIALITÉ
Chaque partie s'engage à garder confidentielles les informations échangées dans le cadre de cette mission pendant la durée de la mission et 2 ans après sa conclusion.

ARTICLE 7, RÉSILIATION
En cas d'annulation après acceptation du devis, les prestations déjà réalisées restent dues intégralement, et un dédit de 30 % du montant restant sera facturé.

ARTICLE 8, DROIT APPLICABLE
Les présentes CGV sont soumises au droit français. Tout litige relève de la compétence exclusive des tribunaux du ressort du siège du prestataire.`;

  async function handleSaveChorus() {
    setSavingChorus(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chorus_pro_login: chorusLogin || null,
        chorus_pro_password: chorusPassword || null,
        chorus_pro_fournisseur_id: chorusFournisseurId ? parseInt(chorusFournisseurId) : null,
        chorus_pro_bank_code: chorusBankCode ? parseInt(chorusBankCode) : null,
        chorus_pro_user_id: chorusUserId ? parseInt(chorusUserId) : null,
      }),
    });
    if (res.ok) {
      setChorusSaved(true);
      setTimeout(() => setChorusSaved(false), 3000);
    }
    setSavingChorus(false);
  }

  const selectedRegime = TVA_REGIMES.find((r) => r.value === profile.tva_regime) ?? TVA_REGIMES[0];
  const inputCls = "w-full bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30";
  const subdomainChanged = subdomainInput.trim().toLowerCase() !== (profile.subdomain || "");
  const canSaveSubdomain = subdomainChanged && (subdomainStatus === "available" || subdomainInput.trim() === "");

  if (loading) return <div className="text-center py-16 text-gray-500">Chargement…</div>;

  // ── Vue simplifiée pour les membres invités ─────────────────────────────
  if (isOwner === false) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Mon profil</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ces informations apparaissent sur les devis et factures que tu crées.
          </p>
        </div>

        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Informations personnelles</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom et nom</label>
            <input
              className={inputCls}
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Thomas Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email professionnel</label>
            <input
              className={inputCls}
              type="email"
              value={profile.email || ""}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="thomas@exemple.fr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
            <input
              className={inputCls}
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+33 6 00 00 00 00"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={async () => {
              setSaving(true);
              setError("");
              const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: profile.full_name, email: profile.email, phone: profile.phone }),
              });
              if (!res.ok) setError("Erreur lors de la sauvegarde.");
              else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
              setSaving(false);
            }}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-60 transition-colors"
          >
            {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
          </button>
        </section>

        <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
          <p className="text-sm text-gray-500">
            Les paramètres de l&apos;entreprise (SIRET, IBAN, abonnement, etc.) sont gérés par le propriétaire du compte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <GuidedTourBanner pageKey="profil" />
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Ces informations apparaîtront automatiquement sur tes devis et factures.</p>
      </div>

      {/* Abonnement */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-white">Abonnement</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profile.plan === "pro" ? "bg-indigo-500/20 text-indigo-300" :
                profile.plan === "solo" ? "bg-indigo-500/20 text-indigo-300" :
                "bg-ds-elevated text-gray-400"
              }`}>
                {profile.plan === "pro" ? "⭐ Pro" : profile.plan === "solo" ? "🚀 Solo" : "🆓 Gratuit"}
              </span>
              {profile.subscription_status === "active" && <span className="text-xs text-emerald-400 font-medium">· Actif</span>}
              {profile.subscription_status && profile.subscription_status !== "active" && (
                <span className="text-xs text-gray-500">· {profile.subscription_status}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {profile.plan === "free" ? (
              <>
                <button type="button" onClick={() => handleUpgrade("solo")}
                  className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium transition-colors">
                  Passer Solo à 18€/mois
                </button>
                <button type="button" onClick={() => handleUpgrade("pro")}
                  className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 font-medium transition-colors">
                  Passer Pro à 34€/mois
                </button>
              </>
            ) : (
              <button type="button" onClick={handlePortal} disabled={portalLoading}
                className="text-sm px-3 py-1.5 border border-ds-border rounded-lg hover:bg-ds-elevated font-medium text-gray-300 disabled:opacity-50 transition-colors">
                {portalLoading ? "Redirection…" : "Gérer mon abonnement →"}
              </button>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Logo</h2>
          {profile.plan === "free" ? (
            <UpgradeBanner variant="logo_blocked" />
          ) : (
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl border border-ds-border bg-ds-elevated flex items-center justify-center overflow-hidden shrink-0">
                {profile.logo_url
                  ? <Image src={profile.logo_url} alt="Logo" width={80} height={80} className="object-contain w-full h-full" unoptimized />
                  : <span className="text-2xl text-gray-600">🏢</span>}
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">PNG, JPG, WebP ou SVG · max 2 Mo<br />Apparaîtra sur tes devis et factures.</p>
                <div className="flex gap-2">
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-ds-border hover:bg-ds-elevated text-gray-300 disabled:opacity-50 transition-colors">
                    {uploadingLogo ? "Upload…" : profile.logo_url ? "Changer" : "Importer"}
                  </button>
                  {profile.logo_url && (
                    <button type="button" onClick={handleLogoDelete}
                      className="text-sm font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 transition-colors">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Identité */}
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">Identité</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Prénom & Nom</label>
              <input value={profile.full_name || ""} onChange={(e) => set("full_name", e.target.value)} placeholder="Selim Martin" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nom de l&apos;entreprise</label>
              <input value={profile.company_name || ""} onChange={(e) => set("company_name", e.target.value)} placeholder="Safetone Studio" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email professionnel</label>
              <input type="email" value={profile.email || ""} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label>
              <input value={profile.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+33 6 00 00 00 00" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Adresse</label>
              <input value={profile.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" className={inputCls} />
            </div>
          </div>
        </section>

        {/* TVA */}
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">Régime TVA</h2>
          <p className="text-xs text-gray-500">Ce réglage pré-remplit automatiquement le taux TVA sur tous tes nouveaux devis et factures.</p>
          <div className="space-y-2">
            {TVA_REGIMES.map((regime) => (
              <label key={regime.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  profile.tva_regime === regime.value || (!profile.tva_regime && regime.value === "franchise")
                    ? "border-indigo-500 bg-indigo-500/10" : "border-ds-border hover:border-zinc-600"
                }`}>
                <input type="radio" name="tva_regime" value={regime.value}
                  checked={profile.tva_regime === regime.value || (!profile.tva_regime && regime.value === "franchise")}
                  onChange={() => set("tva_regime", regime.value)} className="mt-0.5 accent-indigo-600" />
                <div>
                  <div className="text-sm font-medium text-white">{regime.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{regime.description}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="bg-ds-elevated/50 rounded-lg p-3 border border-ds-border">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mention affichée sur tes documents</div>
            {selectedRegime.value === "franchise"
              ? <p className="text-xs text-gray-400 italic">TVA non applicable, art. 293 B du CGI</p>
              : <p className="text-xs text-gray-400 italic">TVA {selectedRegime.rate}% applicable · Taux en vigueur à la date d&apos;émission</p>}
          </div>
        </section>

        {/* Légal */}
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">Informations légales</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">SIRET <span className="text-gray-500">(14 chiffres)</span></label>
              <input value={profile.siret || ""} onChange={(e) => set("siret", e.target.value)} placeholder="123 456 789 00012" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">N° TVA intracommunautaire <span className="text-gray-500">(si assujetti)</span></label>
              <input value={profile.tva_number || ""} onChange={(e) => set("tva_number", e.target.value)} placeholder="FR12345678901"
                disabled={selectedRegime.value === "franchise"} className={`${inputCls} disabled:opacity-50`} />
              {selectedRegime.value === "franchise" && <p className="text-xs text-gray-500 mt-1">Non applicable en franchise de TVA</p>}
            </div>
          </div>
        </section>

        {/* Apparence (Pro) */}
        {profile.plan === "pro" ? (
          <section className="bg-ds-surface border border-ds-border rounded-xl p-5 space-y-5">
            <div>
              <h2 className="font-semibold text-white">Apparence des documents</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choisissez le style de vos devis et factures envoyés aux clients.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Mise en page</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "classic", label: "Classique" },
                  { value: "modern",  label: "Moderne" },
                  { value: "epure",   label: "Épuré" },
                ].map((t) => {
                  const selected = (profile.proposal_template || "classic") === t.value;
                  const color = profile.proposal_color || "#4f46e5";
                  return (
                    <button key={t.value} type="button"
                      onClick={() => set("proposal_template" as keyof Profile, t.value)}
                      className={`relative rounded-xl border-2 p-3 transition-all text-left ${selected ? "border-indigo-500 bg-indigo-500/10" : "border-ds-border hover:border-zinc-600"}`}>
                      <div className="bg-ds-elevated rounded border border-ds-border p-2 mb-2 h-16 overflow-hidden">
                        {t.value === "classic" && <div><div className="text-xs font-semibold mb-1" style={{ color }}>DEVIS</div><div className="h-1 w-10 rounded mb-1 bg-zinc-600" /><div className="h-1 w-7 rounded bg-gray-700" /><div className="mt-2 h-1.5 rounded" style={{ backgroundColor: color, opacity: 0.3 }} /></div>}
                        {t.value === "modern" && <div><div className="rounded mb-2 px-2 py-1" style={{ backgroundColor: color }}><div className="h-1 w-8 rounded bg-white opacity-80" /></div><div className="h-1 w-10 rounded mb-1 bg-zinc-600" /><div className="h-1 w-7 rounded bg-gray-700" /></div>}
                        {t.value === "epure" && <div className="flex gap-2"><div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: color }} /><div><div className="text-xs font-semibold tracking-widest text-gray-400 mb-1" style={{ fontSize: 7 }}>DEVIS</div><div className="h-1 w-8 rounded mb-1 bg-zinc-600" /><div className="h-1 w-6 rounded bg-gray-700" /></div></div>}
                      </div>
                      <div className="text-xs font-semibold text-gray-300">{t.label}</div>
                      {selected && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Couleur d&apos;accent</label>
              <div className="flex items-center gap-2 flex-wrap">
                {["#4f46e5", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0f172a"].map((c) => (
                  <button key={c} type="button" onClick={() => set("proposal_color" as keyof Profile, c)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: (profile.proposal_color || "#4f46e5") === c ? "#a5b4fc" : "transparent", transform: (profile.proposal_color || "#4f46e5") === c ? "scale(1.15)" : "scale(1)" }} />
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <input type="color" value={profile.proposal_color || "#4f46e5"}
                    onChange={(e) => set("proposal_color" as keyof Profile, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-ds-border" />
                  <span className="text-xs text-gray-500">Personnalisée</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-ds-elevated/50 border border-ds-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-300">Apparence des documents</h2>
                <p className="text-xs text-gray-500 mt-0.5">Templates personnalisés, couleur d&apos;accent : réservé au plan Pro.</p>
              </div>
              <span className="shrink-0 text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">Pro</span>
            </div>
          </section>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer le profil"}
        </button>
      </form>

      {/* ── Sous-domaine (Pro) ── */}
      {profile.plan === "pro" ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6 space-y-4">
          <div>
            <h2 className="font-semibold text-white">Sous-domaine personnalisé</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vos devis seront accessibles via <span className="text-indigo-400 font-mono">votre-nom.getdeviso.fr</span>.</p>
          </div>
          {profile.subdomain && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-sm text-emerald-300 font-mono">{profile.subdomain}.getdeviso.fr</span>
              <span className="text-xs text-emerald-500 ml-1">· Actif</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Choisir un sous-domaine</label>
            <div className="flex items-center">
              <div className="relative flex-1">
                <input type="text" value={subdomainInput} onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="mon-agence" maxLength={30}
                  className={`w-full bg-ds-bg border rounded-l-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors ${
                    subdomainStatus === "available" ? "border-emerald-500 focus:ring-emerald-500/30" :
                    subdomainStatus === "taken" || subdomainStatus === "invalid" ? "border-red-500 focus:ring-red-500/30" :
                    "border-ds-border focus:border-indigo-500 focus:ring-indigo-500/30"
                  }`} />
                {subdomainStatus === "checking" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="bg-ds-elevated border border-l-0 border-ds-border rounded-r-lg px-3 py-2.5 text-sm text-gray-400 whitespace-nowrap">.getdeviso.fr</div>
            </div>
            {subdomainStatus === "available" && <p className="text-xs text-emerald-400 mt-1.5">✓ Disponible !</p>}
            {subdomainStatus === "taken" && <p className="text-xs text-red-400 mt-1.5">✗ Ce sous-domaine est déjà pris.</p>}
            {subdomainStatus === "invalid" && <p className="text-xs text-red-400 mt-1.5">Format invalide : 3 à 30 caractères, lettres, chiffres et tirets.</p>}
            {subdomainSaved && <p className="text-xs text-emerald-400 mt-1.5">✓ Sous-domaine enregistré !</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleSaveSubdomain} disabled={savingSubdomain || !canSaveSubdomain}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {savingSubdomain ? "Enregistrement…" : "Enregistrer"}
            </button>
            {profile.subdomain && (
              <button type="button" onClick={() => { setSubdomainInput(""); setSubdomainStatus("idle"); handleSaveSubdomain(); }}
                className="px-4 py-2 border border-ds-border text-gray-400 text-sm rounded-lg hover:bg-ds-elevated transition-colors">
                Supprimer
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 border-t border-ds-border pt-3">
            Le lien de partage de vos devis utilisera automatiquement ce sous-domaine.
          </p>
        </section>
      ) : (
        <section className="bg-ds-elevated/50 border border-ds-border rounded-xl p-5 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-300">Sous-domaine personnalisé</h2>
              <p className="text-xs text-gray-500 mt-0.5">Partagez vos devis via <span className="font-mono">votre-nom.getdeviso.fr</span> : réservé au plan Pro.</p>
            </div>
            <span className="shrink-0 text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">Pro</span>
          </div>
        </section>
      )}

      {/* ── Domaine email personnalisé (Pro) ── */}
      {profile.plan === "pro" ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6 space-y-4">
          <div>
            <h2 className="font-semibold text-white">Domaine d&apos;envoi personnalisé</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Vos emails partiront depuis <span className="text-indigo-400 font-mono">devis@votredomaine.fr</span> et <span className="text-indigo-400 font-mono">facturation@votredomaine.fr</span> au lieu de noreply@getdeviso.fr.
            </p>
          </div>

          {emailDomainVerified && emailDomain && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-sm text-emerald-300 font-mono">{emailDomain}</span>
              <span className="text-xs text-emerald-500 ml-1">· Actif</span>
              <div className="ml-auto flex gap-1.5 text-xs text-gray-500 font-mono">
                <span>devis@{emailDomain}</span>
                <span>·</span>
                <span>facturation@{emailDomain}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Votre domaine</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={emailDomainInput}
                onChange={(e) => setEmailDomainInput(e.target.value.trim().toLowerCase())}
                placeholder="monentreprise.fr"
                className="flex-1 bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveEmailDomain}
                disabled={emailDomainSaving || !emailDomainInput}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                {emailDomainSaving ? "Enregistrement…" : emailDomain ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </div>

          {emailDomainMsg && (
            <p className={`text-xs ${emailDomainMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {emailDomainMsg.text}
            </p>
          )}

          {/* Enregistrements DNS */}
          {emailDomain && emailDomainRecords.length === 0 && !emailDomainLoading && (
            <button
              type="button"
              onClick={loadEmailDomainRecords}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Afficher les enregistrements DNS à ajouter
            </button>
          )}

          {emailDomainLoading && <p className="text-xs text-gray-500">Chargement…</p>}

          {emailDomainRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enregistrements DNS à ajouter</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emailDomainVerified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {emailDomainVerified ? "✓ Vérifié" : emailDomainStatus === "pending" ? "En attente" : "Non vérifié"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Ajoutez ces enregistrements dans votre gestionnaire DNS (OVH, Cloudflare, Namecheap…). La propagation peut prendre jusqu&apos;à 48h.
              </p>
              <div className="space-y-2">
                {emailDomainRecords.map((rec, i) => (
                  <div key={i} className="bg-ds-bg border border-ds-border rounded-lg p-3 text-xs font-mono space-y-1">
                    <div className="flex gap-3 flex-wrap">
                      <span className="text-indigo-400 font-semibold w-12 shrink-0">{rec.record}</span>
                      <span className="text-gray-300 break-all">{rec.name}</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <span className="text-gray-500 w-12 shrink-0">Valeur</span>
                      <span className="text-gray-300 break-all">{rec.value}</span>
                    </div>
                    {rec.priority !== undefined && (
                      <div className="flex gap-3">
                        <span className="text-gray-500 w-12 shrink-0">Priorité</span>
                        <span className="text-gray-300">{rec.priority}</span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <span className="text-gray-500 w-12 shrink-0">TTL</span>
                      <span className="text-gray-400">{rec.ttl}</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${rec.status === "verified" ? "bg-emerald-500/10 text-emerald-400" : "bg-ds-elevated text-gray-500"}`}>
                        {rec.status === "verified" ? "✓" : "En attente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {!emailDomainVerified && (
                <button
                  type="button"
                  onClick={handleVerifyEmailDomain}
                  disabled={emailDomainVerifying}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {emailDomainVerifying ? "Vérification…" : "Vérifier maintenant"}
                </button>
              )}
            </div>
          )}

          {emailDomain && (
            <button
              type="button"
              onClick={handleDeleteEmailDomain}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Supprimer ce domaine
            </button>
          )}
        </section>
      ) : (
        <section className="bg-ds-elevated/50 border border-ds-border rounded-xl p-5 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-300">Domaine d&apos;envoi personnalisé</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Envoyez vos devis et factures depuis <span className="font-mono">devis@votredomaine.fr</span> : réservé au plan Pro.
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">Pro</span>
          </div>
        </section>
      )}

      {/* ── Relances programmables (Pro) ── */}
      {profile.plan === "pro" ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">Relances automatiques</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Définissez vos propres délais de relance (en jours après envoi) et un message personnalisé inclus dans chaque email.
            </p>
          </div>

          {/* Intervalles */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Délais de relance <span className="text-gray-600">(jours après envoi)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {reminderIntervals.map((day) => (
                <span key={day} className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-medium px-3 py-1 rounded-full">
                  J+{day}
                  <button type="button" onClick={() => removeInterval(day)}
                    className="text-indigo-400 hover:text-red-400 transition-colors leading-none ml-0.5">
                    ×
                  </button>
                </span>
              ))}
              {reminderIntervals.length === 0 && (
                <span className="text-xs text-gray-500 italic">Aucun délai configuré : relances désactivées</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterval())}
                placeholder="ex: 5"
                className="w-28 bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
              <button type="button" onClick={addInterval}
                disabled={!intervalInput || reminderIntervals.length >= 10}
                className="px-3 py-2 bg-ds-elevated border border-ds-border text-gray-300 text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors">
                + Ajouter J+{intervalInput || "…"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1.5">Maximum 10 délais · Entre 1 et 365 jours</p>
          </div>

          {/* Message personnalisé */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Message personnalisé <span className="text-gray-600">(optionnel)</span>
            </label>
            <textarea
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Bonjour, je me permets de vous relancer concernant ce devis. N'hésitez pas à me contacter si vous avez des questions."
              className="w-full bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-600">Affiché en encadré vert dans l&apos;email de relance</p>
              <p className="text-xs text-gray-600">{reminderMessage.length}/500</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={handleSaveReminders} disabled={savingReminders}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors">
              {savingReminders ? "Enregistrement…" : "Enregistrer"}
            </button>
            {remindersSaved && <span className="text-xs text-emerald-400">✓ Relances enregistrées !</span>}
          </div>

          <div className="bg-ds-elevated/50 border border-ds-border rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-400">Exemple :</strong> avec J+2, J+7, J+30 : le client reçoit une relance 2 jours, 7 jours, puis 30 jours après l&apos;envoi du devis.
              Les relances s&apos;arrêtent automatiquement dès que le devis est signé ou refusé.
            </p>
          </div>
        </section>
      ) : (
        <section className="bg-ds-elevated/50 border border-ds-border rounded-xl p-5 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-300">Relances automatiques personnalisées</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Choisissez vos délais (J+2, J+10…) et un message sur-mesure : réservé au plan Pro.
                {profile.plan === "solo" && <span className="ml-1 text-gray-600">· Solo : relances fixes à J+3 et J+7.</span>}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">Pro</span>
          </div>
        </section>
      )}

      {/* ── Chorus Pro (B2G, Réforme 2026) ── */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold text-white">Chorus Pro</h2>
            <span className="text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">Réforme 2026 · B2G</span>
          </div>
          <p className="text-xs text-gray-500">
            Pour déposer vos factures auprès du service public (collectivités, ministères, hôpitaux) en un clic.
            Laissez vide si vous ne facturez pas le secteur public.
          </p>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            <strong>Prérequis :</strong> créez un compte technique sur{" "}
            <a href="https://chorus-pro.gouv.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">
              chorus-pro.gouv.fr
            </a>{" "}
            → Mon compte → Gérer mes comptes techniques. L&apos;identifiant a le format{" "}
            <code className="bg-blue-500/10 px-1 rounded">TECH_1_xxxxx@cpro.fr</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Identifiant compte technique
            </label>
            <input
              type="text"
              value={chorusLogin}
              onChange={(e) => setChorusLogin(e.target.value)}
              placeholder="TECH_1_xxxxx@cpro.fr"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Mot de passe compte technique
            </label>
            <input
              type="password"
              value={chorusPassword}
              onChange={(e) => setChorusPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              ID structure (idFournisseur)
            </label>
            <input
              type="number"
              value={chorusFournisseurId}
              onChange={(e) => setChorusFournisseurId(e.target.value)}
              placeholder="ex: 26262962"
              className={inputCls}
            />
            <p className="text-xs text-gray-600 mt-1">Chorus Pro → Mes structures → colonne ID</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Code coordonnées bancaires
            </label>
            <input
              type="number"
              value={chorusBankCode}
              onChange={(e) => setChorusBankCode(e.target.value)}
              placeholder="ex: 144050"
              className={inputCls}
            />
            <p className="text-xs text-gray-600 mt-1">Chorus Pro → Mes structures → Coordonnées bancaires</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              ID utilisateur courant <span className="text-gray-600">(optionnel)</span>
            </label>
            <input
              type="number"
              value={chorusUserId}
              onChange={(e) => setChorusUserId(e.target.value)}
              placeholder="ex: 65336344681929"
              className={inputCls}
            />
            <p className="text-xs text-gray-600 mt-1">Chorus Pro → Mon compte → Informations personnelles</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="button" onClick={handleSaveChorus} disabled={savingChorus}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {savingChorus ? "Enregistrement…" : "Enregistrer"}
          </button>
          {chorusSaved && <span className="text-xs text-emerald-400">✓ Connexion Chorus Pro enregistrée !</span>}
        </div>
      </section>

      {/* ── CGV ── */}
      <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mb-6 mt-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-semibold text-white">Conditions Générales de Vente</h2>
            <p className="text-xs text-gray-500 mt-1">
              Rédigées une fois, annexées automatiquement à chaque devis PDF. Le client voit la mention &quot;Acceptation de ce devis vaut acceptation des CGV ci-jointes&quot;.
            </p>
          </div>
          {!cgvText && (
            <button
              type="button"
              onClick={() => setCgvText(DEFAULT_CGV)}
              className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-4 flex-shrink-0"
            >
              Utiliser le modèle
            </button>
          )}
        </div>
        <textarea
          value={cgvText}
          onChange={(e) => setCgvText(e.target.value)}
          rows={14}
          placeholder="Rédigez vos conditions générales de vente ici, ou cliquez sur « Utiliser le modèle » pour partir d'une base complète…"
          className="w-full bg-ds-bg border border-ds-border text-white placeholder:text-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-y mt-3 font-mono leading-relaxed"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={handleSaveCgv}
            disabled={savingCgv}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {savingCgv ? "Enregistrement…" : "Enregistrer"}
          </button>
          {cgvText && (
            <button
              type="button"
              onClick={() => setCgvText("")}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Supprimer les CGV
            </button>
          )}
          {cgvSaved && <span className="text-xs text-emerald-400">✓ CGV enregistrées !</span>}
        </div>
      </section>
    </div>
  );
}
