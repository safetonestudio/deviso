import type { createAdminClient } from "@/lib/supabase/admin";
import { envoyerCourriel } from "@/lib/resend";
import { BETA, STATUT_BETA, STATUT_BETA_TERMINEE } from "@/lib/beta";
import {
  EXPEDITEUR_BETA,
  REPONDRE_A,
  courrielAvisReception,
  courrielFinBeta,
  courrielRappelFinBeta,
} from "@/lib/emails/beta";

type Admin = ReturnType<typeof createAdminClient>;
const JOUR = 86400_000;

/**
 * Fin de bêta des testeurs, passage quotidien (app/api/cron/fin-beta).
 *
 * Ne dépend PAS de l'interrupteur BETA_OUVERTE : un testeur entré pendant la
 * bêta garde ses 2 mois même si la bêta a été fermée entre-temps.
 *
 * Chaque étape écrit sa marque AVANT d'envoyer, sous condition que la marque
 * soit encore vide (même règle que la relance de pointage) : deux passages
 * concurrents n'envoient jamais deux fois le même courriel, et un courriel
 * en échec n'est pas renvoyé en boucle.
 *
 *   1. rappel         7 jours avant beta_fin                     beta_rappel_le
 *   2. bascule        à beta_fin : plan free, « beta_terminee »   beta_fin_notifiee_le
 *   3. avis réception 7 jours avant la fermeture de la réception  beta_reception_avis_le
 *   4. purge          candidatures sans compte, 12 mois après la réponse ;
 *                     empreintes d'IP effacées après 24 heures
 *
 * La fermeture de la ligne de réception elle-même (30 jours après la fin)
 * n'est PAS automatique : fermer rend l'entreprise injoignable par ses
 * fournisseurs. Les comptes concernés sont listés sur /admin/beta
 * (lignesAFermer) ; Selim ferme, le serveur de production exécute.
 */

const fr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export type BilanFinBeta = { rappels: number; bascules: number; avis: number; purgees: number; erreurs: string[] };

