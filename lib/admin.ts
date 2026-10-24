/**
 * Acces administrateur (pilotage), reserve aux adresses listees dans la
 * variable d'environnement ADMIN_EMAILS (separateur virgule). L'adresse ne vit
 * pas dans le code : le depot est public.
 */
export function estAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const liste = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return liste.includes(email.trim().toLowerCase());
}
