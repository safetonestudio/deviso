/**
 * Constantes partagees de la Plateforme Agreee, SANS aucune dependance serveur.
 *
 * Pourquoi ce fichier existe. `lib/superpdp-entreprise.ts` et `lib/superpdp.ts`
 * tirent `crypto` (Node) et le client Supabase admin (cle de service). Un
 * composant `"use client"` qui importait `PERIODICITES_TVA` depuis
 * `superpdp-entreprise` embarquait donc tout ce graphe serveur dans le bundle
 * navigateur : ~452 Ko de polyfills crypto cote client, et du code admin
 * expose. Ce module ne contient QUE des valeurs pures, il peut etre importe
 * librement depuis le client. Le garde `check:client-pur` interdit a tout
 * fichier client de remonter jusqu'au code serveur.
 *
 * Ne JAMAIS ajouter d'import ici (ni crypto, ni supabase, ni superpdp).
 */

/** Les quatre valeurs admises par `PATCH /v1.beta/companies`. */
export type VatRegime = "monthly" | "quarterly" | "simplified" | "vat_exemption";

/** Periodicites de declaration proposees a l'utilisateur dans la page profil. */
export const PERIODICITES_TVA = [
  { value: "monthly", label: "Mensuelle, régime réel normal" },
  { value: "quarterly", label: "Trimestrielle, régime réel normal" },
  { value: "simplified", label: "Annuelle, régime simplifié (RSI)" },
] as const;
