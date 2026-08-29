import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Liste les factures reçues de l'espace de travail, en JSON.
 *
 * Pourquoi cette route existe. La page « Factures reçues » est rendue côté
 * serveur : elle lit la base directement, et rien de ce qu'elle affiche n'était
 * atteignable autrement. Conséquence, le refus d'une facture reçue (fr:210) —
 * l'un des quatre statuts que la DGFiP classe **obligatoires** — était classé
 * « non testable » : aucune traversée ne pouvait retrouver l'identifiant d'une
 * entrante pour la refuser.
 *
 * Un comportement obligatoire qu'on ne peut pas atteindre par programme est un
 * comportement qui ne sera jamais testé. La route rend la réception observable,
 * ce qui est la condition pour qu'elle soit vérifiable.
 *
 * La RLS fait le tri : on passe par le client de session, pas par celui
 * d'administration. Un espace ne voit que ses propres factures.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("superpdp_invoices")
    .select("id, number, issue_date, payment_due_date, seller_name, total_with_vat, currency_code, last_status_code, received_at")
    .eq("direction", "in")
    .order("id", { ascending: false })
    .limit(100);

  // Une lecture qui échoue ne doit pas se présenter comme une absence : c'est
  // le repli silencieux qui a fait chercher des factures inexistantes pendant
  // deux heures le 29/08/2026.
  if (error) {
    return NextResponse.json(
      { error: "Lecture impossible", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ factures: data ?? [] });
}
