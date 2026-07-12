import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import {
  generateProposalWithContext,
  refineProposalWithContext,
  type UserContext,
  type CatalogItemContext,
} from "@/lib/openai";
import { getWorkspaceUserId } from "@/lib/workspace";
import type { GeneratedProposal } from "@/types";

const DAILY_LIMIT = 20;

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REGIME_TO_RATE: Record<string, number> = {
  franchise:     0,
  normal:        20,
  intermediaire: 10,
  reduit:        5.5,
  super_reduit:  2.1,
};

/* ─────────────────────────────────────────────
   Extraction des stats de pricing depuis les devis passés
───────────────────────────────────────────── */

interface ProposalRow {
  title: string | null;
  total_ht: number;
  payment_terms: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
  }> | null;
}

function extractPricingStats(proposals: ProposalRow[]): Partial<UserContext> {
  if (!proposals.length) return {};

  const allItems = proposals.flatMap((p) => p.items ?? []);

  // TJM : prix unitaire moyen des lignes avec unité "jour"
  const dayItems = allItems.filter(
    (i) => i.unit && /\bjour(n(é|e)e?)?\b/i.test(i.unit) && i.unit_price > 0
  );
  const avgDailyRate =
    dayItems.length > 0
      ? Math.round(dayItems.reduce((s, i) => s + i.unit_price, 0) / dayItems.length)
      : null;

  // Montant HT moyen par projet
  const validTotals = proposals.map((p) => p.total_ht).filter((t) => t > 0);
  const avgProjectTotal =
    validTotals.length > 0
      ? Math.round(validTotals.reduce((s, t) => s + t, 0) / validTotals.length)
      : null;

  // Unités les plus utilisées (top 4)
  const unitCounts: Record<string, number> = {};
  for (const item of allItems) {
    if (item.unit) unitCounts[item.unit] = (unitCounts[item.unit] ?? 0) + 1;
  }
  const commonUnits = Object.entries(unitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([u]) => u);

  // Conditions de paiement les plus fréquentes
  const ptCounts: Record<string, number> = {};
  for (const p of proposals) {
    if (p.payment_terms?.trim()) {
      ptCounts[p.payment_terms] = (ptCounts[p.payment_terms] ?? 0) + 1;
    }
  }
  const typicalPaymentTerms =
    Object.entries(ptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Nombre moyen de lignes par devis
  const avgItemCount =
    proposals.length > 0
      ? Math.round(
          proposals.reduce((s, p) => s + (p.items?.length ?? 0), 0) / proposals.length
        )
      : null;

  // Titres des dernières missions (pour contexte)
  const recentProjects = proposals
    .slice(0, 4)
    .map((p) => p.title)
    .filter((t): t is string => !!t);

  return {
    avgDailyRate,
    avgProjectTotal,
    commonUnits,
    typicalPaymentTerms,
    avgItemCount,
    recentProjects,
  };
}

/* ─────────────────────────────────────────────
   Route POST
───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { brief, existingProposal, refinement } = body as {
      brief?: string;
      existingProposal?: GeneratedProposal;
      refinement?: string;
    };

    const isRefinement = !!(existingProposal && refinement);

    // Validation
    if (isRefinement) {
      if (!refinement || typeof refinement !== "string" || refinement.trim().length < 3) {
        return NextResponse.json({ error: "Instruction trop courte." }, { status: 400 });
      }
    } else {
      if (!brief || typeof brief !== "string" || brief.trim().length < 10) {
        return NextResponse.json(
          { error: "Brief trop court. Décris ton projet en quelques phrases." },
          { status: 400 }
        );
      }
    }

    // Rate limit journalier
    const today = new Date().toISOString().split("T")[0];
    const { data: rl } = await supabaseAdmin
      .from("ai_rate_limits")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const currentCount = rl?.count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Limite journalière atteinte. Réessaie demain." },
        { status: 429 }
      );
    }

    // Comptes démo, retourner un devis mock sans appeler OpenAI
    const { data: demoCheck } = await supabaseAdmin
      .from("profiles")
      .select("is_demo")
      .eq("id", user.id)
      .single();

    if (demoCheck?.is_demo) {
      const mockProposal = isRefinement
        ? {
            ...(existingProposal!),
            notes:
              (existingProposal!.notes ?? "") +
              "\n[Affinage démo, tarifs basés sur le catalogue Studio Créatif MD]",
          }
        : {
            title: "Devis, Refonte identité visuelle + Landing page",
            items: [
              { description: "Audit UX complet", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
              { description: "Création logo + charte graphique", quantity: 1, unit: "forfait", unit_price: 1800, total: 1800 },
              { description: "Landing page complète (page d'acquisition)", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
              { description: "Droits de cession (web + print + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
            ],
            total_ht: 4700,
            tva_rate: 20,
            total_ttc: 5640,
            valid_days: 30,
            payment_terms:
              "30% à la commande, 70% à la livraison, Pénalités de retard : 3× taux légal (art. L441-10 C.Com.)",
            notes:
              "Délai de réalisation : 5 semaines. Inclut 2 cycles de révisions. Fichiers sources livrés à réception du solde. TVA 20% applicable.",
          };
      return NextResponse.json({ proposal: mockProposal, demo: true });
    }

    // Workspace routing, les membres utilisent le profil + catalogue de l'owner
    const workspaceUserId = await getWorkspaceUserId(user.id);

    // Fetch profil + derniers devis + catalogue en parallèle
    const [profileRes, proposalsRes, catalogRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, company_name, tva_regime, plan")
        .eq("id", workspaceUserId)
        .single(),
      supabaseAdmin
        .from("proposals")
        .select("title, total_ht, payment_terms, items")
        .eq("created_by", user.id)
        .not("status", "eq", "cancelled")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("service_catalog")
        .select("name, description, unit, unit_price, type")
        .eq("user_id", workspaceUserId)
        .order("name", { ascending: true }),
    ]);

    const profile = profileRes.data;
    const pastProposals = (proposalsRes.data ?? []) as ProposalRow[];
    const catalogItems = (catalogRes.data ?? []) as CatalogItemContext[];

    const tvaRate = profile?.tva_regime
      ? (REGIME_TO_RATE[profile.tva_regime] ?? 20)
      : 20;

    const pricingStats = extractPricingStats(pastProposals);

    const userContext: UserContext = {
      name: profile?.full_name ?? null,
      company: profile?.company_name ?? null,
      tvaRegime: profile?.tva_regime ?? null,
      tvaRate,
      plan: profile?.plan ?? "free",
      avgProjectTotal: null,
      avgDailyRate: null,
      avgItemCount: null,
      commonUnits: [],
      typicalPaymentTerms: null,
      recentProjects: [],
      catalogItems,
      ...pricingStats,
    };

    // Incrément rate limit (avant appel IA pour éviter les doubles calls en cas de timeout)
    await supabaseAdmin
      .from("ai_rate_limits")
      .upsert(
        { user_id: user.id, date: today, count: currentCount + 1 },
        { onConflict: "user_id,date" }
      );

    // Génération ou affinage
    let generated: GeneratedProposal;
    if (isRefinement) {
      generated = await refineProposalWithContext(
        existingProposal!,
        refinement!.trim(),
        userContext
      );
    } else {
      generated = await generateProposalWithContext(brief!.trim(), userContext);
    }

    return NextResponse.json({ proposal: generated });
  } catch (error) {
    console.error("[generate-proposal]", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération. Réessaie." },
      { status: 500 }
    );
  }
}
