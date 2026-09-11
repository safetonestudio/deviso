/**
 * Un seul endroit où du JSON-LD est injecté dans une page.
 *
 * Pourquoi : `dangerouslySetInnerHTML` était répété dans vingt-trois fichiers.
 * Ce n'était pas dangereux — le contenu est construit côté serveur à partir du
 * registre, jamais d'une saisie — mais vingt-trois copies d'un même appel, c'est
 * vingt-trois occasions d'en oublier un, ou d'y glisser une valeur non sérialisée.
 *
 * `JSON.stringify` échappe déjà `<` et `>` dans les chaînes ? Non, justement :
 * il ne le fait pas. Une chaîne contenant « </script> » refermerait la balise.
 * Aucun contenu du registre n'en contient, mais le jour où une réponse de FAQ
 * citera un extrait de code, le site ne doit pas se casser en silence — d'où
 * l'échappement explicite ci-dessous.
 */
export function DonneesStructurees({ donnees }: { donnees: unknown }) {
  const json = JSON.stringify(donnees).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
