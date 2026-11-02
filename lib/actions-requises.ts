import type { ActionItem } from "@/components/DashboardActionFeed";

/**
 * Ce qui reclame une action sur les devis et les factures : factures en
 * retard (a relancer), devis sans reponse depuis 7 jours ou plus (a relancer),
 * devis signes pas encore factures (a facturer). Affiche dans l'onglet
 * Notifications ; le tableau de bord n'affiche en tete que les messages du
 * cabinet (maquette validee le 02/11/2026).
 */
type DevisLu = {
  id: string;
  title?: string | null;
  client_name?: string | null;
  status: string;
  total_ttc: number;
  created_at: string;
};
type FactureLue = {
  id: string;
  invoice_number?: string | null;
  client_name?: string | null;
  status: string;
  total_ttc: number;
  due_date?: string | null;
  proposal_id?: string | null;
  invoice_type?: string | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const jours = (iso: string, maintenant: Date) =>
  Math.floor((maintenant.getTime() - new Date(iso).getTime()) / 86_400_000);

export function actionsRequises(devis: DevisLu[], factures: FactureLue[], maintenant = new Date()): ActionItem[] {
  const envoyees = factures.filter((i) => i.status === "sent" && i.invoice_type !== "avoir");
  const enRetard = envoyees.filter((i) => i.due_date && new Date(i.due_date) < maintenant);
  const aRelancer = devis.filter((p) => ["sent", "viewed"].includes(p.status) && jours(p.created_at, maintenant) >= 7);
  const facturés = new Set(factures.filter((i) => i.proposal_id).map((i) => i.proposal_id));
  const aFacturer = devis.filter((p) => p.status === "signed" && !facturés.has(p.id));

  return [
    ...enRetard.map((i) => ({
      type: "overdue_invoice" as const,
      id: i.id,
      label: `${i.invoice_number} · ${i.client_name || "-"}`,
      sublabel: `En retard de ${jours(i.due_date!, maintenant)}j · ${fmt(i.total_ttc)}`,
      urgency: "high" as const,
      href: `/invoices/${i.id}`,
      actionLabel: "Relancer",
      actionApi: `/api/invoices/${i.id}/send-reminder`,
    })),
    ...aRelancer.map((p) => ({
      type: "remind_proposal" as const,
      id: p.id,
      label: `${p.title || p.client_name || "Devis sans titre"}`,
      sublabel: `Sans réponse depuis ${jours(p.created_at, maintenant)}j · ${fmt(p.total_ttc)}`,
      urgency: "medium" as const,
      href: `/proposals/${p.id}`,
      actionLabel: "Relancer",
      actionApi: `/api/proposals/${p.id}/remind`,
    })),
    ...aFacturer.map((p) => ({
      type: "to_invoice" as const,
      id: `inv-${p.id}`,
      label: `${p.title || p.client_name || "Devis signé"}`,
      sublabel: `Signé, en attente de facturation · ${fmt(p.total_ttc)}`,
      urgency: "low" as const,
      href: `/proposals/${p.id}`,
      actionLabel: "Facturer",
      actionHref: `/invoices/new?from=${p.id}`,
    })),
  ];
}
