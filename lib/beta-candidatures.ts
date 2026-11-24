import { createHash, createHmac, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { appUrl } from "@/lib/public-url";
import { BETA, STATUT_BETA, finDeBeta } from "@/lib/beta";
import {
  EXPEDITEUR_BETA,
  REPONDRE_A,
  courrielAcces,
  courrielAccuseCandidature,
  courrielNouvelleCandidature,
  courrielRefus,
} from "@/lib/emails/beta";

/**
 * Candidatures et invitations du programme bêta. Serveur seulement (clé de
 * service) : la table beta_candidatures n'a aucune politique RLS.
 *
 * Le lien d'accès envoyé au candidat accepté porte un jeton aléatoire ; seule
 * son empreinte SHA-256 est stockée. Usage unique, durée limitée, et lié à
 * l'adresse de la candidature : le compte qui l'utilise doit avoir CETTE adresse.
 */

export type TypeAcces = "testeur" | "cabinet";

export type Candidature = {
  id: string;
  cree_le: string;
  origine: "formulaire" | "direct";
  type_acces: TypeAcces;
  nom: string;
  email: string;
  activite: string | null;
  statut_juridique: string | null;
  outil: string | null;
  message: string | null;
  echange_accepte: boolean;
  statut: "en_attente" | "acceptee" | "refusee";
  decide_le: string | null;
  jeton_expire_le: string | null;
  jeton_utilise_le: string | null;
  user_id: string | null;
};

const COLONNES =
  "id, cree_le, origine, type_acces, nom, email, activite, statut_juridique, outil, message, echange_accepte, statut, decide_le, jeton_expire_le, jeton_utilise_le, user_id";

export const empreinte = (v: string) => createHash("sha256").update(v).digest("hex");

export function normaliserEmail(e: string): string {
  return e.trim().toLowerCase();
}

/**
 * Lien personnel envoyé au candidat accepté. Il mène à l'activation : connecté,
 * le compte passe en bêta tout de suite (cas d'un compte déjà existant) ;
 * sinon, l'activation renvoie vers l'inscription (adresse préremplie), qui y
 * revient après la confirmation de l'adresse.
 */
export function lienInscription(jeton: string): string {
  return `${appUrl()}/api/beta/activer?j=${encodeURIComponent(jeton)}`;
}

async function envoyer(to: string, m: { subject: string; html: string }, replyTo = REPONDRE_A) {
  const { error } = await resend.emails.send({ from: EXPEDITEUR_BETA, to, replyTo, subject: m.subject, html: m.html });
  if (error) throw new Error(`Courriel non parti (${m.subject}) : ${error.message}`);
}

// ── Candidature publique ────────────────────────────────────────────────────

export type SaisieCandidature = {
  nom: string;
  email: string;
  activite?: string | null;
  statut_juridique?: string | null;
  outil?: string | null;
  message?: string | null;
  echange_accepte: boolean;
};

/**
 * Empreinte de l'adresse IP pour la limite d'envois : HMAC avec un secret
 * serveur, donc non réversible (une empreinte SHA-256 nue se retrouve en
 * parcourant l'espace IPv4). Effacée après 24 heures par le cron fin-beta.
 */
export function empreinteIp(ip: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHmac("sha256", secret).update(`beta:${ip}`).digest("hex");
}

/**
 * Enregistre une candidature, d'un seul geste en base (fonction
 * beta_enregistrer_candidature : verrou par origine, limite de 3 envois par
 * heure, doublon d'adresse en attente, insertion). Les courriels ne sont PAS
 * envoyés ici : la route les envoie après avoir répondu, pour que le temps de
 * réponse ne révèle pas si une adresse a déjà candidaté.
 */
export async function enregistrerCandidature(
  s: SaisieCandidature,
  ipEmpreinte: string | null
): Promise<"nouvelle" | "doublon" | "limite"> {
  const { data, error } = await createAdminClient().rpc("beta_enregistrer_candidature", {
    p_nom: s.nom.trim(),
    p_email: normaliserEmail(s.email),
    p_activite: s.activite?.trim() || null,
    p_statut_juridique: s.statut_juridique?.trim() || null,
    p_outil: s.outil?.trim() || null,
    p_message: s.message?.trim() || null,
    p_echange: s.echange_accepte,
    p_ip_empreinte: ipEmpreinte,
  });
  if (error) throw new Error(`Candidature non enregistrée : ${error.message}`);
  if (data !== "nouvelle" && data !== "doublon" && data !== "limite") throw new Error(`Réponse inattendue : ${data}`);
  return data;
}

/** Courriels d'une nouvelle candidature : à Selim, puis accusé au candidat. */
export async function courrielsCandidature(s: SaisieCandidature): Promise<void> {
  const email = normaliserEmail(s.email);
  const ligne = {
    nom: s.nom.trim(),
    email,
    activite: s.activite?.trim() || null,
    statut_juridique: s.statut_juridique?.trim() || null,
    outil: s.outil?.trim() || null,
    message: s.message?.trim() || null,
    echange_accepte: s.echange_accepte,
  };
  try {
    await envoyer(REPONDRE_A, courrielNouvelleCandidature(ligne, `${appUrl()}/admin/beta`), email);
    await envoyer(email, courrielAccuseCandidature(ligne.nom));
  } catch (e) {
    console.error("[beta] candidature enregistrée, courriel en échec :", e);
  }
}

// ── Décisions de Selim (page /admin/beta) ───────────────────────────────────

export async function listerCandidatures(): Promise<Candidature[]> {
  const { data, error } = await createAdminClient()
    .from("beta_candidatures")
    .select(COLONNES)
    .order("cree_le", { ascending: false });
  if (error) throw new Error(`Lecture des candidatures impossible : ${error.message}`);
  return (data ?? []) as Candidature[];
}

/** Ouvre l'accès : jeton neuf, statut acceptée, courriel avec le lien personnel. */
async function ouvrirAcces(id: string): Promise<void> {
  const admin = createAdminClient();
  const jeton = randomBytes(32).toString("base64url");
  const expire = new Date(Date.now() + BETA.joursValiditeLien * 86400_000);
  const { data, error } = await admin
    .from("beta_candidatures")
    .update({
      statut: "acceptee",
      decide_le: new Date().toISOString(),
      jeton_hash: empreinte(jeton),
      jeton_expire_le: expire.toISOString(),
      jeton_utilise_le: null,
    })
    .eq("id", id)
    .is("jeton_utilise_le", null)
    .select(COLONNES)
    .maybeSingle();
  if (error) throw new Error(`Acceptation impossible : ${error.message}`);
  if (!data) throw new Error("Candidature introuvable, ou accès déjà utilisé.");
  const c = data as Candidature;
  await envoyer(
    c.email,
    courrielAcces(c.nom, lienInscription(jeton), {
      typeAcces: c.type_acces,
      dureeMois: BETA.dureeMois,
      joursValidite: BETA.joursValiditeLien,
    })
  );
}

/** Accepter une candidature en attente (ou renvoyer un lien expiré non utilisé). */
export async function accepter(id: string): Promise<void> {
  await ouvrirAcces(id);
}

export async function refuser(id: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("beta_candidatures")
    .update({ statut: "refusee", decide_le: new Date().toISOString(), jeton_hash: null, jeton_expire_le: null })
    .eq("id", id)
    .eq("statut", "en_attente")
    .select("nom, email")
    .maybeSingle();
  if (error) throw new Error(`Refus impossible : ${error.message}`);
  if (!data) throw new Error("Seule une candidature en attente peut être refusée.");
  await envoyer(data.email as string, courrielRefus(data.nom as string));
}

/** Invitation directe de Selim (clients du cabinet pilote, cabinet lui-même), sans formulaire. */
export async function inviterDirectement(nom: string, email: string, typeAcces: TypeAcces): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("beta_candidatures")
    .insert({ origine: "direct", type_acces: typeAcces, nom: nom.trim(), email: normaliserEmail(email), echange_accepte: true })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Une candidature est déjà en attente pour cette adresse : acceptez-la depuis la liste.");
    throw new Error(`Invitation impossible : ${error.message}`);
  }
  await ouvrirAcces(data.id as string);
}

