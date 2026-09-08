import { timingSafeEqual } from "node:crypto";

/**
 * Le contrôle d'accès des tâches planifiées, en un seul endroit.
 *
 * Pourquoi ce fichier existe. Les quatre routes `app/api/cron/*` écrivaient la
 * même ligne :
 *
 *   if (auth !== `Bearer ${process.env.CRON_SECRET}`) return 401;
 *
 * Elle a un défaut qui ne se voit pas à la lecture : quand `CRON_SECRET`
 * n'existe pas dans l'environnement, le gabarit produit la chaîne
 * `"Bearer undefined"`. La comparaison ne devient pas fausse — elle devient
 * **devinable**. N'importe qui envoyant cet en-tête déclenche alors l'envoi de
 * toutes les relances clients, la génération de toutes les factures
 * récurrentes, ou la purge des comptes de démonstration. Une variable
 * d'environnement oubliée lors d'un déploiement, d'une bascule de projet
 * Vercel ou d'un environnement de préproduction suffit.
 *
 * Un secret absent doit fermer la porte, pas l'ouvrir. C'est la règle ici :
 * pas de secret configuré, pas d'exécution.
 *
 * La comparaison est en temps constant. Le risque d'une attaque temporelle à
 * distance sur un secret Vercel est en pratique négligeable, mais elle ne
 * coûte rien et évite d'avoir à en juger.
 */
export function cronAutorise(req: { headers: { get(nom: string): string | null } }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;

  const fourni = req.headers.get("authorization") ?? "";
  const attendu = `Bearer ${secret}`;

  // `timingSafeEqual` exige des longueurs égales : comparer les longueurs
  // d'abord fuiterait cette information, mais elle n'est pas secrète (la
  // longueur du secret est une propriété de la configuration, pas du secret).
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
