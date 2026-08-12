import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { getConnection, revokeToken } from "@/lib/superpdp";

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
  if (!conn) return NextResponse.json({ disconnected: true, alreadyGone: true });

  await revokeToken(conn.refresh_token);

  const admin = createAdminClient();
  const { error } = await admin
    .from("superpdp_connections")
    .delete()
    .eq("user_id", workspaceId);

  if (error) {
    return NextResponse.json({ error: "Débranchement impossible" }, { status: 500 });
  }

  return NextResponse.json({ disconnected: true });
}
