"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { Users, CircleCheck, Euro, type LucideIcon } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { KpiCard } from "@/components/ui/KpiCard";
import { BarreRecherche } from "@/components/ui/BarreRecherche";
import { ClientCarte, type ClientData, type CRMProposal, type CRMInvoice } from "@/components/crm/ClientCarte";

function clientKey(name: string | null, email: string | null): string {
  return email?.toLowerCase().trim() || name?.toLowerCase().trim() || "inconnu";
}

function fmt(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export default function CRMPage() {
  const [proposals, setProposals] = useState<CRMProposal[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [contactsMap, setContactsMap] = useState<Record<string, { phone: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(true);
  const [search, setSearch] = useState("");

  // Cache SWR : retour instantane au revisit, revalidation en fond.
  const { data: crmData } = useSWR("/api/crm", fetcher);
  useEffect(() => {
    if (crmData === undefined) return;
    if (crmData === null) { setIsPro(false); setLoading(false); return; }
    setProposals(crmData.proposals ?? []);
    setInvoices(crmData.invoices ?? []);
    setContactsMap(crmData.contacts ?? {});
    setLoading(false);
  }, [crmData]);

  function handlePhoneSaved(email: string, phone: string) {
    setContactsMap((prev) => ({ ...prev, [email.toLowerCase()]: { phone: phone || null } }));
  }

  const clients = useMemo<ClientData[]>(() => {
    const map = new Map<string, ClientData>();

    for (const p of proposals) {
      const key = clientKey(p.client_name, p.client_email);
      if (!map.has(key)) {
        const emailKey = p.client_email?.toLowerCase().trim() ?? "";
        map.set(key, {
          key,
          name: p.client_name || p.client_email || "Inconnu",
          email: p.client_email,
          company: p.client_company,
          phone: contactsMap[emailKey]?.phone ?? null,
          proposals: [], invoices: [],
          nb_proposals: 0, nb_signed: 0, nb_invoices: 0,
          ca_total: 0, ca_pending: 0,
          last_activity: p.created_at,
        });
      }
      const c = map.get(key)!;
      c.proposals.push(p);
      c.nb_proposals++;
      if (p.status === "signed") c.nb_signed++;
      if (p.created_at > c.last_activity) c.last_activity = p.created_at;
    }

    for (const inv of invoices) {
      const key = clientKey(inv.client_name, inv.client_email);
      if (!map.has(key)) {
        const emailKey = inv.client_email?.toLowerCase().trim() ?? "";
        map.set(key, {
          key,
          name: inv.client_name || inv.client_email || "Inconnu",
          email: inv.client_email,
          company: inv.client_company,
          phone: contactsMap[emailKey]?.phone ?? null,
          proposals: [], invoices: [],
          nb_proposals: 0, nb_signed: 0, nb_invoices: 0,
          ca_total: 0, ca_pending: 0,
          last_activity: inv.created_at,
        });
      }
      const c = map.get(key)!;
      c.invoices.push(inv);
      c.nb_invoices++;
      // CA hors taxes, avoirs retranchés, même règle que l'écran Activité et
      // que les statistiques d'équipe.
      const signe = inv.invoice_type === "avoir" ? -1 : 1;
      const ht = signe * (inv.total_ht ?? inv.total_ttc ?? 0);
      if (inv.status === "paid") c.ca_total += ht;
      if (inv.status === "sent") c.ca_pending += signe * (inv.total_ttc ?? 0);
      if (inv.created_at > c.last_activity) c.last_activity = inv.created_at;
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );
  }, [proposals, invoices, contactsMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (!isPro) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center space-y-4">
        <Users size={36} className="mx-auto text-gray-600" />
        <h1 className="titre-page">Clients & Revenus</h1>
        <p className="sous-titre-page">
          L&apos;historique complet par client est réservé aux plans payants.
        </p>
        <UpgradeButton plan="solo" label="Passer Solo" />
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Chargement…</div>;
  }

  const totalCA = clients.reduce((s, c) => s + c.ca_total, 0);
  const totalClients = clients.length;
  const totalSigned = clients.reduce((s, c) => s + c.nb_signed, 0);

  return (
    <div className="space-y-8 w-full">
      <GuidedTourBanner pageKey="crm" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="titre-page">Clients & Revenus</h1>
          <p className="sous-titre-page">Vue d&apos;ensemble et historique par client</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Clients", value: totalClients, icon: Users as LucideIcon, large: false },
          { label: "Devis signés", value: totalSigned, icon: CircleCheck as LucideIcon, large: false },
          { label: "CA encaissé HT", value: fmt(totalCA), icon: Euro as LucideIcon, large: true },
        ].map((s) => (
          <KpiCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            className={s.large ? "col-span-2 sm:col-span-1" : ""}
          />
        ))}
      </div>

      <BarreRecherche value={search} onChange={setSearch} placeholder="Rechercher un client, email, société…" />

      {filtered.length === 0 ? (
        <div className="carte p-16 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Aucun client trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Vos clients apparaîtront ici dès que vous créerez un devis ou une facture.</p>
          <Link href="/proposals/new" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-ink text-sm font-medium rounded-lg hover:bg-indigo-700">
            Créer un devis
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <ClientCarte key={c.key} client={c} onPhoneSaved={handlePhoneSaved} />
          ))}
        </div>
      )}
    </div>
  );
}
