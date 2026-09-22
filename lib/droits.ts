import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Droits d'un membre invité dans un espace de travail.
 *
 * Modèle arrêté le 22/09/2026 (voir CLAUDE.md, « Membres d'équipe — périmètre
 * d'accès »). Cinq actes réglables par le gérant, chacun autorisé ou non par
 * membre. Le titulaire (user.id == owner de l'espace) a tout, implicitement, et
 * n'est jamais lu dans `team_members`.
 *
 * Ce fichier est LA source de vérité de l'autorisation côté serveur. Une route
 * qui touche à un de ces actes DOIT passer par `exigerActe`. Les blocages durs
 * « titulaire seul » (encaissement, compta, suppression, Stripe, équipe,
 * identité, raccordement PA) passent par `exigerTitulaire`. Les pages gardent
 * leur redirection, mais elle ne remplace jamais ces gardes.
 */
export const ACTES = [
  "envoyer_devis",
  "envoyer_facture",
  "transmettre_pa",
  "deposer_chorus",
  "refuser_facture_recue",
] as const;

export type Acte = (typeof ACTES)[number];
export type Permissions = Record<Acte, boolean>;

/** Défaut à l'invitation : rien. Le gérant ouvre les droits délibérément. */
export const PERMISSIONS_AUCUNE: Permissions = {
  envoyer_devis: false,
  envoyer_facture: false,
  transmettre_pa: false,
  deposer_chorus: false,
  refuser_facture_recue: false,
};

/** Libellés pour l'UI et les messages d'erreur. */
export const LIBELLE_ACTE: Record<Acte, string> = {
  envoyer_devis: "envoyer un devis",
  envoyer_facture: "envoyer une facture",
  transmettre_pa: "transmettre une facture à la Plateforme Agréée",
  deposer_chorus: "déposer une facture sur Chorus Pro",
  refuser_facture_recue: "refuser une facture reçue",
};

/**
 * Normalise un jsonb quelconque en `Permissions` complet.
 *
 * Une clé absente vaut `false` — jamais `true` par défaut : un droit qu'on n'a
 * pas su lire est un droit qu'on n'accorde pas. Toute valeur non strictement
 * `true` est fausse.
 */
export function normaliserPermissions(brut: unknown): Permissions {
  const src = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const out = { ...PERMISSIONS_AUCUNE };
  for (const acte of ACTES) out[acte] = src[acte] === true;
  return out;
}

/** Le titulaire de l'espace : user.id == id du propriétaire. */
export function estTitulaire(userId: string, workspaceId: string): boolean {
  return userId === workspaceId;
}

/**
 * Droits effectifs d'un utilisateur dans un espace.
 *
 * Titulaire ⇒ tout `true`. Membre ⇒ ses droits lus dans `team_members`
 * (member actif). Ligne introuvable ⇒ aucun droit : on n'accorde rien sur une
 * appartenance qu'on ne voit pas.
 */
export async function droitsDe(
  userId: string,
  workspaceId: string,
  admin: SupabaseClient = createAdminClient()
): Promise<Permissions> {
  if (estTitulaire(userId, workspaceId)) {
    return { envoyer_devis: true, envoyer_facture: true, transmettre_pa: true, deposer_chorus: true, refuser_facture_recue: true };
  }
  const { data, error } = await admin
    .from("team_members")
    .select("permissions")
    .eq("owner_id", workspaceId)
    .eq("member_id", userId)
    .eq("status", "active")
    .maybeSingle();
  // Erreur de lecture : on refuse tout plutôt que d'accorder par défaut.
  if (error) {
    console.error(`[droits] lecture des permissions impossible (${workspaceId}/${userId}) : ${error.message}`);
    return { ...PERMISSIONS_AUCUNE };
  }
  return normaliserPermissions(data?.permissions);
}

/** `true` si l'utilisateur a le droit de faire cet acte dans cet espace. */
export async function peutFaire(
  userId: string,
  workspaceId: string,
  acte: Acte,
  admin?: SupabaseClient
): Promise<boolean> {
  const droits = await droitsDe(userId, workspaceId, admin);
  return droits[acte] === true;
}

/** Réponse 403 « titulaire seul ». */
export function refusTitulaire(): NextResponse {
  return NextResponse.json(
    { error: "RESERVE_TITULAIRE", message: "Cette action est réservée au titulaire du compte." },
    { status: 403 }
  );
}

/** Réponse 403 « acte non autorisé pour ce membre ». */
export function refusActe(acte: Acte): NextResponse {
  return NextResponse.json(
    {
      error: "PERMISSION_REFUSEE",
      acte,
      message: `Vous n'avez pas l'autorisation de ${LIBELLE_ACTE[acte]}. Demandez-la au titulaire du compte.`,
    },
    { status: 403 }
  );
}

/**
 * Garde « titulaire seul ». Retourne une réponse 403 à renvoyer telle quelle si
 * l'appelant n'est pas le titulaire, sinon `null` (on continue).
 *
 *   const refus = exigerTitulaire(user.id, workspaceId);
 *   if (refus) return refus;
 */
export function exigerTitulaire(userId: string, workspaceId: string): NextResponse | null {
  return estTitulaire(userId, workspaceId) ? null : refusTitulaire();
}

/**
 * Garde d'un acte réglable. Retourne 403 si le membre n'a pas le droit, sinon
 * `null`. Le titulaire passe toujours.
 *
 *   const refus = await exigerActe(user.id, workspaceId, "transmettre_pa");
 *   if (refus) return refus;
 */
export async function exigerActe(
  userId: string,
  workspaceId: string,
  acte: Acte,
  admin?: SupabaseClient
): Promise<NextResponse | null> {
  return (await peutFaire(userId, workspaceId, acte, admin)) ? null : refusActe(acte);
}
