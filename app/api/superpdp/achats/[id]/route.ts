import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import {
  validerSaisie,
  transmettreAchat,
  patchStatut,
  type SaisieAchat,
  type AchatInternational,
} from "@/lib/superpdp-achats";

/**
 * Corrige un achat international non encore declare, puis retente la
 * transmission. C'est le chemin qui evite tout blocage : ajouter l'identifiant
 * fiscal du fournisseur (TVA UE ou identifiant etranger), corriger un pays ou un
 * montant, et la declaration repart. On ne touche pas a un achat deja transmis :
 * sa declaration existe chez la Plateforme Agreee.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const refus = exigerTitulaire(user.id, workspaceId);
  if (refus) return refus;

  let corps: Partial<SaisieAchat>;
  try {
    corps = (await req.json()) as Partial<SaisieAchat>;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const manques = validerSaisie(corps);
  if (manques.length) {
    return NextResponse.json(
      { error: "Informations manquantes", message: `Il manque ${manques.join(", ")}.`, manques },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: existant } = await admin
    .from("superpdp_achats_int")
    .select("transmission_status")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!existant) {
    return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
  }
  if (existant.transmission_status === "transmis") {
    return NextResponse.json(
      {
        error: "Déjà déclaré",
        message: "Cet achat a déjà été transmis à la Plateforme Agréée et ne peut plus être modifié.",
      },
      { status: 409 }
    );
  }

  const champs = {
    fournisseur_nom: corps.fournisseur_nom!.trim(),
    fournisseur_pays: corps.fournisseur_pays!.trim().toUpperCase(),
    fournisseur_tva: corps.fournisseur_tva?.trim() || null,
    numero: corps.numero?.trim() || null,
    date_facture: corps.date_facture!,
    categorie: corps.categorie!,
    devise: (corps.devise?.trim() || "EUR").toUpperCase(),
    montant_ht: Number(corps.montant_ht),
    taux_tva: Number(corps.taux_tva),
    montant_tva: Number(corps.montant_tva),
  };

  const { data: achat, error: errMaj } = await admin
    .from("superpdp_achats_int")
    .update(champs)
    .eq("id", id)
    .eq("user_id", workspaceId)
    .select("*")
    .single();

  if (errMaj || !achat) {
    return NextResponse.json(
      { error: "Modification impossible", message: errMaj?.message ?? "" },
      { status: 500 }
    );
  }

  // L'utilisateur vient de corriger : on repart d'un compteur de reessais neuf.
  const resultat = await transmettreAchat(workspaceId, achat as AchatInternational);
  const patch = { ...patchStatut(resultat), retry_count: 0 };
  await admin.from("superpdp_achats_int").update(patch).eq("id", achat.id).eq("user_id", workspaceId);

  return NextResponse.json({ achat: { ...achat, ...patch }, transmission: resultat });
}
