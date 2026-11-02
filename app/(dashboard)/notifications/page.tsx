import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamMember, getWorkspaceUserId } from "@/lib/workspace";
import { DashboardActionFeed } from "@/components/DashboardActionFeed";
import { NotificationsHistorique } from "@/components/NotificationsHistorique";
import { ActionsGlobales } from "@/components/ActionsGlobales";
import { actionsRequises } from "@/lib/actions-requises";

export const metadata = { title: "Notifications" };

/**
 * Onglet Notifications : ce qui reclame une action sur les devis et factures
 * (relances, facturation), puis l'historique des evenements. Les messages de
 * l'expert-comptable restent, eux, en tete du tableau de bord.
 */
export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isMember = await isTeamMember(user.id);
  const workspaceId = await getWorkspaceUserId(user.id);

  // Filtre d'espace explicite en plus de la RLS, comme sur le tableau de bord.
  let devisQ = supabase
    .from("proposals")
    .select("id, title, client_name, status, total_ttc, created_at")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);
  let facturesQ = supabase
    .from("invoices")
    .select("id, invoice_number, client_name, status, total_ttc, due_date, proposal_id, invoice_type")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (isMember) {
    devisQ = devisQ.eq("created_by", user.id);
    facturesQ = facturesQ.eq("created_by", user.id);
  }
  const [{ data: devis }, { data: factures }] = await Promise.all([devisQ, facturesQ]);
  const items = actionsRequises(devis ?? [], factures ?? []);

  return (
    <div className="space-y-6 w-full">
      <div className="en-tete-page flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[32px] sm:text-[38px] font-bold text-ink tracking-tight leading-tight">Notifications</h1>
          <p className="text-[15px] text-gray-400 mt-1">Ce qui demande ton attention, puis l&apos;historique de ton activité</p>
        </div>
        <ActionsGlobales />
      </div>
      <DashboardActionFeed items={items} />
      <NotificationsHistorique />
    </div>
  );
}
