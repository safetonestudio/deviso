/**
 * Seuils du regime micro, valeurs 2026.
 *
 * Verifies le 02/11/2026 (service-public, Urssaf). La loi du 3 novembre 2025 a
 * abandonne le projet de seuil unique de franchise a 25 000 EUR : ce sont bien
 * les seuils ci-dessous qui s'appliquent. Plafonds du regime revalorises pour
 * 2026-2028. A mettre a jour ici seulement : le tableau de bord et les guides
 * lisent ce module.
 */
export const FRANCHISE_TVA = {
  biens: { base: 85_000, majore: 93_500 },
  services: { base: 37_500, majore: 41_250 },
} as const;

export const PLAFOND_MICRO = { biens: 203_100, services: 83_600 } as const;

export type JaugeFranchise = {
  /** "biens" : contrainte sur le CA total (ventes) ; "services" : sur la part prestations. */
  categorie: "biens" | "services";
  atteint: number;
  seuil: number;
  /** 0 a 1+, part du seuil atteinte. */
  ratio: number;
  reste: number;
};

/**
 * La jauge de franchise la plus proche de son seuil, c'est-a-dire celle que le
 * micro-entrepreneur franchira en premier. Activite mixte : le CA total ne doit
 * pas depasser le seuil "biens" ET la part prestations le seuil "services".
 */
export function jaugeFranchise(ht: { biens: number; services: number }): JaugeFranchise {
  const total = Math.max(0, ht.biens + ht.services);
  const services = Math.max(0, ht.services);
  const jauge = (categorie: JaugeFranchise["categorie"], atteint: number, seuil: number): JaugeFranchise => ({
    categorie,
    atteint,
    seuil,
    ratio: atteint / seuil,
    reste: Math.max(0, seuil - atteint),
  });
  const candidates = [
    jauge("biens", total, FRANCHISE_TVA.biens.base),
    jauge("services", services, FRANCHISE_TVA.services.base),
  ];
  // Sans aucune prestation, seule la contrainte globale compte.
  if (services === 0) return candidates[0];
  return candidates[0].ratio > candidates[1].ratio ? candidates[0] : candidates[1];
}
