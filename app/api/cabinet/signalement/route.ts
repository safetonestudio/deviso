import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estComptableDe } from "@/lib/cabinet-acces";
import { creerSignalement } from "@/lib/cabinet-signalements";

/**
 * Signalement du cabinet vers un client (cote cabinet, depuis la fiche).
 *
 * POST { clientId, message }. Le dossier doit etre rattache au cabinet
 * (estComptableDe) : un signalement ne peut viser qu'un client du portefeuille.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!clientId || !message) return NextResponse.json({ error: "Client et message requis" }, { status: 400 });

  const admin = createAdminClient();
  if (!(await estComptableDe(admin, user.id, clientId))) {
    return NextResponse.json({ error: "Dossier hors de votre portefeuille" }, { status: 403 });
  }

  const signalement = await creerSignalement(admin, user.id, clientId, message);
  return NextResponse.json({ signalement });
}
