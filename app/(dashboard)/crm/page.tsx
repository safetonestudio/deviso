import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { CRMClient, type CRMProposal, type CRMInvoice } from "./CRMClient";

export const dynamic = "force-dynamic";

/**
 * Page Clients & Revenus (CRM), en rendu SERVEUR.
 *
 * Avant : page cliente qui faisait fetch('/api/crm') au montage. Desormais les
 * trois jeux de donnees (devis, factures, contacts) sont lus cote serveur et
 * passes en props, sans cascade ni ecran de chargement.
 *
 * La recuperation calque EXACTEMENT GET /api/crm : gate plan Pro, meme client
 * admin, memes selects, meme tri, meme filtre de portee user_id = workspaceId,
 * et meme construction de la map de contacts (email en minuscules). Les membres
 * n'atteignent jamais cette page (le layout bloque /crm pour eux), comme avant.
 * Les mutations (telephone) restent cote client, inchangees.
 */
export default async function CRMPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const profile = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");

  if (profile?.plan !== "pro") {
    return (
      <CRMClient initialProposals={[]} initialInvoices={[]} initialContacts={{}} planOk={false} />
    );
  }

  const admin = createAdminClient();
  const [{ data: proposals }, { data: invoices }, { data: contacts }] = await Promise.all([
    admin
      .from("proposals")
      .select("id, proposal_number, title, client_name, client_email, client_company, total_ttc, status, created_at")
      .eq("user_id", workspaceId)
      .order("created_at", { ascending: false }),
    admin
      .from("invoices")
      .select("id, invoice_number, client_name, client_email, client_company, total_ht, total_ttc, status, created_at, invoice_type")
      .eq("user_id", workspaceId)
      .order("created_at", { ascending: false }),
    admin
      .from("contacts")
      .select("email, name, company, phone")
      .eq("user_id", workspaceId),
  ]);

  const contactMap: Record<string, { phone: string | null }> = {};
  for (const c of contacts ?? []) {
    if (c.email) contactMap[c.email.toLowerCase().trim()] = { phone: c.phone ?? null };
  }

  return (
    <CRMClient
      initialProposals={(proposals ?? []) as CRMProposal[]}
      initialInvoices={(invoices ?? []) as CRMInvoice[]}
      initialContacts={contactMap}
      planOk
    />
  );
}
