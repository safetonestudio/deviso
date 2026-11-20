// Sans dépendance serveur : importable par les pages client (lib/chorus-pro.ts
// utilise crypto et ne peut pas l'être).

/**
 * Libellé lisible d'un état de flux. Les valeurs exactes ne sont pas publiées
 * dans les sources consultées : on lit le mot significatif, et l'état brut
 * reste affiché tel quel s'il n'est pas reconnu (jamais d'invention).
 */
export function libelleEtatFlux(etat: string): string {
  const e = etat.toUpperCase();
  if (!e) return "Déposée";
  if (e.includes("REJET")) return "Rejetée";
  if (e.includes("INCIDENT") || e.includes("ERREUR") || e.includes("ANOMALIE")) return "En anomalie";
  if (e.includes("INTEGR")) return "Intégrée";
  if (e.includes("COURS") || e.includes("ATTENTE") || e.includes("RECU")) return "En cours de traitement";
  return etat;
}

/** Teinte d'affichage d'un état (flux ou ancien statut de facture). */
export function couleurEtatChorus(etat: string): string {
  const e = etat.toUpperCase();
  if (/REJET|INCIDENT|ERREUR|ANOMALIE|ANNUL/.test(e)) return "red";
  if (/INTEGR|MANDAT|VALID|PAIEMENT/.test(e)) return "emerald";
  return "blue";
}
