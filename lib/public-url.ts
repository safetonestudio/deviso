import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Résolution de l'adresse publique sous laquelle un utilisateur partage ses
 * documents.
 *
 * Point unique de vérité, volontairement. Auparavant chaque route reconstruisait
 * l'URL de son côté : la page devis utilisait le sous-domaine, les relances
 * repartaient sur `NEXT_PUBLIC_APP_URL`. Le client recevait donc deux adresses
 * différentes pour le même devis — au moment précis où on lui demande de signer.
 */

export const ROOT_DOMAIN = "getdeviso.fr";

export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || `https://${ROOT_DOMAIN}`;

/** Le sous-domaine est une contrepartie du plan Pro : il tombe avec l'abonnement. */
export function publicBaseUrl(owner?: {
  subdomain?: string | null;
  plan?: string | null;
} | null): string {
  if (owner?.plan === "pro" && owner.subdomain) {
    return `https://${owner.subdomain}.${ROOT_DOMAIN}`;
  }
  return appUrl();
}

/**
 * Variante pour les traitements côté serveur qui n'ont que l'identifiant du
 * propriétaire — les crons, notamment, qui parcourent les documents de tout le
 * monde. Passe par le client admin : ces routes n'ont pas de session utilisateur.
 */
export async function publicBaseUrlForUser(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("subdomain, plan")
    .eq("id", userId)
    .maybeSingle();
  return publicBaseUrl(data);
}

/**
 * Lien de consultation et de signature d'un devis.
 *
 * Le jeton est typé `string | null` en base : un devis sans jeton n'est pas
 * partageable, on renvoie alors la racine plutôt qu'une URL en `/p/null`.
 */
export const proposalShareUrl = (base: string, shareToken: string | null) =>
  shareToken ? `${base}/p/${shareToken}` : base;
