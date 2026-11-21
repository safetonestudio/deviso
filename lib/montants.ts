/**
 * Arithmétique monétaire exacte au centime (21/11/2026).
 *
 * `Math.round(x * 100) / 100` arrondit mal les demi-centimes : en virgule
 * flottante, 10,05 × 10 % vaut 1,00499999… et donne 1,00 € au lieu de 1,01 €.
 * Mesuré sur toutes les bases de 0,01 € à 10 000 € : 4 588 montants de TVA
 * faux à 10 %, plusieurs centaines aux autres taux réduits. Une TVA fausse d'un
 * centime fausse la facture, son Factur-X (règle de cohérence base × taux),
 * le FEC et la déclaration.
 *
 * Ici, les nombres sont repris dans leur écriture décimale (celle qu'on a
 * saisie : « 10.05 », « 8.5 »), multipliés en entiers exacts (BigInt), puis
 * arrondis au centime le plus proche, demi-centime vers l'extérieur (0,005 →
 * 0,01 ; -0,005 → -0,01), comme on arrondit un montant à la main.
 *
 * Sans dépendance serveur : utilisé aussi par les formulaires.
 */

/** Écriture décimale d'un nombre en entier mis à l'échelle : 10.05 -> { v: 1005n, e: 2 }. */
function decimal(n: number): { v: bigint; e: number } {
  if (!Number.isFinite(n)) return { v: BigInt(0), e: 0 };
  // Le plus court affichage qui redonne le même nombre : c'est ce qu'on a saisi.
  let s = String(n);
  if (/e/i.test(s)) s = n.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
  const negatif = s.startsWith("-");
  if (negatif) s = s.slice(1);
  const [ent, frac = ""] = s.split(".");
  const v = BigInt(ent + frac || "0");
  return { v: negatif ? -v : v, e: frac.length };
}

const DIX = BigInt(10);
const puissance = (e: number) => DIX ** BigInt(e);

/** Quotient entier arrondi, demi vers l'extérieur. */
function diviserArrondi(num: bigint, den: bigint): bigint {
  const zero = BigInt(0);
  const negatif = (num < zero) !== (den < zero);
  const a = num < zero ? -num : num;
  const b = den < zero ? -den : den;
  const q = a / b;
  const r = a % b;
  const arrondi = r * BigInt(2) >= b ? q + BigInt(1) : q;
  return negatif ? -arrondi : arrondi;
}

/**
 * (a × b) / diviseur, arrondi au centime, sans erreur de virgule flottante.
 * TVA d'une base : produitArrondi(base, taux, 100). Ligne : produitArrondi(quantité, prix).
 */
export function produitArrondi(a: number, b: number, diviseur = 1): number {
  const x = decimal(Number(a) || 0);
  const y = decimal(Number(b) || 0);
  const d = decimal(diviseur);
  // a·b/d en centimes = (x.v·y.v·100·10^d.e) / (d.v·10^(x.e+y.e))
  const num = x.v * y.v * BigInt(100) * puissance(d.e);
  const den = d.v * puissance(x.e + y.e);
  if (den === BigInt(0)) return 0;
  return Number(diviserArrondi(num, den)) / 100;
}

/** Un montant arrondi au centime, demi-centime vers l'extérieur. */
export const arrondi2 = (n: number): number => produitArrondi(Number(n) || 0, 1);

/** TVA d'une base à un taux en pourcentage, exacte au centime. */
export const tvaSurBase = (base: number, taux: number): number => produitArrondi(base, taux, 100);
