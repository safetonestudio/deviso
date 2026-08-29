import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { envoyerEncaissementPdp } from "@/lib/superpdp-encaissement";

/**
 * Déclenche l'envoi du statut « Encaissée » (fr:212) pour une facture émise.
 *
 * Appelée par le bouton « Marquer comme payée » quand la facture a déjà été
 * transmise à Super PDP. Toute la logique vit dans lib/superpdp-encaissement.ts,
 * partagée avec le webhook Stripe — voir ce fichier pour le pourquoi.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const resultat = await envoyerEncaissementPdp(workspaceId, id);

  if (!resultat.ok) {
    if (resultat.raison === "non_transmise") {
      // Cas normal, pas une erreur : la facture n'a jamais été transmise à
      // Super PDP, donc aucun e-reporting de paiement ne peut s'y rattacher.
      return NextResponse.json({ encaissee: false, raison: "non_transmise" });
    }
    const messages: Record<string, string> = {
      non_raccorde: "Compte non raccordé à la Plateforme Agréée.",
      verification_en_cours: "Super PDP vérifie encore le rattachement de votre entreprise.",
      refuse: "La Plateforme Agréée a refusé l'événement d'encaissement. Réessayez dans un moment.",
    };
    return NextResponse.json(
      {
        error: "Encaissement non transmis",
        message: messages[resultat.raison] ?? "Erreur inconnue.",
      },
      { status: resultat.raison === "refuse" ? 502 : 409 }
    );
  }

  return NextResponse.json({ encaissee: true, dejaEncaissee: resultat.dejaEncaissee ?? false });
}
