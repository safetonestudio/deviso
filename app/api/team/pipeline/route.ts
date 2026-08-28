import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";

// GET /api/team/pipeline, vue manager : pipeline de l'équipe par membre (Pro only)
//
// Oubliée lors du correctif du 12/08 (8a2563f) qui a résolu la même panne sur
// catalog, invoices, proposals/send-email, superpdp/connect et templates :
// cette route filtrait sur `user.id` directement au lieu de l'espace de
// travail. Pour l'owner ça ne se voyait pas (son id EST celui de l'espace).
// Pour un membre, ça cassait sur trois niveaux à la fois — plan lu sur son
// propre profil (jamais "pro"), team_members et proposals filtrés sur un
// owner_id qui n'existe pas pour lui — d'où l'écran vide, sans erreur visible.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const ownerProfile = await getWorkspaceProfile<{ plan: string; email: string | null; full_name: string | null; company_name: string | null }>(
    workspaceId,
    "plan, email, full_name, company_name"
  );

  if (ownerProfile?.plan !== "pro") {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Récupère les membres actifs de l'équipe
  const { data: members } = await admin
    .from("team_members")
    .select("id, email, role, member_id, accepted_at")
    .eq("owner_id", workspaceId)
    .eq("status", "active");

  // Récupère tous les profils des membres pour leurs noms
  const memberIds = (members ?? [])
    .map((m) => m.member_id)
    .filter(Boolean) as string[];

  const { data: memberProfiles } = memberIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, company_name")
        .in("id", memberIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map((p) => [p.id, p])
  );

  // Récupère tous les devis du workspace (owner + membres)
  const allUserIds = [workspaceId, ...memberIds];

  const { data: proposals } = await admin
    .from("proposals")
    .select("id, status, total_ttc, total_ht, created_by, created_at, client_name, title")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  // Récupère les factures payées pour le CA réel
  const { data: invoices } = await admin
    .from("invoices")
    .select("id, status, total_ttc, created_by")
    .eq("user_id", workspaceId)
    .eq("status", "paid");

  // Dédupliquer et exclure les entrées corrompues (member_id = owner_id)
  const uniqueUserIds = [...new Set(allUserIds)];

  // Agrège par membre
  const memberStats = uniqueUserIds.map((uid) => {
    const isOwner = uid === workspaceId;
    const memberRecord = (members ?? []).find((m) => m.member_id === uid);
    const memberProfile = isOwner ? ownerProfile : profileMap[uid];

    const myProposals = (proposals ?? []).filter((p) => p.created_by === uid);
    const myInvoices = (invoices ?? []).filter((i) => i.created_by === uid);

    const sent = myProposals.filter((p) => p.status !== "draft").length;
    const signed = myProposals.filter((p) => p.status === "signed").length;
    const declined = myProposals.filter((p) => p.status === "declined").length;
    const pending = myProposals.filter((p) => ["sent", "viewed"].includes(p.status)).length;
    const draft = myProposals.filter((p) => p.status === "draft").length;
    const ca_encaisse = myInvoices.reduce((sum, i) => sum + (i.total_ttc ?? 0), 0);
    const ca_pipeline = myProposals
      .filter((p) => ["sent", "viewed"].includes(p.status))
      .reduce((sum, p) => sum + (p.total_ttc ?? 0), 0);
    const conversion = sent > 0 ? Math.round((signed / sent) * 100) : 0;

    // Dernier devis créé
    const lastProposal = myProposals[0] ?? null;

    return {
      uid,
      is_owner: isOwner,
      email: isOwner ? ownerProfile?.email ?? "" : memberRecord?.email ?? "",
      name: memberProfile?.full_name || memberProfile?.company_name || (uid === user.id ? "Vous" : memberRecord?.email ?? ownerProfile?.email ?? ""),
      joined_at: isOwner ? null : memberRecord?.accepted_at,
      stats: {
        proposals_total: myProposals.length,
        proposals_draft: draft,
        proposals_sent: sent,
        proposals_signed: signed,
        proposals_declined: declined,
        proposals_pending: pending,
        ca_encaisse,
        ca_pipeline,
        conversion_rate: conversion,
      },
      last_proposal: lastProposal ? {
        title: lastProposal.title,
        client: lastProposal.client_name,
        status: lastProposal.status,
        date: lastProposal.created_at,
      } : null,
    };
  });

  // Stats globales de l'équipe
  const allProposals = proposals ?? [];
  const totalSent = allProposals.filter((p) => p.status !== "draft").length;
  const totalSigned = allProposals.filter((p) => p.status === "signed").length;
  const totalCa = (invoices ?? []).reduce((sum, i) => sum + (i.total_ttc ?? 0), 0);
  const totalPipeline = allProposals
    .filter((p) => ["sent", "viewed"].includes(p.status))
    .reduce((sum, p) => sum + (p.total_ttc ?? 0), 0);

  return NextResponse.json({
    team: memberStats,
    global: {
      proposals_total: allProposals.length,
      proposals_sent: totalSent,
      proposals_signed: totalSigned,
      ca_encaisse: totalCa,
      ca_pipeline: totalPipeline,
      conversion_rate: totalSent > 0 ? Math.round((totalSigned / totalSent) * 100) : 0,
      members_count: (members ?? []).length + 1,
    },
  });
}
