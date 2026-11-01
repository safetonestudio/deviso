import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Journal des acces et exports du cockpit cabinet.
 *
 * Le cockpit lit les dossiers avec la cle de service (hors RLS). Pour la
 * confiance du cabinet comme du client, chaque consultation de dossier et
 * chaque export y laisse une trace. L'ecriture est best-effort : elle ne doit
 * jamais faire echouer la consultation ou l'export qu'elle accompagne.
 */

export type ActionJournal = "consultation" | "export_fec" | "export_csv";

export type EntreeJournal = {
  id: string;
  client_id: string | null;
  action: ActionJournal;
  details: string | null;
  created_at: string;
};

export async function journaliser(
  admin: Admin,
  cabinetId: string,
  action: ActionJournal,
  clientId: string | null,
  details: string | null = null,
): Promise<void> {
  const { error } = await admin
    .from("cabinet_journal")
    .insert({ cabinet_id: cabinetId, client_id: clientId, action, details });
  if (error) console.warn(`journal cabinet non ecrit (${action}) : ${error.message}`);
}

export async function lireJournal(admin: Admin, cabinetId: string, limite = 100): Promise<EntreeJournal[]> {
  const { data, error } = await admin
    .from("cabinet_journal")
    .select("id, client_id, action, details, created_at")
    .eq("cabinet_id", cabinetId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) return [];
  return (data ?? []) as EntreeJournal[];
}

export const LIBELLE_ACTION: Record<ActionJournal, string> = {
  consultation: "Consultation du dossier",
  export_fec: "Export FEC",
  export_csv: "Export CSV des factures",
};
