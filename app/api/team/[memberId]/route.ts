import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { synchroniserSieges } from "@/lib/stripe-seats";

type Params = { params: Promise<{ memberId: string }> };

// DELETE /api/team/[memberId], retirer un membre
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = createAdminClient();

  // Récupérer le membre avant suppression pour savoir s'il était actif
  const { data: member } = await admin
    .from("team_members")
    .select("status")
    .eq("id", memberId)
    .eq("owner_id", user.id)
    .single();

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Réaligner les sièges facturés, quel que soit le statut du membre retiré.
  //
  // L'appel était conditionné à `status === "active"`, ce qui suffisait tant
  // qu'il s'agissait de décrémenter un compteur. Ce n'en est plus un : la
  // fonction lit les membres actifs et pose la quantité juste. La rappeler
  // sans raison ne coûte rien — elle sort d'elle-même si la quantité est déjà
  // bonne — et c'est précisément ce qui lui permet de RÉPARER une divergence
  // au lieu de la propager.
  //
  // Un échec ici coûte de l'argent au propriétaire : le collaborateur n'a plus
  // accès, mais le siège reste facturé tous les mois. Le `catch` vide rendait
  // la situation indétectable — personne ne peut régulariser ce que personne
  // ne sait.
  await synchroniserSieges(user.id).catch((err) => {
    console.error(
      `[team/DELETE] sièges NON synchronisés pour l'espace ${user.id} ` +
        `(membre ${memberId}, statut ${member?.status ?? "inconnu"}) : ` +
        `un siège peut continuer d'être facturé.`,
      err
    );
  });

  return NextResponse.json({ success: true });
}
