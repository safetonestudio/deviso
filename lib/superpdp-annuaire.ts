import { SUPERPDP_API } from "@/lib/superpdp";
import { toSiren } from "@/lib/facturx-helpers";

/**
 * Adresse d'acheminement d'un client, lue dans l'Annuaire.
 *
 * Ce que ça remplace. Jusqu'au 29/08/2026, Deviso **fabriquait** l'adresse du
 * destinataire en collant `0225:` devant son SIREN, et faisait saisir une
 * surcharge à la main quand ça ne suffisait pas. Deux problèmes :
 *
 *   1. la spécification française admet `SIREN`, `SIREN_SIRET`,
 *      `SIREN_SUFFIXE` et `SIREN_SIRET_CODEROUTAGE` — une entreprise à
 *      plusieurs établissements peut exiger un routage plus fin que son SIREN
 *      nu. Fabriquer l'adresse revient à supposer qu'elle n'en a qu'une ;
 *   2. la surcharge manuelle demandait à un freelance une donnée qu'il n'a
 *      aucun moyen de connaître : elle est chez son client, ou dans l'annuaire.
 *
 * `GET /french_directory/entries?number=<SIREN>` rend précisément la liste des
 * identifiants « qui peuvent être utilisés comme adresse de destination d'une
 * facture ». On la lit au lieu de la deviner.
 *
 * Ordre de priorité retenu à l'émission :
 *   1. l'adresse saisie sur la facture, si l'utilisateur en a mis une — elle
 *      reste souveraine, un client peut avoir communiqué la sienne par écrit ;
 *   2. l'annuaire, quand il connaît le SIREN ;
 *   3. le SIREN nu, repli historique, correct pour la majorité des entreprises.
 */

export type EntreeAnnuaire = {
  identifier: string;
  /** Faux tant que l'entrée n'est pas en vigueur — voir le tri ci-dessous. */
  is_active?: boolean;
  is_replyto?: boolean;
};

/**
 * Interroge l'Annuaire pour un SIREN.
 *
 * Renvoie `null` — et non une exception — quand l'annuaire ne répond pas ou ne
 * connaît pas l'entreprise : une facture ne doit pas échouer parce qu'une
 * recherche d'agrément a échoué. L'appelant retombe alors sur le SIREN nu.
 *
 * ⚠️ Appel NON authentifié, et c'est délibéré. La spécification marque
 * `GET /french_directory/entries` avec `"security": []`, seule route du lot
 * avec `/french_directory/companies` à ne demander aucun jeton — l'Annuaire
 * national est public.
 *
 * Passer par `superpdpFetch` exigeait un raccordement, rafraîchissait un jeton
 * et levait `SuperPdpNotConnected` pour tout compte non raccordé : la
 * résolution d'adresse ne se produisait donc JAMAIS pour l'immense majorité des
 * utilisateurs, et le code retombait en silence sur `0225:<siren>` — la
 * fabrication que ce fichier a précisément été écrit pour supprimer. Le
 * `workspaceId` n'est plus nécessaire, il est conservé pour ne pas casser les
 * appelants et pour le jour où une variante authentifiée serait utile.
 */
export async function adresseAnnuaire(
  _workspaceId: string,
  siren: string | null | undefined
): Promise<string | null> {
  const numero = toSiren(siren);
  if (!numero) return null;

  try {
    const res = await fetch(
      `${SUPERPDP_API}/french_directory/entries?number=${encodeURIComponent(numero)}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return null;

    const corps = (await res.json()) as { data?: EntreeAnnuaire[] };

    // On écarte les lignes `_replyto` : ce sont les adresses techniques de
    // retour pour les messages de cycle de vie, pas des destinations de
    // facture. Les adresser enverrait la facture dans un canal de service.
    const utilisables = (corps.data ?? []).filter((e) => !e.is_replyto && e.identifier);
    if (utilisables.length === 0) return null;

    // Une entrée d'annuaire porte une date d'entrée en vigueur : `is_active`
    // est faux tant qu'elle n'est pas effective. Constaté sur de vraies
    // entreprises avant l'échéance de septembre 2026, où toutes les entrées
    // sont encore inactives. On préfère donc systématiquement une adresse en
    // vigueur — envoyer vers une entrée pas encore ouverte reviendrait à
    // adresser une boîte qui n'existe pas encore.
    const actives = utilisables.filter((e) => e.is_active !== false);
    const retenues = actives.length ? actives : utilisables;

    // Plusieurs entrées en vigueur : on prend la première, qui est l'adresse
    // principale. Choisir entre plusieurs établissements demanderait de savoir
    // lequel facture — une information que seul l'utilisateur détient, et qu'il
    // fournit alors par la surcharge manuelle sur la facture.
    return retenues[0].identifier;
  } catch {
    // Non raccordé, session en attente, réseau : aucun de ces cas ne justifie
    // de faire échouer l'émission ici. Le repli SIREN prend le relais.
    return null;
  }
}

/**
 * Adresse à porter dans le BT-49 acheteur, dans l'ordre de priorité décrit
 * en tête de fichier. Renvoie `null` si rien n'est déterminable — cas d'une
 * facture B2C, où le destinataire n'a pas d'adresse d'annuaire du tout.
 */
export async function resoudreAdresseClient(
  workspaceId: string,
  facture: { client_directory_address?: string | null; client_siren?: string | null }
): Promise<{ adresse: string | null; source: "saisie" | "annuaire" | "siren" | "aucune" }> {
  const saisie = facture.client_directory_address?.trim();
  if (saisie) return { adresse: saisie, source: "saisie" };

  const annuaire = await adresseAnnuaire(workspaceId, facture.client_siren);
  if (annuaire) return { adresse: annuaire, source: "annuaire" };

  const siren = toSiren(facture.client_siren);
  if (siren) return { adresse: `0225:${siren}`, source: "siren" };

  return { adresse: null, source: "aucune" };
}
