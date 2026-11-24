/**
 * Courriels du programme bêta (lib/beta.ts).
 *
 * Deviso écrit en son nom (candidat, testeur, Selim) : ce ne sont pas des
 * messages au client d'un utilisateur, ils portent donc le nom Deviso.
 * Vouvoiement partout. Toute valeur saisie par un visiteur est échappée
 * (lib/emails/html.ts) : nom, activité et message viennent d'un formulaire
 * public.
 */
import { echapperHtml, echapperUrl } from "@/lib/emails/html";

export const EXPEDITEUR_BETA = "Deviso <noreply@getdeviso.fr>";
export const REPONDRE_A = "support@getdeviso.fr";

const SIGNATURE = "S. Albert, fondateur de Deviso";

function prenom(nom: string): string {
  return echapperHtml(nom.trim().split(/\s+/)[0] || "");
}

function cadre(titre: string, corps: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titre}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f1;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;font-size:20px;font-weight:700;color:#16211c;">Deviso</td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:14px;border:1px solid #e1e4db;padding:36px 36px 28px;font-size:15px;line-height:1.6;color:#36433c;">
${corps}
              <p style="margin:28px 0 0;color:#16211c;font-weight:600;">${SIGNATURE}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;font-size:12px;color:#5b665f;text-align:center;">
              Deviso, getdeviso.fr. Pour toute question : support@getdeviso.fr
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function bouton(url: string, texte: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="background:#0c6b4c;border-radius:10px;">
    <a href="${echapperUrl(url)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${texte}</a>
  </td></tr></table>`;
}

const p = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`;

// ── Au candidat, juste après l'envoi du formulaire ─────────────────────────
export function courrielAccuseCandidature(nom: string): { subject: string; html: string } {
  return {
    subject: "Votre candidature à la bêta Deviso est bien reçue",
    html: cadre(
      "Candidature reçue",
      p(`Bonjour ${prenom(nom)},`) +
        p("Merci pour votre candidature à la bêta de Deviso. Je la lis moi-même et je vous réponds sous 48 heures.") +
        p("Si votre profil correspond, vous recevrez un lien personnel pour créer votre compte. Vous n'avez rien d'autre à faire d'ici là.")
    ),
  };
}

// ── À Selim (support@getdeviso.fr) : nouvelle candidature ──────────────────
export function courrielNouvelleCandidature(
  c: { nom: string; email: string; activite: string | null; statut_juridique: string | null; outil: string | null; message: string | null; echange_accepte: boolean },
  urlAdmin: string
): { subject: string; html: string } {
  const ligne = (k: string, v: string | null) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5b665f;vertical-align:top;">${k}</td><td style="padding:4px 0;color:#16211c;">${echapperHtml(v || "Non renseigné")}</td></tr>`;
  return {
    subject: `Nouvelle candidature bêta : ${c.nom.slice(0, 60)}`,
    html: cadre(
      "Nouvelle candidature",
      p("Une nouvelle candidature à la bêta vient d'arriver.") +
        `<table cellpadding="0" cellspacing="0" style="margin:8px 0 8px;font-size:14px;">
          ${ligne("Nom", c.nom)}${ligne("Adresse", c.email)}${ligne("Activité", c.activite)}${ligne("Statut", c.statut_juridique)}${ligne("Facture aujourd'hui avec", c.outil)}${ligne("Échange de 20 minutes", c.echange_accepte ? "Accepté" : "Non")}${ligne("Message", c.message)}
        </table>` +
        bouton(urlAdmin, "Accepter ou refuser")
    ),
  };
}

// ── Au candidat accepté : son lien personnel ───────────────────────────────
export function courrielAcces(
  nom: string,
  url: string,
  opts: { typeAcces: "testeur" | "cabinet"; dureeMois: number; joursValidite: number }
): { subject: string; html: string } {
  const corps =
    opts.typeAcces === "testeur"
      ? p(`Bonjour ${prenom(nom)},`) +
        p("Bonne nouvelle : votre accès à la bêta de Deviso est ouvert.") +
        p(`Créez votre compte avec le lien ci-dessous. Vous aurez Deviso complet, sans rien payer, pendant ${opts.dureeMois} mois à partir de la création de votre compte. Aucune carte bancaire ne vous sera demandée.`) +
        bouton(url, "Créer mon compte") +
        p(`Ce lien vous est personnel et reste valable ${opts.joursValidite} jours. Je vous écrirai pour fixer nos 20 minutes d'échange.`)
      : p(`Bonjour ${prenom(nom)},`) +
        p("Votre accès à Deviso pour votre cabinet est ouvert. Le cockpit cabinet est gratuit.") +
        bouton(url, "Créer le compte du cabinet") +
        p(`Ce lien vous est personnel et reste valable ${opts.joursValidite} jours.`);
  return {
    subject: opts.typeAcces === "testeur" ? "Votre accès à la bêta Deviso est ouvert" : "Votre accès cabinet à Deviso est ouvert",
    html: cadre("Accès ouvert", corps),
  };
}

// ── Au candidat refusé ─────────────────────────────────────────────────────
export function courrielRefus(nom: string): { subject: string; html: string } {
  return {
    subject: "Votre candidature à la bêta Deviso",
    html: cadre(
      "Candidature",
      p(`Bonjour ${prenom(nom)},`) +
        p("Merci de l'intérêt que vous portez à Deviso. Les places de la bêta sont limitées, et je ne peux pas retenir votre candidature cette fois-ci.") +
        p("Je vous préviendrai volontiers quand Deviso sera ouvert à tous. Vous pouvez aussi m'écrire à support@getdeviso.fr à tout moment.")
    ),
  };
}

// ── Au testeur, 7 jours avant la fin ───────────────────────────────────────
export function courrielRappelFinBeta(
  nom: string,
  opts: { fin: string; remise: number; url: string }
): { subject: string; html: string } {
  return {
    subject: "Votre bêta Deviso se termine dans 7 jours",
    html: cadre(
      "Fin de bêta dans 7 jours",
      p(`Bonjour ${prenom(nom)},`) +
        p(`Votre bêta de Deviso se termine le ${echapperHtml(opts.fin)}. Merci pour vos retours pendant ces semaines.`) +
        p(`Pour continuer sans interruption, abonnez-vous avant cette date : en tant que bêta-testeur, votre abonnement est à -${opts.remise} % pendant 12 mois.`) +
        bouton(opts.url, "Voir mon abonnement")
    ),
  };
}

// ── Au testeur, le jour de la fin ──────────────────────────────────────────
export function courrielFinBeta(
  nom: string,
  opts: { remise: number; joursReception: number; url: string }
): { subject: string; html: string } {
  return {
    subject: "Votre bêta Deviso est terminée",
    html: cadre(
      "Bêta terminée",
      p(`Bonjour ${prenom(nom)},`) +
        p("Votre bêta de Deviso est terminée. Merci d'avoir fait partie des premiers utilisateurs.") +
        p("Rien n'est supprimé : vos devis, vos factures et vos clients restent consultables. Les fonctions de l'abonnement, dont la création de factures, sont suspendues.") +
        p(`Vos factures reçues continuent d'arriver pendant ${opts.joursReception} jours. Pour garder votre adresse de réception au-delà, abonnez-vous ou choisissez une autre plateforme agréée.`) +
        p(`Pour continuer, votre abonnement est à -${opts.remise} % pendant 12 mois.`) +
        bouton(opts.url, "Continuer avec Deviso")
    ),
  };
}

// ── Au testeur, quelques jours avant la fermeture de la réception ──────────
export function courrielAvisReception(nom: string, opts: { fermeture: string; url: string }): { subject: string; html: string } {
  return {
    subject: "Votre adresse de réception de factures sera fermée",
    html: cadre(
      "Réception de factures",
      p(`Bonjour ${prenom(nom)},`) +
        p(`Votre bêta de Deviso est terminée. Votre adresse de réception de factures électroniques sera fermée le ${echapperHtml(opts.fermeture)}.`) +
        p("Après cette date, vos fournisseurs ne pourront plus vous envoyer de factures par Deviso. Pour garder cette adresse, abonnez-vous ; sinon, choisissez une autre plateforme agréée avant cette date.") +
        bouton(opts.url, "Garder mon adresse avec Deviso")
    ),
  };
}
