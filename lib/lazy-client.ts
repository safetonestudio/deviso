/**
 * Instancie un client externe paresseusement — au premier accès à une de ses
 * propriétés, pas au chargement du module.
 *
 * Next collecte la configuration de chaque route au build. Un client construit
 * au chargement du module (`export const x = new X(process.env.CLE)`) fait
 * échouer TOUT le build si `CLE` est absente de l'environnement qui build —
 * c'est ce qui a fait tomber la toute première preview Vercel de ce projet le
 * 28/08/2026 : Preview n'a que 6 des 23 variables d'environnement, et
 * `lib/resend.ts` construisait son client au chargement, faisant échouer la
 * collecte de /api/cron/recurring, puis le build entier.
 *
 * Avec ce proxy, une clé absente ne casse plus que la route qui l'utilise
 * réellement, au moment où elle est appelée — jamais le build. `factory` n'est
 * appelée qu'une fois, à la première propriété lue sur l'objet retourné.
 */
export function lazyClient<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  function get(): T {
    if (!instance) instance = factory();
    return instance;
  }
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      return Reflect.get(get() as object, prop, receiver);
    },
    has(_target, prop) {
      return Reflect.has(get() as object, prop);
    },
  });
}
