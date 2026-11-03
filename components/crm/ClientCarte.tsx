"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Pencil, Check, X } from "lucide-react";
import { CarteDepliable, Puce, Champ } from "@/components/ui/CarteDepliable";

export interface CRMProposal {
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

export interface CRMInvoice {
  id: string;
  invoice_number: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  total_ht: number | null;
  total_ttc: number;
  invoice_type: string | null;
  status: string;
  created_at: string;
}

export interface ClientData {
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

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-ds-elevated text-gray-400" },
  sent: { label: "Envoyé", color: "bg-blue-500/10 text-blue-400" },
  viewed: { label: "Vu", color: "bg-amber-500/10 text-amber-400" },
  signed: { label: "Signé", color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé", color: "bg-red-500/10 text-red-400" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-ds-elevated text-gray-400" },
  sent: { label: "Envoyée", color: "bg-blue-500/10 text-blue-400" },
  paid: { label: "Payée", color: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Annulée", color: "bg-red-500/10 text-red-400" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ClientCarte({
  client: c,
  onPhoneSaved,
}: {
  client: ClientData;
  onPhoneSaved: (email: string, phone: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(c.phone || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!c.email) return;
    setSaving(true);
    await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: c.email, phone }),
    });
    onPhoneSaved(c.email, phone);
    setSaving(false);
    setEditing(false);
  }

  const pastille =
    c.ca_pending > 0 ? (
      <Puce ton="attention" texte={`En attente ${fmt(c.ca_pending)}`} />
    ) : c.nb_invoices > 0 ? (
      <Puce ton="bien" texte="À jour" />
    ) : (
      <Puce ton="neutre" texte="Prospect" />
    );

  return (
    <CarteDepliable
      titre={c.name}
      pastilles={pastille}
      sousTitre={
        <span className="text-gray-400">
          {c.company ? `${c.company} · ` : ""}
          Dernière activité {fmtDate(c.last_activity)}
        </span>
      }
      montant={fmt(c.ca_total)}
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
        <Champ libelle="Devis" valeur={c.nb_proposals} />
        <Champ libelle="Signés" valeur={c.nb_signed} />
        <Champ libelle="Factures" valeur={c.nb_invoices} />
        <Champ libelle="En attente" valeur={fmt(c.ca_pending)} />
      </dl>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <Phone size={14} className="text-gray-500 shrink-0" />
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="+33 6 12 34 56 78"
              className="bg-ds-bg border border-ds-border rounded-lg px-2 py-1 text-xs text-ink placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-44"
            />
            <button onClick={save} disabled={saving} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
              <Check size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-300">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setPhone(c.phone || "");
              setEditing(true);
            }}
            className="flex items-center gap-1.5 group"
            disabled={!c.email}
          >
            <span className={c.phone ? "text-gray-300" : "text-gray-600 italic"}>
              {c.phone || (c.email ? "Ajouter un numéro" : "Aucun e-mail")}
            </span>
            {c.email && <Pencil size={11} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        )}
      </div>

      {c.proposals.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Devis ({c.proposals.length})</h3>
          <div className="space-y-2">
            {c.proposals.map((p) => {
              const st = PROPOSAL_STATUS[p.status] ?? { label: p.status, color: "bg-ds-elevated text-gray-400" };
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-ds-border hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{p.title}</div>
                    <div className="text-xs text-gray-500">{p.proposal_number} · {fmtDate(p.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    <span className="text-sm font-semibold text-gray-300">{fmt(p.total_ttc)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {c.invoices.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Factures ({c.invoices.length})</h3>
          <div className="space-y-2">
            {c.invoices.map((inv) => {
              const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: "bg-ds-elevated text-gray-400" };
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-ds-border hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{inv.invoice_number}</div>
                    <div className="text-xs text-gray-500">{fmtDate(inv.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    <span className="text-sm font-semibold text-gray-300">{fmt(inv.total_ttc)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </CarteDepliable>
  );
}
