import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import DevisVue from "./DevisVue";
import { publicBaseUrl, proposalShareUrl } from "@/lib/public-url";
import { chargerDevis } from "@/lib/devis-donnees";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const workspaceId = await getWorkspaceUserId(user.id);
  const isOwner = user.id === workspaceId;

  // Même lecture que le PDF du devis (/api/proposals/[id]/pdf).
  const devis = await chargerDevis(id, workspaceId);
  if (!devis) notFound();

  // Une seule fonction décide de l'adresse publique, ici comme dans les relances.
  const shareUrl = proposalShareUrl(publicBaseUrl(devis.ownerProfile), devis.proposal.share_token);

  return (
    <div className="w-full">
      <DevisVue proposal={devis.proposal} profile={devis.profile} shareUrl={shareUrl} isOwner={isOwner} />
    </div>
  );
}
