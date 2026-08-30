import type { Invoice } from "@/types";
import { manquesPourEmission, transmissible } from "@/lib/superpdp-precontrole";
import { factureBloquee, depuis } from "@/lib/superpdp-blocage";

/**
 * Où en est une facture vis-à-vis de la Plateforme Agréée ?
 *
 * Pourquoi cette colonne existe. La transmission était un bouton au fond du
 * panneau d'une facture ouverte : pour savoir si ses factures étaient parties,
 * il fallait les ouvrir une par une. Sous la réforme, la transmission n'est pas
 * une option — une facture émise et jamais transmise est une facture qui, pour
 * l'administration, n'existe pas. Cet état doit se lire d'un coup d'œil sur la
 * liste, comme le statut de paiement.
 *
 * Pourquoi cette fonction est partagée. Elle vivait dans la page de liste, et
 * le panneau d'une facture ouverte jugeait de son côté sur `superpdp_invoice_id`
 * seul : la liste avertissait « Transmise — adresse déduite » en ambre pendant
 * que le détail de la même facture affichait un « Transmise » vert et rassurant.
 * Deux écrans, deux verdicts, sur la même facture. Une seule règle désormais —
 * comme pour `manquesPourEmission`, et pour la même raison : deux copies d'une
 * règle finissent toujours par diverger, et c'est l'utilisateur qui arbitre.
 */
export function etatPdp(inv: Invoice): {
  texte: string;
  classe: string;
  aFaire: boolean;
  manques: string[];
  alerte?: string;
} | null {
  if (!transmissible(inv)) return null;
  if (inv.superpdp_encaisse_at)
    return { texte: "Encaissement déclaré", classe: "bg-emerald-500/10 text-emerald-400", aFaire: false, manques: [] };
  if (inv.superpdp_status === "fr:210")
    return { texte: "Refusée par le client", classe: "bg-amber-500/10 text-amber-400", aFaire: false, manques: [] };
  if (inv.superpdp_status === "fr:213")
    return { texte: "Rejetée", classe: "bg-amber-500/10 text-amber-400", aFaire: false, manques: [] };
  // Un blocage prime sur tout le reste : c'est la seule chose que l'utilisateur
  // doive traiter aujourd'hui. Une facture qui stagne dans un statut de
  // transport n'a jamais été remise, et sans ce test elle s'affichait comme une
  // facture normalement partie.
  const blocage = factureBloquee(inv);
  if (blocage)
    return {
      texte: `Bloquée ${depuis(blocage.heures)}`,
      classe: "bg-red-500/10 text-red-400",
      aFaire: false,
      manques: [],
      alerte: `${blocage.raison}. ${blocage.remede}`,
    };

  if (inv.superpdp_invoice_id) {
    // Une facture transmise à une adresse **déduite du SIREN** peut n'être
    // jamais remise : si plusieurs entreprises partagent ce SIREN, la
    // Plateforme Agréée l'accepte, ne sait pas à qui la donner, et ne le
    // signale pas. Constaté le 29/08/2026 sur sept factures. Afficher
    // « Transmise » tout court serait une promesse qu'on ne tient pas.
    if (inv.superpdp_adresse_source === "siren")
      return {
        texte: "Transmise — adresse déduite",
        classe: "bg-amber-500/10 text-amber-400",
        aFaire: false,
        manques: [],
        alerte:
          "L'adresse d'acheminement a été déduite du SIREN, faute d'entrée à l'Annuaire. " +
          "Si le destinataire n'est pas joignable à cette adresse, la facture peut ne jamais lui être remise. " +
          "Renseignez son adresse de facturation électronique pour lever le doute.",
      };
    return { texte: "Transmise", classe: "bg-emerald-500/10 text-emerald-400", aFaire: false, manques: [] };
  }

  // Une facture à laquelle il manque le SIREN du client ne peut pas partir.
  // Afficher « À transmettre » avec un bouton qui échouera serait un piège :
  // on nomme ce qui bloque, à l'endroit où la personne le lit.
  const manques = manquesPourEmission(inv);
  if (manques.length)
    return { texte: "Transmission impossible", classe: "bg-red-500/10 text-red-400", aFaire: false, manques };

  return { texte: "À transmettre", classe: "bg-amber-500/10 text-amber-400", aFaire: true, manques: [] };
}

