import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Télécharge une facture reçue au format Factur-X.
 *
 * ⚠️ La route Super PDP est `GET /invoices/{id}?format=factur-x`, **pas**
 * `/invoices/{id}/download`. Sur `/download`, le paramètre `format` est ignoré
 * en silence et la réponse est du XML CII quel que soit l'en-tête `Accept`
 * envoyé — vérifié le 12/08/2026 sur les trois variantes. Leur note de version
 * 1.22.0.beta est explicite : la vue lisible est servie par `/convert`,
 * `/generate_test_invoice` et `/invoices/{id}?format=factur-x`.
 *
 * La première version appelait `/download` et étiquetait la réponse
 * `application/pdf`. Le fichier n'était pas corrompu : c'était un XML portant
 * une extension `.pdf`, et Acrobat refusait de l'ouvrir. Rien dans le code ne
 * pouvait le montrer — les deux côtés répondaient 200.
 *
 * Format Factur-X plutôt que XML brut : le PDF est lisible par un humain et
 * porte le XML en pièce jointe. Une facture reçue doit pouvoir être ouverte,
 * imprimée, transmise au comptable.
 *
 * Le contenu transite par notre serveur au lieu d'un lien direct vers Super PDP :
 * leur API exige un jeton d'accès, qui ne doit jamais atteindre le navigateur.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Un identifiant Super PDP est un bigint positif. Filtrer ici évite de relayer
  // n'importe quel chemin vers leur API.
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

  const workspaceId = await getWorkspaceUserId(user.id);

  // Vérification d'appartenance **avant** tout appel à Super PDP. Sans elle,
  // n'importe quel utilisateur raccordé pourrait tenter des identifiants au
  // hasard et lire les factures d'une autre entreprise, puisque c'est le jeton
  // de son propre raccordement qui serait utilisé pour la demande.
  const admin = createAdminClient();
  const { data: facture } = await admin
    .from("superpdp_invoices")
    .select("id, number")
    .eq("id", Number(id))
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  try {
    // `superpdpFetch` pose `Accept: application/json` par défaut. Testé sans
    // effet sur cette route, mais autant demander ce qu'on attend vraiment.
    let res = await superpdpFetch(workspaceId, `/invoices/${id}?format=factur-x`, {
      headers: { Accept: "application/pdf" },
    });

    // Repli sur le rendu de la plateforme.
    //
    // « To ignore the embedded PDFs and always use the SUPER PDP invoice
    // renderer » — c'est exactement le cas où le PDF embarqué par l'émetteur
    // est illisible. Sans ce repli, l'utilisateur restait sur une impasse pour
    // une pièce dont la conservation est une obligation légale.
    if (!res.ok) {
      res = await superpdpFetch(
        workspaceId,
        `/invoices/${id}?format=factur-x&force_superpdp_pdf_renderer=true`,
        { headers: { Accept: "application/pdf" } }
      );
    }

    // Dernier repli : le fichier ORIGINAL, tel que l'émetteur l'a déposé.
    // `format=original` renvoie « the unmodified original invoice ». Ce n'est
    // pas un PDF, mais un XML correctement étiqueté vaut mieux qu'un message
    // d'échec sur une facture qu'on doit pouvoir conserver.
    if (!res.ok) {
      const brut = await superpdpFetch(workspaceId, `/invoices/${id}?format=original`);
      if (brut.ok) {
        const nomBrut = `facture-${(facture.number ?? id).toString().replace(/[^\w.-]/g, "_")}.xml`;
        return new NextResponse(await brut.arrayBuffer(), {
          headers: {
            "Content-Type": brut.headers.get("content-type") ?? "application/xml",
            "Content-Disposition": `attachment; filename="${nomBrut}"`,
            "Cache-Control": "private, no-store",
          },
        });
      }
      return NextResponse.json(
        { error: "Téléchargement impossible auprès de la Plateforme Agréée" },
        { status: 502 }
      );
    }

    // On ne décrète pas le type de ce qu'on renvoie : on constate celui qu'on a
    // reçu. C'est précisément ce contrôle qui manquait — la version précédente
    // étiquetait `application/pdf` un contenu qui était du XML, et le défaut
    // n'apparaissait que dans Acrobat, chez l'utilisateur.
    const typeRecu = res.headers.get("content-type") ?? "";
    if (!typeRecu.includes("pdf")) {
      console.error(`[superpdp/download] type inattendu : ${typeRecu}`);
      return NextResponse.json(
        {
          error: "Format inattendu",
          message:
            "La Plateforme Agréée n'a pas renvoyé de PDF pour cette facture. " +
            "Réessayez dans un moment.",
        },
        { status: 502 }
      );
    }

    const nom = `facture-${(facture.number ?? id).toString().replace(/[^\w.-]/g, "_")}.pdf`;

    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nom}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Compte non raccordé" }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification du raccordement en cours" }, { status: 409 });
    }
    console.error("[superpdp/download]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Téléchargement impossible" }, { status: 500 });
  }
}
