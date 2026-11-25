/*
  BÊTA OUVERTE : source unique du réglage.

  Pendant la bêta, le site public ne propose plus l'essai de 14 jours :
    - la section tarifs de l'accueil devient l'appel aux bêta-testeurs ;
    - chaque bouton « Essayer 14 jours gratuitement » devient « Devenir
      bêta-testeur » et mène au formulaire de candidature ;
    - les phrases qui accompagnaient ces boutons parlent de la bêta.
  Repasser BETA_OUVERTE à false remet tout comme avant, sans autre retouche.

  Décisions de Selim (24/11/2026) : 10 places affichées, sans compteur ;
  2 mois gratuits à partir de la création du compte ; -30 % la première année
  d'abonnement pour qui continue ; candidatures triées par Selim, ouvertes
  un mois après la mise en ligne ; un échange de 20 minutes au départ, puis
  des retours ; les clients du cabinet pilote entrent aux mêmes conditions,
  dans les 10 places.
*/

export const BETA_OUVERTE = true;

export const BETA = {
  places: 10,
  dureeMois: 2,
  remise: 30,
  /**
   * Ouverture de la bêta. Seuls les comptes créés APRÈS cette date sont
   * concernés par la fermeture des inscriptions (lib/beta-acces.ts) : un compte
   * existant, même sans formule, garde exactement son accès d'avant.
   */
  ouverture: new Date("2026-11-24T00:00:00+01:00"),
  /** Dernier jour pour candidater : mise en ligne + 1 mois, à fixer au déploiement. */
  finCandidatures: new Date("2026-12-24T23:59:59+01:00"),
  /** Validité du lien personnel envoyé au candidat accepté. */
  joursValiditeLien: 14,
  /** Rappel avant la fin de la bêta d'un testeur. */
  joursRappel: 7,
  /** Réception des factures maintenue après une bêta non suivie d'abonnement. */
  joursReceptionApres: 30,
  /** Utilisateurs d'un espace en bêta, titulaire compris (formule Pro : 3 inclus). */
  utilisateursMax: 3,
};

/** profiles.subscription_status d'un compte en bêta, puis après sa bêta. */
export const STATUT_BETA = "beta";
export const STATUT_BETA_TERMINEE = "beta_terminee";

/** Les candidatures sont-elles encore ouvertes à cet instant ? */
export function candidaturesOuvertes(maintenant: Date = new Date()): boolean {
  return BETA_OUVERTE && maintenant.getTime() <= BETA.finCandidatures.getTime();
}

/** Fin de bêta d'un compte créé à cette date (2 mois, même jour du mois). */
export function finDeBeta(debut: Date): Date {
  const fin = new Date(debut.getTime());
  fin.setUTCMonth(fin.getUTCMonth() + BETA.dureeMois);
  return fin;
}

/** Ancre du formulaire de candidature, sur l'accueil. */
export const LIEN_CANDIDATURE = "/#candidature";

/** Bouton d'appel principal du site public (essai ou bêta selon la période). */
export const APPEL = BETA_OUVERTE
  ? {
      lien: LIEN_CANDIDATURE,
      libelle: "Devenir bêta-testeur",
      libelleCourt: "Bêta gratuite",
      phrase: `${BETA.dureeMois} mois gratuits pour nos bêta-testeurs, sans carte bancaire.`,
      phraseCourte: `Bêta gratuite ${BETA.dureeMois} mois`,
    }
  : {
      lien: "/signup",
      libelle: "Essayer 14 jours gratuitement",
      libelleCourt: "Essai gratuit",
      phrase: "Essai gratuit de 14 jours, sans carte bancaire.",
      phraseCourte: "Essai gratuit 14 jours",
    };
