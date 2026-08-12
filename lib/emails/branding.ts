/**
 * Pied de page « via Deviso » des emails clients.
 *
 * Règle : visible tant que l'utilisateur n'a pas d'abonnement actif, masqué dès
 * Solo ou Pro. C'est exactement celle qu'appliquent déjà les documents
 * (`showBranding = plan === "free"` dans ProposalDocument et sur la page
 * publique). Les emails en étaient la seule exception — un oubli, pas un choix :
 * la grille tarifaire vend « Sans branding Deviso sur vos documents », et un
 * client payant qui voit encore la marque dans ses relances a raison de se
 * plaindre.
 *
 * `plan` vaut `'free'` par défaut à l'inscription. Ce n'est plus une offre
 * commerciale, mais c'est l'état de tout compte avant abonnement — donc
 * précisément la population qui prospecte, et pour laquelle ce pied de page est
 * le seul canal de diffusion gratuit du produit.
 */

export const MARQUE_VISIBLE = (plan?: string | null) => plan === "free" || !plan;

/**
 * Renvoie le bloc HTML du pied de page, ou une chaîne vide pour un abonné.
 * `texte` varie selon le contexte : « Ce devis a été créé via », « Relance
 * automatique envoyée via »…
 */
export function piedDePageMarque(plan: string | null | undefined, texte: string, couleur = "#4f46e5") {
  if (!MARQUE_VISIBLE(plan)) return "";
  return `<p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">${texte} <a href="https://getdeviso.fr" style="color:${couleur};text-decoration:none;">Deviso</a></p>`;
}
