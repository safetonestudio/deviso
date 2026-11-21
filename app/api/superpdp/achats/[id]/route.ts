import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import {
  validerSaisie,
  champsTva,
  transmettreAchat,
  patchStatut,
  refusSiDeclare,
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
    .select("id, numero, transmission_status, superpdp_id, ppf_ereporting_id, fournisseur_tva, date_facture, montant_ht")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!existant) {
    return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
  }
  // Vérifié AVANT d'écrire : une correction ne doit jamais réécrire un achat
  // que la plateforme a déjà reçu (réponse perdue), ni le redéclarer.
  const refusPa = await refusSiDeclare(admin, workspaceId, existant as AchatInternational, "modifié");
  if (refusPa) return NextResponse.json({ error: refusPa.error, message: refusPa.message }, { status: refusPa.status });

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
    ...champsTva(corps),
    // Montant, devise ou date peuvent avoir changé : la conversion en euros
    // (lib/achats-export.ts) sera refaite au prochain export.
    taux_change: null,
    date_taux_change: null,
    montant_ht_eur: null,
    montant_tva_eur: null,
  };
  if (!/^[A-Z]{3}$/.test(champs.devise)) {
    return NextResponse.json({ error: "Devise invalide", message: "La devise doit être un code à trois lettres (EUR, USD, GBP…)." }, { status: 400 });
  }

  // Garde face au réessai automatique : jamais d'écriture sur un achat transmis entre-temps.
  const { data: achat, error: errMaj } = await admin
    .from("superpdp_achats_int")
    .update(champs)
    .eq("id", id)
    .eq("user_id", workspaceId)
    .neq("transmission_status", "transmis")
    .is("superpdp_id", null)
    .select("*")
    .maybeSingle();
  if (!errMaj && !achat) {
    return NextResponse.json({ error: "Déjà transmis", message: "Cet achat vient d'être transmis : il ne peut plus être modifié." }, { status: 409 });
  }

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

/**
 * Supprime un achat saisi par erreur (doublon, mauvais fournisseur), tant
 * qu'il n'a pas été transmis (20/11/2026). Titulaire seul, comme la saisie.
 *
 * Un achat transmis ne se supprime JAMAIS : sa déclaration existe chez la
 * Plateforme Agréée, la pièce doit rester. On le reconnaît à son statut, mais
 * aussi à toute trace d'envoi (identifiant chez la plateforme, e-reporting
 * parti), et l'on vérifie chez la plateforme qu'aucune déclaration n'y existe
 * sous ce numéro (réponse perdue après un envoi réussi). Au moindre doute, on
 * refuse.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const admin = createAdminClient();
  const { data: achat } = await admin
    .from("superpdp_achats_int")
    .select("id, numero, transmission_status, superpdp_id, ppf_ereporting_id, fournisseur_tva, date_facture, montant_ht")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();
  if (!achat) return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });

  const refusPa = await refusSiDeclare(admin, workspaceId, achat as AchatInternational, "supprimé");
  if (refusPa) return NextResponse.json({ error: refusPa.error, message: refusPa.message }, { status: refusPa.status });

  // Le statut est revérifié dans la suppression même : une transmission du
  // cron entre la lecture et ici ne doit pas être effacée.
  const { data: supprimes, error } = await admin
    .from("superpdp_achats_int")
    .delete()
    .eq("id", id)
    .eq("user_id", workspaceId)
    .neq("transmission_status", "transmis")
    .is("superpdp_id", null)
    .is("ppf_ereporting_id", null)
    .select("id");
  if (error) return NextResponse.json({ error: "Suppression impossible", message: error.message }, { status: 500 });
  if (!supprimes || supprimes.length === 0) {
    return NextResponse.json(
      { error: "Déjà transmis", message: "Cet achat vient d'être transmis : il ne peut plus être supprimé." },
      { status: 409 }
    );
  }
  return NextResponse.json({ supprime: true });
}
