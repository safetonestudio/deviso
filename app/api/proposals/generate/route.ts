import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProposal } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérification de l'auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { brief } = await req.json();
    if (!brief || typeof brief !== "string" || brief.trim().length < 10) {
      return NextResponse.json(
        { error: "Brief trop court. Décris ton projet en quelques phrases." },
        { status: 400 }
      );
    }

    const generated = await generateProposal(brief.trim());
    return NextResponse.json({ proposal: generated });
  } catch (error) {
    console.error("[generate-proposal]", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération. Réessaie." },
      { status: 500 }
    );
  }
}
