import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Proposal } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { ProposalsListe } from "@/components/proposals/ProposalsListe";
import { FileText, Sparkles } from "lucide-react";

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
    <div className="w-full">
      <GuidedTourBanner pageKey="proposals" />
      <PageHeader
        title="Mes devis"
        description={`${p.length} devis au total`}
        action={
          <Link
            href="/proposals/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm inline-block"
            >
              Créer mon premier devis
            </Link>
          }
        />
      ) : (
        <ProposalsListe proposals={p} />
      )}
    </div>
  );
}
