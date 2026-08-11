/**
 * Adresses postales des documents.
 *
 * Deux représentations coexistent volontairement :
 *  - les champs séparés (rue / CP / ville / pays), exigés en éléments distincts
 *    par l'EN 16931 pour le XML de facture électronique ;
 *  - une chaîne affichable, recomposée depuis les champs séparés, utilisée par
 *    les PDF et les emails.
 *
 * La chaîne est **dérivée**, jamais saisie : c'est ce qui rend le découpage
 * déterministe. Auparavant on faisait l'inverse — deviner le code postal dans du
 * texte libre — et une adresse mal formée produisait une facture non conforme
 * sans qu'aucun contrôle ne le signale.
 *
 * Rien ici n'est bloquant : un document doit pouvoir être créé et envoyé avec
 * une adresse incomplète. Le manque est signalé, jamais opposé à l'utilisateur.
 */

export interface AddressParts {
  street?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string | null;
}

const clean = (v?: string | null) => v?.trim() || null;

/** « 24 Avenue de Gradignan, 33170 Gradignan » */
export function composeAddress(parts: AddressParts): string | null {
  const street = clean(parts.street);
  const locality = [clean(parts.postcode), clean(parts.city)].filter(Boolean).join(" ");
  return [street, locality || null].filter(Boolean).join(", ") || null;
}

/**
 * Découpage de secours d'une adresse en texte libre, pour les documents créés
 * avant l'introduction des champs séparés. On n'extrait que ce dont on est
 * certain : le premier groupe de cinq chiffres est le code postal, ce qui suit
 * est la ville. Sinon on rend la chaîne entière comme rue et on laisse le reste
 * vide — un champ vide se voit et se corrige, une valeur devinée se propage.
 */
export function splitAddress(raw?: string | null): Required<AddressParts> {
  const value = clean(raw);
  if (!value) return { street: null, postcode: null, city: null, country: "FR" };

  const match = value.match(/\d{5}/);
  if (!match) return { street: value, postcode: null, city: null, country: "FR" };

  const [before, after] = value.split(match[0]);
  return {
    street: clean(before?.replace(/[\s,]+$/, "")),
    postcode: match[0],
    city: clean(after?.replace(/^[\s,]+/, "")),
    country: "FR",
  };
}

/**
 * Réconcilie ce qui arrive d'un formulaire avec l'existant : on privilégie les
 * champs séparés quand ils sont renseignés, sinon on retombe sur le découpage
 * du texte libre. Utilisé à l'écriture (normalisation) comme à la lecture
 * (génération du XML) pour que les deux ne puissent pas diverger.
 */
export function resolveAddress(
  parts: AddressParts,
  fallbackRaw?: string | null
): Required<AddressParts> & { formatted: string | null } {
  const hasStructured = Boolean(clean(parts.postcode) || clean(parts.city) || clean(parts.street));
  const base = hasStructured
    ? {
        street: clean(parts.street),
        postcode: clean(parts.postcode),
        city: clean(parts.city),
        country: clean(parts.country) || "FR",
      }
    : splitAddress(fallbackRaw);

  return { ...base, formatted: composeAddress(base) ?? clean(fallbackRaw) };
}
