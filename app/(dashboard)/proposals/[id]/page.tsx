import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProposalActions from "./ProposalActions";
import type { Proposal } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-slate-100 text-slate-700" },
  sent:     { label: "Envoyé",     color: "bg-blue-100 text-blue-700" },
  viewed:   { label: "Consulté",   color: "bg-yellow-100 text-yellow-700" },
  signed:   { label: "Signé ✓",   color: "bg-green-100 text-green-700" },
  declined: { label: "Refusé",     color: "bg-red-100 text-red-700" },
};

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !data) notFound();

  const proposal = data as Proposal;
  const status = STATUS_LABELS[proposal.status] || STATUS_LABELS.draft;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/p/${proposal.share_token}`;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/proposals" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Tous les devis
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{proposal.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
              {status.label}
            </span>
            <span className="text-sm text-slate-400">
              Créé le {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
            </span>
            {proposal.viewed_at && (
              <span className="text-sm text-yellow-600">
                · Consulté le {new Date(proposal.viewed_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>
        <ProposalActions proposal={proposal} shareUrl={shareUrl} />
      </div>

      {/* Devis card — rendu PDF */}
      <div id="proposal-print" className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
        {/* Header devis */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
          <div>
            <div className="text-2xl font-black text-brand-600 mb-1">DEVIS</div>
            <div className="text-sm text-slate-500">
              {new Date(proposal.created_at).toLocaleDateString("fr-FR", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </div>
            {proposal.valid_until && (
              <div className="text-sm text-slate-500">
                Valable jusqu&apos;au{" "}
                {new Date(proposal.valid_until).toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900 text-lg">
              {proposal.client_company || proposal.client_name || "Client"}
            </div>
            {proposal.client_name && proposal.client_company && (
              <div className="text-sm text-slate-500">{proposal.client_name}</div>
            )}
            {proposal.client_email && (
              <div className="text-sm text-slate-400">{proposal.client_email}</div>
            )}
          </div>
        </div>

        {/* Lignes */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2">Prestation</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2">Qté</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2">Unité</th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2">Prix HT</th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposal.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-sm text-slate-700 pr-4">{item.description}</td>
                <td className="py-3 text-sm text-slate-500 text-center">{item.quantity}</td>
                <td className="py-3 text-sm text-slate-500 text-center">{item.unit}</td>
                <td className="py-3 text-sm text-slate-500 text-right">{fmt(item.unit_price)}</td>
                <td className="py-3 text-sm font-medium text-slate-900 text-right">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Total HT</span>
              <span>{fmt(proposal.total_ht)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>TVA {proposal.tva_rate}%</span>
              <span>{fmt(proposal.total_ttc - proposal.total_ht)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Total TTC</span>
              <span className="text-brand-600">{fmt(proposal.total_ttc)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(proposal.payment_terms || proposal.notes) && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
            {proposal.payment_terms && (
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">Paiement : </span>
                {proposal.payment_terms}
              </p>
            )}
            {proposal.notes && (
              <p className="text-sm text-slate-400">{proposal.notes}</p>
            )}
          </div>
        )}

        {/* Branding Deviso (viral loop) */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-300">
            Devis créé avec{" "}
            <a href="https://deviso.fr" className="text-brand-400 hover:underline">
              Deviso
            </a>{" "}
            — l&apos;outil de devis IA pour freelances
          </p>
        </div>
      </div>

      {/* Lien de partage */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-900 text-sm mb-1">🔗 Lien de partage client</div>
            <div className="text-xs text-slate-500 font-mono truncate max-w-sm">{shareUrl}</div>
          </div>
          <ProposalActions proposal={proposal} shareUrl={shareUrl} compact />
        </div>
      </div>
    </div>
  );
}
