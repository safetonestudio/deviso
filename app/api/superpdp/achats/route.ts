import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import {
  validerSaisie,
  transmettreAchat,
  type SaisieAchat,
  type AchatInternational,
} from "@/lib/superpdp-achats";

/**
 * Achats internationaux — e-reporting des acquisitions auprès de fournisseurs
 * étrangers. Réservé au titulaire de l'espace (comme les pages « Factures
 * reçues » et « Déclarations » qui l'affichent) : c'est une obligation
 * déclarative de l'entreprise, pas un acte délégable à un membre.
 */

export async function GET() {
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
  const { data, error } = await admin
    .from("superpdp_achats_int")
    .select("*")
    .eq("user_id", workspaceId)
    .order("date_facture", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Lecture impossible", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ achats: data ?? [] });
}

export async function POST(req: NextRequest) {
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
      {
        error: "Informations manquantes",
        message: `Il manque ${manques.join(", ")}.`,
        manques,
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Stockage d'abord : la déclaration peut être refusée temporairement par la
  // fenêtre de déclaration de la Plateforme Agréée. On ne veut pas perdre la
  // saisie de l'utilisateur si la transmission ne passe pas du premier coup.
  const { data: achat, error: erreurInsert } = await admin
    .from("superpdp_achats_int")
    .insert({
      user_id: workspaceId,
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
      transmission_status: "en_attente",
    })
    .select("*")
    .single();

  if (erreurInsert || !achat) {
    return NextResponse.json(
      { error: "Enregistrement impossible", message: erreurInsert?.message ?? "" },
      { status: 500 }
    );
  }

  // Tentative de transmission immédiate. Le verdict décide du statut : transmis,
  // en attente (réessai automatique ultérieur), ou échec (refus réel).
  const resultat = await transmettreAchat(workspaceId, achat as AchatInternational);

  const patch = resultat.ok
    ? {
        transmission_status: "transmis" as const,
        superpdp_id: resultat.superpdpId,
        transmission_error: null,
        transmitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : {
        transmission_status: resultat.reessayable ? ("en_attente" as const) : ("echec" as const),
        transmission_error: resultat.detail.slice(0, 1000),
        updated_at: new Date().toISOString(),
      };

  await admin.from("superpdp_achats_int").update(patch).eq("id", achat.id).eq("user_id", workspaceId);

  return NextResponse.json({
    achat: { ...achat, ...patch },
    transmission: resultat,
  });
}
