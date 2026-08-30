import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Ce que la Plateforme Agréée déclare au fisc en votre nom.
 *
 * Deviso ne fabrique pas l'e-reporting : la spec est claire, « E-reportings are
 * constructed by aggregating payment and transaction data and then sent to the
 * PPF according to a specific schedule ». Super PDP agrège seul, à un rythme
 * dicté par le régime de TVA de l'entreprise, et dépose.
 *
 * Conséquence : jusqu'ici, un utilisateur qui facturait des particuliers avait
 * des déclarations qui partaient **sans qu'il en voie jamais rien** — ni le
 * contenu, ni l'accusé, ni le rejet. Or `events[].status_code` est le SEUL
 * endroit où l'on apprend qu'une déclaration a été refusée par
 * l'administration (`ppf:ereporting-rejected`, `-ack-error`).
 *
 * Lecture seule : aucune de ces routes n'a de POST, et c'est normal.
 */

/** Les cinq états possibles d'une déclaration, et ce qu'ils veulent dire. */
const ETATS: Record<string, { texte: string; ton: "neutre" | "bien" | "attention" }> = {
  "ppf:ereporting": { texte: "Déposée", ton: "neutre" },
  "ppf:ereporting-ack": { texte: "Reçue par l'administration", ton: "neutre" },
  "ppf:ereporting-response-ok": { texte: "Acceptée", ton: "bien" },
  "ppf:ereporting-ack-error": { texte: "Erreur d'acheminement", ton: "attention" },
  "ppf:ereporting-rejected": { texte: "Rejetée par l'administration", ton: "attention" },
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const role = req.nextUrl.searchParams.get("role_code");

  try {
    const params = new URLSearchParams({ limit: "50", order: "desc" });
    // `SE` = ce que l'entreprise a vendu, `BY` = ce qu'elle a acheté. Les
    // déclarations sont scindées par rôle ; sans filtre on ramène les deux.
    if (role === "SE" || role === "BY") params.set("role_code", role);

    const res = await superpdpFetch(workspaceId, `/ereportings?${params}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Lecture impossible", message: `La Plateforme Agréée a répondu ${res.status}.` },
        { status: 502 }
      );
    }

    const corps = (await res.json()) as {
      data?: {
        id: number;
        kind: "transaction" | "payment";
        role_code: "SE" | "BY";
        start_period: string;
        end_period: string;
        events?: { status_code: string; created_at: string }[];
      }[];
      count?: number;
    };

    const declarations = (corps.data ?? []).map((d) => {
      // Le dernier événement fait foi ici — contrairement aux statuts de
      // facture, cette énumération est une seule séquence linéaire.
      const dernier = d.events?.[d.events.length - 1];
      const etat = dernier ? ETATS[dernier.status_code] : undefined;
      return {
        id: d.id,
        nature: d.kind === "payment" ? "Encaissements" : "Transactions",
        role: d.role_code === "BY" ? "Achats" : "Ventes",
        debut: d.start_period,
        fin: d.end_period,
        statut: etat?.texte ?? dernier?.status_code ?? "—",
        ton: etat?.ton ?? "neutre",
        le: dernier?.created_at ?? null,
        // Une déclaration rejetée demande une action : c'est l'information
        // pour laquelle cet écran existe.
        aTraiter:
          dernier?.status_code === "ppf:ereporting-rejected" ||
          dernier?.status_code === "ppf:ereporting-ack-error",
      };
    });

    return NextResponse.json({ declarations, total: corps.count ?? declarations.length });
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return NextResponse.json({ error: "Non raccordé", declarations: [] }, { status: 409 });
    }
    if (err instanceof SuperPdpSessionPending) {
      return NextResponse.json({ error: "Vérification en cours", declarations: [] }, { status: 409 });
    }
    console.error("[superpdp/ereportings]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }
}
