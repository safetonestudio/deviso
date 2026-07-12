"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Phone, Pencil, Check, X } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";

interface CRMProposal {
  id: string;
  proposal_number: string | null;
  title: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  total_ttc: number;
  status: string;
  created_at: string;
}

interface CRMInvoice {
  id: string;
  invoice_number: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  total_ttc: number;
  status: string;
  created_at: string;
}

interface Client {
  key: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  proposals: CRMProposal[];
  invoices: CRMInvoice[];
  nb_proposals: number;
  nb_signed: number;
  nb_invoices: number;
  ca_total: number;
  ca_pending: number;
  last_activity: string;
}

function clientKey(name: string | null, email: string | null): string {
  return email?.toLowerCase().trim() || name?.toLowerCase().trim() || "inconnu";
}

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon", color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",    color: "bg-blue-500/10 text-blue-400" },
  viewed:   { label: "Vu",        color: "bg-amber-500/10 text-amber-400" },
  signed:   { label: "Signé",     color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",    color: "bg-red-500/10 text-red-400" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: "Brouillon", color: "bg-ds-elevated text-gray-400" },
  sent:      { label: "Envoyée",   color: "bg-blue-500/10 text-blue-400" },
  paid:      { label: "Payée",     color: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Annulée",   color: "bg-red-500/10 text-red-400" },
};

function fmt(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CRMPage() {
  const [proposals, setProposals] = useState<CRMProposal[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [contactsMap, setContactsMap] = useState<Record<string, { phone: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  // Phone edit state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    fetch("/api/crm")
      .then((r) => {
        if (r.status === 403) { setIsPro(false); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProposals(data.proposals ?? []);
        setInvoices(data.invoices ?? []);
        setContactsMap(data.contacts ?? {});
        setLoading(false);
      });
  }, []);

  async function savePhone(email: string) {
    setSavingPhone(true);
    await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone: phoneInput }),
    });
    // Update local state
    setContactsMap((prev) => ({ ...prev, [email.toLowerCase()]: { phone: phoneInput || null } }));
    if (selected) setSelected({ ...selected, phone: phoneInput || null });
    setEditingPhone(false);
    setSavingPhone(false);
  }

  const clients = useMemo<Client[]>(() => {
    const map = new Map<string, Client>();

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
      if (inv.status === "paid") c.ca_total += inv.total_ttc;
      if (inv.status === "sent")  c.ca_pending += inv.total_ttc;
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
        <div className="text-4xl">👥</div>
        <h1 className="text-2xl font-semibold text-white">Clients & Revenus</h1>
        <p className="text-gray-400">
          L&apos;historique complet par client est réservé au plan Pro.
        </p>
        <UpgradeButton plan="pro" label="Passer Pro" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-ds-elevated rounded" />
        <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-ds-border flex gap-4">
              <div className="h-4 flex-1 bg-ds-elevated rounded" />
              <div className="h-4 w-24 bg-ds-elevated rounded" />
              <div className="h-4 w-16 bg-ds-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalCA = clients.reduce((s, c) => s + c.ca_total, 0);
  const totalClients = clients.length;
  const totalSigned = clients.reduce((s, c) => s + c.nb_signed, 0);

  return (
    <div className="space-y-8">
      <GuidedTourBanner pageKey="crm" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Clients & Revenus</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble et historique par client</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clients", value: totalClients, icon: "👥" },
          { label: "Devis signés", value: totalSigned, icon: "✅" },
          { label: "CA encaissé", value: fmt(totalCA), icon: "💶" },
        ].map((s) => (
          <div key={s.label} className="bg-ds-surface border border-ds-border rounded-xl p-6 flex flex-col gap-4">
            <div className="w-8 h-8 flex items-center justify-center text-lg bg-ds-elevated rounded-lg">{s.icon}</div>
            <div>
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">{s.label}</div>
              <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Rechercher un client, email, société…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-ds-bg border border-ds-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white placeholder:text-gray-600"
      />

      {filtered.length === 0 ? (
        <div className="bg-ds-surface border border-ds-border rounded-xl p-16 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400 font-medium">Aucun client trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Vos clients apparaîtront ici dès que vous créerez un devis ou une facture.</p>
          <Link href="/proposals/new" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500">
            Créer un devis
          </Link>
        </div>
      ) : (
        <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ds-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Devis</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Signés</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Factures</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">CA encaissé</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dernière activité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {filtered.map((c) => (
                <tr
                  key={c.key}
                  onClick={() => setSelected(c)}
                  className="hover:bg-ds-elevated/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{c.name}</div>
                    {c.company && <div className="text-xs text-gray-500">{c.company}</div>}
                    {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{c.nb_proposals}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={c.nb_signed > 0 ? "text-emerald-400 font-semibold" : "text-gray-500"}>{c.nb_signed}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{c.nb_invoices}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{fmt(c.ca_total)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{fmtDate(c.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-ds-surface border-l border-ds-border shadow-xl flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-ds-border flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                {selected.company && <p className="text-sm text-gray-400">{selected.company}</p>}
                {selected.email && <p className="text-sm text-gray-500">{selected.email}</p>}

                {/* Phone */}
                <div className="flex items-center gap-2 mt-2">
                  <Phone size={13} className="text-gray-600 shrink-0" />
                  {editingPhone ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePhone(selected.email!);
                          if (e.key === "Escape") setEditingPhone(false);
                        }}
                        placeholder="+33 6 12 34 56 78"
                        className="bg-ds-bg border border-ds-border rounded-lg px-2 py-1 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-44"
                      />
                      <button
                        onClick={() => savePhone(selected.email!)}
                        disabled={savingPhone}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                      >
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditingPhone(false)} className="text-gray-500 hover:text-gray-300">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPhoneInput(selected.phone || "");
                        setEditingPhone(true);
                      }}
                      className="flex items-center gap-1.5 group"
                    >
                      <span className={`text-sm ${selected.phone ? "text-gray-300" : "text-gray-600 italic"}`}>
                        {selected.phone || "Ajouter un numéro"}
                      </span>
                      <Pencil size={11} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setEditingPhone(false); }} className="text-gray-500 hover:text-gray-300 text-xl leading-none ml-3">&times;</button>
            </div>

            <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-ds-elevated/50 border-b border-ds-border">
              <div className="text-center">
                <div className="text-xl font-semibold text-white">{selected.nb_proposals}</div>
                <div className="text-xs text-gray-500">Devis</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-emerald-400">{fmt(selected.ca_total)}</div>
                <div className="text-xs text-gray-500">CA encaissé</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-blue-400">{fmt(selected.ca_pending)}</div>
                <div className="text-xs text-gray-500">En attente</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {selected.proposals.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Devis ({selected.proposals.length})</h3>
                  <div className="space-y-2">
                    {selected.proposals.map((p) => {
                      const st = PROPOSAL_STATUS[p.status] ?? { label: p.status, color: "bg-ds-elevated text-gray-400" };
                      return (
                        <Link
                          key={p.id}
                          href={`/proposals/${p.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-ds-border hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{p.title}</div>
                            <div className="text-xs text-gray-500">{p.proposal_number} · {fmtDate(p.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                            <span className="text-sm font-semibold text-gray-300">{fmt(p.total_ttc)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.invoices.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Factures ({selected.invoices.length})</h3>
                  <div className="space-y-2">
                    {selected.invoices.map((inv) => {
                      const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: "bg-ds-elevated text-gray-400" };
                      return (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-ds-border hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{inv.invoice_number}</div>
                            <div className="text-xs text-gray-500">{fmtDate(inv.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                            <span className="text-sm font-semibold text-gray-300">{fmt(inv.total_ttc)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
