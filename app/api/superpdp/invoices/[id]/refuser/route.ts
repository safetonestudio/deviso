import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { estMotifValide } from "@/lib/superpdp-motifs";

/**
 * Refuse une facture reçue — statut 210 « Refusée ».
 *
 * Ce n'est pas une commodité. Le tableau 8 du dossier de spécifications
 * externes de la DGFiP (v3.2) classe ce statut parmi les quatre **obligatoires**,
 * et précise qu'il est posé par le destinataire : « Le destinataire refuse la
 * facture dans son intégralité. » Sans cette route, un utilisateur raccordé via
 * Deviso devrait aller sur l'interface de Super PDP pour refuser une facture
 * erronée — nous l'aurions rendu joignable sans lui donner de quoi répondre.
 *
 * Forme de la requête, découverte auprès de l'API le 12/08/2026 en lui envoyant
 * des corps volontairement incomplets :
 *   { invoice_id, status_code: "fr:210", details: [{ reason }] }
 * « Il est attendu exactement un detail avec un reason. »
 *
 * Le refus est **définitif et global** : il porte sur la facture entière, et
 * oblige le fournisseur à procéder à une annulation comptable. D'où la
 * confirmation exigée côté interface.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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

  const body = await req.json().catch(() => ({}));
  const motif = typeof body.motif === "string" ? body.motif : "";

  // On valide contre la liste que l'API nous a elle-même donnée, plutôt que de
  // relayer n'importe quelle chaîne et de laisser Super PDP répondre en anglais
  // technique. Il n'existe pas de motif « Autre » pour ce statut.
  if (!estMotifValide(motif)) {
    return NextResponse.json(
      { error: "Motif invalide", message: "Choisissez un motif de refus dans la liste." },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  // Appartenance vérifiée avant tout appel : le jeton utilisé est celui du
  // raccordement de cet espace de travail, donc sans ce contrôle un utilisateur
  // pourrait tenter des identifiants au hasard et refuser la facture d'autrui.
  const { data: facture } = await admin
    .from("superpdp_invoices")
    .select("id, direction, last_status_code")
    .eq("id", Number(id))
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // On ne refuse que ce qu'on a reçu. Refuser sa propre facture n'a pas de sens
  // et serait rejeté par Super PDP, mais autant le dire clairement ici.
  if (facture.direction !== "in") {
    return NextResponse.json(
      { error: "Sens invalide", message: "Seule une facture reçue peut être refusée." },
      { status: 400 }
    );
  }

  if (facture.last_status_code === "fr:210") {
    return NextResponse.json({ refusee: true, dejaRefusee: true });
  }

  try {
    const res = await superpdpFetch(workspaceId, "/invoice_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(id),
        status_code: "fr:210",
        details: [{ reason: motif }],
      }),
    });

    const texte = await res.text();
    if (!res.ok) {
      console.error(`[superpdp/refuser] ${id} : HTTP ${res.status} ${texte.slice(0, 300)}`);
      return NextResponse.json(
        {
          error: "Refus impossible",
          message: "La Plateforme Agréée a rejeté le refus. Réessayez dans un moment.",
        },
        { status: 502 }
      );
    }

    // On reflète le nouveau statut sans attendre la prochaine synchronisation :
    // l'utilisateur vient d'agir, l'écran doit le montrer tout de suite.
    await admin
      .from("superpdp_invoices")
      .update({ last_status_code: "fr:210" })
      .eq("id", Number(id))
      .eq("user_id", workspaceId);

    return NextResponse.json({ refusee: true });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/refuser]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Refus impossible" }, { status: 500 });
  }
}
