import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorise } from "@/lib/cron-auth";
import { appUrl } from "@/lib/public-url";
import { comptesReels, cheminsCritiques } from "@/lib/veille/controles";
import { appliquerVeille } from "@/lib/veille/alerte";
import type { Resultat } from "@/lib/veille/decision";

// Le banc d'essai rejoue ses scénarios par les vraies routes. Au-delà de 170 s
// on n'en lance plus (les suivants passent le lendemain) : une fonction tuée à
// 300 s n'écrirait ni état ni alerte, la pire des issues pour une veille.
export const maxDuration = 300;

/**
 * Veille quotidienne (20/11/2026) : alerte Deviso une seule fois quand un
 * chemin critique casse, se tait tant que la même panne dure, écrit au retour à
 * la normale. Contrôles : lib/veille/controles.ts. Dédoublonnage :
 * lib/veille/decision.ts et la table `veille_etat`.
 *
 * Mode essai (`?essai=1`, même secret) : état séparé (ligne « essai »), aucun
 * courriel ni événement Sentry, aucun compte réel lu ; l'alerte qui serait
 * partie est renvoyée dans la réponse. `scenarios=a,b` limite le banc,
 * `casser=lien-cabinet` retire volontairement la jointure cabinet-dossier.
 * C'est ce qu'éprouve scripts/e2e/veille.ts.
 */
export async function GET(req: NextRequest) {
  if (!cronAutorise(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const p = req.nextUrl.searchParams;
  const essai = p.get("essai") === "1";
  const scenarios = p.get("scenarios")?.split(",").map((s) => s.trim()).filter(Boolean);
  const casser = essai && p.get("casser") === "lien-cabinet" ? "lien-cabinet" : null;
  const base = (process.env.VEILLE_BASE_URL || appUrl()).replace(/\/$/, "");

  const admin = createAdminClient();
  const resultats: Resultat[] = [];
  let nonJoues: string[] = [];
  let duree = 0;
  let nettoyage: string[] = [];
  let horsSurveillance: string[] = [];
  try {
    if (!essai) {
      const reels = await comptesReels(admin);
      resultats.push(...reels.resultats);
      horsSurveillance = reels.horsSurveillance;
    }
    const b = await cheminsCritiques(admin, { base, scenarios, casser, budgetMs: essai ? 120_000 : 170_000 });
    resultats.push(...b.resultats);
    nonJoues = b.nonJoues;
    duree = b.dureeMs;
    nettoyage = b.nettoyage;
  } catch (e) {
    resultats.push({ id: "veille:execution", libelle: "Exécution de la veille", ok: false, detail: (e as Error).message });
  }

  const bilan = {
    controles: resultats.length,
    enPanne: resultats.filter((r) => !r.ok).map((r) => r.id),
    nonJoues,
    dureeMs: duree,
    nettoyage,
  };
  try {
    const issue = await appliquerVeille(admin, essai ? "essai" : "prod", resultats, nonJoues, { envoyer: !essai, bilan, horsSurveillance });
    console.log(`[veille] ${JSON.stringify({ ...bilan, alerte: issue.alerte?.genre ?? null, envoi: issue.envoi ?? null })}`);
    return NextResponse.json({
      ...bilan,
      alerte: issue.alerte ? { genre: issue.alerte.genre, sujet: issue.alerte.sujet, texte: issue.alerte.texte } : null,
      envoi: issue.envoi ?? null,
      concurrent: issue.concurrent ?? false,
      resultats: resultats.map((r) => ({ id: r.id, ok: r.ok, detail: r.detail })),
    });
  } catch (e) {
    // L'état ne se lit plus : on ne peut pas dédoublonner, on prévient quand même Sentry.
    Sentry.captureException(e, { tags: { veille: "etat" } });
    await Sentry.flush(3000).catch(() => false);
    return NextResponse.json({ error: (e as Error).message, ...bilan }, { status: 500 });
  }
}
