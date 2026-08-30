import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { synchroniserFactures } from "@/lib/superpdp-sync";
import { factureBloquee } from "@/lib/superpdp-blocage";

/**
 * Filet horaire pour la réception des factures électroniques.
 *
 * Le déclencheur principal est la présence de l'utilisateur (voir
 * /api/superpdp/sync). Cette tâche couvre le reste : quelqu'un qui n'ouvre pas
 * Deviso pendant plusieurs jours doit quand même voir arriver ses factures.
 *
 * Pourquoi vingt-quatre entrées dans `vercel.json` plutôt qu'une. Le plan Hobby
 * impose « une exécution par jour **par tâche** » et autorise jusqu'à cent
 * tâches par projet. Vingt-quatre tâches programmées chacune à une heure
 * différente respectent donc la règle à la lettre, et donnent ensemble une
 * couverture horaire — gratuitement. Vercel ne garantit pas la minute exacte
 * (une tâche prévue à 1 h peut partir à 1 h 59), ce qui est sans conséquence
 * pour de la facturation.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // On ne synchronise que les raccordements vérifiés : sur un `pending`,
  // Super PDP répond 403 et on ne ferait qu'ajouter du bruit dans les journaux.
  const { data: raccordements, error } = await admin
    .from("superpdp_connections")
    .select("user_id")
    .eq("session_status", "verified");

  if (error) {
    console.error("[superpdp-sync] lecture des raccordements :", error.message);
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }

  let comptes = 0;
  let factures = 0;
  let entrantes = 0;
  let echecs = 0;

  for (const { user_id } of raccordements ?? []) {
    // Une entreprise dont la synchronisation échoue ne doit pas empêcher les
    // suivantes : chaque compte est indépendant.
    try {
      const r = await synchroniserFactures(user_id);
      comptes++;
      factures += r.recuperees;
      entrantes += r.entrantes;
      if (r.raison === "erreur") echecs++;
    } catch (err) {
      echecs++;
      console.error(`[superpdp-sync] ${user_id} :`, err instanceof Error ? err.message : err);
    }
  }

  // Recensement des factures qui ne bougent plus, après synchronisation.
  //
  // Pourquoi ici plutôt que dans l'application. L'écran ne dit la vérité qu'à
  // celui qui l'ouvre : un utilisateur qui ne se connecte pas de la semaine ne
  // verra pas que ses factures ne sont jamais arrivées, et c'est précisément
  // celui-là qu'il faut protéger. Ce passage horaire regarde pour lui, et
  // laisse une trace côté serveur — la seule chose qui permette de découvrir
  // une panne d'acheminement autrement que par la plainte d'un client.
  //
  // On ne fait qu'observer : aucune retransmission automatique. Réémettre une
  // facture dont on ignore le sort risquerait le doublon, qui est une faute
  // plus grave que le retard.
  let bloquees = 0;
  try {
    const { data: candidates } = await admin
      .from("invoices")
      .select("id, user_id, invoice_number, superpdp_invoice_id, superpdp_status, superpdp_status_date, superpdp_adresse_source, updated_at")
      .not("superpdp_invoice_id", "is", null);

    for (const f of candidates ?? []) {
      const b = factureBloquee(f);
      if (!b) continue;
      bloquees++;
      console.error(
        `[superpdp-blocage] facture ${f.invoice_number} (${f.id}, compte ${f.user_id}) : ` +
          `${b.raison} — ${b.heures} h dans « ${f.superpdp_status ?? "aucun statut"} »`
      );
    }
  } catch (err) {
    // Le recensement ne doit jamais faire échouer la synchronisation, qui est
    // la mission principale de cette tâche.
    console.error("[superpdp-blocage] recensement impossible :", err instanceof Error ? err.message : err);
  }

  console.log(
    `[superpdp-sync] ${comptes} compte(s), ${factures} facture(s) dont ${entrantes} entrante(s)` +
      (echecs ? ` — ${echecs} échec(s)` : "") +
      (bloquees ? ` — ${bloquees} facture(s) bloquée(s)` : "")
  );

  return NextResponse.json({ comptes, factures, entrantes, echecs, bloquees });
}
