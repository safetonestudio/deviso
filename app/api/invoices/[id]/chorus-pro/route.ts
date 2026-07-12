import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFacturXPdf } from "@/lib/facturx";
import type { Invoice } from "@/types";

// ─── Config PISTE ────────────────────────────────────────────────────────────
const PISTE_SANDBOX = false; // Production PISTE activée
const PISTE_OAUTH_URL = PISTE_SANDBOX
  ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
  : "https://oauth.piste.gouv.fr/api/oauth/token";
const PISTE_API_BASE = PISTE_SANDBOX
  ? "https://sandbox-api.piste.gouv.fr/cpro"
  : "https://api.piste.gouv.fr/cpro";

// ─── Mode complet (DEPOT_PDF_API) ────────────────────────────────────────────
// false → SAISIE_API (mode actuel, sans PDF joint)
// true  → DEPOT_PDF_API + Structures + Utilisateurs + Factur-X joint
// À activer via Vercel env var dès réception de la confirmation AIFE
const FULL_MODE = process.env.CHORUS_PRO_FULL_MODE === "true";

// ─── PISTE OAuth token ───────────────────────────────────────────────────────
async function getPisteToken(): Promise<string> {
  const res = await fetch(PISTE_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.PISTE_CLIENT_ID!,
      client_secret: process.env.PISTE_CLIENT_SECRET!,
      scope: "openid",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PISTE OAuth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ─── API Structures, résout SIRET → identifiantStructure ───────────────────
async function getStructureId(
  siret: string,
  token: string,
  cproAccount: string
): Promise<number> {
  const res = await fetch(`${PISTE_API_BASE}/structures/v1/rechercher/criteres`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "cpro-account": cproAccount,
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json;charset=utf-8",
    },
    body: JSON.stringify({ numSiret: siret, statutStructure: "ACTIVE" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Structures: ${res.status} ${text}`);
  }
  const data = await res.json();
  const structure = data.listeStructures?.[0];
  if (!structure?.idStructure) {
    throw new Error(
      `Aucune structure active trouvée pour le SIRET ${siret}. Vérifiez que votre client est bien référencé sur Chorus Pro.`
    );
  }
  return structure.idStructure as number;
}

// ─── API Utilisateurs, récupère l'ID utilisateur courant ───────────────────
async function getCurrentUserId(
  token: string,
  cproAccount: string
): Promise<number | null> {
  try {
    const res = await fetch(`${PISTE_API_BASE}/utilisateurs/v1/recuperer/idCourant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "cpro-account": cproAccount,
        "Content-Type": "application/json;charset=utf-8",
        Accept: "application/json;charset=utf-8",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.idUtilisateur as number) ?? null;
  } catch {
    return null;
  }
}

// ─── Génère le PDF Factur-X directement (sans fetch HTTP interne) ────────────
// Remplace l'ancien fetchInvoicePdf qui faisait un fetch vers /api/invoices/[id]/download
//, couplage fragile (dépendait du process Next.js, pas de localhost garanti en Vercel).
async function buildInvoicePdfBase64(
  invoice: Invoice,
  userId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<string> {
  const { data: profileData } = await admin
    .from("profiles")
    .select("proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name")
    .eq("id", userId)
    .single();

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentInfo = profileData ? {
    method: (profileData.payment_method || "none") as "none" | "link" | "bank" | "both",
    linkProvider: profileData.payment_link_provider,
    linkUrl: profileData.payment_link_profile,
    bankIban: profileData.bank_iban,
    bankBic: profileData.bank_bic,
    bankAccountName: profileData.bank_account_name,
  } : undefined;

  let linkedInvoiceNumber: string | null = null;
  if (invoice.invoice_type === "solde" && invoice.linked_invoice_id) {
    const { data: linkedInv } = await admin
      .from("invoices")
      .select("invoice_number")
      .eq("id", invoice.linked_invoice_id)
      .single();
    linkedInvoiceNumber = linkedInv?.invoice_number ?? null;
  }

  const pdfBuffer = await generateFacturXPdf(invoice, accentColor, paymentInfo, linkedInvoiceNumber);
  return Buffer.from(pdfBuffer).toString("base64");
}

// ─── Handler principal ───────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminClient();

  // ── Facture
  const { data: invoice, error: invErr } = await admin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (invErr || !invoice)
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  if (invoice.chorus_pro_ref)
    return NextResponse.json(
      { error: "Déjà déposée sur Chorus Pro", ref: invoice.chorus_pro_ref },
      { status: 409 }
    );

  // ── Profil
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "chorus_pro_login, chorus_pro_password, chorus_pro_fournisseur_id, chorus_pro_bank_code, chorus_pro_user_id"
    )
    .eq("id", user.id)
    .single();

  if (
    !profile?.chorus_pro_login ||
    !profile?.chorus_pro_password ||
    !profile?.chorus_pro_fournisseur_id
  ) {
    return NextResponse.json(
      {
        error:
          "Compte Chorus Pro non configuré. Rendez-vous dans Paramètres → Chorus Pro.",
      },
      { status: 422 }
    );
  }

  if (!invoice.client_siren) {
    return NextResponse.json(
      { error: "Le SIRET du client est requis pour déposer sur Chorus Pro." },
      { status: 422 }
    );
  }

  // ── Auth headers
  const cproAccount = Buffer.from(
    `${profile.chorus_pro_login}:${profile.chorus_pro_password}`
  ).toString("base64");

  // ── Token PISTE
  let token: string;
  try {
    token = await getPisteToken();
  } catch (e: any) {
    return NextResponse.json(
      { error: `Erreur authentification PISTE : ${e.message}` },
      { status: 502 }
    );
  }

  // ── Lignes de poste (communes aux deux modes)
  const items = (invoice.items as any[]) || [];
  const lignePoste = items.map((item: any, idx: number) => ({
    lignePosteDenomination: item.description,
    lignePosteMontantRemiseHT: 0,
    lignePosteMontantUnitaireHT: item.unit_price,
    lignePosteNumero: idx + 1,
    lignePosteQuantite: item.quantity,
    lignePosteReference: `ligne-${idx + 1}`,
    lignePosteTauxTvaManuel: invoice.tva_rate,
    lignePosteUnite: item.unit || "forfait",
  }));

  const montantHt = invoice.total_ht;
  const montantTva = invoice.total_ttc - invoice.total_ht;
  const ligneTva = [
    {
      ligneTvaMontantBaseHtParTaux: montantHt,
      ligneTvaMontantTvaParTaux: montantTva,
      ligneTvaTauxManuel: invoice.tva_rate,
    },
  ];

  const montantTotal = {
    montantAPayer: invoice.total_ttc,
    montantHtTotal: montantHt,
    montantRemiseGlobaleTTC: 0,
    montantTVA: montantTva,
    montantTtcTotal: invoice.total_ttc,
  };

  const references = {
    deviseFacture: "EUR",
    modePaiement: "VIREMENT",
    // AVOIR = note de crédit uniquement. Un acompte reste une FACTURE sur Chorus Pro.
    typeFacture: "FACTURE",
    typeTva: invoice.payment_on_debit
      ? "TVA_SUR_DEBITS"
      : "TVA_SUR_ENCAISSEMENT",
  };

  const cadreDeFacturation = { codeCadreFacturation: "A1_FACTURE_FOURNISSEUR" };

  const fournisseur = {
    idFournisseur: profile.chorus_pro_fournisseur_id,
    codeCoordonneesBancairesFournisseur: profile.chorus_pro_bank_code ?? 0,
  };

  // ── Construction du payload selon le mode ──────────────────────────────────
  let payload: any;

  if (FULL_MODE) {
    // ── Mode complet : DEPOT_PDF_API + Structures + Utilisateurs + Factur-X
    let structureId: number;
    try {
      structureId = await getStructureId(invoice.client_siren, token, cproAccount);
    } catch (e: any) {
      return NextResponse.json(
        { error: `API Structures : ${e.message}` },
        { status: 502 }
      );
    }

    // Récupère l'ID utilisateur : depuis le profil ou via API Utilisateurs
    const userId =
      profile.chorus_pro_user_id ??
      (await getCurrentUserId(token, cproAccount));

    // Génère le PDF Factur-X directement (appel fonction, pas fetch HTTP interne)
    let pdfBase64: string;
    try {
      pdfBase64 = await buildInvoicePdfBase64(invoice as Invoice, user.id, admin);
    } catch (e: any) {
      return NextResponse.json(
        { error: `Génération PDF : ${e.message}` },
        { status: 502 }
      );
    }

    payload = {
      numeroFactureSaisi: invoice.invoice_number,
      dateFacture: invoice.issue_date.slice(0, 10),
      modeDepot: "DEPOT_PDF_API",
      cadreDeFacturation,
      destinataire: {
        identifiantStructureDestinataire: structureId,
      },
      fournisseur,
      lignePoste,
      ligneTva,
      montantTotal,
      references,
      pieceJointe: [
        {
          pieceJointeDesignation: "Facture Factur-X",
          pieceJointeNumeroLigneFacture: 0,
          pieceJointeTypeCode: "DEP",
          pieceJointeNomFichier: `${invoice.invoice_number}.pdf`,
          pieceJointeContenu: pdfBase64,
        },
      ],
    };

    if (userId) payload.idUtilisateurCourant = userId;
  } else {
    // ── Mode basique : SAISIE_API (actif jusqu'à confirmation AIFE)
    payload = {
      numeroFactureSaisi: invoice.invoice_number,
      dateFacture: invoice.issue_date.slice(0, 10),
      modeDepot: "SAISIE_API",
      cadreDeFacturation,
      destinataire: {
        codeDestinataire: invoice.client_siren,
      },
      fournisseur,
      lignePoste,
      ligneTva,
      montantTotal,
      references,
    };
  }

  // ─── Envoi à Chorus Pro via PISTE ────────────────────────────────────────
  const endpoint = `${PISTE_API_BASE}/factures/v1/deposer/flux`;

  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "cpro-account": cproAccount,
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    return NextResponse.json(
      { error: `Chorus Pro API error: ${submitRes.status} ${errText}` },
      { status: 502 }
    );
  }

  const result = await submitRes.json();
  const ref = result.numeroFluxDepot ?? result.numeroDossierFacture ?? "?";

  await admin
    .from("invoices")
    .update({
      chorus_pro_ref: ref,
      chorus_pro_submitted_at: new Date().toISOString(),
      chorus_pro_status: "DEPOSEE",
      chorus_pro_status_date: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    ref,
    message: "Facture déposée avec succès sur Chorus Pro.",
  });
}
