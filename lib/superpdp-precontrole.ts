import { toSiren, resolveVatNumber } from "@/lib/facturx-helpers";
import { natureOperation } from "@/lib/superpdp-nature";

/**
 * Ce qui manque à une facture pour pouvoir partir vers la Plateforme Agréée.
 *
 * Pourquoi ce fichier existe. Ces contrôles ne vivaient que dans la route
 * d'émission : l'interface proposait « Transmettre » à toutes les factures, et
 * l'utilisateur découvrait qu'il manquait le SIREN de son client **après**
 * avoir cliqué, sous la forme d'un 400. Proposer une action qui va échouer
 * n'est pas une action, c'est un piège.
 *
 * La fonction est volontairement pure et sans dépendance serveur, pour que la
 * liste des factures et la route d'émission jugent avec exactement la même
 * règle. Deux copies de cette règle finiraient par diverger, et c'est
 * l'interface qui mentirait.
 *
 * Les libellés sont écrits pour être affichés tels quels : ils disent ce qui
 * manque et où le corriger.
 */
export function manquesPourEmission(facture: {
  seller_siren?: string | null;
  client_siren?: string | null;
  client_company?: string | null;
  client_name?: string | null;
  client_country?: string | null;
  seller_postcode?: string | null;
  seller_city?: string | null;
  seller_tva_number?: string | null;
  client_postcode?: string | null;
  client_city?: string | null;
  tva_rate?: number | null;
  operation_category?: string | null;
}): string[] {
  const manques: string[] = [];

  if (!toSiren(facture.seller_siren)) {
    manques.push("votre SIREN (à renseigner dans Paramètres)");
  }

  // Un particulier n'a pas de SIREN — l'exiger bloquerait toute facture B2C.
  // Super PDP détecte le B2C autrement (note BAR + adresse email), voir
  // lib/invoice-xml.ts.
  //
  // Une entreprise ÉTRANGÈRE n'a pas de SIREN non plus, et c'était un blocage
  // pur : un freelance facturant un client belge ne pouvait rien transmettre.
  // Le SIREN est un identifiant français ; on ne le réclame qu'aux Français.
  const nature = natureOperation(facture);
  if (nature === "B2B" && !toSiren(facture.client_siren)) {
    manques.push(`le SIREN de ${facture.client_name || "votre client"}`);
  }

  // En revanche, une opération internationale doit dire d'où vient le client :
  // sans pays, elle ne serait pas classable, et Deviso la traiterait comme
  // française par défaut — c'est-à-dire à tort.
  if (nature === "B2BInt" && !facture.client_country?.trim()) {
    manques.push(`le pays de ${facture.client_name || "votre client"}`);
  }

  // Documenté par Super PDP (page « E-reporting ») : les factures mélangeant
  // biens et services ne sont pas gérées par leur extraction d'e-reporting.
  if (facture.operation_category === "mixed") {
    manques.push(
      "une catégorie d'opération unique : biens OU services, pas les deux sur la même facture"
    );
  }

  // Les trois conditions que `checkInvoiceCompliance` qualifiait déjà de
  // bloquantes, et que ce pré-contrôle ignorait.
  //
  // Le panneau de conformité affichait « serait rejetée par une Plateforme
  // Agréée » en rouge pendant que la route laissait partir la facture. Elle
  // revenait sous forme de 400 brut, alors que Deviso savait déjà écrire le
  // message en français. Deux règles pour une seule question, c'est une de trop.
  //
  // On juge sur les champs STRUCTURÉS, comme le panneau : relire l'adresse
  // formatée en texte libre signalait un code postal manquant alors qu'il était
  // bien saisi, juste écrit autrement.
  if (!facture.seller_postcode?.trim() || !facture.seller_city?.trim()) {
    manques.push("votre adresse complète, avec code postal et ville (Paramètres)");
  }

  // Franchise en base : pas de TVA, donc pas de numéro intracommunautaire à
  // exiger. Le panneau retient `tva_rate === 0` comme critère ; on reprend le
  // même, pour que les deux ne puissent pas diverger.
  if (facture.tva_rate !== 0) {
    const tva = resolveVatNumber(facture.seller_tva_number, facture.seller_siren, false);
    if (!tva.value) {
      manques.push("votre numéro de TVA intracommunautaire (Paramètres)");
    }
  }

  // L'adresse postale du destinataire n'est exigée que si la facture doit lui
  // être acheminée : un particulier est identifié par son courriel.
  if (nature !== "B2C" && (!facture.client_postcode?.trim() || !facture.client_city?.trim())) {
    manques.push(
      `l'adresse complète de ${facture.client_name || "votre client"}, avec code postal et ville`
    );
  }

  return manques;
}

/**
 * Phrase complète destinée à l'utilisateur, à partir des manques.
 * Une seule formulation, partagée par la route et l'interface.
 */
export function phraseManques(manques: string[]): string {
  return (
    "Impossible de transmettre cette facture sans " +
    manques.join(" et ") +
    ". L'adresse de facturation électronique du destinataire en est déduite."
  );
}

/** Une facture au brouillon ou annulée n'a pas à être transmise. */
export function transmissible(facture: { status?: string | null }): boolean {
  return facture.status !== "draft" && facture.status !== "cancelled";
}
