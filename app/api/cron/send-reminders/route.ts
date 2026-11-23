import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { cronAutorise } from "@/lib/cron-auth";
import { relancesDues } from "@/lib/relances";

// Vercel cron job, déclenché quotidiennement à 8h
// Protégé par CRON_SECRET (Vercel l'injecte automatiquement)
//
// Ce qui part, et à qui, est décidé par `relancesDues` (lib/relances.ts), qui
// exclut les comptes de démonstration à la source de sa requête (filtre
// is_demo). La veille quotidienne rejoue cette même sélection sans envoyer.

export async function GET(req: NextRequest) {
  if (!cronAutorise(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const dues = await relancesDues(supabase);

  let invoicesSent = 0;
  let proposalsSent = 0;

  for (const r of dues) {
    const { error: emailError } = await resend.emails.send(r.message);
    if (emailError) continue;

    // Mise à jour CONDITIONNELLE, et on lit ce qu'elle a touché.
    //
    // Le retour de cet `update` était ignoré. S'il échouait, coupure
    // passagère de la base, délai dépassé, `reminder_count` ne bougeait
    // pas, la relance redevenait due le lendemain, et la même relance
    // repartait. Tous les jours, indéfiniment : le garde-fou
    // `.lt("reminder_count", 10)` ne se déclenche jamais sur un compteur qui
    // n'avance pas. Le client final reçoit une relance quotidienne au nom du
    // freelance.
    //
    // `.eq("reminder_count", …)` ferme en plus la course entre deux
    // exécutions du cron, Vercel garantit « au moins une fois ».
    const { data: majFaite, error: majErreur } = await supabase
      .from(r.table)
      .update({ last_reminder_sent_at: now, reminder_count: r.reminderNum })
      .eq("id", r.id)
      .eq("reminder_count", r.reminderCount)
      .select("id");

    if (majErreur || !majFaite || majFaite.length === 0) {
      console.error(
        `[cron/send-reminders] relance ${r.reminderNum} ENVOYÉE pour ${r.table === "invoices" ? "la facture" : "le devis"} ${r.repere} ` +
          `mais compteur non incrémenté : la relance repartira demain.`,
        majErreur
      );
    }
    if (r.table === "invoices") invoicesSent++;
    else proposalsSent++;
  }

  return NextResponse.json({ invoices_sent: invoicesSent, proposals_sent: proposalsSent });
}
