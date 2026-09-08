import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/team/invite-signup
// Crée un compte sans email de confirmation (réservé au flow d'invitation)
export async function POST(req: NextRequest) {
  const { email, password, full_name, invite_token } = await req.json();

  if (!email || !password || !invite_token) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Même politique que la checklist client (components/PasswordChecklist.tsx)
  if (
    password.length < 12 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 12 caractères, dont 1 majuscule, 1 chiffre et 1 caractère spécial." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Vérifie que le token d'invitation est valide et en attente
  const { data: invite } = await admin
    .from("team_members")
    .select("id, email, status, owner_id")
    .eq("invite_token", invite_token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "Invitation invalide ou expirée." }, { status: 404 });
  }
  if (invite.status === "active") {
    return NextResponse.json({ error: "already_accepted" }, { status: 409 });
  }

  // L'adresse créée DOIT être celle qui a été invitée.
  //
  // Sans ce contrôle, le jeton d'invitation devenait une fabrique de comptes
  // vérifiés sous n'importe quelle adresse : `email_confirm: true` ci-dessous
  // marque l'e-mail comme prouvé sans qu'aucune preuve n'ait été apportée.
  // Quelqu'un qui reçoit — ou intercepte, ou se voit transférer — une seule
  // invitation pouvait ouvrir un compte au nom de `compta@grand-client.fr` :
  // la vraie personne ne pouvait plus s'inscrire, et selon la configuration
  // Supabase un futur lien magique sur cette adresse atterrissait chez lui.
  //
  // Le jeton prouve qu'on a été invité, pas qu'on est le destinataire.
  if (String(email).trim().toLowerCase() !== String(invite.email ?? "").trim().toLowerCase()) {
    return NextResponse.json(
      {
        error: "EMAIL_MISMATCH",
        message:
          "Cette invitation a été envoyée à une autre adresse. " +
          "Inscrivez-vous avec l'adresse qui l'a reçue, ou demandez une nouvelle invitation.",
      },
      { status: 403 }
    );
  }

  // Crée l'utilisateur avec email confirmé d'emblée (pas d'email de vérification)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || "" },
  });

  if (createError) {
    // Si l'utilisateur existe déjà, on laisse le client se connecter normalement
    if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: created.user.id });
}
