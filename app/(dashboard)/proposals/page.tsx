import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Proposal } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { ProposalTableRows } from "@/components/proposals/ProposalTableRows";
import { FileText, Sparkles } from "lucide-react";

const STATUS = {
  draft:    { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",     color: "bg-blue-500/10 text-blue-400" },
  viewed:   { label: "Consulté",   color: "bg-amber-500/10 text-amber-400" },
  signed:   { label: "Signé ✓",   color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",     color: "bg-red-500/10 text-red-400" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function ProposalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: proposals = [] }, { data: profile }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user!.id)
      .single(),
  ]);

  const p = proposals as Proposal[];
  const plan = profile?.plan ?? "free";

  return (
    <div>
      <GuidedTourBanner pageKey="proposals" />
      <PageHeader
        title="Mes devis"
        description={`${p.length} devis au total`}
        action={
          <Link
            href="/proposals/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <Sparkles size={16} />Nouveau devis
          </Link>
        }
      />


      {p.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis encore"
          description="Crée ton premier devis en décrivant ton projet à l'IA."
          action={
            <Link
              href="/proposals/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm inline-block"
            >
              Créer mon premier devis
            </Link>
          }
        />
      ) : (
        <>
          <div className="sm:hidden space-y-3">
            {p.map((proposal) => {
              const s = STATUS[proposal.status as keyof typeof STATUS] || STATUS.draft;
              return (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="block bg-ds-surface border border-ds-border rounded-xl p-4 hover:bg-ds-elevated/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-white text-sm leading-snug">{proposal.title}</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">{proposal.client_name || "—"}</div>
                    <div className="text-sm font-semibold text-white">{fmt(proposal.total_ttc)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5">
                    {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="hidden sm:block bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-ds-border">
                <tr>
                  {["Titre", "Client", "Montant TTC", "Statut", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                <ProposalTableRows proposals={p} />
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
