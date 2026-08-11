import { Resend } from "resend";

/**
 * Client d'envoi — clé « Sending access ».
 *
 * C'est le chemin chaud (devis, factures, relances). Volontairement restreint :
 * si cette clé fuite, elle ne permet pas de manipuler les domaines du compte.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Client d'administration des domaines — clé « Full access ».
 *
 * Nécessaire uniquement pour `domains.create/get/verify/remove`, utilisé par la
 * fonctionnalité « domaine d'envoi personnalisé » du plan Pro. La clé d'envoi
 * renvoie `restricted_api_key` (401) sur ces appels — c'est ce qui faisait
 * remonter un message anglais incompréhensible dans le formulaire.
 *
 * Volontairement séparée plutôt que de tout basculer sur une clé Full access :
 * une clé qui peut supprimer les domaines n'a rien à faire sur le chemin qui
 * envoie des centaines d'emails par jour.
 */
export const resendAdmin = process.env.RESEND_ADMIN_API_KEY
  ? new Resend(process.env.RESEND_ADMIN_API_KEY)
  : null;
