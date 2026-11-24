/**
 * Règles pures de la relance de pointage, sans aucun import serveur : la page
 * de la facture (composant client) les lit pour afficher la question « A-t-elle
 * été payée ? ». Elles vivaient dans lib/pointage-paiement.ts, qui importe le
 * client Supabase administrateur : le navigateur embarquait tout ce graphe
 * (garde `check:client-pur`). Le détail des règles est en tête de ce fichier-là.
 */

export const ESPACEMENT_JOURS = 7;
export const MAX_DEMANDES = 6;
export const JOUR_MS = 24 * 60 * 60 * 1000;

export type FactureAPointer = {
  id: string;
  invoice_number: string | null;
  status: string;
  invoice_type: string | null;
  due_date: string | null;
  total_ttc: number | null;
  client_name: string | null;
  client_company: string | null;
  superpdp_invoice_id?: string | null;
  pointage_demande_at?: string | null;
  pointage_demande_nb?: number | null;
  pointage_pas_encore_at?: string | null;
};

/** Date du jour en `YYYY-MM-DD`, heure de Paris (le cron tourne en UTC). */
export function jourParis(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Échue et toujours en attente de paiement : à pointer. */
export function estAPointer(f: Pick<FactureAPointer, "status" | "invoice_type" | "due_date">, maintenant: Date): boolean {
  if (f.status !== "sent") return false;
  if (f.invoice_type === "avoir") return false;
  if (!f.due_date) return false;
  return f.due_date.slice(0, 10) < jourParis(maintenant);
}

export function joursDeRetard(dueDate: string, maintenant: Date): number {
  const echeance = new Date(`${dueDate.slice(0, 10)}T00:00:00Z`).getTime();
  const jour = new Date(`${jourParis(maintenant)}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((jour - echeance) / JOUR_MS));
}

