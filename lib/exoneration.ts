// Imports relatifs et sans alias : cette règle est éprouvée par
// `scripts/e2e/exoneration.mjs`, qui tourne sous node sans le résolveur de Next.
import { CODES_UE, estFrance } from "./territoires.ts";

/**
 * Pourquoi cette facture ne porte pas de TVA, et ce qu'il faut écrire dessus.
 *
 * Pourquoi ce fichier existe. Le PDF, le XML transmis à l'administration et
 * l'écran tiraient tous les trois la même conclusion d'une seule donnée :
 *
 *   const isFranchise = invoice.tva_rate === 0;
 *
 * Un taux nul devenait donc, partout, « franchise en base, article 293 B du
 * CGI », la mention du micro-entrepreneur non assujetti. Or un zéro de TVA a
 * au moins quatre causes, et 293 B n'en est qu'une :
 *
 *   | Cause                          | Catégorie EN 16931 | Mention légale                        |
 *   |--------------------------------|--------------------|---------------------------------------|
 *   | Franchise en base              | E                  | art. 293 B du CGI                     |
 *   | Livraison de biens dans l'UE   | K                  | Exonération, art. 262 ter I du CGI    |
 *   | Prestation à une entreprise UE | AE                 | Autoliquidation (art. 196 directive)  |
 *   | Exportation de biens hors UE   | G                  | Exonération, art. 262 I du CGI        |
 *   | Prestation à une entreprise    | G                  | TVA non applicable, art. 259-1° CGI   |
 *   | hors UE                        |                    |                                       |
 *
 * Correction du 27/11/2026 : les articles 262 ter I et 262 I ne visent que les
 * LIVRAISONS DE BIENS. Ils s'imprimaient aussi sur des prestations de services
 * (le cas le plus courant chez les utilisateurs), ce qui est une mention
 * fausse. La nature de l'opération (`operation_category`, déduite des lignes)
 * départage désormais ; inconnue ou mixte, on revient à la mention neutre.
 *
 * ATTENTION : au 1er janvier 2027, la TVA quitte le CGI pour le livre II du code des
 * impositions sur les biens et services (BOFiP BOI-RES-TVA-000253) : les
 * numéros d'articles cités ici (293 B, 262 ter I, 262 I, 259-1°) seront à
 * remplacer par leurs équivalents du CIBS.
 *
 * Conséquence concrète : un développeur assujetti facturant 5 000 € à une
 * société belge et mettant le taux à 0 voyait s'imprimer sur son PDF « TVA non
 * applicable, art. 293 B du CGI », c'est-à-dire une déclaration écrite qu'il
 * est micro-entrepreneur en franchise, ce qu'il n'est pas, et le XML partait
 * vers l'administration avec la catégorie E alors que l'opération est une
 * livraison intracommunautaire. Le routage, lui, était correct : seule la
 * qualification fiscale était fausse.
 *
 * ── Ce que cette fonction refuse de faire ────────────────────────────────────
 *
 * Elle ne devine pas. Quand les données ne permettent pas de justifier une
 * exonération précise, elle renvoie une mention neutre, « TVA non applicable »
 *, plutôt qu'une citation d'article. Écrire un mauvais article sur une facture
 * est pire que de n'en écrire aucun : c'est une affirmation fiscale fausse,
 * opposable, imprimée par l'outil et non par l'utilisateur. Le champ `certaine`
 * dit lequel des deux cas on est, pour que l'interface puisse demander la
 * donnée manquante plutôt que de laisser passer.
 *
 * ── Comment le régime du vendeur est déterminé ──────────────────────────────
 *
 * Par la présence d'un numéro de TVA intracommunautaire sur la facture
 * (`seller_tva_number`). C'est un indice, pas une preuve, mais c'en est un bon :
 * une entreprise en franchise en base n'en a pas, c'est la définition même du
 * régime, et le profil Deviso ne le renseigne que pour les assujettis. À
 * défaut d'un champ « régime » porté par la facture, c'est la donnée la plus
 * fiable disponible sans changer le schéma.
 */

export type MotifExoneration = {
  /** Catégorie de TVA au sens EN 16931 (BT-118 / BT-151). */
  categorie: "S" | "E" | "K" | "G" | "AE";
  /** Texte à imprimer sur le document et à porter en BT-120. Vide si taxé. */
  mention: string;
  /**
   * Faux quand la qualification n'a pas pu être établie avec certitude et
   * qu'on s'est rabattu sur une mention neutre. L'interface doit alors dire ce
   * qui manque.
   */
  certaine: boolean;
  /** Ce qui manque pour trancher, quand `certaine` est faux. */
  manque?: string;
};

