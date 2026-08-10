import type { SupabaseClient } from "@supabase/supabase-js";

/** Durée de vie d'un compte de démonstration. */
export const DEMO_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 heures

/**
 * Supprime les comptes de démonstration expirés.
 *
 * Pourquoi ce n'est pas qu'un cron : le plan Vercel Hobby limite les tâches
 * planifiées à **une exécution par jour**. Un compte créé juste après le passage
 * du cron survivrait donc près de 24 h au lieu de 2 h. On appelle donc aussi
 * cette fonction au lancement de chaque nouvelle démo : le ménage se fait
 * naturellement, proportionnellement au trafic.
 *
 * `maxDeletions` borne la latence : au-delà, le reste part au prochain passage.
 */
export async function purgeExpiredDemoAccounts(
  admin: SupabaseClient,
  { maxDeletions = 25 }: { maxDeletions?: number } = {}
): Promise<{ deleted: number; expired: number; errors: number }> {
  const cutoff = new Date(Date.now() - DEMO_MAX_AGE_MS).toISOString();

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("[demo-cleanup] listUsers:", error.message);
    return { deleted: 0, expired: 0, errors: 1 };
  }

  const expired = (data.users ?? []).filter(
    (u) => u.email?.endsWith("@deviso.internal") && u.created_at < cutoff
  );

  let deleted = 0;
  let errors = 0;

  for (const user of expired.slice(0, maxDeletions)) {
    // Les tables métier sont en ON DELETE CASCADE sur profiles, lui-même en
    // cascade sur auth.users. On nettoie tout de même explicitement celles qui
    // référencent l'utilisateur par une autre colonne que `user_id`.
    await admin.from("team_members").delete().eq("owner_id", user.id);
    await admin.from("team_members").delete().eq("member_id", user.id);

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`[demo-cleanup] deleteUser ${user.id}:`, delErr.message);
      errors++;
    } else {
      deleted++;
    }
  }

  return { deleted, expired: expired.length, errors };
}
