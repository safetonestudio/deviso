/**
 * Relance de pointage : demander au titulaire si une facture échue a été payée.
 *
 * Pourquoi. La déclaration d'encaissement (`fr:212`, prestations de services)
 * et le livre des recettes partent du clic « Marquer comme payée ». L'argent
 * n'arrive jamais chez Deviso : si le titulaire oublie de pointer, rien ne
 * part, et le cabinet ne le découvre qu'après coup. On pose donc la question,
 * par e-mail et sur la facture, jusqu'à obtenir une réponse.
 *
 * Règles (fonctions pures, éprouvées par `test:pointage`) :
 *  - une facture envoyée, hors avoir, dont l'échéance est passée ;
 *  - première question le lendemain de l'échéance ;
 *  - ensuite au plus une question tous les 7 jours, comptés depuis la dernière
 *    question OU la dernière réponse « pas encore » ;
 *  - jamais deux fois le même jour, au plus 6 questions par facture
 *    (au-delà, la bannière de la facture et le cabinet prennent le relais).
 */

export const ESPACEMENT_JOURS = 7;
export const MAX_DEMANDES = 6;
const JOUR_MS = 24 * 60 * 60 * 1000;

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

/** Faut-il poser la question aujourd'hui pour cette facture ? */
export function pointageDu(f: FactureAPointer, maintenant: Date): boolean {
  if (!estAPointer(f, maintenant)) return false;
  const nb = f.pointage_demande_nb ?? 0;
  if (nb >= MAX_DEMANDES) return false;
  const aujourdhui = jourParis(maintenant);
  if (f.pointage_demande_at && jourParis(new Date(f.pointage_demande_at)) === aujourdhui) return false;

  const reperes = [f.pointage_demande_at, f.pointage_pas_encore_at]
    .filter((x): x is string => !!x)
    .map((x) => new Date(x).getTime());
  if (reperes.length === 0) return true;
  return maintenant.getTime() - Math.max(...reperes) >= ESPACEMENT_JOURS * JOUR_MS - 60 * 60 * 1000;
}

/**
 * Demandée au moins deux fois, sans réponse depuis la dernière question :
 * le paiement a peut-être été reçu sans être déclaré. Signal pour le cabinet.
 */
export function sansReponse(f: Pick<FactureAPointer, "status" | "invoice_type" | "due_date" | "pointage_demande_at" | "pointage_demande_nb" | "pointage_pas_encore_at">, maintenant: Date): boolean {
  if (!estAPointer(f, maintenant)) return false;
  if ((f.pointage_demande_nb ?? 0) < 2 || !f.pointage_demande_at) return false;
  if (!f.pointage_pas_encore_at) return true;
  return new Date(f.pointage_pas_encore_at).getTime() < new Date(f.pointage_demande_at).getTime();
}

// ── Le courriel ────────────────────────────────────────────────────────────

const echapper = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const montant = (n: number | null) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n ?? 0);

const dateFr = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

export const AFFICHEES_MAX = 10;

export function lienPointage(base: string, id: string, reponse: "payee" | "pas-encore"): string {
  return `${base.replace(/\/$/, "")}/invoices/${id}?pointage=${reponse}`;
}

export function construirePointage(
  factures: FactureAPointer[],
  opts: { prenom: string | null; base: string; maintenant: Date }
): { sujet: string; html: string; texte: string } {
  const n = factures.length;
  const premiere = factures[0];
  const sujet =
    n === 1
      ? `Facture ${premiere.invoice_number ?? ""} échue · a-t-elle été payée ?`
      : `${n} factures échues à pointer · ont-elles été payées ?`;
  const bonjour = opts.prenom ? `Bonjour ${opts.prenom.split(" ")[0]},` : "Bonjour,";
  const transmises = factures.some((f) => !!f.superpdp_invoice_id);
  const affichees = factures.slice(0, AFFICHEES_MAX);
  const reste = n - affichees.length;

  const intro =
    n === 1
      ? "Cette facture a passé son échéance et n'est pas encore marquée payée dans Deviso."
      : "Ces factures ont passé leur échéance et ne sont pas encore marquées payées dans Deviso.";
  const pourquoi = transmises
    ? "Pour une facture transmise à la plateforme agréée, c'est ce pointage qui déclare l'encaissement à l'administration. La date de paiement compte : elle fixe le mois où la TVA est due."
    : "Ce pointage tient à jour ton livre des recettes et ce que voit ton expert-comptable.";

  const lignesHtml = affichees
    .map((f) => {
      const client = f.client_company || f.client_name || "Client";
      const retard = f.due_date ? joursDeRetard(f.due_date, opts.maintenant) : 0;
      return `<tr><td style="padding:14px 0;border-top:1px solid #e2e8f0;">
        <div style="font-size:15px;font-weight:700;color:#0f172a;">${echapper(f.invoice_number ?? "Facture")} · ${echapper(montant(f.total_ttc))}</div>
        <div style="font-size:13px;color:#64748b;margin:2px 0 10px;">${echapper(client)} · échue le ${f.due_date ? dateFr(f.due_date) : ""} (${retard} jour${retard > 1 ? "s" : ""})</div>
        <a href="${echapper(lienPointage(opts.base, f.id, "payee"))}" style="display:inline-block;background:#047857;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:9px 16px;border-radius:8px;margin-right:8px;">Oui, elle est payée</a>
        <a href="${echapper(lienPointage(opts.base, f.id, "pas-encore"))}" style="display:inline-block;border:1px solid #cbd5e1;color:#334155;text-decoration:none;font-size:14px;font-weight:600;padding:8px 16px;border-radius:8px;">Pas encore</a>
      </td></tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${echapper(sujet)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
<tr><td>
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">${echapper(bonjour)}</p>
<p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">${intro}</p>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">${pourquoi}</p>
<table width="100%" cellpadding="0" cellspacing="0">${lignesHtml}</table>
${reste > 0 ? `<p style="margin:16px 0 0;font-size:14px;color:#64748b;">Et ${reste} autre${reste > 1 ? "s" : ""}, à retrouver dans <a href="${echapper(opts.base)}/invoices" style="color:#4f46e5;">tes factures</a>.</p>` : ""}
<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">« Pas encore » : on te reposera la question dans ${ESPACEMENT_JOURS} jours. Tu reçois ce message parce que ces factures sont échues sans paiement enregistré.</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  const texte = [
    bonjour,
    "",
    intro,
    pourquoi,
    "",
    ...affichees.map((f) => {
      const client = f.client_company || f.client_name || "Client";
      return `${f.invoice_number ?? "Facture"} · ${montant(f.total_ttc)} · ${client} · échue le ${f.due_date ? dateFr(f.due_date) : ""}\n  Payée : ${lienPointage(opts.base, f.id, "payee")}\n  Pas encore : ${lienPointage(opts.base, f.id, "pas-encore")}`;
    }),
    reste > 0 ? `\nEt ${reste} autre${reste > 1 ? "s" : ""} : ${opts.base}/invoices` : "",
    "",
    `« Pas encore » : on te reposera la question dans ${ESPACEMENT_JOURS} jours.`,
  ].join("\n");

  return { sujet, html, texte };
}
