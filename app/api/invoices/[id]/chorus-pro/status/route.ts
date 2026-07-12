import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PISTE_OAUTH_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const PISTE_API_BASE = "https://api.piste.gouv.fr/cpro";

// Statuts Chorus Pro → libellé FR + couleur UI
export const CHORUS_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DEPOSEE:              { label: "Déposée",               color: "blue" },
  EN_COURS_TRAITEMENT:  { label: "En cours de traitement", color: "amber" },
  COMPLETEE:            { label: "Complétée",              color: "amber" },
  MISE_EN_PAIEMENT:     { label: "Mise en paiement",       color: "indigo" },
  MANDATEE:             { label: "Mandatée",               color: "emerald" },
  VALIDEE:              { label: "Validée",                color: "emerald" },
  SUSPENDUE:            { label: "Suspendue",              color: "amber" },
  REJETEE:              { label: "Rejetée",                color: "red" },
  ANNULEE:              { label: "Annulée",                color: "red" },
};

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
  if (!res.ok) throw new Error(`PISTE OAuth: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createAdminClient();

  // Récupère la facture
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, chorus_pro_ref, chorus_pro_status, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (!invoice.chorus_pro_ref) return NextResponse.json({ error: "Pas encore déposée sur Chorus Pro" }, { status: 404 });

  // Récupère les identifiants Chorus Pro
  const { data: profile } = await admin
    .from("profiles")
    .select("chorus_pro_login, chorus_pro_password")
    .eq("id", user.id)
    .single();

  if (!profile?.chorus_pro_login) {
    return NextResponse.json({ error: "Compte Chorus Pro non configuré" }, { status: 422 });
  }

  const cproAccount = Buffer.from(
    `${profile.chorus_pro_login}:${profile.chorus_pro_password}`
  ).toString("base64");

  // Token PISTE
  let token: string;
  try {
    token = await getPisteToken();
  } catch (e: any) {
    return NextResponse.json({ error: `Auth PISTE : ${e.message}` }, { status: 502 });
  }

  // Interroge consulterCR (Compte Rendu) via API Facturations
  const crRes = await fetch(`${PISTE_API_BASE}/factures/v1/consulterCR`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "cpro-account": cproAccount,
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      numeroFactureCPP: parseInt(invoice.chorus_pro_ref, 10),
    }),
  });

  if (!crRes.ok) {
    const text = await crRes.text();
    return NextResponse.json({ error: `consulterCR: ${crRes.status} ${text}` }, { status: 502 });
  }

  const crData = await crRes.json();

  // Le statut est dans statutFacture ou statutCourantFacture selon la version de l'API
  const statut: string =
    crData.statutFacture ??
    crData.statutCourantFacture ??
    crData.libelleStatut ??
    "DEPOSEE";

  const motifRejet: string | null =
    crData.motifRefus ?? crData.motifRejet ?? null;

  // Stocke le statut en DB
  await admin
    .from("invoices")
    .update({
      chorus_pro_status: statut,
      chorus_pro_status_date: new Date().toISOString(),
      ...(motifRejet ? { chorus_pro_motif_rejet: motifRejet } : {}),
    })
    .eq("id", invoice.id);

  const statusInfo = CHORUS_STATUS_MAP[statut] ?? { label: statut, color: "gray" };

  return NextResponse.json({
    ref: invoice.chorus_pro_ref,
    status: statut,
    label: statusInfo.label,
    color: statusInfo.color,
    motifRejet,
    raw: crData,
  });
}
