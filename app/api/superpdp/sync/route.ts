import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { getConnection } from "@/lib/superpdp";
import { synchroniserFactures } from "@/lib/superpdp-sync";

/**
 * Synchronisation déclenchée par la présence de l'utilisateur.
 *
 * C'est le déclencheur principal, et non un complément du cron. Le plan Vercel
 * Hobby limite chaque tâche planifiée à une exécution par jour ; s'en remettre
 * à elle seule ferait apparaître les factures avec jusqu'à 24 h de retard.
 * Quelqu'un qui ouvre Deviso veut voir ses factures maintenant — on regarde à
 * ce moment-là.
 *
 * Le délai minimal évite qu'une navigation entre plusieurs pages ne déclenche
 * autant d'allers-retours. Il est volontairement court : l'interrogation ne
 * coûte rien chez Super PDP, dont la tarification est à la facture et non à
 * l'appel.
 */
const DELAI_MINIMAL_MS = 3 * 60 * 1000;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const conn = await getConnection(workspaceId);

  // Pas raccordé : ce n'est pas une erreur, l'immense majorité des comptes le
  // seront un jour et pas aujourd'hui. On répond calmement.
  if (!conn) return NextResponse.json({ synchronise: false, raison: "non_raccorde" });

  if (conn.last_sync_at) {
    const depuis = Date.now() - new Date(conn.last_sync_at).getTime();
    if (depuis < DELAI_MINIMAL_MS) {
      return NextResponse.json({
        synchronise: false,
        raison: "trop_recent",
        derniere: conn.last_sync_at,
      });
    }
  }

  const resultat = await synchroniserFactures(workspaceId);
  return NextResponse.json({ synchronise: !resultat.raison, ...resultat });
}
