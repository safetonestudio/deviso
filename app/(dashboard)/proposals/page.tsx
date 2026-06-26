import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Proposal } from "@/types";

const STATUS = {
  draft:    { label: "Brouillon",  color: "bg-slate-100 text-slate-600" },
  sent:     { label: "Envoyé",     color: "bg-blue-100 text-blue-700" },
  viewed:   { label: "Consulté",   color: "bg-yellow-100 text-yellow-700" },
  signed:   { label: "Signé ✓",   color: "bg-green-100 text-green-700" },
  declined: { label: "Refusé",     color: "bg-red-100 text-red-700" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function ProposalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: proposals = [] } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const p = proposals as Proposal[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mes devis</h1>
          <p className="text-slate-500 text-sm mt-1">{p.length} devis au total</p>
        </div>
        <Link
          href="/proposals/new"
          className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
        >
          ✨ Nouveau devis
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {p.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-slate-500 mb-4">Aucun devis encore</p>
            <Link
              href="/proposals/new"
              className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
            >
              Créer mon premier devis
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Titre", "Client", "Montant TTC", "Statut", "Date", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {p.map((proposal) => {
                const s = STATUS[proposal.status as keyof typeof STATUS] || STATUS.draft;
                return (
                  <tr key={proposal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900 text-sm">{proposal.title}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {proposal.client_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {fmt(proposal.total_ttc)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="text-brand-600 text-sm font-medium hover:underline"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
