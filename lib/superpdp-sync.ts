import { createAdminClient } from "@/lib/supabase/admin";
import {
  getConnection,
  saveConnection,
  superpdpFetch,
  SuperPdpNotConnected,
  SuperPdpSessionPending,
} from "@/lib/superpdp";

/**
 * Synchronisation des factures échangées via la Plateforme Agréée.
 *
 * Super PDP ne nous prévient de rien : il n'y a pas de webhook, c'est à nous
 * d'aller demander ce qui est nouveau. Leur documentation « Synchronisation »
 * décrit le seul procédé qui garantisse de ne rien manquer :
 *
 *   - les id sont des bigint **strictement croissants** ;
 *   - la liste est triée par id croissant ;
 *   - `starting_after_id` ne renvoie que ce qui dépasse un id donné ;
 *   - `has_after` indique qu'il reste des pages.
 *
 * D'où le curseur `last_invoice_id`. Filtrer sur une date de création à la
 * place semblerait équivalent et ne l'est pas — deux écritures concurrentes
 * peuvent produire des dates dans le désordre, et on perdrait des factures sans
 * jamais le voir. C'est le piège que leur documentation prend soin de nommer.
 *
 * Deux détails qui ont dicté la forme du code, constatés sur une vraie facture
 * reçue le 12/08/2026 :
 *   1. la liste est **maigre** — elle ne contient ni montant ni nom de vendeur.
 *      Il faut un appel de détail par facture ;
 *   2. elle contient les deux sens. `direction` vaut `in` ou `out` ; on garde
 *      les deux, l'affichage filtrera.
 */

/** Borne de sécurité : une synchronisation ne doit pas tourner indéfiniment. */
const PAGES_MAX = 20;

export type ResultatSync = {
  recuperees: number;
  entrantes: number;
  jusquA: number | null;
  /** Renseigné quand la synchronisation n'a pas pu se faire. */
  raison?: "non_raccorde" | "verification_en_cours" | "erreur";
  detail?: string;
};

type FactureListe = {
  id: number;
  company_id?: number | string;
  created_at?: string;
  direction: "in" | "out";
  processing_rule?: string;
};

const nombre = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(typeof v === "object" ? (v as { value?: string }).value : v);
  return Number.isFinite(n) ? n : null;
};

/** Une date EN 16931 absente doit rester nulle, pas devenir « aujourd'hui ». */
const date = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;

export async function synchroniserFactures(userId: string): Promise<ResultatSync> {
  const conn = await getConnection(userId);
  if (!conn) return { recuperees: 0, entrantes: 0, jusquA: null, raison: "non_raccorde" };

  const admin = createAdminClient();
  let curseur = conn.last_invoice_id ?? null;
  let recuperees = 0;
  let entrantes = 0;

  try {
    // Rattrapage de l'adresse de réception.
    //
    // Elle est renseignée au moment du raccordement, mais tout raccordement
    // établi avant l'ajout de ce champ l'a laissée vide — et l'écran, qui
    // n'affiche le bloc que si l'adresse existe, ne montrait alors rien du
    // tout. Une migration ne pouvait pas la remplir : l'information est chez
    // Super PDP, pas chez nous. On la récupère donc à la première occasion.
    if (!conn.directory_address) {
      const annuaire = await superpdpFetch(userId, "/directory_entries");
      if (annuaire.ok) {
        const body = (await annuaire.json()) as {
          data?: { id?: number; identifier?: string; is_replyto?: boolean }[];
        };
        const ligne = (body.data ?? []).find((e) => !e.is_replyto);
        if (ligne?.identifier) {
          await saveConnection(userId, {
            directory_address: ligne.identifier,
            directory_id: ligne.id != null ? String(ligne.id) : null,
          });
        }
      }
    }

    for (let page = 0; page < PAGES_MAX; page++) {
      const params = new URLSearchParams();
      if (curseur) params.set("starting_after_id", String(curseur));
      const chemin = `/invoices${params.toString() ? `?${params}` : ""}`;

      const res = await superpdpFetch(userId, chemin);
      if (!res.ok) {
        return {
          recuperees,
          entrantes,
          jusquA: curseur,
          raison: "erreur",
          detail: `HTTP ${res.status} sur ${chemin}`,
        };
      }

      const body = (await res.json()) as { data?: FactureListe[]; has_after?: boolean };
      const lot = body.data ?? [];
      if (lot.length === 0) break;

      for (const brute of lot) {
        // La liste ne porte pas le contenu : un appel de détail par facture.
        const d = await superpdpFetch(userId, `/invoices/${brute.id}`);
        if (!d.ok) continue; // on n'interrompt pas tout le lot pour une facture

        const facture = (await d.json()) as {
          en_invoice?: Record<string, unknown>;
          events?: { status_code?: string }[];
        };
        const en = (facture.en_invoice ?? {}) as Record<string, any>;
        const totaux = (en.totals ?? {}) as Record<string, unknown>;
        const evenements = facture.events ?? [];

        await admin.from("superpdp_invoices").upsert(
          {
            id: brute.id,
            user_id: userId,
            company_id: brute.company_id != null ? String(brute.company_id) : null,
            direction: brute.direction,
            processing_rule: brute.processing_rule ?? null,
            number: en.number ?? null,
            issue_date: date(en.issue_date),
            payment_due_date: date(en.payment_due_date),
            currency_code: en.currency_code ?? null,
            seller_name: en.seller?.name ?? null,
            buyer_name: en.buyer?.name ?? null,
            total_without_vat: nombre(totaux.total_without_vat),
            total_vat: nombre(totaux.total_vat_amount),
            total_with_vat: nombre(totaux.total_with_vat),
            amount_due: nombre(totaux.amount_due_for_payment),
            // Le dernier événement fait foi : ils sont rendus dans l'ordre.
            last_status_code: evenements.at(-1)?.status_code ?? null,
            en_invoice: en,
            received_at: brute.created_at ?? null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        recuperees++;
        if (brute.direction === "in") entrantes++;
        // Le curseur n'avance qu'après écriture réussie : une interruption fait
        // rejouer la facture au prochain passage plutôt que de la sauter.
        curseur = Math.max(curseur ?? 0, brute.id);
      }

      await saveConnection(userId, {
        last_invoice_id: curseur,
        last_sync_at: new Date().toISOString(),
      });

      if (!body.has_after) break;
    }
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return { recuperees, entrantes, jusquA: curseur, raison: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { recuperees, entrantes, jusquA: curseur, raison: "verification_en_cours" };
    }
    const detail = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[superpdp-sync]", detail);
    return { recuperees, entrantes, jusquA: curseur, raison: "erreur", detail };
  }

  // Une synchronisation sans nouveauté est un succès, pas un non-événement :
  // on horodate quand même, sinon l'écran ne peut pas distinguer « rien de
  // nouveau » de « on n'a pas regardé depuis hier ».
  await saveConnection(userId, { last_sync_at: new Date().toISOString() });

  return { recuperees, entrantes, jusquA: curseur };
}
