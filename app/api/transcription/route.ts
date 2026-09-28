import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcrireAudio } from "@/lib/openai-transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Transcription d'une dictée : reçoit un court enregistrement audio et renvoie
 * le texte. Réservé aux utilisateurs authentifiés. Ne stocke rien : le texte
 * repart au client, qui l'ajoute au champ que l'utilisateur relit ensuite.
 */

const TAILLE_MAX = 25 * 1024 * 1024; // limite de l'API de transcription
const TAILLE_MIN = 1000; // en dessous, l'enregistrement est vide (aucune parole)

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    if (f instanceof File) audio = f;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!audio) {
    return NextResponse.json({ error: "Aucun audio reçu" }, { status: 400 });
  }
  if (audio.size < TAILLE_MIN) {
    return NextResponse.json(
      { error: "Enregistrement vide", message: "Aucune parole détectée. Réessayez." },
      { status: 400 }
    );
  }
  if (audio.size > TAILLE_MAX) {
    return NextResponse.json(
      { error: "Enregistrement trop long", message: "La dictée est trop longue. Découpez-la." },
      { status: 413 }
    );
  }

  try {
    const texte = await transcrireAudio(audio, audio.name || "dictee.webm");
    return NextResponse.json({ texte });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Transcription impossible",
        message: "La dictée n'a pas pu être transcrite. Réessayez, ou tapez le texte.",
        detail: detail.slice(0, 300),
      },
      { status: 502 }
    );
  }
}
