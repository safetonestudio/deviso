import { randomInt } from "crypto";

// Alphabet sans caracteres ambigus (pas de O/0, 1/I/L) : un code lu au telephone
// ou recopie a la main ne doit pas preter a confusion.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Code d'invitation cabinet, a usage unique, de la forme XXXX-XXXX.
 * 31^8 combinaisons : non devinable, l'unicite reelle est garantie par la
 * contrainte UNIQUE en base (on retente en cas de collision).
 */
export function genererCodeCabinet(): string {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}`;
}

// Normalise une saisie utilisateur vers la forme canonique du code.
export function normaliserCode(brut: string): string {
  return brut.trim().toUpperCase().replace(/\s+/g, "");
}
