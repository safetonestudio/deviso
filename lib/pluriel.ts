/** Mot accordé selon n (0 et 1 au singulier, comme en français). */
export function accord(n: number, singulier: string, pluriel?: string): string {
  return Math.abs(n) >= 2 ? (pluriel ?? `${singulier}s`) : singulier;
}

/** « 1 facture », « 3 factures ». */
export function pluriel(n: number, singulier: string, pluriel?: string): string {
  return `${n} ${accord(n, singulier, pluriel)}`;
}
