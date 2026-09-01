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
export function etatPdp(
  inv: Invoice,
  /**
   * Vrai quand le raccordement est en bac à sable. Fourni par l'appelant —
   * `/api/superpdp/status` le renvoie — plutôt que lu d'une variable
   * d'environnement : cette fonction tourne aussi côté navigateur, où les
   * variables serveur n'existent pas, et une valeur absente y aurait
   * silencieusement pris la mauvaise branche.
   */
  sandbox = false
): {
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
    // L'adresse déduite du SIREN n'est PAS une anomalie en production.
    //
    // Ce badge ambre a été écrit le 29/08/2026, après que sept factures se
    // soient perdues : elles portaient l'adresse `0225:315143296`, le SIREN nu,
    // que les deux sociétés du bac à sable partagent. La plateforme les a
    // acceptées, n'a pas su à qui les remettre, et n'a rien dit.
    //
    // Sauf que c'est un artefact du bac à sable. La FAQ Super PDP dit
    // l'inverse pour le monde réel : « En France et en production, l'adresse
    // électronique de facturation est dans la plupart des cas le numéro
    // SIREN. » Déduire l'adresse du SIREN y est donc le cas NOMINAL.
    //
    // Laisser l'ambre allumé aurait signalé comme douteuse la quasi-totalité
    // des factures émises en production. Une alerte permanente est une alerte
    // morte : on apprend à la sauter, et le jour où elle dit vrai personne ne
    // la lit. C'est exactement le défaut que `superpdp-blocage.ts` existe pour
    // éviter, et on l'aurait recréé ici.
    //
    // Le vrai signal n'est pas la manière dont l'adresse a été obtenue, c'est
    // le fait que la facture n'arrive pas. Il est déjà donné, plus haut, par
    // `factureBloquee` — qui juge sur le silence de la plateforme au bout de
    // 24 h, et qui nomme l'adresse déduite comme cause probable quand elle
    // l'est. On ne double pas ce signal par une couleur permanente.
    //
    // Reste le bac à sable, où l'ambiguïté est réelle et permanente : on y
    // garde l'avertissement, parce que c'est là qu'on teste et qu'on a besoin
    // de le voir.
    if (sandbox && inv.superpdp_adresse_source === "siren")
      return {
        texte: "Transmise — adresse déduite",
        classe: "bg-amber-500/10 text-amber-400",
        aFaire: false,
        manques: [],
        alerte:
          "Bac à sable : l'adresse d'acheminement a été déduite du SIREN, que plusieurs " +
          "sociétés de test partagent. La facture peut ne jamais être remise.",
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

