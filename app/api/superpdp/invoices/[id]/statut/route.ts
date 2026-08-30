import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { actionDestinataire, CODES_RESERVES } from "@/lib/superpdp-cycle";

/**
 * Pose un statut de cycle de vie sur une facture reçue.
 *
 * Couvre les réponses du destinataire que Deviso n'offrait pas : accusé de
 * réception (`fr:204`), approbation (`fr:205`), suspension (`fr:208`), litige
 * (`fr:207`), clôture (`fr:209`) et signalement de paiement (`fr:211`).
 *
 * Le refus (`fr:210`) et l'encaissement (`fr:212`) gardent leurs routes : le
 * premier est irréversible et exige un motif de la nomenclature, le second
 * appartient au fournisseur. Les faire passer par ici les banaliserait.
 *
 * ⚠️ La spec est explicite sur la nature de l'appel : « Create an invoice event
 * message and **place it in a queue to be sent asynchronously** ». Un 200
 * signifie « accepté dans la file », pas « notifié ». On reflète donc le statut
 * localement tout en sachant que la synchronisation fera foi.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (CODES_RESERVES.has(code)) {
    return NextResponse.json(
      {
        error: "Action dédiée",
        message:
          code === "fr:210"
            ? "Le refus passe par sa propre action, qui exige un motif."
            : "L'encaissement se déclare depuis la facture émise, pas ici.",
      },
      { status: 400 }
    );
  }

  const action = actionDestinataire(code);
  if (!action) {
    return NextResponse.json(
      { error: "Statut inconnu", message: "Cette action n'existe pas." },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  // Appartenance vérifiée avant tout appel : le jeton utilisé est celui du
  // raccordement de cet espace, donc sans ce contrôle on pourrait poser un
  // statut sur la facture d'autrui en devinant un identifiant.
  const { data: facture } = await admin
    .from("superpdp_invoices")
    .select("id, direction, last_status_code")
    .eq("id", Number(id))
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  if (facture.direction !== "in") {
    return NextResponse.json(
      { error: "Sens invalide", message: "Ces réponses ne concernent que les factures reçues." },
      { status: 400 }
    );
  }

  if (facture.last_status_code === code) {
    return NextResponse.json({ pose: true, dejaPose: true, code });
  }

  try {
    // `notes` porte l'explication en clair. Sans elle, le fournisseur reçoit un
    // code et doit deviner ce qui ne va pas : un aller-retour téléphonique par
    // contestation.
    const details = note
      ? [{ notes: [{ contents: [{ content: note }] }] }]
      : undefined;

    const res = await superpdpFetch(workspaceId, "/invoice_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(id),
        status_code: code,
        ...(details ? { details } : {}),
      }),
    });

    const texte = await res.text();
    if (!res.ok) {
      console.error(`[superpdp/statut] ${id} ${code} : HTTP ${res.status} ${texte.slice(0, 300)}`);
      let message = "La Plateforme Agréée a rejeté cette action.";
      try {
        const ko = JSON.parse(texte) as { message?: string };
        if (ko.message) message += ` ${ko.message}`;
      } catch {
        /* réponse non JSON */
      }
      return NextResponse.json({ error: "Action refusée", message }, { status: 502 });
    }

    await admin
      .from("superpdp_invoices")
      .update({ last_status_code: code })
      .eq("id", Number(id))
      .eq("user_id", workspaceId);

    return NextResponse.json({ pose: true, code, libelle: action.libelle });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/statut]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Action impossible" }, { status: 500 });
  }
}
