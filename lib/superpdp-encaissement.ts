import { createAdminClient } from "@/lib/supabase/admin";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

export type ResultatEncaissement =
  | { ok: true; dejaEncaissee?: boolean }
  | {
      ok: false;
      raison: "non_transmise" | "non_raccorde" | "verification_en_cours" | "refuse";
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
  invoiceId: string
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

  try {
    const res = await superpdpFetch(workspaceId, "/invoice_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(facture.superpdp_invoice_id),
        status_code: "fr:212",
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      console.error(`[superpdp/encaissement] ${invoiceId} : HTTP ${res.status} ${detail.slice(0, 300)}`);
      return { ok: false, raison: "refuse", detail };
    }

    await admin
      .from("invoices")
      .update({ superpdp_encaisse_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("user_id", workspaceId);

    return { ok: true };
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) return { ok: false, raison: "non_raccorde" };
    if (err instanceof SuperPdpSessionPending) return { ok: false, raison: "verification_en_cours" };
    console.error("[superpdp/encaissement]", err instanceof Error ? err.message : err);
    return { ok: false, raison: "refuse" };
  }
}
