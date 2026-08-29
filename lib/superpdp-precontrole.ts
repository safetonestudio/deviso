import { toSiren, isB2CInvoice } from "@/lib/facturx-helpers";
import type { Invoice } from "@/types";

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
  operation_category?: string | null;
}): string[] {
  const manques: string[] = [];

  if (!toSiren(facture.seller_siren)) {
    manques.push("votre SIREN (à renseigner dans Paramètres)");
  }

  // Un particulier n'a pas de SIREN — l'exiger bloquerait toute facture B2C.
  // Super PDP détecte le B2C autrement (note BAR + adresse email), voir
  // lib/invoice-xml.ts.
  const isB2C = isB2CInvoice(facture as unknown as Invoice);
  if (!isB2C && !toSiren(facture.client_siren)) {
    manques.push(`le SIREN de ${facture.client_name || "votre client"}`);
  }

  // Documenté par Super PDP (page « E-reporting ») : les factures mélangeant
  // biens et services ne sont pas gérées par leur extraction d'e-reporting.
  if (facture.operation_category === "mixed") {
    manques.push(
      "une catégorie d'opération unique : biens OU services, pas les deux sur la même facture"
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
