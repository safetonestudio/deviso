import { isB2CInvoice } from "@/lib/facturx-helpers";
import type { Invoice } from "@/types";

/**
 * De quelle nature est l'opération, au sens de la réforme.
 *
 * Pourquoi ce fichier existe. La route d'émission déclarait
 * `processing_rule: isB2C ? "B2C" : "B2B"`. Une facture à un client belge,
 * allemand ou suisse partait donc étiquetée **B2B** — c'est-à-dire annoncée au
 * réseau national de facturation, qui n'a pas à l'acheminer. Cas massivement
 * fréquent chez les freelances techniques, et jamais traité.
 *
 * Les trois natures que la plateforme sait recevoir (« Only `B2B`, `B2C` and
 * `B2BInt` are handled » dans la description de `processing_rule`) :
 *
 *   - **B2C** : le client est un particulier. Pas d'acheminement, mais un
 *     e-reporting de la transaction et de l'encaissement.
 *   - **B2BInt** : le client est une entreprise hors de France. Pas
 *     d'acheminement national non plus, mais un e-reporting des opérations
 *     internationales — et il porte aussi sur les ACHATS, ce que Deviso ne
 *     couvre pas encore.
 *   - **B2B** : tout le reste, c'est-à-dire une entreprise française.
 *
 * Le pays est déterminant et n'était lu nulle part. Attention : `parseAddress`
 * met « FR » par défaut quand rien n'est renseigné, donc un pays vide n'est PAS
 * une information — c'est une absence, et on la traite comme la France, ce qui
 * est le comportement le moins surprenant pour un logiciel français.
 */
export type NatureOperation = "B2B" | "B2C" | "B2BInt";

/**
 * Territoires où la TVA française s'applique pour ce qui nous occupe.
 * Monaco est traité comme la France au regard de la TVA (art. 302 F CGI).
 * Les DOM sont hors du territoire TVA métropolitain mais restent français et
 * relèvent du circuit national : on ne les sort donc pas en B2BInt.
 */
const CODES_FRANCE = new Set(["FR", "MC", "GP", "MQ", "GF", "RE", "YT"]);

export function paysFrancais(code: string | null | undefined): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return true; // absence de pays = France, cf. parseAddress
  return CODES_FRANCE.has(c);
}

export function natureOperation(facture: {
  client_company?: string | null;
  client_country?: string | null;
}): NatureOperation {
  if (isB2CInvoice(facture as unknown as Invoice)) return "B2C";
  return paysFrancais(facture.client_country) ? "B2B" : "B2BInt";
}
