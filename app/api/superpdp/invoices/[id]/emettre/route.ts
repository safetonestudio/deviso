import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, getConnection, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { generateFacturXml } from "@/lib/invoice-xml";
import { isB2CInvoice } from "@/lib/facturx-helpers";
import { manquesPourEmission, phraseManques } from "@/lib/superpdp-precontrole";
import { resoudreAdresseClient } from "@/lib/superpdp-annuaire";
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
  // plateforme. La règle vit dans lib/superpdp-precontrole.ts et sert aussi à
  // l'interface : elle sait donc AVANT le clic si la transmission peut aboutir.
  const isB2C = isB2CInvoice(facture as unknown as Invoice);

  const manques = manquesPourEmission(facture);
  if (manques.length) {
    return NextResponse.json(
      { error: "Informations manquantes", message: phraseManques(manques), manques },
      { status: 400 }
    );
  }

  try {
    // Adresse électronique et numéro d'entreprise réellement enregistrés par
    // Super PDP pour NOUS (le vendeur) — voir generateFacturXml pour le
    // pourquoi. Les deux viennent du raccordement plutôt que du profil : c'est
    // ce que la Plateforme Agréée connaît de nous qui fait foi à l'émission,
    // pas ce que l'utilisateur a saisi.
    const connexion = await getConnection(workspaceId);

    // Adresse d'acheminement du destinataire : lue dans l'Annuaire plutôt que
    // fabriquée à partir du SIREN. Voir lib/superpdp-annuaire.ts pour l'ordre
    // de priorité et pourquoi la fabrication était fausse.
    const { adresse: adresseClient, source: sourceAdresse } = isB2C
      ? { adresse: null, source: "aucune" as const }
      : await resoudreAdresseClient(workspaceId, facture);

    const xml = generateFacturXml(
      facture as unknown as Invoice,
      undefined,
      undefined,
      connexion?.directory_address ?? null,
      connexion?.company_number ?? null,
      adresseClient
    );

    const formulaire = new FormData();
    formulaire.append(
      "file",
      new Blob([xml], { type: "application/xml" }),
      `${facture.invoice_number || facture.id}.xml`
    );

    // `processing_rule` : on déclare la nature qu'on a détectée, et Super PDP
    // **répond en erreur** si son propre calcul diffère. C'est un filet gratuit
    // sur notre détection B2C, qui n'est qu'une heuristique (absence de raison
    // sociale). Sans ce paramètre, un mauvais classement passerait inaperçu et
    // partirait dans le mauvais flux d'e-reporting.
    //
    // `external_id` : notre identifiant de facture, pour que leur côté et le
    // nôtre se rattachent sans dépendre du seul numéro de facture.
    const params = new URLSearchParams({
      processing_rule: isB2C ? "B2C" : "B2B",
      external_id: facture.id,
    });

    const res = await superpdpFetch(workspaceId, `/invoices?${params}`, {
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
          // Remontée même en cas de refus : savoir d'où venait l'adresse du
          // destinataire est la première question qu'on se pose devant un rejet
          // d'acheminement, et la relire dans le XML coûte une session de
          // débogage.
          sourceAdresse,
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
        // Conservé, pas seulement renvoyé : c'est ce qui permet, des jours plus
        // tard, de savoir si une facture « transmise » l'a été à une adresse
        // sûre ou à un SIREN nu qui peut ne désigner personne.
        superpdp_adresse_source: sourceAdresse,
      })
      .eq("id", id)
      .eq("user_id", workspaceId);

    // `sourceAdresse` remonte à l'appelant : c'est ce qui permet à l'interface
    // — et aux tests — de distinguer une adresse lue dans l'Annuaire d'un repli
    // sur le SIREN nu, sans avoir à relire le XML.
    return NextResponse.json({ emise: true, superpdpId: reponse.id, sourceAdresse });
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
