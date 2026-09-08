import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeExpiredDemoAccounts } from "@/lib/demo-cleanup";
import { cronAutorise } from "@/lib/cron-auth";

/**
 * Filet de sécurité quotidien pour la suppression des comptes de démonstration.
 *
 * Le vrai ménage se fait au lancement de chaque démo (voir /api/demo/start) :
 * le plan Vercel Hobby ne déclenche les tâches planifiées qu'une fois par jour,
 * ce qui laisserait sinon vivre un compte jusqu'à ~24 h au lieu de 2 h.
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const result = await purgeExpiredDemoAccounts(admin, { maxDeletions: 200 });

  console.log(
    `[cleanup-demo] ${result.deleted}/${result.expired} comptes supprimés` +
      (result.errors ? ` — ${result.errors} échec(s)` : "")
  );

  // Un échec de suppression doit être visible : c'est ainsi qu'une contrainte
  // de clé étrangère bloquante est passée inaperçue pendant plusieurs jours.
  const status = result.errors > 0 ? 500 : 200;
  return NextResponse.json(result, { status });
}
