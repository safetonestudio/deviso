import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteDemoAccount, purgeExpiredDemoAccounts } from "@/lib/demo-cleanup";

/**
 * Sortie explicite d'une démonstration : le compte factice est supprimé tout de
 * suite, sans attendre l'inactivité ni le cron.
 *
 * C'est le seul chemin déterministe de fin de démo. L'inactivité et l'âge
 * absolu restent des inférences, utiles pour la fermeture brutale mais avec un
 * délai. Ici l'utilisateur dit qu'il part, on le prend au mot.
 *
 * Appelée par le bouton « Quitter la démo » et par la déconnexion.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Pas de session : il n'y a rien à supprimer, et surtout rien à révéler.
  // On répond 200 pour que l'interface puisse rediriger sans cas particulier —
  // un double-clic sur le bouton ne doit pas afficher d'erreur.
  if (authError || !user) {
    return NextResponse.json({ ended: true, alreadyGone: true });
  }

  const admin = createAdminClient();
  const result = await deleteDemoAccount(admin, user.id);

  if (!result.deleted) {
    // Cas important : un vrai compte arrive ici. `deleteDemoAccount` a refusé,
    // on refuse aussi explicitement plutôt que de laisser croire à une sortie.
    return NextResponse.json(
      { ended: false, error: result.reason ?? "suppression impossible" },
      { status: 400 }
    );
  }

  // Tant qu'on est là, on fait le ménage des autres sessions terminées.
  // Sans cela, la dernière démo de la journée laisserait les précédentes en
  // base jusqu'au cron du lendemain.
  const purge = await purgeExpiredDemoAccounts(admin, { maxDeletions: 10 });

  return NextResponse.json({ ended: true, purge });
}
