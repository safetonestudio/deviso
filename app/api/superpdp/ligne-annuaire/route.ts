import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile, isTeamMember } from "@/lib/workspace";
import { SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { ouvrirLigneAnnuaire, lireLigneAnnuaire } from "@/lib/superpdp-ligne-annuaire";

/**
 * Ouvre la ligne de réception de l'entreprise auprès de la Plateforme Agréée.
 *
 * Pourquoi cette route existe. Jusqu'ici, la création de la ligne d'annuaire
 * était entièrement confiée au tunnel d'autorisation, via un paramètre
 * (`superpdp_send_and_receive`) absent de la spécification. Quand elle
 * n'aboutissait pas, l'utilisateur voyait « Raccordé », restait injoignable, et
 * n'avait aucun recours dans Deviso : il devait aller sur l'interface de
 * Super PDP, ce que rien ne lui disait.
 *
 * Recevoir des factures électroniques est une obligation au 1ᵉʳ septembre 2026.
 * Le produit ne peut pas se contenter d'espérer que la ligne existe.
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

  // Le raccordement engage l'entreprise : c'est au propriétaire de l'espace de
  // le faire, pas à un collaborateur.
  if (await isTeamMember(user.id)) {
    return NextResponse.json(
      { error: "Réservé au propriétaire", message: "Seul le propriétaire de l'espace peut ouvrir la ligne de réception." },
      { status: 403 }
    );
  }

  const workspaceId = await getWorkspaceUserId(user.id);

  try {
    // On ne crée pas une deuxième ligne si une existe déjà : l'annuaire n'est
    // pas un endroit où l'on empile les doublons.
    const existante = await lireLigneAnnuaire(workspaceId);
    if (existante && existante.etat !== "absente") {
      return NextResponse.json({ ouverte: true, dejaOuverte: true, ligne: existante });
    }

    const profil = await getWorkspaceProfile<{ siret: string | null }>(workspaceId, "siret");
    const r = await ouvrirLigneAnnuaire(workspaceId, { siret: profil?.siret ?? null });
    if (!r.ok) {
      return NextResponse.json({ error: "Ouverture impossible", message: r.raison }, { status: 400 });
    }

    return NextResponse.json({
      ouverte: true,
      adresse: r.adresse,
      ligne: await lireLigneAnnuaire(workspaceId),
    });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json(
        { error: "Non raccordé", message: "Raccordez d'abord votre entreprise à la Plateforme Agréée." },
        { status: 409 }
      );
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json(
        { error: "Vérification en cours", message: "Super PDP vérifie encore votre entreprise. Réessayez plus tard." },
        { status: 409 }
      );
    }
    console.error("[superpdp/ligne-annuaire]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ouverture impossible" }, { status: 500 });
  }
}
