import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import type { Invoice } from "@/types";
import { InvoicesClient } from "./InvoicesClient";

export const dynamic = "force-dynamic";

/**
 * Page Factures, liste en rendu SERVEUR.
 *
 * Avant : la page cliente recuperait au montage, en parallele, la liste des
 * factures, le profil (moyen de paiement) et le statut de raccordement PDP.
 * La LISTE (le gros du contenu) est desormais lue cote serveur et passee en
 * props : elle apparait au premier rendu, sans cascade ni squelette.
 *
 * Les deux drapeaux secondaires (paiement configure, raccordement PDP) restent
 * charges cote client : ils ne pilotent que des badges, et le statut PDP a des
 * effets de bord de rafraichissement qu'on ne veut pas rejouer cote serveur.
 *
 * La requete calque EXACTEMENT GET /api/invoices : client SSR (RLS), filtre de
 * portee user_id = workspaceId, tri par date de creation decroissante. Les
 * mutations restent cote client, inchangees.
 */
export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  return <InvoicesClient initialInvoices={(data ?? []) as Invoice[]} />;
}
