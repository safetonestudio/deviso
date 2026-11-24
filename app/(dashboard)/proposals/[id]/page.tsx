import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getWorkspaceUserId } from "@/lib/workspace";
import DevisVue from "./DevisVue";
import type { Proposal, Profile } from "@/types";
import { publicBaseUrl, proposalShareUrl } from "@/lib/public-url";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// `cgv_text` : les conditions générales que le client voit jointes au devis
// (/p/[token]). Elles manquaient ici, si bien que la page du devis ne montrait
// pas le même document que celui reçu par le client.
const PROFILE_FIELDS = "full_name, company_name, email, phone, address, siret, tva_number, proposal_template, proposal_color, plan, subdomain, cgv_text";

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
    .select(PROFILE_FIELDS)
    .eq("id", workspaceId)
    .single();


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

  // Une seule fonction décide de l'adresse publique, ici comme dans les relances.
  const shareUrl = proposalShareUrl(publicBaseUrl(ownerProfile), proposal.share_token);

  return (
    <div className="w-full">
      <DevisVue proposal={proposal} profile={mergedProfile} shareUrl={shareUrl} isOwner={isOwner} />
    </div>
  );
}
