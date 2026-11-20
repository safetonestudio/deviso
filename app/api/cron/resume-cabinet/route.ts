import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorise } from "@/lib/cron-auth";
import { ROLE_COMPTABLE } from "@/lib/droits";
import { construireResume, adresseDeTest } from "@/lib/cabinet-resume";
import { envoyerCourriel } from "@/lib/resend";
import { resumeDu, rythmeEnClair, estFrequence, estJour } from "@/lib/cabinet-resume-frequence";

export const maxDuration = 60;

/**
 * Résumé du lundi aux cabinets (20/11/2026), voir lib/cabinet-resume.ts.
 *
 * Un cabinet le reçoit s'il a au moins un dossier actif, n'a pas coupé le
 * résumé (profiles.resume_cabinet_hebdo), que c'est son jour (rythme réglé
 * dans ses paramètres, lib/cabinet-resume-frequence.ts ; le cron passe chaque
 * matin) et qu'il a quelque chose à signaler.
 * L'expéditeur est Deviso : le destinataire est le cabinet lui-même, pas le
 * client d'un utilisateur (règle des courriels du 12/08/2026).
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: liens, error } = await admin
    .from("team_members")
    .select("member_id")
    .eq("role", ROLE_COMPTABLE)
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cabinets = [...new Set((liens ?? []).map((l) => l.member_id as string).filter(Boolean))];
  const bilan = { cabinets: cabinets.length, envoyes: 0, rienASignaler: 0, pasLeJour: 0, ignores: 0, echecs: 0 };
  const aujourdhui = new Date();

  for (const cabinetId of cabinets) {
    const { data: p } = await admin
      .from("profiles")
      .select("email, resume_cabinet_hebdo, resume_cabinet_frequence, resume_cabinet_jour, resume_cabinet_dernier_passage")
      .eq("id", cabinetId)
      .maybeSingle();
    if (!p || p.resume_cabinet_hebdo === false || adresseDeTest(p.email)) {
      bilan.ignores++;
      continue;
    }
    const frequence = estFrequence(p.resume_cabinet_frequence) ? p.resume_cabinet_frequence : "hebdo";
    const jour = estJour(p.resume_cabinet_jour) ? p.resume_cabinet_jour : 1;
    if (!resumeDu(aujourdhui, frequence, jour, p.resume_cabinet_dernier_passage ?? null)) {
      bilan.pasLeJour++;
      continue;
    }
    // Le passage est noté avant l'envoi : un cron relancé le même jour ne
    // renvoie pas le résumé, et « rien à signaler » compte comme un passage.
    await admin.from("profiles").update({ resume_cabinet_dernier_passage: aujourdhui.toISOString().slice(0, 10) }).eq("id", cabinetId);
    try {
      const resume = await construireResume(admin, cabinetId, aujourdhui, rythmeEnClair(frequence, jour));
      if (!resume) {
        bilan.rienASignaler++;
        continue;
      }
      const { error: e } = await envoyerCourriel(cabinetId, {
        from: "Deviso <noreply@getdeviso.fr>",
        replyTo: "support@getdeviso.fr",
        to: p.email as string,
        subject: resume.sujet,
        html: resume.html,
        text: resume.texte,
      });
      if (e) {
        bilan.echecs++;
        console.error(`[resume-cabinet] échec d'envoi pour ${cabinetId} : ${e.message}`);
      } else bilan.envoyes++;
    } catch (e) {
      bilan.echecs++;
      console.error(`[resume-cabinet] ${cabinetId} : ${(e as Error).message}`);
    }
  }

  console.log(`[resume-cabinet] ${JSON.stringify(bilan)}`);
  return NextResponse.json(bilan);
}
