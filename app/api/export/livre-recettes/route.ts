import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { can } from "@/lib/plans";
import { getPlan } from "@/lib/stripe";
import { lireFacturesPayees, lignesRecettes, MODES_REGLEMENT } from "@/lib/recettes";

/**
 * Export CSV du livre des recettes (separateur point-virgule, UTF-8 avec BOM :
 * s'ouvre directement dans Excel en francais). Memes lignes que la page,
 * lib/recettes.ts etant la seule source.
 */
const montant = (n: number) => n.toFixed(2).replace(".", ",");
const cellule = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return refusT;

  const profil = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");
  const plan = getPlan(profil?.plan);
  if (!can(plan, "livreRecettes")) {
    return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
  }

  const anneeCourante = new Date().getFullYear();
  const demandee = Number(req.nextUrl.searchParams.get("annee"));
  const annee = Number.isInteger(demandee) && demandee >= 2000 && demandee <= anneeCourante ? demandee : anneeCourante;

  let lignes;
  try {
    lignes = lignesRecettes(await lireFacturesPayees(supabase, workspaceId, annee), annee);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lecture impossible" }, { status: 500 });
  }

  const entete = ["Date d'encaissement", "N° de facture", "Client", "Nature de la prestation", "Montant HT", "Montant encaissé TTC", "Mode de règlement", "Date estimée (émission)"];
  const corps = lignes.map((l) =>
    [
      l.date.split("-").reverse().join("/"),
      l.numero,
      l.client,
      l.nature,
      montant(l.ht),
      montant(l.ttc),
      l.mode ? MODES_REGLEMENT[l.mode] : "",
      l.dateEstimee ? "oui" : "non",
    ].map(cellule).join(";")
  );
  const csv = "﻿" + [entete.map(cellule).join(";"), ...corps].join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="livre-des-recettes-${annee}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
