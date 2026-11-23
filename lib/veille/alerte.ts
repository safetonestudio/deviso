import * as Sentry from "@sentry/nextjs";
import type { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { decider, type Alerte, type Pannes, type Resultat } from "./decision";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Envoi de l'alerte de la veille, dédoublonnée par l'état en base
 * (table `veille_etat`, ligne « prod » ; « essai » pour le test).
 *
 * Destinataire : Deviso lui-même (`VEILLE_ALERTE_EMAIL`, défaut
 * support@getdeviso.fr, qui arrive dans la boîte de Selim). Jamais un
 * utilisateur, jamais un client. Doublé d'un événement Sentry, dont l'empreinte
 * est l'ensemble des contrôles en panne : Sentry n'ouvre donc lui aussi qu'un
 * seul ticket par panne, et la règle d'alerte haute priorité déjà en place
 * prévient par courriel.
 */
export type Issue = {
  alerte: Alerte | null;
  pannes: string[];
  /** Un autre passage a écrit l'état entre-temps : il a envoyé, pas nous. */
  concurrent?: boolean;
  envoi?: "envoye" | "echec" | "non (essai)";
};

export async function appliquerVeille(
  admin: Admin,
  cle: "prod" | "essai",
  resultats: Resultat[],
  nonJoues: string[],
  options: {
    envoyer: boolean;
    bilan?: unknown;
    /** Contrôles retirés de la surveillance : leurs pannes passées sont oubliées sans message (ni « réparé », ni réalerte). */
    horsSurveillance?: string[];
  },
): Promise<Issue> {
  await admin.from("veille_etat").upsert({ cle }, { onConflict: "cle", ignoreDuplicates: true });
  const { data: ligne, error } = await admin.from("veille_etat").select("pannes, version").eq("cle", cle).single();
  if (error || !ligne) throw new Error(`lecture de l'état de la veille : ${error?.message ?? "absent"}`);
  const precedentes = { ...((ligne.pannes ?? {}) as Pannes) };
  for (const id of options.horsSurveillance ?? []) delete precedentes[id];
  const version = ligne.version as number;

  // Un contrôle qui n'a pas pu être joué cette fois (temps imparti, comptes de
  // démonstration non créés) garde son état : son silence ne vaut pas
  // réparation.
  const vus = new Set(resultats.map((r) => r.id));
  const complets = [...resultats];
  for (const id of nonJoues) {
    if (!vus.has(id) && precedentes[id]) complets.push({ id, libelle: precedentes[id].libelle, ok: false, detail: precedentes[id].detail });
  }

  const maintenant = new Date();
  const { pannes, alerte } = decider(precedentes, complets, maintenant);
  const { data: ecrit } = await admin
    .from("veille_etat")
    .update({
      pannes,
      version: version + 1,
      dernier_passage: maintenant.toISOString(),
      ...(alerte ? { derniere_alerte: maintenant.toISOString() } : {}),
      dernier_bilan: options.bilan ?? null,
    })
    .eq("cle", cle)
    .eq("version", version)
    .select("cle");
  if (!ecrit || ecrit.length === 0) return { alerte: null, pannes: Object.keys(pannes), concurrent: true };
  if (!alerte) return { alerte: null, pannes: Object.keys(pannes) };
  if (!options.envoyer) return { alerte, pannes: Object.keys(pannes), envoi: "non (essai)" };

  Sentry.captureMessage(alerte.sujet, {
    level: alerte.genre === "panne" ? "error" : "info",
    fingerprint: ["veille-quotidienne", alerte.genre, ...Object.keys(pannes).sort()],
    tags: { veille: alerte.genre },
    extra: { nouvelles: alerte.nouvelles, reparees: alerte.reparees, enCours: alerte.enCours, texte: alerte.texte },
  });
  await Sentry.flush(3000).catch(() => false);

  const { error: eEnvoi } = await resend.emails.send({
    from: "Deviso <noreply@getdeviso.fr>",
    to: process.env.VEILLE_ALERTE_EMAIL || "support@getdeviso.fr",
    subject: alerte.sujet,
    html: alerte.html,
    text: alerte.texte,
  });
  if (eEnvoi) {
    // Rien n'est parti : on rend l'état précédent, l'alerte repartira au
    // prochain passage au lieu d'être perdue.
    await admin.from("veille_etat").update({ pannes: precedentes, version: version + 2 }).eq("cle", cle).eq("version", version + 1);
    console.error(`[veille] envoi de l'alerte impossible : ${eEnvoi.message}`);
    return { alerte, pannes: Object.keys(pannes), envoi: "echec" };
  }
  return { alerte, pannes: Object.keys(pannes), envoi: "envoye" };
}
