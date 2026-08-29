import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import type { ProposalItem } from "@/types";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { resolveAddress } from "@/lib/address";

// GET /api/invoices
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const workspaceId = await getWorkspaceUserId(user.id);

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

// POST /api/invoices
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getWorkspaceUserId(user.id);
  // Bloquer les utilisateurs Free (pas de factures)
  const profile = await getWorkspaceProfile<{ plan: string | null, payment_method: string | null }>(
    workspaceId,
    "plan, payment_method"
  );

  if (!profile || profile.plan === "free") {
    return NextResponse.json(
      { error: "PLAN_REQUIRED", message: "La création de factures nécessite le plan Solo ou Pro." },
      { status: 403 }
    );
  }

  // Bloquer si aucun moyen de paiement configuré
  if (!profile.payment_method || profile.payment_method === "none") {
    return NextResponse.json(
      {
        error: "PAYMENT_NOT_CONFIGURED",
        message: "Configurez votre moyen de paiement dans l'onglet Paiements avant de créer une facture.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const invoiceType = body.invoice_type || "standard";

  // Génère le numéro de facture auto si absent.
  //
  // ⚠️ Aucun numéro de repli. La version précédente écrivait
  // `numData || "YYYY-001"` : quand la séquence échouait, chaque facture du
  // compte recevait le même numéro, en silence. C'est exactement ce qui s'est
  // produit — la fonction SQL n'était pas exécutable par le rôle
  // `authenticated`, l'appel échouait à tous les coups, et un compte de test a
  // accumulé quinze factures « 2026-001 » sans que rien ne le signale.
  //
  // L'article 242 nonies A du CGI impose une numérotation chronologique,
  // continue et sans doublon. Un numéro inventé pour éviter une erreur produit
  // donc une facture irrégulière, ce qui est plus grave que l'échec qu'il
  // masque. On refuse de créer la facture plutôt que d'en créer une fausse.
  let invoiceNumber = body.invoice_number;
  if (!invoiceNumber) {
    // Séquence atomique via document_sequences : AC-YYYY-NNN ou YYYY-NNN,
    // continue et sans concurrence possible.
    const fonction = invoiceType === "acompte" ? "next_acompte_number" : "next_invoice_number";
    const { data: numData, error: numErr } = await supabase
      .rpc(fonction, { p_user_id: workspaceId });

    if (numErr || !numData) {
      console.error(`[invoices] numérotation ${fonction} :`, numErr?.message ?? "aucun numéro renvoyé");
      return NextResponse.json(
        {
          error: "NUMEROTATION_INDISPONIBLE",
          message:
            "Le numéro de facture n'a pas pu être attribué. La facture n'a pas été créée : " +
            "mieux vaut réessayer que produire un numéro en doublon, interdit par la réglementation.",
        },
        { status: 500 }
      );
    }
    invoiceNumber = numData;
  }

  // Adresses : on dérive la forme affichable des champs saisis, des deux côtés.
  // Rien n'est requis — une facture doit pouvoir être créée avec une adresse
  // incomplète, quitte à ce que la bannière de conformité le signale ensuite.
  const clientAddr = resolveAddress(
    { street: body.client_street, postcode: body.client_postcode, city: body.client_city },
    body.client_address
  );
  const sellerAddr = resolveAddress(
    { street: body.seller_street, postcode: body.seller_postcode, city: body.seller_city },
    body.seller_address
  );

  const itemsWithIds = ((body.items || []) as ProposalItem[]).map((item) => ({
    ...item,
    id: item.id || uuidv4(),
  }));

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      ...body,
      client_street: clientAddr.street,
      client_postcode: clientAddr.postcode,
      client_city: clientAddr.city,
      client_country: clientAddr.country,
      client_address: clientAddr.formatted,
      seller_street: sellerAddr.street,
      seller_postcode: sellerAddr.postcode,
      seller_city: sellerAddr.city,
      seller_country: sellerAddr.country,
      seller_address: sellerAddr.formatted,
      user_id: workspaceId,
      created_by: user.id,
      invoice_number: invoiceNumber,
      items: itemsWithIds,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data }, { status: 201 });
}
