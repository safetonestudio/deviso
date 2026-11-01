import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_COMPTABLE, PLANS_ACCES_COMPTABLE } from "@/lib/droits";
import { normaliserCode } from "@/lib/cabinet";

const PLANS = new Set<string>(PLANS_ACCES_COMPTABLE);

/**
 * Rattachement a un cabinet (cote client).
 *
 * Le client saisit le code recu de son cabinet. Saisir le code vaut
 * consentement : on cree directement le lien team_members (role comptable, en
 * lecture seule), et l'invitation passe a "claimed". Un seul cabinet par client.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = normaliserCode(typeof body.code === "string" ? body.code : "");
  if (!code) return NextResponse.json({ error: "Code manquant" }, { status: 400 });

  // Le rattachement d'un cabinet reste une fonctionnalite des l'offre Solo.
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!PLANS.has(profile?.plan ?? "")) {
    return NextResponse.json(
      { error: "PLAN_REQUIRED", message: "Le rattachement a un cabinet est disponible a partir de l'offre Solo." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: invit } = await admin
    .from("cabinet_invitations")
    .select("id, cabinet_id, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  const expiree = invit?.expires_at ? new Date(invit.expires_at) < new Date() : false;
  if (!invit || invit.status !== "pending" || expiree) {
    return NextResponse.json(
      { error: "CODE_INCONNU", message: "Ce code est invalide ou a deja ete utilise." },
      { status: 404 },
    );
  }
  if (invit.cabinet_id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous rattacher a vous-meme." }, { status: 400 });
  }

  // Un seul comptable par client.
  const { data: existant } = await admin
    .from("team_members")
    .select("id, member_id, status")
    .eq("owner_id", user.id)
    .eq("role", ROLE_COMPTABLE)
    .maybeSingle();

  if (existant && existant.status === "active" && existant.member_id && existant.member_id !== invit.cabinet_id) {
    return NextResponse.json(
      { error: "COMPTABLE_DEJA_ACTIF", message: "Un cabinet a deja acces a votre dossier. Detachez-le avant d'en rattacher un autre." },
      { status: 409 },
    );
  }

  const { data: cab } = await admin.from("profiles").select("company_name, full_name").eq("id", invit.cabinet_id).maybeSingle();
  const { data: cabUser } = await admin.auth.admin.getUserById(invit.cabinet_id);
  // team_members.email est NOT NULL : une adresse absente ne doit pas faire
  // echouer le lien (l'affichage cote client retombe sur « Votre cabinet »).
  const emailCab = cabUser?.user?.email ?? "";
  const nowIso = new Date().toISOString();

  // 1. Reserver le code de facon ATOMIQUE : deux clients qui saisiraient le
  //    meme code au meme instant ne peuvent pas tous deux le consommer.
  const { data: reserve } = await admin
    .from("cabinet_invitations")
    .update({ status: "claimed", claimed_by: user.id, claimed_at: nowIso })
    .eq("id", invit.id)
    .eq("status", "pending")
    .select("id");
  if (!reserve || reserve.length === 0) {
    return NextResponse.json(
      { error: "CODE_INCONNU", message: "Ce code est invalide ou a deja ete utilise." },
      { status: 404 },
    );
  }

  // 2. Creer (ou mettre a jour) le lien. En cas d'echec, le code redevient
  //    utilisable : on ne consomme jamais un code sans avoir rattache le client.
  const { error: erreurLien } = existant
    ? await admin.from("team_members").update({
        member_id: invit.cabinet_id, email: emailCab, status: "active", accepted_at: nowIso,
      }).eq("id", existant.id)
    : await admin.from("team_members").insert({
        owner_id: user.id, member_id: invit.cabinet_id, email: emailCab, role: ROLE_COMPTABLE, status: "active", accepted_at: nowIso,
      });
  if (erreurLien) {
    await admin
      .from("cabinet_invitations")
      .update({ status: "pending", claimed_by: null, claimed_at: null })
      .eq("id", invit.id);
    return NextResponse.json({ error: "Rattachement impossible, reessayez." }, { status: 500 });
  }

  const nomCab = cab?.company_name || cab?.full_name || "votre cabinet";
  return NextResponse.json({ success: true, cabinet: nomCab });
}
