import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

// GET /api/proposals/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Sans garde, un appel anonyme repartait avec 404 « devis introuvable » —
  // la RLS bloquait la lecture — au lieu d'un franc 401.
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  // Comparaison à l'espace de travail, pas à la personne. Cette route comparait
  // à `user.id` : un collaborateur recevait 403 sur les devis de son propre
  // espace. Elle avait échappé à la correction d'hier parce qu'elle exprimait
  // le contrôle autrement que les autres — d'où l'intérêt de la traversée.
  if (data.user_id !== workspaceId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({ proposal: data });
}

// PATCH /api/proposals/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Les documents appartiennent à l'espace de travail, pas au collaborateur :
  // filtrer sur user.id renvoyait 404 à tout membre d'équipe, alors que la
  // liste les affichait. Le plan Pro est vendu sur le multi-utilisateurs.
  const workspaceId = await getWorkspaceUserId(user.id);

  const body = await req.json();

  // Liste blanche, comme partout ailleurs dans le projet.
  //
  // Cette route écrivait `body` tel quel. Deux conséquences, et la seconde est
  // la plus lourde :
  //
  //   - `approval_status` étant écrivable, un collaborateur d'un espace où la
  //     validation par le propriétaire est exigée passait outre en une
  //     requête, alors que `/approve` et `/submit-for-approval` gardent
  //     soigneusement le rôle. Le garde-fou vendu avec le plan Pro ne tenait
  //     qu'à ce que personne n'appelle l'API directement ;
  //   - `signed_at`, `signer_name`, `signer_ip`, `signature_hash` l'étaient
  //     aussi. Toute la piste d'audit que la route publique de signature
  //     construit côté serveur — empreinte SHA-256 du document figé, IP,
  //     user-agent, horodatage serveur — était réinscriptible par le vendeur
  //     lui-même. Un devis « signé » ne prouvait donc rien, ce qui est
  //     exactement ce qu'une signature électronique doit prouver.
  //
  // Ce qui suit est ce qu'un utilisateur modifie légitimement sur son devis.
  // Le statut de signature, celui d'approbation et l'horodatage n'en font pas
  // partie : ils se posent par les routes dédiées, qui contrôlent le rôle.
  const MODIFIABLES = new Set([
    "title",
    "client_name",
    "client_company",
    "client_email",
    "client_siren",
    "client_address",
    "client_street",
    "client_postcode",
    "client_city",
    "client_country",
    "items",
    "total_ht",
    "total_ttc",
    "tva_rate",
    "description",
    "notes",
    "payment_terms",
    "valid_until",
    "status",
    "proposal_number",
  ]);

  const modifs = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([k]) => MODIFIABLES.has(k))
  );

  // `status` sert au cycle commercial (brouillon → envoyé → refusé), pas à se
  // déclarer signé : cet état-là n'est posé que par la signature du client.
  if (modifs.status === "signed") {
    return NextResponse.json(
      {
        error: "STATUT_RESERVE",
        message: "Un devis ne passe à « signé » que par la signature du client.",
      },
      { status: 400 }
    );
  }

  if (Object.keys(modifs).length === 0) {
    return NextResponse.json({ error: "Aucun champ modifiable fourni" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("proposals")
    .update(modifs)
    .eq("id", id)
    .eq("user_id", workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data });
}

// DELETE /api/proposals/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", id)
    .eq("user_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
