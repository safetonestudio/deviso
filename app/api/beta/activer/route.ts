import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activerBeta, lireJeton } from "@/lib/beta-candidatures";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/beta/activer?j=... : étape finale de l'inscription d'un candidat
 * accepté. La page d'inscription fait revenir ici après la confirmation de
 * l'adresse (/auth/callback?next=/api/beta/activer?j=...).
 *
 * Exige une session : un lien ouvert sans être connecté (aperçu d'une
 * messagerie, robot) ne consomme rien. Le jeton n'est consommé que pour le
 * compte dont l'adresse est celle de la candidature.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const jeton = req.nextUrl.searchParams.get("j") ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    // Pas connecté : l'inscription, adresse préremplie. Elle propose aussi
    // « Se connecter », qui revient ici, pour qui a déjà un compte.
    const j = await lireJeton(jeton);
    const email = j ? `&email=${encodeURIComponent(j.email)}` : "";
    // Adresse qui a déjà un compte : la connexion, qui revient ici. L'inscription
    // ne lui enverrait aucun courriel (Supabase répond un succès muet).
    if (j) {
      const { data: existant } = await createAdminClient().from("profiles").select("id").eq("email", j.email).limit(1).maybeSingle();
      if (existant) {
        const retour = `/api/beta/activer?j=${encodeURIComponent(jeton)}`;
        return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(retour)}${email}`);
      }
    }
    return NextResponse.redirect(`${origin}/signup?beta=${encodeURIComponent(jeton)}${email}`);
  }

  try {
    const r = await activerBeta(user.id, user.email, jeton);
    // Un compte neuf n'a pas encore de nom d'entreprise : le tableau de bord
    // l'enverrait vers /onboarding en perdant le message. On y va directement.
    const { data: p } = await createAdminClient().from("profiles").select("company_name").eq("id", user.id).maybeSingle();
    const page = p?.company_name ? "/dashboard" : "/onboarding";
    if (!r.ok) return NextResponse.redirect(`${origin}${page}?beta=${r.raison}`);
    // Le cabinet va à son cockpit, pas au démarrage du micro-entrepreneur.
    if (r.typeAcces === "cabinet") return NextResponse.redirect(`${origin}/cabinet?beta=cabinet`);
    return NextResponse.redirect(`${origin}${page}?beta=active`);
  } catch (e) {
    console.error("[beta/activer]", e);
    return NextResponse.redirect(`${origin}/dashboard?beta=erreur`);
  }
}
