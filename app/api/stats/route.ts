import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

// GET /api/stats, Solo + Pro (analytics Pro en bonus)
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Le profil de l'ESPACE, pas celui de la personne connectée.
  //
  // Ce `.eq("id", user.id)` était un défaut discret et coûteux : sur un plan
  // Pro multi-utilisateurs, un collaborateur agissant sur un document de
  // l'espace lisait SON profil. Selon la route, cela donnait un PDF portant
  // son IBAN (ou aucun) au lieu de celui de l'entreprise — le client paie
  // alors sur le mauvais compte — ou un refus « plan insuffisant » sur une
  // fonction que l'espace paie pourtant.
  const profile = await getWorkspaceProfile<{ plan: string | null }>(
    await getWorkspaceUserId(user.id),
    "plan"
  );

  const workspaceId = await getWorkspaceUserId(user.id);

  if (!["solo", "pro"].includes(profile?.plan ?? "")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const isPro = profile?.plan === "pro";

  const now = new Date();
  const startOfYear = `${now.getFullYear()}-01-01`;
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  const since = twelveMonthsAgo.toISOString().split("T")[0];

  const [{ data: invoices }, { data: proposals }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, client_name, client_company, total_ht, total_ttc, status, issue_date, invoice_type")
      .eq("user_id", workspaceId),
    supabase
      .from("proposals")
      .select("id, client_name, client_email, total_ttc, status, created_at, signed_at, reminder_count")
      .eq("user_id", workspaceId),
  ]);

  // --- CA mensuel (12 derniers mois, factures payées) ---
  const monthlyMap = new Map<string, number>();
  for (let m = 0; m < 12; m++) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(d.getMonth() + m);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  // Un avoir se RETRANCHE du chiffre d'affaires.
  //
  // Ses montants sont positifs — c'est la règle BR-27, le type du document
  // porte le sens — et ils étaient additionnés partout ici. Une facture de
  // 1 200 € encaissée puis annulée par un avoir de 1 200 € affichait donc
  // 2 400 € de CA au lieu de zéro, sur le graphique, sur le cumul annuel et
  // dans le classement des meilleurs clients. Le tableau de bord appliquait
  // pourtant déjà la règle sur un de ses indicateurs — pas sur les autres.
  const signeCa = (inv: { invoice_type?: string | null }) => (inv.invoice_type === "avoir" ? -1 : 1);

  /**
   * Le chiffre d'affaires se compte HORS TAXES.
   *
   * Ces trois indicateurs sommaient le TTC sous l'étiquette « CA encaissé ».
   * Pour un utilisateur en franchise en base, HT et TTC sont égaux et personne
   * ne voyait rien ; pour un assujetti à 20 %, le chiffre affiché était gonflé
   * d'un cinquième. Or c'est ce chiffre-là qu'on reporte — sur une déclaration,
   * dans un prévisionnel, chez un comptable. La TVA collectée n'appartient pas
   * à l'entreprise : elle ne fait que transiter.
   */
  const montantCa = (inv: { invoice_type?: string | null; total_ht?: number | null; total_ttc?: number | null }) =>
    signeCa(inv) * (inv.total_ht ?? inv.total_ttc ?? 0);

  for (const inv of invoices ?? []) {
    if (inv.status !== "paid") continue;
    if (inv.issue_date < since) continue;
    const key = inv.issue_date.slice(0, 7);
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + montantCa(inv));
  }
  const monthly_ca = Array.from(monthlyMap.entries()).map(([month, ca]) => ({ month, ca: Math.round(ca * 100) / 100 }));

  // --- CA encaissé YTD ---
  const ca_ytd = (invoices ?? [])
    .filter((i) => i.status === "paid" && i.issue_date >= startOfYear)
    .reduce((s, i) => s + montantCa(i), 0);

  // --- CA prévisionnel (devis envoyés ou vus, non signés) ---
  const ca_previsionnel = (proposals ?? [])
    .filter((p) => p.status === "sent" || p.status === "viewed")
    .reduce((s, p) => s + p.total_ttc, 0);

  // --- Taux de conversion ---
  const closedProposals = (proposals ?? []).filter((p) =>
    ["sent", "viewed", "signed", "declined"].includes(p.status)
  );
  const signedCount = closedProposals.filter((p) => p.status === "signed").length;
  const conversion_rate = closedProposals.length > 0
    ? Math.round((signedCount / closedProposals.length) * 100)
    : 0;

  // --- Top 5 clients (par CA encaissé) ---
  const clientMap = new Map<string, { name: string; ca: number }>();
  for (const inv of invoices ?? []) {
    if (inv.status !== "paid") continue;
    const key = inv.client_company || inv.client_name || "Inconnu";
    const existing = clientMap.get(key) ?? { name: key, ca: 0 };
    clientMap.set(key, { name: key, ca: existing.ca + montantCa(inv) });
  }
  const top_clients = Array.from(clientMap.values())
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5)
    .map((c) => ({ ...c, ca: Math.round(c.ca * 100) / 100 }));

  // --- Valeur moyenne devis signés ---
  const signedProposals = (proposals ?? []).filter((p) => p.status === "signed");
  const avg_proposal = signedProposals.length > 0
    ? Math.round(signedProposals.reduce((s, p) => s + p.total_ttc, 0) / signedProposals.length * 100) / 100
    : 0;

  const base = {
    monthly_ca,
    ca_ytd: Math.round(ca_ytd * 100) / 100,
    ca_previsionnel: Math.round(ca_previsionnel * 100) / 100,
    conversion_rate,
    proposals_total: closedProposals.length,
    proposals_signed: signedCount,
    top_clients,
    avg_proposal,
    is_pro: isPro,
  };

  if (!isPro) {
    return NextResponse.json(base);
  }

  // ── Analytics Pro avancées ────────────────────────────────────────────────

  // Funnel de conversion
  const allProposals = proposals ?? [];
  const funnel = {
    created: allProposals.length,
    sent: allProposals.filter((p) => ["sent", "viewed", "signed", "declined"].includes(p.status)).length,
    viewed: allProposals.filter((p) => ["viewed", "signed", "declined"].includes(p.status)).length,
    signed: signedCount,
    declined: allProposals.filter((p) => p.status === "declined").length,
  };

  // Temps moyen de signature (jours entre created_at et signed_at)
  const signedWithDates = signedProposals.filter((p) => p.signed_at && p.created_at);
  const avg_days_to_sign = signedWithDates.length > 0
    ? Math.round(
        signedWithDates.reduce((sum, p) => {
          const days = (new Date(p.signed_at!).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / signedWithDates.length
      )
    : null;

  // Meilleur mois (taux de conversion par mois sur les 12 derniers mois)
  const monthlyConversion = new Map<string, { sent: number; signed: number }>();
  for (const p of allProposals) {
    const month = p.created_at.slice(0, 7);
    if (month < since.slice(0, 7)) continue;
    if (!["sent", "viewed", "signed", "declined"].includes(p.status)) continue;
    const entry = monthlyConversion.get(month) ?? { sent: 0, signed: 0 };
    entry.sent++;
    if (p.status === "signed") entry.signed++;
    monthlyConversion.set(month, entry);
  }
  let best_month: { month: string; rate: number } | null = null;
  for (const [month, { sent, signed }] of monthlyConversion.entries()) {
    if (sent < 2) continue; // ignorer les mois avec trop peu de données
    const rate = Math.round((signed / sent) * 100);
    if (!best_month || rate > best_month.rate) {
      best_month = { month, rate };
    }
  }

  // Impact des relances (devis relancés qui ont finalement été signés)
  const reminded = allProposals.filter((p) => (p.reminder_count ?? 0) > 0);
  const reminded_and_signed = reminded.filter((p) => p.status === "signed").length;
  const reminders_impact = reminded.length > 0
    ? {
        total_reminded: reminded.length,
        signed_after_reminder: reminded_and_signed,
        rate: Math.round((reminded_and_signed / reminded.length) * 100),
      }
    : null;

  return NextResponse.json({
    ...base,
    funnel,
    avg_days_to_sign,
    best_month,
    reminders_impact,
  });
}
