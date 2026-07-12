import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getWorkspaceUserId } from "@/lib/workspace";
import ProposalActions from "./ProposalActions";
import ShareSection from "./ShareSection";
import { ProposalPreviewWrapper } from "@/components/ProposalPreviewWrapper";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import type { Proposal, Profile } from "@/types";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",     color: "bg-blue-500/10 text-blue-400" },
  viewed:   { label: "Consulté",   color: "bg-amber-500/10 text-amber-400" },
  signed:   { label: "Signé ✓",   color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",     color: "bg-red-500/10 text-red-400" },
};

const PROFILE_FIELDS = "full_name, company_name, email, phone, address, siret, tva_number, proposal_template, proposal_color, plan, subdomain";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const workspaceId = await getWorkspaceUserId(user.id);
  const isOwner = user.id === workspaceId;

  const { data, error } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (error || !data) notFound();

  const proposal = data as Proposal;

  // Fetch owner profile (company info + template + require_approval + subdomain)
  const { data: ownerProfile } = await supabaseAdmin
    .from("profiles")
    .select(`${PROFILE_FIELDS}, require_approval`)
    .eq("id", workspaceId)
    .single();

  const requireApproval: boolean = ownerProfile?.require_approval ?? false;

  // If the proposal was created by a collaborator, merge their personal info
  let mergedProfile: Partial<Profile> | null = ownerProfile ?? null;
  if (proposal.created_by && proposal.created_by !== workspaceId) {
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", proposal.created_by)
      .single();
    if (creatorProfile) {
      mergedProfile = {
        ...ownerProfile,
        full_name: creatorProfile.full_name,
        email: creatorProfile.email,
        phone: creatorProfile.phone,
      };
    }
  }

  const status = STATUS_LABELS[proposal.status] || STATUS_LABELS.draft;

  // Share URL: use custom subdomain for Pro users who have one configured
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ownerSubdomain = ownerProfile?.subdomain;
  const shareBase =
    ownerSubdomain && ownerProfile?.plan === "pro"
      ? `https://${ownerSubdomain}.getdeviso.fr`
      : appUrl;
  const shareUrl = `${shareBase}/p/${proposal.share_token}`;

  // Approval banner config
  const approvalStatus = proposal.approval_status;
  const showPendingBanner = proposal.status === "draft" && approvalStatus === "pending_review";
  const showApprovedBanner = proposal.status === "draft" && approvalStatus === "approved";
  const showRejectedBanner = proposal.status === "draft" && approvalStatus === "rejected";

  return (
    <div className="max-w-5xl mx-auto">
      <GuidedTourBanner pageKey="proposals_detail" />
      {/* Retour */}
      <Link href="/proposals" className="text-sm text-gray-500 hover:text-gray-400 transition-colors mb-5 inline-block">
        ← Tous les devis
      </Link>

      {/* Layout deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">

        {/* ── Colonne gauche : document ── */}
        <div className="min-w-0">
          {/* Header : titre + statuts + dates */}
          <div className="mb-5">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-semibold text-white tracking-tight">{proposal.title}</h1>
              {proposal.proposal_number && (
                <span className="text-xs font-mono font-semibold text-gray-400 bg-ds-elevated px-2 py-0.5 rounded">
                  {proposal.proposal_number}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
              {approvalStatus === "pending_review" && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                  ⏳ En attente de validation
                </span>
              )}
              {approvalStatus === "approved" && proposal.status === "draft" && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  ✓ Approuvé
                </span>
              )}
              {approvalStatus === "rejected" && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
                  ✗ Validation refusée
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Créé le {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
              {proposal.viewed_at && (
                <span className="text-amber-400"> · Consulté le {new Date(proposal.viewed_at).toLocaleDateString("fr-FR")}</span>
              )}
            </p>
          </div>

          {/* Approval info banners */}
          {showPendingBanner && isOwner && (
            <div className="mb-5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-amber-400 mb-0.5">En attente de votre validation</p>
              <p className="text-xs text-amber-400/70">
                Un collaborateur a soumis ce devis pour approbation. Vérifiez le contenu, puis approuvez ou refusez.
              </p>
            </div>
          )}
          {showRejectedBanner && !isOwner && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-red-400 mb-0.5">Validation refusée</p>
              <p className="text-xs text-red-400/70">
                Le propriétaire a refusé ce devis. Modifiez-le et soumettez-le à nouveau.
              </p>
            </div>
          )}
          {showApprovedBanner && !isOwner && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-emerald-400 mb-0.5">Devis approuvé ✓</p>
              <p className="text-xs text-emerald-400/70">
                Ce devis a été approuvé. Vous pouvez le marquer comme envoyé.
              </p>
            </div>
          )}

          {/* Document devis */}
          <div id="proposal-print">
            <ProposalPreviewWrapper proposal={proposal} profile={mergedProfile} showBranding={mergedProfile?.plan === "free"} cgvText={mergedProfile?.cgv_text} />
          </div>

          {/* Section partage + email */}
          <ShareSection proposal={proposal} shareUrl={shareUrl} profile={mergedProfile} />
        </div>

        {/* ── Colonne droite : panel d'actions ── */}
        <ProposalActions
          proposal={proposal}
          shareUrl={shareUrl}
          isOwner={isOwner}
          requireApproval={requireApproval}
          panel={true}
        />
      </div>
    </div>
  );
}
