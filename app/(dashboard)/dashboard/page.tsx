import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamMember } from "@/lib/workspace";
import type { Proposal } from "@/types";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductTour } from "@/components/ProductTour";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { DashboardActionFeed, type ActionItem } from "@/components/DashboardActionFeed";
import {
  Sparkles, Receipt, FileText, Send,
  Euro, TrendingUp, ArrowRight, Clock,
} from "lucide-react";

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",     color: "bg-blue-500/10 text-blue-400" },
  viewed:   { label: "Consulté",   color: "bg-amber-500/10 text-amber-400" },
  signed:   { label: "Signé",      color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",     color: "bg-red-500/10 text-red-400" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:      { label: "Envoyée",    color: "bg-blue-500/10 text-blue-400" },
  paid:      { label: "Payée",      color: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Annulée",    color: "bg-red-500/10 text-red-400" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isMember = await isTeamMember(user.id);

  let proposalsQuery = supabase
    .from("proposals")
    .select("id, title, client_name, status, total_ttc, created_at, signed_at")
    .order("created_at", { ascending: false })
    .limit(50);

  let invoicesQuery = supabase
    .from("invoices")
    .select("id, invoice_number, client_name, client_email, status, total_ht, total_ttc, due_date, issue_date, created_at, proposal_id")
    .order("created_at", { ascending: false });

  if (isMember) {
    proposalsQuery = proposalsQuery.eq("created_by", user.id);
    invoicesQuery  = invoicesQuery.eq("created_by", user.id);
  }

  const [{ data: allProposals }, { data: invoices }, { data: profile }] = await Promise.all([
    proposalsQuery,
    invoicesQuery,
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
  ]);

  const proposals = (allProposals ?? []) as Proposal[];
  const inv       = invoices ?? [];
  const plan      = profile?.plan ?? "free";
  const isPaid    = plan !== "free";

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // ── KPI 1 : Encours à encaisser ──────────────────────────────────────────
  const sentInvoices    = inv.filter((i) => i.status === "sent");
  const caToCollect     = sentInvoices.reduce((s, i) => s + i.total_ttc, 0);
  const overdueInvoices = sentInvoices.filter(
    (i) => i.due_date && new Date(i.due_date) < now
  );
  const overdueAmount   = overdueInvoices.reduce((s, i) => s + i.total_ttc, 0);

  // ── KPI 2 : Devis en attente ──────────────────────────────────────────────
  const pendingProposals    = proposals.filter((p) => ["sent", "viewed"].includes(p.status));
  const totalDevisEnAttente = pendingProposals.reduce((s, p) => s + p.total_ttc, 0);
  const oldestDevisAge      = pendingProposals.length > 0
    ? Math.max(...pendingProposals.map((p) => daysSince(p.created_at)))
    : 0;

  // ── KPI 3 : Encaissé vs Facturé ce mois ──────────────────────────────────
  const caThisMonth      = inv
    .filter((i) => i.status === "paid" && i.created_at >= monthStart)
    .reduce((s, i) => s + i.total_ttc, 0);
  const facturéThisMonth = inv
    .filter((i) => i.status !== "cancelled" && i.created_at >= monthStart)
    .reduce((s, i) => s + i.total_ttc, 0);

  // ── KPI 4 : Devis signés non encore facturés ─────────────────────────────
  const invoicedProposalIds = new Set(inv.filter((i) => i.proposal_id).map((i) => i.proposal_id));
  const toInvoice           = proposals.filter((p) => p.status === "signed" && !invoicedProposalIds.has(p.id));
  const toInvoiceAmount     = toInvoice.reduce((s, p) => s + p.total_ttc, 0);

  // ── Action feed ──────────────────────────────────────────────────────────
  const toRemind = pendingProposals.filter((p) => daysSince(p.created_at) >= 7);

  const actionItems: ActionItem[] = [
    // Factures en retard (urgence haute)
    ...overdueInvoices.slice(0, 3).map((i) => {
      const days = Math.floor((now.getTime() - new Date(i.due_date!).getTime()) / 86_400_000);
      return {
        type: "overdue_invoice" as const,
        id: i.id,
        label: `${i.invoice_number} · ${i.client_name || "—"}`,
        sublabel: `En retard de ${days}j · ${fmt(i.total_ttc)}`,
        urgency: "high" as const,
        href: `/invoices/${i.id}`,
        actionLabel: "Relancer",
        actionApi: `/api/invoices/${i.id}/send-reminder`,
      };
    }),
    // Devis sans réponse depuis +7j (urgence moyenne)
    ...toRemind.slice(0, 3).map((p) => ({
      type: "remind_proposal" as const,
      id: p.id,
      label: `${p.title || p.client_name || "Devis sans titre"}`,
      sublabel: `Sans réponse depuis ${daysSince(p.created_at)}j · ${fmt(p.total_ttc)}`,
      urgency: "medium" as const,
      href: `/proposals/${p.id}`,
      actionLabel: "Relancer",
      actionApi: `/api/proposals/${p.id}/remind`,
    })),
    // Devis signés à facturer (urgence basse)
    ...toInvoice.slice(0, 2).map((p) => ({
      type: "to_invoice" as const,
      id: `inv-${p.id}`,
      label: `${p.title || p.client_name || "Devis signé"}`,
      sublabel: `Signé, en attente de facturation · ${fmt(p.total_ttc)}`,
      urgency: "low" as const,
      href: `/proposals/${p.id}`,
      actionLabel: "Facturer",
      actionHref: `/invoices/new?from=${p.id}`,
    })),
  ].slice(0, 6);

  // ── Listes récentes ───────────────────────────────────────────────────────
  const recentProposals = proposals.slice(0, 8);
  const recentInvoices  = inv.slice(0, 5);

  return (
    <>
    <div className="space-y-8 max-w-5xl mx-auto">

      <GuidedTourBanner pageKey="dashboard" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            {isMember ? "Mon activité" : "Tableau de bord"}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {isMember ? "Tes devis et factures personnels" : "Vue d'ensemble de ton activité"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/proposals/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Sparkles size={14} /> Nouveau devis
          </Link>
          {isPaid && (
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 bg-ds-surface hover:bg-ds-elevated text-gray-300 hover:text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm border border-ds-border"
            >
              <Receipt size={14} /> Nouvelle facture
            </Link>
          )}
        </div>
      </div>

      {/* ── Upgrade banner (free, owners only) ── */}
      {!isPaid && !isMember && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 flex items-center justify-between gap-4 text-white">
          <div>
            <div className="font-semibold text-sm">Passez à Solo, débloquez l&apos;IA, les factures et les relances</div>
            <div className="text-xs text-indigo-200 mt-0.5">Essai gratuit 14 jours · sans carte bancaire</div>
          </div>
          <Link
            href="/billing"
            className="shrink-0 bg-white text-indigo-600 hover:bg-indigo-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Voir les offres →
          </Link>
        </div>
      )}

      {/* ── KPI cards, cash-first ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Encours à encaisser */}
        <KpiCard
          label="Encours à encaisser"
          value={fmt(caToCollect)}
          icon={TrendingUp}
          color={overdueAmount > 0 ? "amber" : caToCollect > 0 ? "indigo" : "zinc"}
          trend={overdueAmount > 0 ? `dont ${fmt(overdueAmount)} en retard` : sentInvoices.length > 0 ? `${sentInvoices.length} facture${sentInvoices.length > 1 ? "s" : ""} envoyée${sentInvoices.length > 1 ? "s" : ""}` : "Aucune en attente"}
        />

        {/* 2. Devis en attente de réponse */}
        <KpiCard
          label="Devis en attente"
          value={pendingProposals.length > 0 ? fmt(totalDevisEnAttente) : "0"}
          icon={Send}
          color={pendingProposals.length > 0 ? "blue" : "zinc"}
          trend={pendingProposals.length > 0
            ? `${pendingProposals.length} devis · plus ancien ${oldestDevisAge}j`
            : "Aucun devis en cours"}
        />

        {/* 3. Encaissé ce mois */}
        <KpiCard
          label="Encaissé ce mois"
          value={fmt(caThisMonth)}
          icon={Euro}
          color="emerald"
          trend={facturéThisMonth > caThisMonth
            ? `Facturé : ${fmt(facturéThisMonth)}`
            : facturéThisMonth > 0 ? "Tout encaissé ✓" : "Aucune facture ce mois"}
        />

        {/* 4. Signés à facturer */}
        <KpiCard
          label="Signés à facturer"
          value={toInvoice.length > 0 ? fmt(toInvoiceAmount) : "0€"}
          icon={Clock}
          color={toInvoice.length > 0 ? "amber" : "zinc"}
          trend={toInvoice.length > 0
            ? `${toInvoice.length} devis en attente`
            : "Tout est facturé ✓"}
        />
      </div>

      {/* ── Action feed ── */}
      {!isMember && actionItems.length > 0 && (
        <DashboardActionFeed items={actionItems} />
      )}

      {/* ── Grille devis + factures ── */}
      <div className={`grid gap-6 ${isPaid ? "lg:grid-cols-2" : ""}`}>

        {/* Devis récents */}
        <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-ds-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Devis récents</h2>
            <Link href="/proposals" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>

          {recentProposals.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="Aucun devis pour l'instant"
                description="Crée ton premier devis en décrivant ton projet à l'IA."
                action={
                  <Link
                    href="/proposals/new"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-block"
                  >
                    Créer un devis
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-ds-border">
              {recentProposals.map((proposal) => {
                const s   = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
                const age = daysSince(proposal.created_at);
                return (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-ds-elevated/60 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate group-hover:text-gray-100 transition-colors">
                        {proposal.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {proposal.client_name || "—"}
                        {" · "}
                        <span className={age >= 7 && ["sent", "viewed"].includes(proposal.status) ? "text-amber-500" : ""}>
                          {age === 0 ? "aujourd'hui" : `il y a ${age}j`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="font-semibold text-white text-sm tabular-nums">{fmt(proposal.total_ttc)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Factures récentes (Solo+) */}
        {isPaid && (
          <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-ds-border flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-400">Factures récentes</h2>
              <Link href="/invoices" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
                Voir tout <ArrowRight size={11} />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Receipt}
                  title="Aucune facture"
                  description="Convertis un devis signé en facture en un clic."
                  action={
                    <Link
                      href="/invoices/new"
                      className="bg-ds-elevated border border-ds-border hover:bg-ds-border text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-block"
                    >
                      Créer une facture
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-ds-border">
                {recentInvoices.map((invoice) => {
                  const s         = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.draft;
                  const isOverdue = invoice.status === "sent" && invoice.due_date && new Date(invoice.due_date) < now;
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-ds-elevated/60 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate group-hover:text-gray-100 transition-colors">
                          {invoice.invoice_number || "—"}
                          <span className="text-gray-500 font-normal ml-2 text-xs">{invoice.client_name || "—"}</span>
                        </div>
                        <div className={`text-xs mt-0.5 ${isOverdue ? "text-red-400 font-medium" : "text-gray-500"}`}>
                          {isOverdue
                            ? `En retard, échéance ${new Date(invoice.due_date!).toLocaleDateString("fr-FR")}`
                            : invoice.due_date
                            ? `Échéance ${new Date(invoice.due_date).toLocaleDateString("fr-FR")}`
                            : `Créée le ${new Date(invoice.created_at).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className="font-semibold text-white text-sm tabular-nums">{fmt(invoice.total_ttc)}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    <ProductTour isMember={isMember} />
    </>
  );
}
