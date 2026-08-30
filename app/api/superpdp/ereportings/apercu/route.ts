import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Ce qui partira au fisc, avant que ça parte.
 *
 * « Get a preview of the e-reporting data that will be sent to the French tax
 * administration (PPF). **This only applies for data that has not yet been
 * sent.** » C'est la seule occasion de corriger une erreur avant qu'elle
 * devienne une déclaration, ce qui vaut infiniment mieux qu'un constat après
 * coup.
 *
 * Trois paramètres, tous **requis** : `date` (une date quelconque DANS la
 * période voulue), `kind` (`transaction` = flux 10.1/10.3, `payment` = flux
 * 10.2/10.4) et `role_code` (`SE` ventes, `BY` achats).
 *
 * ⚠️ La réponse est du **XML uniquement** — contrairement à
 * `/ereportings/{id}` qui accepte `format=json`. Et un `204` signifie « rien à
 * déclarer sur cette période », ce qui est une information, pas une erreur.
 *
 * ⚠️ La granularité n'est PAS le mois. L'exemple de la spec pour un régime
 * `monthly` — `2026-01-13` renvoie la période du 11 au 20 janvier — montre un
 * découpage par décades. Le comportement pour `quarterly` et `simplified`
 * n'est pas documenté : on ne calcule donc aucune période nous-mêmes, on passe
 * la date que l'utilisateur regarde et on affiche ce que la plateforme
 * considère être la période correspondante.
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

  const p = req.nextUrl.searchParams;
  const date = p.get("date") ?? new Date().toISOString().slice(0, 10);
  const kind = p.get("kind") ?? "transaction";
  const role = p.get("role_code") ?? "SE";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date invalide", message: "Format attendu : AAAA-MM-JJ." }, { status: 400 });
  }
  if (kind !== "transaction" && kind !== "payment") {
    return NextResponse.json({ error: "Nature invalide" }, { status: 400 });
  }
  if (role !== "SE" && role !== "BY") {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);

  try {
    const params = new URLSearchParams({ date, kind, role_code: role });
    const res = await superpdpFetch(workspaceId, `/ereportings/preview?${params}`, {
      headers: { Accept: "application/xml" },
    });

    if (res.status === 204) {
      // Rien à déclarer : c'est un résultat, pas un échec.
      return NextResponse.json({ vide: true, date, kind, role });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "Aperçu indisponible", message: `La Plateforme Agréée a répondu ${res.status}.` },
        { status: 502 }
      );
    }

    const xml = await res.text();

    // On extrait de quoi juger sans lire du XML : les montants et la période.
    // Le document complet reste disponible pour qui veut le vérifier.
    const montants = [...xml.matchAll(/>([0-9]+\.[0-9]{2})</g)].map((m) => m[1]);
    const periode = xml.match(/(\d{4}-\d{2}-\d{2})[^]*?(\d{4}-\d{2}-\d{2})/);

    return NextResponse.json({
      vide: false,
      date,
      kind,
      role,
      periode: periode ? { debut: periode[1], fin: periode[2] } : null,
      nombreMontants: montants.length,
      xml,
    });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/apercu]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Aperçu indisponible" }, { status: 500 });
  }
}
