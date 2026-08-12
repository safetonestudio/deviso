import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { getConnection, isSandbox, superpdpConfig } from "@/lib/superpdp";

/**
 * État du raccordement à la Plateforme Agréée, pour l'affichage.
 *
 * Ne renvoie **jamais** le refresh token : c'est toute la raison pour laquelle
 * il vit dans une table sans policy RLS plutôt que dans `profiles`.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!superpdpConfig()) {
    return NextResponse.json({ available: false, connected: false });
  }

  const conn = await getConnection(await getWorkspaceUserId(user.id));

  return NextResponse.json({
    available: true,
    sandbox: isSandbox(),
    connected: Boolean(conn),
    status: conn?.session_status ?? null,
    companyId: conn?.company_id ?? null,
    // Ce que l'utilisateur communique à ses clients pour être joignable.
    directoryAddress: conn?.directory_address ?? null,
    lastError: conn?.last_error ?? null,
  });
}
