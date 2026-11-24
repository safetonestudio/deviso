/**
 * Lecture d'un devis et du profil qui l'habille, côté serveur.
 *
 * Une seule lecture pour la page du devis (`app/(dashboard)/proposals/[id]`) et
 * pour son PDF (`/api/proposals/[id]/pdf`) : l'écran et le fichier téléchargé
 * montrent ainsi le même émetteur, le même modèle, la même couleur et les mêmes
 * conditions générales.
 *
 * Le profil est celui de l'ESPACE (titulaire). Quand un collaborateur a créé le
 * devis, ses nom, e-mail et téléphone remplacent ceux du titulaire, comme
 * l'affichait déjà la page.
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Proposal, Profile } from "@/types";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// `cgv_text` : les conditions générales que le client voit jointes au devis
// (/p/[token]). `proposal_template` et `proposal_color` : le modèle et la
// couleur choisis dans Profil, communs aux devis et aux factures.
const PROFILE_FIELDS =
  "full_name, company_name, email, phone, address, siret, tva_number, proposal_template, proposal_color, plan, subdomain, cgv_text";

export interface DevisCharge {
  proposal: Proposal;
  /** Profil du titulaire, tel quel (adresse publique, sous-domaine). */
  ownerProfile: Partial<Profile> | null;
  /** Profil affiché sur le document (collaborateur fusionné le cas échéant). */
  profile: Partial<Profile> | null;
}

export async function chargerDevis(id: string, workspaceId: string): Promise<DevisCharge | null> {
  const { data, error } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();
  if (error || !data) return null;
  const proposal = data as Proposal;

  const { data: ownerProfile } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", workspaceId)
    .single();

  let profile: Partial<Profile> | null = (ownerProfile as Partial<Profile> | null) ?? null;
  if (proposal.created_by && proposal.created_by !== workspaceId) {
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", proposal.created_by)
      .single();
    if (creatorProfile) {
      profile = {
        ...(ownerProfile as Partial<Profile> | null),
        full_name: creatorProfile.full_name,
        email: creatorProfile.email,
        phone: creatorProfile.phone,
      };
    }
  }

  return { proposal, ownerProfile: (ownerProfile as Partial<Profile> | null) ?? null, profile };
}

/** Nom du fichier PDF d'un devis : `devis_D-2026-002_LAGARDE_RECEPTIONS.pdf`. */
export function nomFichierDevis(p: Proposal): string {
  const client = (p.client_company || p.client_name || "CLIENT")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .slice(0, 20);
  return `devis_${p.proposal_number || p.id.slice(0, 8)}_${client}.pdf`;
}
