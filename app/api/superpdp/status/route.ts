import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { getConnection, isSandbox, superpdpConfig, superpdpFetch } from "@/lib/superpdp";

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

  const workspaceId = await getWorkspaceUserId(user.id);
  const conn = await getConnection(workspaceId);

  // Régime de TVA tel que la Plateforme Agréée le connaît. On le lit chez elle
  // et non chez nous : c'est sa valeur à elle qui commande le calendrier
  // d'e-reporting et qui fait accepter ou refuser les factures aux
  // particuliers. Afficher notre copie masquerait précisément la divergence
  // qu'on veut pouvoir constater.
  let regimeTva: string | null = null;
  if (conn?.session_status === "verified") {
    try {
      const res = await superpdpFetch(workspaceId, "/companies/me");
      if (res.ok) {
        const body = (await res.json()) as { vat_regime?: string | null };
        regimeTva = body.vat_regime?.trim() ? body.vat_regime : null;
      }
    } catch {
      // L'état du raccordement reste affichable sans cette information.
    }
  }

  return NextResponse.json({
    available: true,
    sandbox: isSandbox(),
    connected: Boolean(conn),
    status: conn?.session_status ?? null,
    companyId: conn?.company_id ?? null,
    // Ce que l'utilisateur communique à ses clients pour être joignable.
    directoryAddress: conn?.directory_address ?? null,
    // Vide = les factures aux particuliers seront refusées. C'est la seule
    // façon pour l'utilisateur de s'en apercevoir avant d'essayer.
    regimeTva,
    lastError: conn?.last_error ?? null,
  });
}
