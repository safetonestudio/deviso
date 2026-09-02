import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { numeroDocument } from "@/lib/numerotation";

/**
 * Crée l'avoir qui annule une facture.
 *
 * Pourquoi cette route existe. Sous la réforme, **une facture transmise ne se
 * modifie plus**. Elle est partie chez le destinataire et, par le circuit,
 * chez l'administration ; la corriger sur place n'aurait aucun sens puisque la
 * version corrigée ne remplacerait rien. Le seul instrument de correction est
 * l'avoir — un second document, de type 381, qui annule le premier.
 *
 * Et ce n'est pas une commodité : le refus (`fr:210`) est **terminal**. Le
 * destinataire qui refuse une facture pour une virgule oblige le fournisseur à
 * passer un avoir, sans alternative. Jusqu'ici, un utilisateur de Deviso dont
 * la facture était refusée n'avait rien pour régulariser — il devait rouvrir
 * son ancien outil, ou fabriquer le document à la main.
 *
 * ⚠️ Les montants d'un avoir sont **POSITIFS**. C'est contre-intuitif et c'est
 * la règle BR-27 : le prix unitaire net d'une ligne ne peut pas être négatif.
 * Ce n'est pas le signe des montants qui dit « on rend l'argent », c'est le
 * type du document (381 au lieu de 380). Une tentative d'avoir à montants
 * négatifs est refusée par le validateur officiel.
 *
 * On copie la facture d'origine plutôt que de demander une ressaisie : un avoir
 * total est le cas courant, et le retaper est l'occasion de se tromper sur les
 * montants — précisément ce qu'un document de régularisation ne doit pas faire.
 * L'avoir naît en brouillon : l'utilisateur peut réduire les lignes pour un
 * avoir partiel avant de le transmettre.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const { data: origine, error: lecture } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (lecture) {
    return NextResponse.json({ error: "Lecture impossible", message: lecture.message }, { status: 500 });
  }
  if (!origine) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Un avoir d'avoir n'a pas de sens : pour rendre un avoir sans effet, on
  // émet la facture correspondante.
  if (origine.invoice_type === "avoir") {
    return NextResponse.json(
      {
        error: "Document invalide",
        message: "Un avoir ne s'annule pas par un autre avoir. Émettez une facture.",
      },
      { status: 400 }
    );
  }

  // Un brouillon se corrige : il n'est parti nulle part. Proposer un avoir
  // dessus fabriquerait deux documents là où une modification suffit, et la
  // numérotation en garderait la trace pour toujours.
  if (origine.status === "draft") {
    return NextResponse.json(
      {
        error: "Facture non émise",
        message:
          "Cette facture est encore un brouillon : modifiez-la directement. " +
          "Un avoir ne sert qu'à corriger une facture déjà envoyée.",
      },
      { status: 400 }
    );
  }

  // Une facture ne s'annule pas deux fois. Sans ce contrôle, deux clics
  // produiraient deux avoirs, donc un crédit du double du montant — et chez le
  // client, une écriture comptable de trop.
  const { data: dejaAvoir } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("user_id", workspaceId)
    .eq("invoice_type", "avoir")
    .eq("linked_invoice_id", id)
    .maybeSingle();

  if (dejaAvoir) {
    return NextResponse.json(
      {
        error: "Avoir déjà établi",
        message: `L'avoir ${dejaAvoir.invoice_number} annule déjà cette facture.`,
        avoirId: dejaAvoir.id,
      },
      { status: 409 }
    );
  }

  let numero: string;
  try {
    numero = await numeroDocument(supabase, workspaceId, "avoir");
  } catch (err) {
    return NextResponse.json(
      {
        error: "NUMEROTATION_INDISPONIBLE",
        message: err instanceof Error ? err.message : "Numérotation indisponible.",
      },
      { status: 500 }
    );
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);

  // On reprend tout de la facture d'origine — parties, adresses, lignes,
  // montants, régime de TVA — et on ne change QUE ce qui fait de ce document
  // un avoir. Énumérer les champs à copier plutôt que ceux à écarter ferait
  // manquer, au premier champ ajouté, une information que l'avoir doit porter
  // à l'identique pour annuler quoi que ce soit.
  //
  // Rien de l'histoire de la facture d'origine ne se transmet : l'avoir est un
  // document neuf, jamais transmis, jamais payé, jamais relancé. Recopier un
  // `superpdp_invoice_id` serait le pire des cas — l'avoir se croirait déjà
  // émis et ne partirait jamais.
  const ecarte = new Set([
    "id",
    "created_at",
    "updated_at",
    "invoice_number",
    "superpdp_invoice_id",
    "superpdp_status",
    "superpdp_status_date",
    "superpdp_error",
    "superpdp_encaisse_at",
    "superpdp_adresse_source",
    "superpdp_emission_debutee_at",
    "paid_at",
    "payment_link_url",
    "reminder_count",
    "last_reminder_at",
    "sent_at",
    "viewed_at",
    "chorus_pro_ref",
    "chorus_pro_status",
    "chorus_pro_submitted_at",
  ]);
  const reprise = Object.fromEntries(
    Object.entries(origine as Record<string, unknown>).filter(([k]) => !ecarte.has(k))
  );

  const { data: avoir, error } = await supabase
    .from("invoices")
    .insert({
      ...reprise,
      user_id: workspaceId,
      invoice_number: numero,
      invoice_type: "avoir",
      // 381 « Note de crédit commerciale ». C'est ce code, et lui seul, qui dit
      // que les montants doivent être rendus.
      type_code: "381",
      linked_invoice_id: id,
      status: "draft",
      issue_date: aujourdhui,
      // Un avoir n'est dû à aucune date : il n'y a rien à payer. Recopier
      // l'échéance de la facture annulée parlerait d'un paiement qui n'aura
      // pas lieu.
      due_date: aujourdhui,
      title: origine.invoice_number ? `Avoir sur facture ${origine.invoice_number}` : "Avoir",
      notes: [`Avoir annulant la facture ${origine.invoice_number ?? ""}`.trim(), origine.notes ?? ""]
        .filter(Boolean)
        .join("\n"),
    })
    .select()
    .single();

  if (error) {
    console.error(`[invoices/avoir] ${id} :`, error.message);
    return NextResponse.json({ error: "Création impossible", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ avoir });
}
