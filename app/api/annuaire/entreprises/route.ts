import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPERPDP_API } from "@/lib/superpdp";

/**
 * Recherche une entreprise dans l'Annuaire national.
 *
 * Pourquoi ça change quelque chose. Pour émettre une facture B2B, Deviso a
 * besoin du SIREN du client — et le demandait à l'utilisateur, qui devait le
 * réclamer à son client ou le recopier depuis un document. Une faute de frappe
 * se solde par une facture rejetée, constatée plus tard.
 *
 * `GET /v1.beta/french_directory/companies` fait ça correctement : on cherche
 * par nom et code postal, on récupère `number` (le SIREN), `formal_name` et
 * l'adresse postale complète — tous les champs requis du Factur-X, d'un coup.
 *
 * Deux propriétés notables :
 *   - la route est **publique** (`"security": []`), donc utilisable par un
 *     utilisateur non encore raccordé — c'est-à-dire tout le monde aujourd'hui ;
 *   - « Companies in this directory are **eligible to the french invoicing
 *     law** » : la présence d'un client dans cet annuaire est en soi
 *     l'information « ce client relève de la réforme ».
 *
 * On garde l'authentification Deviso : c'est une aide à la saisie réservée aux
 * utilisateurs, pas un service de recherche d'entreprises ouvert à tous.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const nom = (params.get("nom") ?? "").trim();
  const codePostal = (params.get("code_postal") ?? "").trim();
  const siren = (params.get("siren") ?? "").replace(/\D/g, "");

  if (!nom && !siren) {
    return NextResponse.json(
      { error: "Recherche vide", message: "Indiquez un nom d'entreprise ou un SIREN." },
      { status: 400 }
    );
  }

  const requete = new URLSearchParams({ limit: "20" });
  if (siren) requete.set("number", siren);
  if (nom) requete.set("formal_name_starts_with", nom);
  if (codePostal) requete.set("post_code_starts_with", codePostal);

  try {
    const res = await fetch(`${SUPERPDP_API}/french_directory/companies?${requete}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Annuaire indisponible", message: "L'Annuaire national n'a pas répondu." },
        { status: 502 }
      );
    }

    const corps = (await res.json()) as {
      data?: {
        number: string;
        formal_name: string;
        address: string;
        postcode: string;
        city: string;
        country: string;
      }[];
      has_more?: boolean;
    };

    return NextResponse.json({
      entreprises: (corps.data ?? []).map((e) => ({
        siren: e.number,
        nom: e.formal_name,
        rue: e.address,
        code_postal: e.postcode,
        ville: e.city,
        pays: e.country,
      })),
      // `has_more` signale une troncature : « you must pass more precise
      // filters to narrow down the results ». Le taire ferait croire à
      // l'utilisateur que son entreprise n'existe pas alors qu'elle est juste
      // au-delà de la vingtième.
      tronque: corps.has_more === true,
    });
  } catch (err) {
    console.error("[annuaire/entreprises]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Annuaire indisponible" }, { status: 502 });
  }
}
