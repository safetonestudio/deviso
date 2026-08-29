/**
 * Helpers de dérivation pour la conformité Factur-X EN 16931.
 *
 * Principe : ne jamais imposer une ressaisie à l'utilisateur quand la donnée
 * peut être déduite de façon fiable de ce qu'il a déjà renseigné.
 *  - le SIREN se déduit du SIRET (9 premiers chiffres)
 *  - le n° de TVA intracommunautaire français se CALCULE depuis le SIREN
 *  - le code postal et la ville se parsent d'une adresse en texte libre
 */

/** Ne conserve que les chiffres (les utilisateurs saisissent « 123 456 789 »). */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * SIREN (9 chiffres) depuis un SIRET (14) ou un SIREN déjà correct.
 * EN 16931 impose schemeID="0002" = SIREN sur exactement 9 chiffres.
 * Retourne null si la valeur ne permet pas d'obtenir un SIREN plausible.
 */
export function toSiren(value: string | null | undefined): string | null {
  const d = digitsOnly(value);
  if (d.length === 9 || d.length === 14) return d.slice(0, 9);
  return null;
}

/** SIRET (14 chiffres) si disponible, sinon null. Utilisé pour l'affichage PDF. */
export function toSiret(value: string | null | undefined): string | null {
  const d = digitsOnly(value);
  return d.length === 14 ? d : null;
}

/**
 * Clé de contrôle du n° de TVA intracommunautaire français.
 * Formule officielle : clé = (12 + 3 × (SIREN mod 97)) mod 97
 * Permet de produire BT-31 sans que l'utilisateur ait à le saisir.
 */
