import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estAdmin } from "@/lib/admin";
import { accepter, inviterDirectement, refuser } from "@/lib/beta-candidatures";

/**
 * POST /api/admin/beta : décisions de Selim sur les candidatures (page
 * /admin/beta). Réservé aux adresses ADMIN_EMAILS ; tout autre appel reçoit
 * une 404, comme la page.
 *
 *   { action: "accepter", id }            ouvre l'accès, envoie le lien
 *   { action: "refuser", id }             courriel de refus
 *   { action: "inviter", nom, email, type } invitation directe (testeur | cabinet)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estAdmin(user.email)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let corps: Record<string, unknown>;
  try {
    corps = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  try {
    if (corps.action === "accepter" && typeof corps.id === "string") {
      await accepter(corps.id);
    } else if (corps.action === "refuser" && typeof corps.id === "string") {
      await refuser(corps.id);
    } else if (corps.action === "inviter") {
      const nom = typeof corps.nom === "string" ? corps.nom.trim() : "";
      const email = typeof corps.email === "string" ? corps.email.trim() : "";
      const type = corps.type === "cabinet" ? "cabinet" : "testeur";
      if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return NextResponse.json({ error: "Nom et adresse e-mail valides requis." }, { status: 400 });
      }
      await inviterDirectement(nom, email, type);
    } else {
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur inconnue." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
