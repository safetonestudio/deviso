import { estCloture } from "./superpdp-statuts.ts";

/**
 * Détecter les factures qui ne bougent plus.
 *
 * Pourquoi ce fichier existe. Chacun des défauts trouvés le 30/08/2026 avait le
 * même profil : l'échec ne levait rien. Une facture acceptée par l'API mais
 * jamais acheminée reste « transmise » pour toujours, et personne ne l'apprend
 * — ni au moment de l'envoi, ni après. Sous la réforme, une facture émise et
 * jamais remise est une facture qui, pour l'administration, n'existe pas : le
 * jour où l'utilisateur s'en aperçoit est le jour du contrôle.
 *
 * On ne peut pas empêcher l'acheminement d'échouer. On peut exiger qu'il échoue
 * bruyamment. C'est tout l'objet de ce module, et c'est la seule protection qui
 * fonctionne aussi pour les pannes qu'on n'a pas prévues.
 *
 * La difficulté est de ne pas crier pour rien. Deux familles de statuts n'ont
 * pas du tout le même rythme normal :
 *
 *   - les **statuts de transport** (`api:uploaded`, `api:validated`,
 *     `api:sent`, `fr:200`, `fr:201`) décrivent une machine en train de router
 *     un document. Ils se résolvent en minutes. Au-delà d'un jour, quelque
 *     chose est cassé ;
 *   - les **statuts d'attente d'un humain** (`fr:202`, `fr:203`, `fr:204`,
 *     `fr:205`, `fr:211`…) décrivent une facture correctement remise, dont le
 *     destinataire n'a pas encore fait sa part. Y rester des semaines est
 *     normal — c'est le délai de paiement. Les signaler serait du bruit, et le
 *     bruit fait ignorer les vraies alertes.
 *
 * Un statut clôturant (encaissée, refusée, rejetée, irrecevable) n'est jamais
 * un blocage : la facture a fini sa vie, même mal.
 */

/**
 * Statuts qui décrivent un acheminement en cours, pas une attente légitime.
 * Y stagner est une panne.
 */
const STATUTS_TRANSPORT = new Set([
  "fr:200",
  "fr:201",
  "api:uploaded",
  "api:validated",
  "api:sent",
]);

/**
 * Un jour. Généreux : l'acheminement nominal prend quelques secondes — sept
 * factures semées le 29/08 sont arrivées en quatre secondes. Un seuil serré
 * attraperait des lenteurs passagères et apprendrait à l'utilisateur à ignorer
 * l'alerte, ce qui est pire que pas d'alerte du tout.
 */
export const SEUIL_TRANSPORT_HEURES = 24;

/**
 * Une facture transmise dont on n'a jamais reçu le moindre statut est le cas le
 * plus grave : ce n'est pas « en cours », c'est un silence. On l'attrape plus
 * tôt.
 */
export const SEUIL_SANS_STATUT_HEURES = 6;

export type Blocage = {
  /** Ce qu'on affiche à l'utilisateur, sans jargon. */
  raison: string;
  /** Ce qu'il peut faire. Vide s'il n'y a rien à faire que signaler. */
  remede: string;
  heures: number;
};

function heuresDepuis(date: string | null | undefined, maintenant: number): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return (maintenant - t) / 3_600_000;
}

/**
 * Cette facture est-elle bloquée ? `null` si tout va bien.
 *
 * Pure et sans dépendance serveur, pour que la liste des factures, la tâche
 * horaire et les tests jugent avec la même règle — même raison que
 * `manquesPourEmission` : deux copies d'une règle finissent par diverger.
 *
 * `maintenant` est injectable pour que les tests n'aient pas à attendre.
 */
export function factureBloquee(
  facture: {
    superpdp_invoice_id?: string | null;
    superpdp_status?: string | null;
    superpdp_status_date?: string | null;
    superpdp_adresse_source?: string | null;
    updated_at?: string | null;
  },
  maintenant: number = Date.now()
): Blocage | null {
  // Jamais transmise : ce n'est pas un blocage, c'est une facture qui n'est pas
  // partie. `manquesPourEmission` couvre déjà ce cas, et le dire deux fois
  // reviendrait à signaler comme panne un travail simplement pas commencé.
  if (!facture.superpdp_invoice_id) return null;

  const statut = facture.superpdp_status ?? null;

  // Terminée, même mal. Une facture rejetée est un problème, mais elle est déjà
  // affichée comme tel et l'utilisateur n'attend plus rien d'elle.
  if (estCloture(statut)) return null;

  // Cas 1 : transmise, et pas le moindre statut en retour.
  if (!statut) {
    const h = heuresDepuis(facture.updated_at, maintenant);
    if (h !== null && h >= SEUIL_SANS_STATUT_HEURES) {
      return {
        raison: "Transmise, mais la Plateforme Agréée n'a renvoyé aucun statut",
        remede:
          "Vérifiez votre raccordement dans Paramètres. Si le problème persiste, " +
          "contactez la Plateforme Agréée en citant cette facture — ne la retransmettez pas.",
        heures: Math.floor(h),
      };
    }
    return null;
  }

  // Une facture à un particulier n'a personne à qui être remise.
  //
  // `source: "aucune"` n'est posé que pour le B2C (voir la route d'émission) :
  // un particulier n'a pas d'adresse de facturation électronique, et une
  // facture B2B sans adresse résoluble n'est jamais partie — la route la
  // bloque avant. Ces factures restent donc à `api:uploaded` **définitivement
  // et normalement** : la plateforme n'a rien à acheminer, elle les retient
  // pour l'e-reporting.
  //
  // Constaté sur les données réelles du 30/08/2026 : 16 factures B2C sur 16 à
  // `api:uploaded`, aucune n'ayant jamais progressé, là où les factures avec
  // adresse atteignent `fr:202` ou `fr:212` en quelques minutes. Sans cette
  // exception, le détecteur aurait signalé comme bloquée chaque facture à un
  // particulier, pour toujours — c'est-à-dire exactement le défaut contre
  // lequel ce module est écrit : une alerte qu'on apprend à ignorer.
  if (facture.superpdp_adresse_source === "aucune") return null;

  // Cas 2 : coincée dans un statut de transport.
  if (STATUTS_TRANSPORT.has(statut)) {
    const h = heuresDepuis(facture.superpdp_status_date ?? facture.updated_at, maintenant);
    if (h !== null && h >= SEUIL_TRANSPORT_HEURES) {
      // L'adresse déduite d'un SIREN est de très loin la cause la plus
      // fréquente, et la seule que l'utilisateur puisse corriger lui-même.
      // Constatée le 29/08 sur sept factures, puis le 30/08 sur une huitième.
      const adresseDeduite = facture.superpdp_adresse_source === "siren";
      return {
        raison: adresseDeduite
          ? "Jamais remise au destinataire — l'adresse avait été déduite de son SIREN"
          : "Bloquée en cours d'acheminement",
        remede: adresseDeduite
          ? "Demandez à votre client son adresse de facturation électronique, " +
            "renseignez-la sur sa fiche, puis retransmettez la facture."
          : "Contactez la Plateforme Agréée en citant cette facture — ne la retransmettez pas.",
        heures: Math.floor(h),
      };
    }
  }

  return null;
}

/** « depuis 3 jours », « depuis 8 heures » — pour l'affichage. */
export function depuis(heures: number): string {
  if (heures < 48) return `depuis ${heures} heure${heures > 1 ? "s" : ""}`;
  return `depuis ${Math.floor(heures / 24)} jours`;
}
