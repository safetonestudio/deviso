import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addSeatToSubscription } from "@/lib/stripe-seats";

type Params = { params: Promise<{ token: string }> };

// GET /api/team/accept/[token], accepter une invitation
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";

  if (authError || !user) {
    return NextResponse.redirect(`${baseUrl}/login?next=/join/${token}`);
  }

  const admin = createAdminClient();

  // Trouver l'invitation par token
  const { data: invite } = await admin
    .from("team_members")
    .select("id, owner_id, email, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=invalid`);
  }

  if (invite.status === "active") {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=already_accepted`);
  }

  // Bloquer si l'utilisateur connecté est le propriétaire du workspace
  if (user.id === invite.owner_id) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=wrong_account`);
  }

  // L'invitation n'est acceptable que par la personne invitée.
  //
  // Ce contrôle n'existait que côté navigateur : `app/(public)/join/[token]`
  // affichait « mauvais compte », mais cette route, appelée directement,
  // acceptait n'importe quel compte connecté. Or le jeton circule — il est
  // renvoyé en clair par `POST /api/team` pour que le propriétaire le
  // transmette lui-même, il passe par un courriel, il reste dans un historique
  // de navigation. Quiconque le récupérait entrait dans l'espace : devis,
  // factures, CRM, export FEC, et un siège facturé au propriétaire.
  //
  // Une invitation n'est pas un mot de passe : c'est une adresse. On la
  // compare.
  if (
    String(user.email ?? "").trim().toLowerCase() !==
    String(invite.email ?? "").trim().toLowerCase()
  ) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=wrong_account`);
  }

  // L'acceptation est atomique : `.eq("status", "pending")` dans la mise à
  // jour elle-même, et on regarde combien de lignes ont bougé.
  //
  // Le contrôle « déjà acceptée » vivait plus haut, dans une lecture séparée.
  // Sur une route GET, deux requêtes concurrentes — un double clic, un
  // préchargement du navigateur, deux onglets — lisaient toutes deux
  // « pending », franchissaient toutes deux le garde, et appelaient chacune
  // `addSeatToSubscription`. Deux sièges facturés au propriétaire pour un seul
  // collaborateur, sans que rien ne le signale.
  const { data: acceptees, error } = await admin
    .from("team_members")
    .update({
      member_id: user.id,
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=error`);
  }

  // Zéro ligne : quelqu'un d'autre — ou nous-mêmes, une milliseconde plus tôt —
  // vient d'accepter. On ne facture pas un second siège.
  if (!acceptees || acceptees.length === 0) {
    return NextResponse.redirect(`${baseUrl}/dashboard?invite=already_accepted`);
  }

  // Facturer le siège supplémentaire sur l'abonnement Stripe du propriétaire.
  //
  // L'échec était avalé par un `catch` vide, avec en commentaire « le billing
  // sera régularisé manuellement » — sauf que rien n'était écrit nulle part :
  // il n'existait aucune trace à partir de laquelle régulariser. Le siège
  // était activé et jamais facturé, définitivement et invisiblement.
  await addSeatToSubscription(invite.owner_id).catch((err) => {
    console.error(
      `[team/accept] siège NON facturé pour l'espace ${invite.owner_id} ` +
        `(membre ${user.id}, invitation ${invite.id}) :`,
      err
    );
  });

  return NextResponse.redirect(`${baseUrl}/dashboard?invite=accepted`);
}
