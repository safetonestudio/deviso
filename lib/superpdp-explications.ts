/**
 * Explications des etats problematiques Super PDP, affichees UNIQUEMENT dans le
 * volet deplie des pages concernees (Factures recues, Declarations, Achats a
 * l'etranger). Chaque explication dit, a l'essentiel : ce qui se passe, et la
 * marche a suivre pour resoudre. Source unique pour les trois pages.
 */

export type TonExplication = "attention" | "alerte";

export interface Explication {
  ton: TonExplication;
  probleme: string;
  etapes: string[];
}

/** Factures recues (cote acheteur) : statuts problematiques et echeance depassee. */
export function expliquerFactureRecue(code: string | null, enRetard: boolean): Explication | null {
  switch (code) {
    case "fr:210": // Refusee
      return {
        ton: "attention",
        probleme: "Vous avez refusé cette facture : elle est close et ne sera pas remise à nouveau en l'état.",
        etapes: [
          "Si le refus était une erreur, demandez au fournisseur de vous la réémettre.",
          "Ne réglez rien tant qu'une facture valide n'a pas été reçue.",
        ],
      };
    case "fr:213": // Rejetee
    case "fr:501": // Irrecevable
    case "api:invalid":
    case "api:rejected":
      return {
        ton: "alerte",
        probleme: "La facture a été rejetée car non conforme : elle n'a pas été valablement remise.",
        etapes: [
          "Le fournisseur doit la corriger et vous la réémettre.",
          "Ne réglez rien tant que vous n'avez pas reçu une facture valide.",
        ],
      };
    case "fr:207": // En litige
      return {
        ton: "attention",
        probleme: "Un litige a été signalé sur cette facture.",
        etapes: [
          "Contactez le fournisseur pour obtenir une facture corrigée ou un avoir.",
          "Le litige se clôt une fois le document rectifié reçu.",
        ],
      };
    case "fr:206": // Approuvee partiellement
      return {
        ton: "attention",
        probleme: "Vous n'avez approuvé qu'une partie de cette facture.",
        etapes: [
          "Réglez la part que vous avez approuvée.",
          "Demandez au fournisseur un avoir pour le reste.",
        ],
      };
    case "fr:208": // Suspendue
      return {
        ton: "attention",
        probleme: "Le traitement de cette facture est suspendu en attente d'une information.",
        etapes: [
          "Patientez : la plateforme reprend seule quand l'information manquante arrive.",
          "Si cela dure, rapprochez-vous du fournisseur.",
        ],
      };
    default:
      if (enRetard)
        return {
          ton: "alerte",
          probleme: "L'échéance est dépassée et la facture n'est pas soldée.",
          etapes: [
            "Réglez la facture au fournisseur dès que possible.",
            "Si vous l'avez déjà payée, le statut se mettra à jour côté plateforme.",
          ],
        };
      return null;
  }
}

/** Achats a l'etranger : echecs et corrections demandees par la plateforme. */
export function expliquerAchat(a: {
  transmission_status: string;
  transmission_error: string | null;
}): Explication | null {
  const err = (a.transmission_error ?? "").toLowerCase();
  const manqueIdentifiant = err.includes("identifiant");
  if (a.transmission_status === "echec")
    return {
      ton: "alerte",
      probleme: "La transmission de cet achat à la Plateforme Agréée a échoué : l'acquisition n'est pas encore déclarée.",
      etapes: [
        "Cliquez sur « Corriger » pour vérifier et compléter les informations (dont l'identifiant fiscal du fournisseur).",
        "Enregistrez : la déclaration repart automatiquement.",
        "Si le message d'erreur ci-dessus persiste, il en indique la cause précise.",
      ],
    };
  if (a.transmission_status === "action_requise")
    return {
      ton: "attention",
      probleme: "Cet achat demande une correction avant de pouvoir être déclaré.",
      etapes: [
        "Cliquez sur « Corriger » et complétez l'information en cause (voir le message ci-dessus).",
        "Enregistrez : la déclaration repart automatiquement.",
      ],
    };
  if (a.transmission_status === "en_attente" && manqueIdentifiant)
    return {
      ton: "attention",
      probleme: "Il manque l'identifiant fiscal du fournisseur pour déclarer cet achat.",
      etapes: [
        "Cliquez sur « Corriger ».",
        "Ajoutez l'identifiant fiscal du fournisseur : son n° de TVA pour l'UE, ou son identifiant fiscal local pour un pays hors UE.",
        "Enregistrez : la déclaration part automatiquement.",
      ],
    };
  if (a.transmission_status === "en_attente" && a.transmission_error)
    return {
      ton: "attention",
      probleme: "La transmission de cet achat n'a pas encore abouti : la Plateforme Agréée réessaie.",
      etapes: [
        "Laissez la plateforme réessayer : cela se résout souvent seul.",
        "Si l'erreur persiste, cliquez sur « Corriger » pour vérifier les informations, puis enregistrez.",
      ],
    };
  return null;
}

/** Declarations au fisc : rejets et erreurs d'acheminement. */
export function expliquerDeclaration(d: { aTraiter: boolean; statut: string }): Explication | null {
  if (!d.aTraiter) return null;
  if (d.statut.toLowerCase().includes("rejet"))
    return {
      ton: "alerte",
      probleme: "L'administration a refusé cette déclaration d'e-reporting.",
      etapes: [
        "Repérez la facture de la période concernée.",
        "Corrigez l'erreur sur cette facture.",
        "Retransmettez-la : une nouvelle déclaration partira automatiquement.",
      ],
    };
  return {
    ton: "attention",
    probleme: "La déclaration n'a pas pu être acheminée jusqu'à l'administration.",
    etapes: [
      "C'est le plus souvent temporaire : la plateforme réessaie seule.",
      "Si l'erreur persiste au-delà de 48 h, contactez le support.",
    ],
  };
}
