/**
 * SOURCE UNIQUE DES PRIX DE DEVISO (grille du 23/11/2026).
 *
 * Tout montant affiché au visiteur ou au client (vitrine, page Abonnement,
 * écran de fin d'essai, boutons, CGU, données structurées) se lit ICI. Aucune
 * surface ne retape un prix à la main : `npm run check:prix` échoue sinon.
 *
 * Les montants Stripe (en centimes) sont les mêmes : `npm run test:stripe-prix`
 * confronte chaque identifiant de prix du compte LIVE à cette grille.
 *
 * Changer un prix = changer ce fichier, créer le prix correspondant dans Stripe,
 * mettre à jour l'identifiant sur Vercel et dans `.env.local`, puis traverser.
 *
 * Fichier sans dépendance : les scripts de contrôle l'importent directement.
 */

export type FormulePayante = "solo" | "pro";

/** Montants HT en centimes, tels qu'ils existent dans Stripe. */
export const CENTIMES = {
  solo: { mensuel: 2400, annuel: 23040 },
  pro: { mensuel: 4400, annuel: 42240 },
  /** Utilisateur au-delà des 3 inclus dans Pro, par mois. */
  siege: 800,
} as const;

/** Remise de l'abonnement annuel, en pourcentage. */
export const REMISE_ANNUELLE = 20;

/** Durée de l'essai gratuit, en jours. */
export const JOURS_ESSAI = 14;

/** Taux de TVA appliqué pour l'affichage TTC. */
const TVA = 0.2;

/** 2400 -> "24", 1920 -> "19,20". Pas de ",00" pour un montant rond. */
export function euros(centimes: number): string {
  const entier = centimes % 100 === 0;
  return (centimes / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

const ttc = (centimes: number) => Math.round(centimes * (1 + TVA));

/** Les montants prêts à afficher pour une formule (sans le signe €). */
export function prix(formule: FormulePayante) {
  const c = CENTIMES[formule];
  return {
    /** Prix mensuel HT, ex. "24". */
    mensuel: euros(c.mensuel),
    /** Prix mensuel TTC, ex. "28,80". */
    mensuelTtc: euros(ttc(c.mensuel)),
    /** Équivalent mensuel de l'annuel, HT, ex. "19,20". */
    annuelParMois: euros(Math.round(c.annuel / 12)),
    /** Total annuel HT, ex. "230,40". */
    annuel: euros(c.annuel),
    /** Total annuel TTC, ex. "276,48". */
    annuelTtc: euros(ttc(c.annuel)),
  };
}

/** Prix d'un utilisateur supplémentaire, HT par mois, ex. "8". */
export const PRIX_SIEGE = euros(CENTIMES.siege);
