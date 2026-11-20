import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorise } from "@/lib/cron-auth";
import { envoyerCourriel } from "@/lib/resend";
import { adresseDeTest } from "@/lib/cabinet-resume";
import { construirePointage, jourParis, MAX_DEMANDES, pointageDu, type FactureAPointer } from "@/lib/pointage-paiement";

// Cron quotidien (9 h) : demande au titulaire si ses factures échues ont été
// payées. Règles dans `lib/pointage-paiement.ts`. Un seul courriel par
// titulaire et par jour, quel que soit le nombre de factures.
//
// `?seulement=<id du titulaire>` limite le passage à un espace : c'est ce qui
// permet de l'éprouver en production sur le compte de test sans écrire à
// personne d'autre. Protégé par le même secret.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  if (!cronAutorise(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const seulement = req.nextUrl.searchParams.get("seulement");
  if (seulement && !UUID.test(seulement)) {
    return NextResponse.json({ error: "seulement invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const maintenant = new Date();
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr").replace(/\/$/, "");

  let requete = admin
    .from("invoices")
    .select("id, user_id, invoice_number, status, invoice_type, due_date, total_ttc, client_name, client_company, superpdp_invoice_id, pointage_demande_at, pointage_demande_nb, pointage_pas_encore_at")
    .eq("status", "sent")
    .neq("invoice_type", "avoir")
    .lt("due_date", jourParis(maintenant))
    .lt("pointage_demande_nb", MAX_DEMANDES)
    .order("due_date", { ascending: true })
    .limit(5000);
  if (seulement) requete = requete.eq("user_id", seulement);
  const { data: factures, error } = await requete;
  if (error) {
    console.error("[cron/pointage-paiements] lecture", error);
    return NextResponse.json({ error: "lecture" }, { status: 500 });
  }

  const parTitulaire = new Map<string, (FactureAPointer & { user_id: string })[]>();
  for (const f of factures ?? []) {
    if (!pointageDu(f as FactureAPointer, maintenant)) continue;
    const liste = parTitulaire.get(f.user_id) ?? [];
    liste.push(f as FactureAPointer & { user_id: string });
    parTitulaire.set(f.user_id, liste);
  }
  if (parTitulaire.size === 0) return NextResponse.json({ courriels: 0, factures: 0 });

  const { data: profils } = await admin
    .from("profiles")
    .select("id, email, full_name, is_demo")
    .in("id", [...parTitulaire.keys()]);
  const profilDe = new Map((profils ?? []).map((p) => [p.id, p]));

  let courriels = 0;
  let facturesDemandees = 0;
  const echecs: string[] = [];

  for (const [titulaire, liste] of parTitulaire) {
    const p = profilDe.get(titulaire);
    // Démonstration : aucune écriture ni courriel. Adresse de test : idem.
    if (!p || p.is_demo) continue;
    // L'adresse de CONNEXION du titulaire : `profiles.email` est l'adresse de
    // contact de l'entreprise, un champ libre (voir scripts/e2e/lib.mjs).
    const { data: auth } = await admin.auth.admin.getUserById(titulaire);
    const destinataire = auth?.user?.email ?? p.email;
    if (adresseDeTest(destinataire)) continue;

    // Écrire la question AVANT l'envoi, sous condition du compteur lu : deux
    // passages concurrents (Vercel garantit « au moins une fois ») ne peuvent
    // pas poser deux fois la même question.
    const posees: (FactureAPointer & { user_id: string })[] = [];
    const quand = maintenant.toISOString();
    for (const f of liste) {
      const { data: maj } = await admin
        .from("invoices")
        .update({ pointage_demande_at: quand, pointage_demande_nb: (f.pointage_demande_nb ?? 0) + 1 })
        .eq("id", f.id)
        .eq("status", "sent")
        .eq("pointage_demande_nb", f.pointage_demande_nb ?? 0)
        .select("id");
      if (maj && maj.length > 0) posees.push(f);
    }
    if (posees.length === 0) continue;

    const { sujet, html, texte } = construirePointage(posees, { prenom: p.full_name, base, maintenant });
    const { error: e } = await envoyerCourriel(titulaire, {
      from: "Deviso <noreply@getdeviso.fr>",
      replyTo: "support@getdeviso.fr",
      to: destinataire as string,
      subject: sujet,
      html,
      text: texte,
    });
    if (e) {
      // Rien n'est parti : on rend la question, elle repartira demain.
      for (const f of posees) {
        await admin
          .from("invoices")
          .update({ pointage_demande_at: f.pointage_demande_at, pointage_demande_nb: f.pointage_demande_nb ?? 0 })
          .eq("id", f.id)
          .eq("pointage_demande_at", quand);
      }
      console.error(`[cron/pointage-paiements] envoi à ${titulaire}`, e.message);
      echecs.push(titulaire);
      continue;
    }
    courriels++;
    facturesDemandees += posees.length;
  }

  return NextResponse.json({ courriels, factures: facturesDemandees, echecs: echecs.length });
}
