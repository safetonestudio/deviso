import type { SupabaseClient } from "@supabase/supabase-js";

/** Durée de vie maximale d'un compte de démonstration, même actif. */
export const DEMO_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 heures

/**
 * Délai sans battement de cœur au-delà duquel on considère le visiteur parti.
 *
 * Le battement part toutes les 60 s. Dix minutes laissent donc passer neuf
 * absences consécutives : une coupure de réseau, un tunnel, un téléphone en
 * veille ou un ordinateur qui se met en sommeil ne détruisent pas la démo d'un
 * prospect encore intéressé. En contrepartie, un onglet fermé brutalement
 * disparaît de la base en dix minutes au lieu de deux heures.
 */
export const DEMO_IDLE_MS = 10 * 60 * 1000;

/**
 * Supprime les comptes de démonstration terminés.
 *
 * Deux critères, pour deux situations différentes :
 *
 * 1. **Inactivité** — plus de battement de cœur depuis `DEMO_IDLE_MS`. C'est le
 *    cas de la fermeture brutale : onglet fermé, navigateur planté, appareil
 *    éteint. Aucun code ne s'exécute alors côté client, donc on ne peut pas
 *    être prévenu du départ ; on l'infère de l'absence de preuve de présence.
 *    `pagehide` + `sendBeacon` seraient tentants mais partent aussi quand on
 *    change simplement d'onglet sur mobile : supprimer sur ce signal reviendrait
 *    à effacer le compte de quelqu'un en train de s'en servir.
 *
 * 2. **Âge absolu** — plus de `DEMO_MAX_AGE_MS`, même si la session est vivante.
 *    Un onglet laissé ouvert des jours ne doit pas immobiliser un compte.
 *
 * Pourquoi ce n'est pas qu'un cron : le plan Vercel Hobby limite les tâches
 * planifiées à une exécution par jour. On appelle donc aussi cette fonction au
 * lancement de chaque démo **et** à chaque battement de cœur : tant qu'une
 * session vit, elle fait le ménage des autres. Reste un angle mort assumé — la
 * toute dernière démo fermée sans visiteur derrière attend le cron quotidien.
 *
 * `maxDeletions` borne la latence : au-delà, le reste part au prochain passage.
 */
export async function purgeExpiredDemoAccounts(
  admin: SupabaseClient,
  { maxDeletions = 25 }: { maxDeletions?: number } = {}
): Promise<{ deleted: number; expired: number; errors: number }> {
  const maintenant = Date.now();
  const limiteAge = new Date(maintenant - DEMO_MAX_AGE_MS).toISOString();
  const limiteInactivite = new Date(maintenant - DEMO_IDLE_MS).toISOString();

  // Les comptes encore vivants : vus récemment ET pas trop vieux. Tout compte de
  // démo qui n'est pas dans cette liste est terminé. On raisonne par exclusion
  // plutôt qu'en listant les expirés, pour qu'un `demo_last_seen_at` resté NULL
  // (compte créé avant la migration, ou battement jamais parti) soit traité
  // comme terminé et non ignoré silencieusement.
  const { data: vivants, error: errVivants } = await admin
    .from("profiles")
    .select("id")
    .eq("is_demo", true)
    .gte("demo_last_seen_at", limiteInactivite);

  if (errVivants) {
    console.error("[demo-cleanup] lecture des sessions vivantes:", errVivants.message);
    return { deleted: 0, expired: 0, errors: 1 };
  }
  const idsVivants = new Set((vivants ?? []).map((p) => p.id as string));

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("[demo-cleanup] listUsers:", error.message);
    return { deleted: 0, expired: 0, errors: 1 };
  }

  const expired = (data.users ?? []).filter((u) => {
    if (!u.email?.endsWith("@deviso.internal")) return false;
    if (u.created_at < limiteAge) return true; // trop vieux, même actif
    return !idsVivants.has(u.id); // plus de signe de vie
  });

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

/**
 * Supprime un compte de démonstration précis, immédiatement.
 *
 * Utilisé par le bouton « Quitter la démo » et par la déconnexion. C'est le seul
 * chemin déterministe : les deux autres (inactivité, âge) sont des inférences.
 *
 * Le garde-fou `is_demo` n'est pas une précaution de style. Cette fonction
 * s'exécute avec la clé de service, qui ignore les politiques RLS : sans lui, un
 * défaut d'aiguillage dans l'interface effacerait le compte d'un vrai client.
 */
export async function deleteDemoAccount(
  admin: SupabaseClient,
  userId: string
): Promise<{ deleted: boolean; reason?: string }> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("is_demo")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { deleted: false, reason: error.message };
  if (!profile) return { deleted: false, reason: "compte introuvable" };
  if (!profile.is_demo) return { deleted: false, reason: "ce compte n'est pas un compte de démonstration" };

  await admin.from("team_members").delete().eq("owner_id", userId);
  await admin.from("team_members").delete().eq("member_id", userId);

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return { deleted: false, reason: delErr.message };

  return { deleted: true };
}
