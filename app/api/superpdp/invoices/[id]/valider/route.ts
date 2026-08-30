import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { getConnection } from "@/lib/superpdp";
import { generateFacturXml } from "@/lib/invoice-xml";
import { resoudreAdresseClient } from "@/lib/superpdp-annuaire";
import { manquesPourEmission, transmissible } from "@/lib/superpdp-precontrole";
import { natureOperation } from "@/lib/superpdp-nature";
import { validerFacture, resumerEchecs } from "@/lib/superpdp-validation";
import type { Invoice } from "@/types";

/**
 * Vérifie une facture sans la transmettre.
 *
 * Deux niveaux, dans cet ordre :
 *   1. le pré-contrôle Deviso — ce qui manque, dit en français ;
 *   2. la validation officielle (`POST /validation_reports`) — 189 contrôles
 *      Schematron et XSD, avec la localisation de l'erreur dans le XML.
 *
 * Le second est celui qui manquait. Le panneau de conformité de Deviso applique
 * des règles écrites à la main ; celui-ci fait tourner les validateurs réels
 * (FNFE, Factur-X EN16931). Une facture peut passer le premier et échouer au
 * second — et c'est précisément ce qui produisait un `api:invalid` asynchrone,
 * constaté des heures après une transmission qu'on croyait réussie.
 *
 * Aucune écriture, aucune transmission : cette route est sans conséquence.
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

  const manques = manquesPourEmission(facture);
  const nature = natureOperation(facture);

  // On construit le XML exactement comme la route d'émission, sinon on
  // validerait un document que personne n'enverra jamais.
  const connexion = await getConnection(workspaceId);
  const resolution =
    nature === "B2C"
      ? { adresse: null, candidats: undefined, obstacle: null }
      : await resoudreAdresseClient(workspaceId, facture);
  const adresseClient = resolution.adresse;

  // « Vérifier avant de transmettre » doit annoncer ce qui va bloquer.
  // Découvrir l'ambiguïté d'adresse seulement au moment du clic « Transmettre »
  // ferait de ce bouton un piège, ce que le pré-contrôle existe pour éviter.
  // Seule l'ambiguïté bloque. Une adresse pas encore en vigueur laisse
  // l'émission se faire sur le SIREN nu — voir lib/superpdp-annuaire.ts pour
  // pourquoi refuser serait pire.
  if (resolution.obstacle === "ambigu") {
    manques.push(
      `l'adresse de facturation électronique à utiliser pour ${facture.client_name || "votre client"} ` +
        `— il en publie plusieurs, une par service : ${(resolution.candidats ?? []).join(", ")}`
    );
  }

  const profil = await getWorkspaceProfile<{
    payment_method: string | null;
    payment_link_profile: string | null;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_account_name: string | null;
  }>(workspaceId, "payment_method, payment_link_profile, bank_iban, bank_bic, bank_account_name");

  let numeroAcompte: string | null = null;
  if (facture.invoice_type === "solde" && facture.linked_invoice_id) {
    const { data: liee } = await admin
      .from("invoices")
      .select("invoice_number")
      .eq("id", facture.linked_invoice_id)
      .eq("user_id", workspaceId)
      .maybeSingle();
    numeroAcompte = liee?.invoice_number ?? null;
  }

  const xml = generateFacturXml(
    facture as unknown as Invoice,
    numeroAcompte,
    profil
      ? {
          method: profil.payment_method,
          linkUrl: profil.payment_link_profile,
          bankIban: profil.bank_iban,
          bankBic: profil.bank_bic,
          bankAccountName: profil.bank_account_name,
        }
      : undefined,
    connexion?.directory_address ?? null,
    connexion?.company_number ?? null,
    adresseClient
  );

  const rapport = await validerFacture(xml, `${facture.invoice_number || facture.id}.xml`);

  // BT-8 tel qu'il part réellement, relu dans le XML plutôt que recalculé :
  // c'est la seule façon de vérifier que l'exigibilité déclarée correspond au
  // régime coché, et ce code était inversé jusqu'au 30/08/2026.
  const exigibilite = xml.match(/<ram:DueDateTypeCode>(\d+)<\/ram:DueDateTypeCode>/)?.[1] ?? null;

  return NextResponse.json({
    transmissible: transmissible(facture),
    nature,
    manques,
    exigibilite,
    conforme: rapport.valide && manques.length === 0 && transmissible(facture),
    validation: {
      valide: rapport.valide,
      format: rapport.format,
      niveau: rapport.niveau,
      echecs: resumerEchecs(rapport.echecs, 10),
      // Renseigné quand la validation n'a pas pu avoir lieu : on ne présente
      // pas une absence de contrôle comme un succès.
      indisponible: rapport.indisponible ?? null,
    },
  });
}
