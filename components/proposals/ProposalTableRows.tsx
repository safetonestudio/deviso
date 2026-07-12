"use client";

import { useRouter } from "next/navigation";
import type { Proposal } from "@/types";

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

export function ProposalTableRows({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();

  return (
    <>
      {proposals.map((proposal) => {
        const s = STATUS[proposal.status as keyof typeof STATUS] || STATUS.draft;
        return (
          <tr
            key={proposal.id}
            onClick={() => router.push(`/proposals/${proposal.id}`)}
            className="hover:bg-ds-elevated/50 transition-colors cursor-pointer"
          >
            <td className="px-5 py-4">
              <div className="font-medium text-white text-sm">{proposal.title}</div>
            </td>
            <td className="px-5 py-4 text-sm text-gray-400">
              {proposal.client_name || "—"}
            </td>
            <td className="px-5 py-4 text-sm font-semibold text-white">
              {fmt(proposal.total_ttc)}
            </td>
            <td className="px-5 py-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                {s.label}
              </span>
            </td>
            <td className="px-5 py-4 text-sm text-gray-500">
              {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
            </td>
          </tr>
        );
      })}
    </>
  );
}