// ── Jeton : vérification (page d'inscription) et activation (après inscription) ──

/** Le jeton est-il utilisable ? Renvoie l'adresse et le type d'accès qu'il ouvre. */
export async function lireJeton(jeton: string): Promise<{ email: string; typeAcces: TypeAcces } | null> {
  if (!jeton || jeton.length > 200) return null;
  const { data } = await createAdminClient()
    .from("beta_candidatures")
    .select("email, type_acces, jeton_expire_le, jeton_utilise_le, statut")
    .eq("jeton_hash", empreinte(jeton))
    .maybeSingle();
  if (!data || data.statut !== "acceptee" || data.jeton_utilise_le) return null;
  if (!data.jeton_expire_le || new Date(data.jeton_expire_le as string).getTime() < Date.now()) return null;
  return { email: data.email as string, typeAcces: data.type_acces as TypeAcces };
}

export type ResultatActivation =
  | { ok: true; typeAcces: TypeAcces; dejaActive: boolean }
  | { ok: false; raison: "jeton" | "adresse" | "abonnement" };

/**
 * Consomme le jeton pour ce compte et ouvre la bêta (type testeur) : formule
 * complète, statut « beta », 2 mois À PARTIR DE MAINTENANT (création du compte,
 * décision de Selim du 24/11). Aucun objet Stripe n'est créé.
 *
 * Le jeton est marqué utilisé dans la MÊME requête qui vérifie sa validité et
 * l'adresse : deux activations simultanées ne peuvent pas l'utiliser deux fois.
 * Un compte qui porte déjà un abonnement Stripe n'est pas touché.
 */
