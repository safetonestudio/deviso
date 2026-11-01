import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Signalements cibles du cabinet vers le client.
 *
 * Le cabinet, en lecture seule, ne touche pas aux donnees du dossier. Un
 * signalement est un simple message ("il manque le SIREN sur la 2026-012") que
 * le client voit dans son tableau de bord et peut clore. Acces par la cle de
 * service, avec controle applicatif : l'appelant cote cabinet a verifie
 * estComptableDe ; cote client, on borne toujours a l'espace du client.
 */

export type Signalement = {
  id: string;
  cabinet_id: string;
  client_id: string;
  message: string;
  statut: "ouvert" | "traite";
  created_at: string;
  traite_at: string | null;
};

const COLONNES = "id, cabinet_id, client_id, message, statut, created_at, traite_at";

export async function creerSignalement(
  admin: Admin,
  cabinetId: string,
  clientId: string,
  message: string,
): Promise<Signalement | null> {
  const { data, error } = await admin
    .from("cabinet_signalements")
    .insert({ cabinet_id: cabinetId, client_id: clientId, message })
    .select(COLONNES)
    .single();
  if (error) throw new Error(`Signalement non enregistré : ${error.message}`);
  return (data as Signalement) ?? null;
}

/** Signalements d'un dossier, vus du cabinet (bornes au cabinet ET au client). */
export async function signalementsDuDossier(admin: Admin, cabinetId: string, clientId: string): Promise<Signalement[]> {
  const { data, error } = await admin
    .from("cabinet_signalements")
    .select(COLONNES)
    .eq("cabinet_id", cabinetId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Signalement[];
}

/** Signalements ouverts d'un client, pour son tableau de bord (bornes a son espace). */
export async function signalementsOuvertsDuClient(admin: Admin, clientId: string): Promise<Signalement[]> {
  const { data, error } = await admin
    .from("cabinet_signalements")
    .select(COLONNES)
    .eq("client_id", clientId)
    .eq("statut", "ouvert")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Signalement[];
}

/**
 * Le client clot un signalement. L'update est borne a l'id ET a l'espace du
 * client : un identifiant d'un autre espace ne clot rien.
 */
export async function cloreSignalement(admin: Admin, id: string, clientId: string): Promise<boolean> {
  const { data, error } = await admin
    .from("cabinet_signalements")
    .update({ statut: "traite", traite_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("statut", "ouvert")
    .select("id");
  if (error) return false;
  return (data ?? []).length > 0;
}
