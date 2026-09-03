import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Ce qui a été déclaré au fisc pour CETTE facture.
 *
 * Découvert en sondant le bac à sable le 30/08/2026 : les transactions
 * d'e-reporting B2C sont **créées automatiquement** par Super PDP à partir des
 * factures transmises, avec un champ `invoice_id` qui pointe la facture
 * d'origine. Deviso n'a donc rien à déclarer pour une vente facturée — mais
 * l'utilisateur n'avait aucun moyen de le savoir, ni de vérifier que ça avait
 * bien eu lieu.
 *
 * C'est exactement le genre d'information qui rassure ou qui alerte : « votre
 * vente du 12 a bien été déclarée au titre du flux 10.1 », ou son absence.
 *
 * Lecture seule, filtrée par `invoice_id` — le paramètre existe précisément
 * pour ça sur les deux routes.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
  const admin = createAdminClient();

  const { data: facture } = await admin
    .from("invoices")
    .select("superpdp_invoice_id")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (!facture.superpdp_invoice_id) {
    // Pas une erreur : une facture jamais transmise n'a rien à déclarer.
    return NextResponse.json({ transmise: false, transactions: [], paiements: [], evenements: [] });
  }

  const idPdp = Number(facture.superpdp_invoice_id);

  try {
    const [tx, evs] = await Promise.all([
      superpdpFetch(workspaceId, `/b2c_transactions?invoice_id=${idPdp}&limit=20`),
      // Les événements de cycle de vie, avec leurs blocs de données déclarées.
      //
      // C'est ici que vit la seule preuve consultable de ce qui a été déclaré au
      // titre du paiement : le `fr:212` porte, dans `details[].reported_data`,
      // les montants encaissés par taux de TVA (MDG-43 / MDT-207 = « MEN »).
      // Sans cette lecture, l'utilisateur ne peut ni vérifier ce qui est parti
      // en son nom, ni nous dire ce qui cloche quand ça ne part pas.
      superpdpFetch(workspaceId, `/invoice_events?invoice_id=${idPdp}&limit=100`),
    ]);

    const lireTransactions = tx.ok
      ? ((await tx.json()) as {
          data?: {
            id: number;
            date: string;
            currency: string;
            category_code?: string;
            tax_exclusive_amount?: string;
            tax_total?: string;
            ppf_ereporting_id?: number;
          }[];
        }).data ?? []
      : [];


    const lireEvenements = evs.ok
      ? ((await evs.json()) as {
          data?: {
            id: number;
            status_code: string;
            status_text?: string;
            created_at: string;
            details?: {
              reason?: string;
              reported_data?: Record<string, unknown>[];
              notes?: { contents?: { content?: string }[] }[];
            }[];
          }[];
        }).data ?? []
      : [];

    // ── Les paiements déclarés, rattachés à l'ÉVÉNEMENT et non à la facture ──
    //
    // `GET /b2c_payments` ne connaît pas de paramètre `invoice_id` : la spec ne
    // lui donne que `invoice_event_id` (et `ppf_ereporting_id`). On lui passait
    // `invoice_id`, qui était donc **ignoré en silence** — la route renvoyait
    // les vingt derniers paiements de toute l'entreprise, et cet écran les
    // présentait comme ceux de la facture regardée. Sur une pièce
    // justificative, attribuer à une facture les déclarations d'une autre est
    // pire que ne rien afficher.
    //
    // Le bon rattachement découle de la documentation : « les données
    // d'e-reporting de paiement sont créées à partir du message de cycle de vie
    // Encaissée (212) ». C'est donc l'identifiant de CET événement qui relie un
    // paiement à une facture — d'où la lecture en deux temps.
    const idsEncaissement = lireEvenements
      .filter((e) => e.status_code === "fr:212")
      .map((e) => e.id);

    const paiements: { id: number; date: string | null; declarationId: number | null }[] = [];
    let paiementsLus = true;
    for (const idEvenement of idsEncaissement) {
      const r = await superpdpFetch(
        workspaceId,
        `/b2c_payments?invoice_event_id=${idEvenement}&limit=20`
      );
      if (!r.ok) {
        paiementsLus = false;
        continue;
      }
      const corps = (await r.json()) as {
        data?: { id: number; date?: string; ppf_ereporting_id?: number }[];
      };
      for (const p of corps.data ?? []) {
        paiements.push({
          id: p.id,
          date: p.date ?? null,
          declarationId: p.ppf_ereporting_id ?? null,
        });
      }
    }

    return NextResponse.json({
      evenements: lireEvenements.map((e) => ({
        id: e.id,
        code: e.status_code,
        libelle: e.status_text ?? null,
        le: e.created_at,
        // Le contenu déclaré, tel quel. On ne le résume pas : c'est une pièce
        // justificative, et une pièce résumée ne justifie plus rien.
        details: e.details ?? [],
      })),
      transmise: true,
      transactions: lireTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        montantHt: t.tax_exclusive_amount ?? null,
        tva: t.tax_total ?? null,
        devise: t.currency,
        categorie: t.category_code ?? null,
        // Renseigné une fois la déclaration effectivement déposée : tant qu'il
        // est nul, la transaction est enregistrée mais pas encore envoyée.
        declarationId: t.ppf_ereporting_id ?? null,
      })),
      paiements,
      // Une facture B2B française n'a pas d'e-reporting : elle est acheminée,
      // c'est le circuit lui-même qui informe l'administration. Ne rien trouver
      // n'est donc pas anormal, et l'écran doit le dire plutôt que d'alarmer.
      lecture: tx.ok && evs.ok && paiementsLus ? "complete" : "partielle",
    });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/declaration]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }
}
