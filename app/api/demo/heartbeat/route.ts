import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeExpiredDemoAccounts } from "@/lib/demo-cleanup";

/**
 * Battement de cœur d'une session de démonstration.
 *
 * La session prouve qu'elle est vivante ; l'absence de preuve vaut départ. Ce
 * sens de lecture est délibéré : on ne peut pas détecter la fermeture brutale
 * d'un onglet, mais on peut constater qu'une session ne donne plus signe de vie.
 *
 * Effet de bord voulu : chaque battement déclenche aussi la purge. Le ménage
 * devient ainsi proportionnel au nombre de sessions **actives** et non au nombre
 * de démos **créées** — c'était le défaut de départ, une démo lancée puis
 * abandonnée restait en base tant que personne d'autre n'en lançait une.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Le filtre `is_demo` fait double emploi avec la vérification côté interface,
  // volontairement : cette colonne ne doit jamais être écrite pour un vrai
  // compte, sous peine de le rendre éligible à la purge.
  const { data, error } = await admin
    .from("profiles")
    .update({ demo_last_seen_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("is_demo", true)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[demo/heartbeat]", error.message);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 500 });
  }

  // Compte réel : on ne renvoie pas d'erreur, l'interface n'a rien fait de mal
  // si un battement traîne après un changement de compte. On ne purge pas non
  // plus — inutile de faire travailler la base sur un appel qui n'aurait pas dû
  // partir.
  if (!data) {
    return NextResponse.json({ alive: false, demo: false });
  }

  const purge = await purgeExpiredDemoAccounts(admin, { maxDeletions: 10 });

  return NextResponse.json({ alive: true, demo: true, purge });
}
