import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire, ROLE_COMPTABLE } from "@/lib/droits";
import { envoyerCourriel } from "@/lib/resend";
import { inviteEmailHtml } from "@/lib/emails/invite";

/**
 * Acces expert-comptable dedie.
 *
 * Un seul comptable par espace, invite par le titulaire, en LECTURE SEULE,
 * GRATUIT et HORS SIEGE facture. Disponible des l'offre Solo (pas sur le plan
 * gratuit, pas reserve a Pro, contrairement a la gestion d'equipe).
 *
 * La ligne vit dans team_members avec role = "comptable". Le reste de la
 * mecanique est partage avec les invitations de membres : meme jeton, meme
 * page /join, meme acceptation. La lecture seule est garantie cote serveur par
 * droitsDe (court-circuit sur ce role), et l'exclusion de la facturation par
 * lib/stripe-seats et le quota de sieges (neq role comptable).
 */

const PLANS_AUTORISES = new Set(["solo", "pro"]);

function refusPlan(): NextResponse {
  return NextResponse.json(
    {
      error: "PLAN_REQUIRED",
      message: "L'acces expert-comptable est disponible a partir de l'offre Solo.",
    },
    { status: 403 },
  );
}

// GET /api/team/comptable : etat de l'acces comptable de l'espace (titulaire).
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  // Seul le titulaire gere son comptable.
  const refusT = exigerTitulaire(user.id, await getWorkspaceUserId(user.id));
  if (refusT) return refusT;

  const admin = createAdminClient();
  const { data: comptable } = await admin
    .from("team_members")
    .select("id, email, status, invited_at, accepted_at")
    .eq("owner_id", user.id)
    .eq("role", ROLE_COMPTABLE)
    .maybeSingle();

  return NextResponse.json({ comptable: comptable ?? null });
}

// POST /api/team/comptable : inviter (ou reinviter) l'expert-comptable.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  // Inviter est reserve au titulaire.
  const refusT = exigerTitulaire(user.id, await getWorkspaceUserId(user.id));
  if (refusT) return refusT;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name, company_name")
    .eq("id", user.id)
    .single();

  // Disponible des Solo, jamais sur le plan gratuit.
  if (!PLANS_AUTORISES.has(profile?.plan ?? "")) return refusPlan();

  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous inviter vous-meme." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Un seul comptable par espace. On lit la ligne comptable existante, quel que
  // soit l'email, pour la remplacer plutot que d'en accumuler.
  const { data: existant } = await admin
    .from("team_members")
    .select("id, status")
    .eq("owner_id", user.id)
    .eq("role", ROLE_COMPTABLE)
    .maybeSingle();

  if (existant && existant.status === "active") {
    return NextResponse.json(
      { error: "COMPTABLE_DEJA_ACTIF", message: "Un expert-comptable a deja acces. Retirez-le avant d'en inviter un autre." },
      { status: 409 },
    );
  }

  let inviteToken: string | undefined;

  if (existant) {
    // Une invitation comptable en attente existe : on remet a jour l'email et
    // on regenere le jeton (reinvitation, eventuellement vers une autre adresse).
    const { data: updated } = await admin
      .from("team_members")
      .update({ email: email.toLowerCase(), status: "pending", invite_token: crypto.randomUUID(), accepted_at: null })
      .eq("id", existant.id)
      .select("invite_token")
      .single();
    inviteToken = updated?.invite_token;
  } else {
    const { data: inserted } = await admin
      .from("team_members")
      .insert({ owner_id: user.id, email: email.toLowerCase(), role: ROLE_COMPTABLE })
      .select("invite_token")
      .single();
    inviteToken = inserted?.invite_token;
  }

  if (!inviteToken) {
    return NextResponse.json({ error: "Erreur lors de la creation de l'invitation" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";
  const inviteUrl = `${baseUrl}/join/${inviteToken}`;

  // Meme garde que l'invitation de membre : ne jamais ecrire reellement a un
  // compte de demonstration (@deviso.internal), cela degrade la reputation
  // d'envoi du domaine pour tous les vrais clients.
  const estFictif = email.toLowerCase().endsWith("@deviso.internal");
  if (!estFictif) {
    await envoyerCourriel(user.id, {
      from: "Deviso <noreply@getdeviso.fr>",
      to: email,
      subject: `${profile?.company_name || profile?.full_name || "Quelqu'un"} vous invite comme expert-comptable sur Deviso`,
      html: inviteEmailHtml(profile?.full_name ?? "", profile?.company_name ?? "", inviteUrl),
    });
  }

  // Le lien est renvoye pour que le titulaire puisse le transmettre lui-meme :
  // la remise d'un email n'est jamais garantie.
  return NextResponse.json({ success: true, inviteUrl, emailEnvoye: !estFictif });
}

// DELETE /api/team/comptable : retirer l'acces de l'expert-comptable.
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const refusT = exigerTitulaire(user.id, await getWorkspaceUserId(user.id));
  if (refusT) return refusT;

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("owner_id", user.id)
    .eq("role", ROLE_COMPTABLE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aucune synchronisation de sieges : le comptable n'en occupe aucun.
  return NextResponse.json({ success: true });
}