export function computeFrenchVatNumber(sirenOrSiret: string | null | undefined): string | null {
  const siren = toSiren(sirenOrSiret);
  if (!siren) return null;
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

/**
 * Renvoie le n° de TVA à utiliser : celui saisi s'il est valide,
 * sinon celui calculé depuis le SIREN. Null si l'entreprise est en franchise
 * (dans ce cas EN 16931 n'exige pas BT-31, la catégorie TVA est "E").
 *
 * `derived: true` signale une valeur calculée : elle est exacte dans la très
 * grande majorité des cas, mais certaines clés historiques sont alphabétiques
 * et seul le SIE fait foi. L'UI doit inviter l'utilisateur à la confirmer.
 */
export function resolveVatNumber(
  declaredVatNumber: string | null | undefined,
  sirenOrSiret: string | null | undefined,
  isFranchise: boolean
): { value: string | null; derived: boolean } {
  if (isFranchise) return { value: null, derived: false };
  const declared = (declaredVatNumber ?? "").replace(/\s/g, "").toUpperCase();
  if (/^FR[0-9A-Z]{2}\d{9}$/.test(declared)) return { value: declared, derived: false };
  return { value: computeFrenchVatNumber(sirenOrSiret), derived: true };
}

export interface StructuredAddress {
  street: string | null;
  postcode: string | null;
  city: string | null;
  country: string;
}

/**
 * Parse une adresse française en texte libre vers ses composants EN 16931.
 * Gère les séparateurs courants (virgule, retour ligne) et la position
 * habituelle « rue, CP ville ».
 *
 * "24 Avenue de Gradignan, 33850 Léognan" → { street: "24 Avenue de Gradignan", postcode: "33850", city: "Léognan" }
 */
export function parseAddress(raw: string | null | undefined): StructuredAddress {
  const empty: StructuredAddress = { street: null, postcode: null, city: null, country: "FR" };
  if (!raw) return empty;

  const text = raw.replace(/\r/g, "").trim();
  if (!text) return empty;

  // Cherche un code postal français : 5 chiffres isolés
  const match = text.match(/(^|[\s,\n])(\d{5})([\s,\n]|$)/);

  if (!match || match.index === undefined) {
    // Pas de CP identifiable : tout part dans la rue, la conformité sera signalée
    return { ...empty, street: text.replace(/\n/g, " ").trim() || null };
  }

  const postcode = match[2];
  const cpStart = match.index + match[1].length;
  const before = text.slice(0, cpStart);
  const after = text.slice(cpStart + postcode.length);

  const street = before.replace(/[\s,\n]+$/, "").replace(/\n/g, " ").trim();
  const city = after.replace(/^[\s,\n]+/, "").replace(/\n/g, " ").trim();

  return {
    street: street || null,
    postcode,
    city: city || null,
    country: "FR",
  };
}

/**
 * Adresse électronique de facturation (BT-34 / BT-49) au sens de l'annuaire
 * français : dans la quasi-totalité des cas, le SIREN de l'entreprise.
 * Utilisée avec schemeID="0225" (Peppol France).
 */
export function electronicAddress(sirenOrSiret: string | null | undefined): string | null {
  return toSiren(sirenOrSiret);
}

/**
 * Un client est-il un particulier (B2C) ?
 *
 * Heuristique provisoire — documentée comme telle depuis l'introduction de
 * `FacturXCompliance` : sans raison sociale, le client est un particulier.
 * Centralisée ici (au lieu d'être réécrite dans le composant de conformité,
 * la génération XML et la route d'émission Super PDP) pour ne pas reproduire
 * la divergence constatée sur la navigation (`check:nav`, 22/08/2026) : trois
 * implémentations indépendantes d'une même règle finissent par diverger sans
 * qu'aucun contrôle ne le remarque.
 */
export function isB2CInvoice(input: { client_company?: string | null }): boolean {
  return !input.client_company?.trim();
}

export interface ComplianceIssue {
  field: string;
  label: string;
  blocking: boolean;
}

/**
 * Diagnostic de conformité EN 16931 d'une facture, à afficher à l'utilisateur
 * avant émission. `blocking: true` = la facture serait rejetée par une
 * Plateforme Agréée.
 */
export function checkInvoiceCompliance(input: {
  sellerSiren?: string | null;
  sellerAddress?: string | null;
  sellerVatNumber?: string | null;
  clientSiren?: string | null;
  clientAddress?: string | null;
  isFranchise: boolean;
  isB2C?: boolean;
  operationCategory?: "services" | "goods" | "mixed" | null;
}): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Documenté par Super PDP (page "E-reporting", 29/08/2026) : « Les factures
  // mixtes (appelées aussi doubles) comportant des ventes de biens et
  // services ne sont pas gérées. » L'extraction automatique de l'e-reporting
  // ne sait pas ventiler une facture entre les deux — il faut deux factures.
  if (input.operationCategory === "mixed") {
    issues.push({
      field: "operation_category",
      label:
        "Une facture mélangeant biens et services ne peut pas être transmise à la Plateforme Agréée — séparez-la en deux factures",
      blocking: true,
    });
  }

  if (!toSiren(input.sellerSiren)) {
    issues.push({ field: "seller_siren", label: "Votre SIREN ou SIRET est manquant ou invalide", blocking: true });
  }

  const sellerAddr = parseAddress(input.sellerAddress);
  if (!sellerAddr.postcode || !sellerAddr.city) {
    issues.push({ field: "seller_address", label: "Votre adresse doit contenir un code postal et une ville", blocking: true });
  }

  if (!input.isFranchise) {
    const vat = resolveVatNumber(input.sellerVatNumber, input.sellerSiren, false);
    if (!vat.value) {
      issues.push({ field: "tva_number", label: "Numéro de TVA intracommunautaire requis (facture assujettie à la TVA)", blocking: true });
    } else if (vat.derived) {
      issues.push({
        field: "tva_number",
        label: `Numéro de TVA calculé depuis votre SIREN (${vat.value}) — vérifiez-le auprès de votre SIE et enregistrez-le dans votre profil`,
        blocking: false,
      });
    }
  }

  // Les obligations d'adressage ne concernent que le B2B
  if (!input.isB2C) {
    if (!toSiren(input.clientSiren)) {
      issues.push({ field: "client_siren", label: "Le SIREN du client est requis pour l'acheminement de la facture", blocking: true });
    }
    const clientAddr = parseAddress(input.clientAddress);
    if (!clientAddr.postcode || !clientAddr.city) {
      issues.push({ field: "client_address", label: "L'adresse du client doit contenir un code postal et une ville", blocking: true });
    }
  }

  return issues;
}
