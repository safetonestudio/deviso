import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { generateFacturXml } from "@/lib/invoice-xml";
import { toSiren } from "@/lib/facturx-helpers";
import type { Invoice } from "@/types";

/**
 * Émet une facture Deviso vers la Plateforme Agréée.
 *
 * C'est l'étape qui débloque le reste : tant qu'une facture n'existe pas chez
 * Super PDP, aucun statut de cycle de vie ne peut s'y accrocher — « Encaissée »
 * (212), pourtant obligatoire, n'a rien à quoi se rattacher.
 *
 * On envoie le **XML CII** et non le PDF Factur-X : la plateforme n'a besoin que
 * des données structurées, et c'est ce que leur route accepte en multipart —
 * vérifié le 12/08/2026 en envoyant une facture entre deux entreprises du bac à
 * sable.
 *
 * Le destinataire n'est pas passé en paramètre : il est **dans le XML**, sous
 * forme d'adresse électronique de facturation (BT-49, `URIID schemeID="0225"`),
 * dérivée du SIREN du client. D'où le contrôle préalable ci-dessous : sans SIREN
 * client, la facture n'est adressable à personne.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Déjà transmise : on ne réémet pas. Une facture envoyée deux fois arriverait
  // en double chez le client et déclencherait un refus pour « DOUBLON ».
  if (facture.superpdp_invoice_id) {
    return NextResponse.json({
      emise: true,
      dejaEmise: true,
      superpdpId: facture.superpdp_invoice_id,
    });
  }

  // Contrôles préalables, formulés en français plutôt que renvoyés bruts par la
  // plateforme. Le principe retenu sur ce projet est qu'aucun champ n'est
  // obligatoire à la création d'une facture ; la contrepartie est de dire
  // clairement, au moment de l'émission, ce qui manque et pourquoi.
  const manques: string[] = [];
  if (!toSiren(facture.seller_siren)) {
    manques.push("votre SIREN (à renseigner dans Paramètres)");
  }
  if (!toSiren(facture.client_siren)) {
    manques.push(`le SIREN de ${facture.client_name || "votre client"}`);
  }
  if (manques.length) {
    return NextResponse.json(
      {
        error: "Informations manquantes",
        message:
          "Impossible de transmettre cette facture sans " +
          manques.join(" et ") +
          ". L'adresse de facturation électronique du destinataire en est déduite.",
        manques,
      },
      { status: 400 }
    );
  }

  try {
    const xml = generateFacturXml(facture as unknown as Invoice);

    const formulaire = new FormData();
    formulaire.append(
      "file",
      new Blob([xml], { type: "application/xml" }),
      `${facture.invoice_number || facture.id}.xml`
    );

    const res = await superpdpFetch(workspaceId, "/invoices", {
      method: "POST",
      body: formulaire,
    });

    const texte = await res.text();

    if (!res.ok) {
      // On conserve l'erreur : sans elle, l'utilisateur voit « échec » sans
      // savoir quoi corriger, et nous non plus.
      const detail = texte.slice(0, 1000);
      await admin
        .from("invoices")
        .update({ superpdp_error: detail, superpdp_status_date: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", workspaceId);

      console.error(`[superpdp/emettre] ${id} : HTTP ${res.status} ${detail.slice(0, 300)}`);
      return NextResponse.json(
        {
          error: "Transmission refusée",
          message:
            "La Plateforme Agréée a refusé la facture. Le détail est enregistré sur la facture.",
          detail,
        },
        { status: 502 }
      );
    }

    const reponse = JSON.parse(texte) as {
      id?: number;
      events?: { status_code?: string }[];
    };

    await admin
      .from("invoices")
      .update({
        superpdp_invoice_id: reponse.id != null ? String(reponse.id) : null,
        superpdp_status: reponse.events?.at(-1)?.status_code ?? "api:uploaded",
        superpdp_status_date: new Date().toISOString(),
        superpdp_error: null,
      })
      .eq("id", id)
      .eq("user_id", workspaceId);

    return NextResponse.json({ emise: true, superpdpId: reponse.id });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json(
        {
          error: "Non raccordé",
          message: "Raccordez votre entreprise à la Plateforme Agréée depuis vos paramètres.",
        },
        { status: 409 }
      );
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json(
        {
          error: "Vérification en cours",
          message: "Super PDP vérifie encore le rattachement de votre entreprise.",
        },
        { status: 409 }
      );
    }
    console.error("[superpdp/emettre]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Transmission impossible" }, { status: 500 });
  }
}