export function motifExoneration(facture: {
  tva_rate?: number | null;
  client_company?: string | null;
  client_country?: string | null;
  client_vat_number?: string | null;
  seller_tva_number?: string | null;
  /** Nature déduite des lignes (lib/nature-operation.ts). Absente : on ne devine pas. */
  operation_category?: "goods" | "services" | "mixed" | null;
}): MotifExoneration {
  // Une facture avec de la TVA n'a rien à justifier.
  if ((facture.tva_rate ?? 0) > 0) return { categorie: "S", mention: "", certaine: true };

  const pays = (facture.client_country ?? "").trim().toUpperCase();
  const vendeurAssujetti = Boolean(facture.seller_tva_number?.trim());
  const clientIntracom = Boolean(facture.client_vat_number?.trim());
  const nature = facture.operation_category ?? null;
  const natureInconnue = {
    categorie: "E" as const,
    mention: "TVA non applicable",
    certaine: false,
    manque:
      "la nature de l'opération (livraison de biens ou prestation de services), " +
      "qui décide de la mention d'exonération : précisez la nature de chaque ligne",
  };

  // ── Vendeur en franchise en base ──────────────────────────────────────────
  //
  // C'est le cas le plus fréquent chez les utilisateurs de Deviso, et il prime :
  // un micro-entrepreneur en franchise ne facture jamais de TVA, y compris à
  // l'étranger, et c'est bien 293 B qui s'applique.
  if (!vendeurAssujetti) {
    return {
      categorie: "E",
      mention: "TVA non applicable, art. 293 B du CGI",
      certaine: true,
    };
  }

  // ── Vendeur assujetti : l'exonération vient de l'opération ────────────────
  if (!estFrance(pays)) {
    if (CODES_UE.has(pays)) {
      if (clientIntracom) {
        if (nature === "goods") {
          return {
            categorie: "K",
            mention: "Exonération de TVA, art. 262 ter I du CGI",
            certaine: true,
          };
        }
        if (nature === "services") {
          // Lieu de la prestation chez le preneur assujetti (art. 259-1° du
          // CGI) ; la TVA est due par lui, d'où la mention « Autoliquidation »
          // exigée par l'art. 242 nonies A de l'annexe II.
          return {
            categorie: "AE",
            mention: "Autoliquidation, art. 196 de la directive 2006/112/CE",
            certaine: true,
          };
        }
        return natureInconnue;
      }
      // Livraison dans l'UE sans numéro de TVA du client : l'exonération
      // intracommunautaire est précisément conditionnée à ce numéro. On ne
      // peut donc pas l'affirmer.
      return {
        categorie: "E",
        mention: "TVA non applicable",
        certaine: false,
        manque: `le numéro de TVA intracommunautaire de ${
          facture.client_company || "votre client"
        }, sans lequel l'exonération intracommunautaire (art. 262 ter I) ne peut pas être justifiée`,
      };
    }

    // Hors Union.
    if (nature === "goods") {
      return {
        categorie: "G",
        mention: "Exonération de TVA, art. 262 I du CGI (exportation)",
        certaine: true,
      };
    }
    if (nature === "services") {
      // Prestation à une entreprise établie hors UE : lieu chez le preneur
      // (art. 259-1° du CGI), hors du champ de la TVA française. Pour un
      // particulier, la règle dépend de la prestation (art. 259 B) : on ne
      // devine pas.
      if (facture.client_company?.trim()) {
        return {
          categorie: "G",
          mention: "TVA non applicable, art. 259-1° du CGI",
          certaine: true,
        };
      }
      return {
        categorie: "E",
        mention: "TVA non applicable",
        certaine: false,
        manque:
          "le statut de votre client : pour une prestation à un particulier établi hors de " +
          "l'Union, la TVA française peut être due selon la prestation (art. 259 B du CGI)",
      };
    }
    return natureInconnue;
  }

  // ── Vendeur assujetti, opération française, taux à zéro ───────────────────
  //
  // Ce cas est réel, autoliquidation dans le bâtiment (art. 283-2 nonies),
  // certaines opérations exonérées, mais rien sur la facture ne dit lequel.
  // On refuse d'inventer une référence d'article : on écrit une mention
  // neutre, et on signale ce qui manque.
  return {
    categorie: "E",
    mention: "TVA non applicable",
    certaine: false,
    manque:
      "le motif de l'absence de TVA. Votre profil porte un numéro de TVA : vous n'êtes " +
      "donc pas en franchise en base, et une facture à 0 % doit indiquer sur quel " +
      "fondement (autoliquidation, exonération…). Renseignez-le dans les notes de la facture",
  };
}