export async function passageFinBeta(admin: Admin, maintenant: Date, base: string): Promise<BilanFinBeta> {
  const bilan: BilanFinBeta = { rappels: 0, bascules: 0, avis: 0, purgees: 0, erreurs: [] };
  const iso = maintenant.toISOString();

  // 1. Rappel J-7
  const { data: aRappeler, error: e1 } = await admin
    .from("profiles")
    .select("id")
    .eq("subscription_status", STATUT_BETA)
    .is("beta_rappel_le", null)
    .gt("beta_fin", iso)
    .lte("beta_fin", new Date(maintenant.getTime() + BETA.joursRappel * JOUR).toISOString());
  if (e1) bilan.erreurs.push(`rappel : ${e1.message}`);
  for (const { id } of aRappeler ?? []) {
    const { data: p } = await admin
      .from("profiles")
      .update({ beta_rappel_le: iso })
      .eq("id", id)
      .eq("subscription_status", STATUT_BETA)
      .is("beta_rappel_le", null)
      .select("id, email, full_name, beta_fin")
      .maybeSingle();
    if (!p?.email) continue;
    const m = courrielRappelFinBeta(p.full_name ?? "", { fin: fr(new Date(p.beta_fin as string)), remise: BETA.remise, url: `${base}/billing` });
    const { error } = await envoyerCourriel(p.id as string, { from: EXPEDITEUR_BETA, to: p.email as string, replyTo: REPONDRE_A, ...m });
    if (error) bilan.erreurs.push(`rappel ${p.id} : ${error.message}`);
    else bilan.rappels++;
  }

  // 2. Bascule à la fin de la bêta. La condition sur le statut fait foi : un
  // testeur qui s'est abonné entre-temps (statut Stripe) n'est pas touché.
  const { data: basculees, error: e2 } = await admin
    .from("profiles")
    .update({ plan: "free", subscription_status: STATUT_BETA_TERMINEE, beta_fin_notifiee_le: iso })
    .eq("subscription_status", STATUT_BETA)
    .lte("beta_fin", iso)
    .is("beta_fin_notifiee_le", null)
    .is("stripe_subscription_id", null)
    .select("id, email, full_name");
  if (e2) bilan.erreurs.push(`bascule : ${e2.message}`);
  for (const p of basculees ?? []) {
    bilan.bascules++;
    if (!p.email) continue;
    const m = courrielFinBeta(p.full_name ?? "", { remise: BETA.remise, joursReception: BETA.joursReceptionApres, url: `${base}/billing` });
    const { error } = await envoyerCourriel(p.id as string, { from: EXPEDITEUR_BETA, to: p.email as string, replyTo: REPONDRE_A, ...m });
    if (error) bilan.erreurs.push(`fin ${p.id} : ${error.message}`);
  }

  // 3. Avis 7 jours avant la fermeture de la réception (fin + 30 jours),
  // seulement pour un compte raccordé à la plateforme agréée.
  const limiteAvis = new Date(maintenant.getTime() - (BETA.joursReceptionApres - 7) * JOUR).toISOString();
  const { data: aAviser, error: e3 } = await admin
    .from("profiles")
    .select("id")
    .eq("subscription_status", STATUT_BETA_TERMINEE)
    .is("beta_reception_avis_le", null)
    .lte("beta_fin", limiteAvis);
  if (e3) bilan.erreurs.push(`avis : ${e3.message}`);
  const idsAvis = (aAviser ?? []).map((r) => r.id as string);
  const raccordes = await comptesRaccordes(admin, idsAvis);
  for (const id of idsAvis) {
    const { data: p } = await admin
      .from("profiles")
      .update({ beta_reception_avis_le: iso })
      .eq("id", id)
      .eq("subscription_status", STATUT_BETA_TERMINEE)
      .is("beta_reception_avis_le", null)
      .select("id, email, full_name, beta_fin")
      .maybeSingle();
    if (!p?.email || !raccordes.has(id)) continue;
    const fermeture = new Date(new Date(p.beta_fin as string).getTime() + BETA.joursReceptionApres * JOUR);
    const m = courrielAvisReception(p.full_name ?? "", { fermeture: fr(fermeture), url: `${base}/billing` });
    const { error } = await envoyerCourriel(p.id as string, { from: EXPEDITEUR_BETA, to: p.email as string, replyTo: REPONDRE_A, ...m });
    if (error) bilan.erreurs.push(`avis ${p.id} : ${error.message}`);
    else bilan.avis++;
  }

  // 4. Purge des candidatures sans compte, 12 mois après la réponse (ou le dépôt).
  const ilYaUnAn = new Date(maintenant.getTime());
  ilYaUnAn.setUTCFullYear(ilYaUnAn.getUTCFullYear() - 1);
  const { data: purgees, error: e4 } = await admin
    .from("beta_candidatures")
    .delete()
    .is("user_id", null)
    .or(`decide_le.lt.${ilYaUnAn.toISOString()},and(decide_le.is.null,cree_le.lt.${ilYaUnAn.toISOString()})`)
    .select("id");
  if (e4) bilan.erreurs.push(`purge : ${e4.message}`);
  bilan.purgees = purgees?.length ?? 0;

  // Empreintes d'IP : utiles une heure (limite d'envois), effacées après 24 heures.
  const { error: e5 } = await admin
    .from("beta_candidatures")
    .update({ ip_empreinte: null })
    .not("ip_empreinte", "is", null)
    .lt("cree_le", new Date(maintenant.getTime() - JOUR).toISOString());
  if (e5) bilan.erreurs.push(`empreintes : ${e5.message}`);

  return bilan;
}

async function comptesRaccordes(admin: Admin, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data } = await admin.from("superpdp_connections").select("user_id").in("user_id", ids);
  return new Set((data ?? []).map((r) => r.user_id as string));
}

/**
 * Comptes dont la réception doit être fermée : bêta finie depuis 30 jours au
 * moins, pas d'abonnement, ligne pas encore marquée fermée, raccordés.
 * Affiché sur /admin/beta.
 */
export async function lignesAFermer(admin: Admin, maintenant: Date): Promise<{ id: string; email: string | null; fin: string }[]> {
  const limite = new Date(maintenant.getTime() - BETA.joursReceptionApres * JOUR).toISOString();
  const { data } = await admin
    .from("profiles")
    .select("id, email, beta_fin")
    .eq("subscription_status", STATUT_BETA_TERMINEE)
    .is("beta_reception_fermee_le", null)
    .lte("beta_fin", limite);
  const ids = (data ?? []).map((r) => r.id as string);
  const raccordes = await comptesRaccordes(admin, ids);
  return (data ?? [])
    .filter((r) => raccordes.has(r.id as string))
    .map((r) => ({ id: r.id as string, email: (r.email as string) ?? null, fin: r.beta_fin as string }));
}
