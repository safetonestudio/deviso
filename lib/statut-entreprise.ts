/**
 * Statut de l'entreprise, et la vue du tableau de bord qui en decoule.
 *
 * Avant ce module, l'app deduisait "micro-entrepreneur" de la franchise de
 * TVA. C'etait faux dans les deux sens : un micro ayant depasse le seuil de
 * TVA declare toujours son CA a l'URSSAF (il perdait son echeance), et une
 * petite societe en franchise recevait les dates du micro. Le statut est
 * desormais demande a l'utilisateur, et rien n'est devine.
 */
export type StatutJuridique = "micro" | "ei_reel" | "societe";

export const STATUTS: { value: StatutJuridique; label: string; description: string }[] = [
  {
    value: "micro",
    label: "Micro-entrepreneur",
    description: "Auto-entreprise : tu déclares ton chiffre d'affaires à l'URSSAF chaque mois ou chaque trimestre.",
  },
  {
    value: "ei_reel",
    label: "Entreprise individuelle au réel",
    description: "Tes cotisations sont calculées sur ton bénéfice, déclaré une fois par an.",
  },
  {
    value: "societe",
    label: "Société",
    description: "SAS, SASU, SARL, EURL… Les cotisations passent par la rémunération du dirigeant.",
  },
];

export function estStatut(v: unknown): v is StatutJuridique {
  return v === "micro" || v === "ei_reel" || v === "societe";
}

export type VueTableauDeBord = {
  /** Echeance de declaration URSSAF et cotisations estimees : micro seulement. */
  echeanceUrssaf: boolean;
  /** Jauge du seuil de franchise : toute entreprise en franchise en base. */
  jaugeFranchise: boolean;
  /** Echeance de TVA (CA3 ou CA12) : toute entreprise assujettie. */
  echeanceTva: boolean;
  /** Statut non precise : le tableau de bord le demande. */
  statutInconnu: boolean;
};

/**
 * La seule source de la vue du tableau de bord. Le regime de TVA absent vaut
 * franchise, comme dans les parametres (case cochee par defaut).
 */
export function vueTableauDeBord(statut: string | null | undefined, tvaRegime: string | null | undefined): VueTableauDeBord {
  const franchise = (tvaRegime ?? "franchise") === "franchise";
  return {
    echeanceUrssaf: statut === "micro",
    jaugeFranchise: franchise,
    echeanceTva: !franchise,
    statutInconnu: !estStatut(statut),
  };
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/**
 * Prochaine declaration de TVA a deposer, selon la periodicite.
 * - Mensuelle (CA3) : le mois ecoule, depose le mois en cours.
 * - Trimestrielle (CA3) : le trimestre ecoule tant qu'on est dans le premier
 *   mois du suivant, sinon le trimestre en cours, depose le mois qui le suit.
 * - Annuelle (CA12) : l'annee ecoulee jusqu'en mai, sinon l'annee en cours,
 *   deposee debut mai de l'annee suivante.
 * Le jour exact depend du SIREN (CA3) : on donne le mois, jamais un jour invente.
 */
export function prochaineDeclarationTva(
  periodicite: "monthly" | "quarterly" | "simplified",
  reference: Date,
): { periode: "aDeclarer" | "enCours"; depot: string } {
  const an = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  if (periodicite === "monthly") return { periode: "aDeclarer", depot: `en ${MOIS[m]} ${an}` };
  if (periodicite === "quarterly") {
    if (m % 3 === 0) return { periode: "aDeclarer", depot: `en ${MOIS[m]} ${an}` };
    const suivant = Math.floor(m / 3) * 3 + 3;
    return { periode: "enCours", depot: suivant === 12 ? `en janvier ${an + 1}` : `en ${MOIS[suivant]} ${an}` };
  }
  return m <= 4 ? { periode: "aDeclarer", depot: `début mai ${an}` } : { periode: "enCours", depot: `début mai ${an + 1}` };
}
