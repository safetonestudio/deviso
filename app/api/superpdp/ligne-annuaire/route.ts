import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile, isTeamMember } from "@/lib/workspace";
import { SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import {
  ouvrirLigneAnnuaire,
  lireLigneAnnuaire,
  lireLignesAnnuaire,
  fermerLigneAnnuaire,
} from "@/lib/superpdp-ligne-annuaire";

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
export async function POST(req: Request) {
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

  // Suffixe d'organisation interne. Absent dans l'usage courant — un freelance
  // n'a qu'une adresse, son SIREN. Présent, il ouvre une ligne SECONDAIRE, ce
  // qui est le seul moyen d'éprouver la fermeture sans fermer l'adresse qui
  // rend le compte joignable.
  const corpsOuverture = await req.json().catch(() => ({}));
  const suffixe = typeof corpsOuverture?.suffixe === "string" ? corpsOuverture.suffixe : undefined;

  try {
    // On ne crée pas une deuxième ligne si une existe déjà : l'annuaire n'est
    // pas un endroit où l'on empile les doublons. Sauf demande explicite d'une
    // ligne secondaire, que l'annuaire autorise — « toutes les entreprises sont
    // libres de créer autant de lignes qu'elles le souhaitent ».
    const existante = await lireLigneAnnuaire(workspaceId);
    if (!suffixe && existante && existante.etat !== "absente") {
      return NextResponse.json({ ouverte: true, dejaOuverte: true, ligne: existante });
    }

    const profil = await getWorkspaceProfile<{ siret: string | null }>(workspaceId, "siret");
    const r = await ouvrirLigneAnnuaire(workspaceId, { siret: profil?.siret ?? null }, suffixe);
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

/**
 * Ferme une ligne de réception, et lit l'état de toutes les lignes.
 *
 * `GET` liste — l'écran n'en montre qu'une, mais l'annuaire en autorise
 * plusieurs et il faut pouvoir les désigner. `DELETE` ferme celle qu'on nomme,
 * ou la principale à défaut.
 *
 * Pourquoi une route de fermeture distincte du débranchement. La fermeture n'y
 * était atteignable que comme effet de bord, ce qui avait deux conséquences :
 * quelqu'un qui aurait ouvert une ligne secondaire ne pouvait pas la refermer,
 * et surtout le seul appel destructeur de toute l'intégration était le seul
 * qu'aucune traversée ne pouvait jouer — l'éprouver aurait rendu le compte
 * injoignable et forcé un nouveau tunnel d'autorisation.
 *
 * Réservée au propriétaire, comme l'ouverture : fermer une ligne, c'est rendre
 * l'entreprise injoignable pour toute la France.
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

  const workspaceId = await getWorkspaceUserId(user.id);
  try {
    const lignes = await lireLignesAnnuaire(workspaceId);
    if (!lignes) {
      return NextResponse.json({ error: "Lecture impossible" }, { status: 502 });
    }
    return NextResponse.json({ lignes });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Non raccordé", lignes: [] }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification en cours", lignes: [] }, { status: 409 });
    }
    console.error("[superpdp/ligne-annuaire GET]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (await isTeamMember(user.id)) {
    return NextResponse.json(
      {
        error: "Réservé au propriétaire",
        message: "Seul le propriétaire de l'espace peut fermer une ligne de réception.",
      },
      { status: 403 }
    );
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const corps = await req.json().catch(() => ({}));
  const id = Number.isInteger(corps?.id) ? (corps.id as number) : undefined;

  try {
    const r = await fermerLigneAnnuaire(workspaceId, id);
    if (!r.ok) {
      // « Portabilité en cours » n'est pas une panne : c'est un refus motivé,
      // et le 409 le dit mieux qu'un 400.
      return NextResponse.json(
        { error: "Fermeture impossible", raison: r.raison, message: r.message },
        { status: r.raison === "migration" ? 409 : r.raison === "absente" ? 404 : 502 }
      );
    }
    return NextResponse.json({ fermee: true, adresse: r.adresse });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification en cours" }, { status: 409 });
    }
    console.error("[superpdp/ligne-annuaire DELETE]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Fermeture impossible" }, { status: 500 });
  }
}
