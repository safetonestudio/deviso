import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Télécharge l'original d'une facture reçue, au format Factur-X.
 *
 * On demande `format=factur-x` plutôt que le XML brut : le PDF est lisible par
 * un humain et porte le XML en pièce jointe. Une facture qu'on reçoit doit
 * pouvoir être ouverte, imprimée, transmise au comptable — un fichier XML seul
 * ne le permet pas.
 *
 * Le contenu transite par notre serveur au lieu d'être servi par un lien direct
 * vers Super PDP : leur API exige un jeton d'accès, qui ne doit jamais atteindre
 * le navigateur.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Un identifiant Super PDP est un bigint positif. Filtrer ici évite de relayer
  // n'importe quel chemin vers leur API.
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);

  // Vérification d'appartenance **avant** tout appel à Super PDP. Sans elle,
  // n'importe quel utilisateur raccordé pourrait tenter des identifiants au
  // hasard et lire les factures d'une autre entreprise, puisque c'est le jeton
  // de son propre raccordement qui serait utilisé pour la demande.
  const admin = createAdminClient();
  const { data: facture } = await admin
    .from("superpdp_invoices")
    .select("id, number")
    .eq("id", Number(id))
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  try {
    const res = await superpdpFetch(workspaceId, `/invoices/${id}/download?format=factur-x`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Téléchargement impossible auprès de la Plateforme Agréée" },
        { status: 502 }
      );
    }

    const nom = `facture-${(facture.number ?? id).toString().replace(/[^\w.-]/g, "_")}.pdf`;

    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nom}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/download]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Téléchargement impossible" }, { status: 500 });
  }
}