export async function activerBeta(userId: string, emailCompte: string, jeton: string): Promise<ResultatActivation> {
  const admin = createAdminClient();
  const email = normaliserEmail(emailCompte);
  const maintenant = new Date();

  // Le même compte qui revient sur son lien (rechargement) : déjà activé, rien à refaire.
  const { data: deja } = await admin
    .from("beta_candidatures")
    .select("type_acces, user_id")
    .eq("jeton_hash", empreinte(jeton))
    .maybeSingle();
  if (deja && deja.user_id === userId) {
    // Activation interrompue (jeton consommé, profil pas encore écrit) : on la
    // termine. Idempotent : sans effet si la bêta est déjà posée.
    if (deja.type_acces === "testeur") {
      const { error } = await admin
        .from("profiles")
        .update({ plan: "pro", subscription_status: STATUT_BETA, beta_debut: maintenant.toISOString(), beta_fin: finDeBeta(maintenant).toISOString() })
        .eq("id", userId)
        .is("beta_debut", null)
        .is("stripe_subscription_id", null);
      if (error) throw new Error(`Ouverture de la bêta impossible : ${error.message}`);
    }
    return { ok: true, typeAcces: deja.type_acces as TypeAcces, dejaActive: true };
  }

  const { data: c } = await admin
    .from("beta_candidatures")
    .update({ jeton_utilise_le: maintenant.toISOString(), user_id: userId })
    .eq("jeton_hash", empreinte(jeton))
    .eq("statut", "acceptee")
    .is("jeton_utilise_le", null)
    .gt("jeton_expire_le", maintenant.toISOString())
    .eq("email", email)
    .select("type_acces")
    .maybeSingle();

  if (!c) {
    const valide = await lireJeton(jeton);
    return { ok: false, raison: valide ? "adresse" : "jeton" };
  }

  if (c.type_acces !== "testeur") return { ok: true, typeAcces: c.type_acces as TypeAcces, dejaActive: false };

  const { data: profil } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (profil?.stripe_subscription_id) return { ok: false, raison: "abonnement" };

  const { error } = await admin
    .from("profiles")
    .update({
      plan: "pro",
      subscription_status: STATUT_BETA,
      beta_debut: maintenant.toISOString(),
      beta_fin: finDeBeta(maintenant).toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(`Ouverture de la bêta impossible : ${error.message}`);
  return { ok: true, typeAcces: "testeur", dejaActive: false };
}
