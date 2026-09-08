/**
 * Échapper ce qui vient de l'utilisateur avant de l'insérer dans un e-mail.
 *
 * Pourquoi ce fichier existe. Les gabarits d'e-mail de Deviso sont des gabarits
 * de chaîne : `<p>Bonjour ${clientName},</p>`. C'est lisible, et c'est le bon
 * choix pour du HTML d'e-mail — mais toute valeur interpolée est du HTML, pas
 * du texte. Un nom de société contenant `<` ou `"` casse la mise en page ; un
 * nom choisi exprès injecte une balise, donc un lien, dans un message qui part
 * avec la signature du domaine.
 *
 * Ces valeurs viennent toutes de champs libres : raison sociale du profil,
 * titre du devis, nom du client. Personne ne les valide, et il n'y a aucune
 * raison qu'on les valide — un nom d'entreprise a le droit de contenir une
 * apostrophe. C'est à l'insertion qu'on les rend inoffensives.
 *
 * `attribut` sert pour ce qui atterrit dans un `href` ou un `style` : on y
 * échappe en plus les guillemets, faute de quoi une valeur bien choisie sort de
 * l'attribut et en ouvre un autre.
 */

/** Texte destiné au corps du HTML. */
export function echapperHtml(v: string | null | undefined): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * URL destinée à un attribut `href`.
 *
 * On n'échappe pas seulement : on refuse tout schéma autre que `http(s)`.
 * `javascript:` ne s'exécute pas dans un client de messagerie sérieux, mais
 * l'aperçu web d'un webmail n'est pas toujours un client sérieux, et une URL
 * qu'on n'a pas fabriquée soi-même n'a rien à faire dans un bouton d'appel à
 * l'action.
 */
export function echapperUrl(v: string | null | undefined): string {
  const brut = String(v ?? "").trim();
  if (!/^https?:\/\//i.test(brut)) return "";
  return echapperHtml(brut);
}
