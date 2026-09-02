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
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Date réelle de l'encaissement, si l'appelant la connaît. C'est elle qui
  // détermine l'exigibilité de la TVA sur les prestations de services, pas la
  // date à laquelle on pense à cocher la case.
  const corps = await req.json().catch(() => ({}));
  const dateEncaissement = typeof corps?.date === "string" ? corps.date : null;

  const workspaceId = await getWorkspaceUserId(user.id);
  const resultat = await envoyerEncaissementPdp(workspaceId, id, dateEncaissement);

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
      // Échec de la réservation en base : l'appel n'est jamais parti.
      non_enregistre:
        "Deviso n'a pas pu enregistrer l'encaissement. Rien n'a été déclaré : réessayez.",
      // La réservation est conservée exprès côté serveur. Le message doit donc
      // dire l'inverse de « réessayez » : on ignore si la déclaration est
      // passée, et la rejouer la ferait partir en double au PPF.
      incertain:
        "L'encaissement a peut-être été déclaré à la Plateforme Agréée : la réponse ne nous est " +
        "jamais parvenue. Ne recommencez pas — vérifiez le statut de la facture dans un moment.",
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
