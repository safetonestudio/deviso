import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { chargerAchats } from "@/lib/achats-export";

/**
 * Ce que l'export comptable signalera, AVANT le téléchargement (21/11/2026).
 *
 * GET /api/cabinet/export/alertes?year=2026&clients=<id>,<id>
 * Mêmes droits et même sélection que /api/cabinet/export : un identifiant hors
 * portefeuille refuse tout. Renvoie, par dossier, les points « à vérifier »
 * (acompte non retrouvé, achat à l'étranger en échec, autoliquidation à
 * confirmer) et les achats que l'export ne pourra pas reprendre (devise sans
 * cours BCE). Lit exactement ce que lira l'export : chargerAchats.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const year = params.get("year") ?? String(new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) return NextResponse.json({ error: "Année invalide" }, { status: 400 });

  const admin = createAdminClient();
  const portefeuille = await dossiersDuCabinet(admin, user.id);
  if (portefeuille.length === 0) return NextResponse.json({ error: "Aucun dossier rattaché" }, { status: 404 });

  const demandes = (params.get("clients") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (demandes.some((id) => !portefeuille.includes(id))) {
    return NextResponse.json({ error: "Dossier hors de votre portefeuille" }, { status: 403 });
  }
  const selection = demandes.length > 0 ? [...new Set(demandes)] : portefeuille;

  const { data: profils } = await admin.from("profiles").select("id, company_name, full_name").in("id", selection);
  const dossiers: { id: string; nom: string; aVerifier: string[]; nonRepris: string[] }[] = [];
  for (const id of selection) {
    const p = (profils ?? []).find((x) => x.id === id);
    try {
      const lus = await chargerAchats(id, year);
      if (lus.aVerifier.length || lus.nonRepris.length) {
        dossiers.push({ id, nom: p?.company_name || p?.full_name || "Dossier", aVerifier: lus.aVerifier, nonRepris: lus.nonRepris });
      }
    } catch {
      return NextResponse.json({ error: "Lecture des achats impossible" }, { status: 500 });
    }
  }
  return NextResponse.json({ dossiers });
}
