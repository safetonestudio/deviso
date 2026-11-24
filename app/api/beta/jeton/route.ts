import { NextRequest, NextResponse } from "next/server";
import { lireJeton } from "@/lib/beta-candidatures";

/**
 * GET /api/beta/jeton?j=... : la page d'inscription vérifie le lien personnel
 * d'un candidat accepté avant d'ouvrir le formulaire. Ne consomme rien
 * (l'activation se fait après l'inscription, /api/beta/activer). Renvoie
 * l'adresse liée au lien, que seul son détenteur connaît déjà.
 */
export async function GET(req: NextRequest) {
  const jeton = req.nextUrl.searchParams.get("j") ?? "";
  const r = await lireJeton(jeton);
  if (!r) return NextResponse.json({ valide: false }, { status: 404 });
  return NextResponse.json({ valide: true, email: r.email, typeAcces: r.typeAcces });
}
