import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { getConnection, revokeToken } from "@/lib/superpdp";
import { fermerLigneAnnuaire } from "@/lib/superpdp-ligne-annuaire";

/**
 * Débranche l'entreprise de la Plateforme Agréée.
 *
 * On révoque le jeton chez Super PDP (RFC 7009) **avant** d'effacer notre
 * enregistrement : dans l'autre ordre, une erreur nous laisserait sans jeton à
 * révoquer et un jeton valable un an continuerait de vivre chez eux.
 *
 * ⚠️ Débrancher ne supprime pas la ligne d'annuaire : l'entreprise resterait
 * inscrite comme joignable via Super PDP alors que Deviso ne lit plus rien.
 * C'est une manœuvre à faire depuis leur interface, on le dit à l'utilisateur
 * plutôt que de laisser croire que tout est défait.
 */
export async function POST(req: Request) {
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
  if (!conn) return NextResponse.json({ disconnected: true, alreadyGone: true });

  // ── Fermeture de la ligne d'annuaire, si elle est demandée ───────────────
  //
  // ⚠️ AVANT la révocation, et c'est une contrainte d'ordre, pas un choix de
  // style : fermer la ligne demande un appel authentifié, et il ne reste plus
  // aucun jeton une fois le raccordement révoqué et effacé. Dans l'autre ordre,
  // la ligne serait définitivement hors d'atteinte depuis Deviso.
  //
  // Décochée par défaut, et ce défaut est le bon. Se débrancher de Deviso, ce
  // n'est pas cesser d'exister : quelqu'un qui change d'outil de facturation
  // tout en restant chez Super PDP doit rester joignable. Fermer sa ligne le
  // rendrait injoignable pour toute la France, sur un geste qu'il croyait
  // limité à Deviso.
  //
  // La fonction refuse d'elle-même de fermer une ligne en cours de portabilité.
  const corps = await req.json().catch(() => ({}));
  let ligne: { fermee: boolean; message?: string } = { fermee: false };

  if (corps?.fermerLigne === true) {
    const r = await fermerLigneAnnuaire(workspaceId);
    if (r.ok) {
      ligne = { fermee: true };
    } else {
      // Un échec de fermeture n'annule pas le débranchement : la personne a
      // demandé à partir, on ne la retient pas parce que l'annuaire résiste.
      // Mais on le lui dit, sans quoi elle repartirait en croyant sa ligne
      // fermée — donc en croyant ne plus rien recevoir alors qu'on lui envoie
      // encore des factures.
      //
      // Le cas « migration » est le seul où c'est une bonne nouvelle : sa
      // ligne est intacte, et c'est ce qu'il fallait.
      ligne = { fermee: false, message: r.message };
      if (r.raison !== "absente") {
        console.error(`[superpdp/disconnect] ${workspaceId} : ligne non fermée — ${r.raison}`);
      }
    }
  }

  await revokeToken(conn.refresh_token);

  const admin = createAdminClient();
  const { error } = await admin
    .from("superpdp_connections")
    .delete()
    .eq("user_id", workspaceId);

  if (error) {
    return NextResponse.json({ error: "Débranchement impossible" }, { status: 500 });
  }

  return NextResponse.json({ disconnected: true, ligne });
}
