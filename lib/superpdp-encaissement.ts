import { createAdminClient } from "@/lib/supabase/admin";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

export type ResultatEncaissement =
  | { ok: true; dejaEncaissee?: boolean }
  | {
      ok: false;
      raison:
        | "non_transmise"
        | "non_raccorde"
        | "verification_en_cours"
        | "refuse"
        /** Déclaré auprès de la plateforme, mais pas noté chez nous : ne pas rejouer. */
        | "non_enregistre";
      detail?: string;
    };

/**
 * Envoie le statut de cycle de vie « Encaissée » (fr:212) à Super PDP pour une
 * facture Deviso déjà émise.
 *
 * Statut obligatoire posé par le fournisseur (art. 290 A du CGI, tableau 8 des
 * spécifications externes DGFiP v3.2) — voir CLAUDE.md, section Super PDP.
 *
 * Corps minimal volontaire : `{ invoice_id, status_code: "fr:212" }`, sans
 * `details`. Vérifié en bac à sable le 29/08/2026 : Super PDP calcule
 * lui-même la ventilation des montants par taux de TVA à partir de la
 * facture déjà connue de leur côté (réponse HTTP 200, événement créé avec
 * `amounts` peuplé automatiquement). Envoyer un détail explicite ne serait
 * utile que pour un encaissement partiel, qu'on ne gère pas ici : « Marquer
 * comme payée » sur Deviso ne représente qu'un encaissement total.
 *
 * Appelée depuis deux endroits — le bouton « Marquer comme payée » et le
 * webhook Stripe (paiement par lien) — et centralisée ici pour que les deux
 * chemins se comportent identiquement. Ne pas la dupliquer : c'est
 * exactement le défaut qui avait fait diverger `superpdp_connections` avant
 * la leçon de `saveConnection` (12/08/2026).
 *
 * Best-effort : ne lève jamais d'exception. Un échec de transmission à la PA
 * ne doit pas empêcher Deviso de considérer la facture payée — ce sont deux
 * systèmes distincts. Le résultat typé permet à l'appelant de prévenir
 * l'utilisateur sans bloquer son propre flux.
 */
export async function envoyerEncaissementPdp(
  workspaceId: string,
  invoiceId: string,
  /**
   * Date réelle de l'encaissement, au format `YYYY-MM-DD`.
   *
   * Sans elle, la date retenue est celle de l'appel. Or la TVA sur les
   * prestations de services est exigible **à l'encaissement** : quelqu'un qui
   * pointe le 29 un virement reçu le 12 déclarait une date fausse de dix-sept
   * jours, sur la donnée qui détermine précisément l'exigibilité.
   *
   * Le champ existe dans la spec : `invoice_event_reported_data.date`,
   * « indicates an expected date value, particularly the date of the receipt of
   * payment ». Absente, on n'invente rien et on laisse la plateforme dater.
   */
  dateEncaissement?: string | null
): Promise<ResultatEncaissement> {
  const admin = createAdminClient();

  const { data: facture } = await admin
    .from("invoices")
    .select("id, superpdp_invoice_id, superpdp_encaisse_at")
    .eq("id", invoiceId)
    .eq("user_id", workspaceId)
    .maybeSingle();

  // Facture introuvable ou jamais transmise : rien à faire, et ce n'est pas
  // une erreur. La grande majorité des factures marquées payées ne sont pas
  // passées par Super PDP.
  if (!facture || !facture.superpdp_invoice_id) {
    return { ok: false, raison: "non_transmise" };
  }

  if (facture.superpdp_encaisse_at) {
    return { ok: true, dejaEncaissee: true };
  }

  // On n'accepte qu'une date du passé, au bon format : une date d'encaissement
  // dans le futur n'a pas de sens et serait rejetée bien plus loin, sans
  // message exploitable.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const dateValide =
    dateEncaissement && /^\d{4}-\d{2}-\d{2}$/.test(dateEncaissement) && dateEncaissement <= aujourdhui
      ? dateEncaissement
      : null;

  try {
    const res = await superpdpFetch(workspaceId, "/invoice_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(facture.superpdp_invoice_id),
        status_code: "fr:212",
        // On ne pose `details` que si l'on connaît la date : le corps minimal
        // reste le cas nominal, et la plateforme calcule alors elle-même la
        // ventilation des montants par taux à partir de la facture qu'elle
        // connaît déjà.
        ...(dateValide
          ? { details: [{ reported_data: [{ date: dateValide }] }] }
          : {}),
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      console.error(`[superpdp/encaissement] ${invoiceId} : HTTP ${res.status} ${detail.slice(0, 300)}`);
      return { ok: false, raison: "refuse", detail };
    }

    // `superpdp_encaisse_at` est la SEULE garde d'idempotence de cette
    // fonction (voir le test plus haut). Si le POST réussit et que cette
    // écriture échoue en silence, un second clic sur « Marquer comme payée »
    // réémet un événement d'encaissement — et la donnée d'e-reporting de
    // paiement part en double vers le PPF. On vérifie donc l'erreur, et on le
    // dit clairement à l'appelant plutôt que de répondre « c'est fait ».
    const { error: erreurEcriture } = await admin
      .from("invoices")
      .update({
        superpdp_encaisse_at: dateValide
          ? new Date(`${dateValide}T12:00:00Z`).toISOString()
          : new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("user_id", workspaceId);

    if (erreurEcriture) {
      console.error(`[superpdp/encaissement] ${invoiceId} : encaissement déclaré mais non enregistré — ${erreurEcriture.message}`);
      return {
        ok: false,
        raison: "non_enregistre",
        detail: erreurEcriture.message,
      };
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) return { ok: false, raison: "non_raccorde" };
    if (err instanceof SuperPdpSessionPending) return { ok: false, raison: "verification_en_cours" };
    console.error("[superpdp/encaissement]", err instanceof Error ? err.message : err);
    return { ok: false, raison: "refuse" };
  }
}
