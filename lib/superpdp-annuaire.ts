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
export type LectureAnnuaire = {
  /** L'adresse retenue, ou `null` si rien d'utilisable ou de non ambigu. */
  adresse: string | null;
  /** Toutes les adresses de facturation utilisables trouvées. */
  candidats: string[];
  /**
   * Pourquoi on n'a pas tranché :
   *   - `ambigu` : plusieurs adresses en vigueur, seul le client sait laquelle ;
   *   - `inactive` : des adresses existent mais aucune n'est encore ouverte.
   */
  obstacle: "ambigu" | "inactive" | null;
};

export async function adresseAnnuaire(
  _workspaceId: string,
  siren: string | null | undefined
): Promise<LectureAnnuaire> {
  const vide: LectureAnnuaire = { adresse: null, candidats: [], obstacle: null };
  const numero = toSiren(siren);
  if (!numero) return vide;

  try {
    const res = await fetch(
      `${SUPERPDP_API}/french_directory/entries?number=${encodeURIComponent(numero)}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return vide;

    const corps = (await res.json()) as { data?: EntreeAnnuaire[] };

    // On écarte les lignes `_replyto` : ce sont les adresses techniques de
    // retour pour les messages de cycle de vie, pas des destinations de
    // facture. Les adresser enverrait la facture dans un canal de service.
    const utilisables = (corps.data ?? []).filter((e) => !e.is_replyto && e.identifier);
    if (utilisables.length === 0) return vide;

    const actives = utilisables.filter((e) => e.is_active !== false);

    // Des adresses existent, mais aucune n'est encore en vigueur.
    //
    // Le code retombait alors sur une entrée inactive, en se disant que c'était
    // mieux que rien. C'est le contraire : adresser une ligne pas encore
    // ouverte, c'est écrire à une boîte aux lettres qui n'est pas posée — la
    // plateforme accepte et n'a personne à qui remettre. Mesuré le 30/08/2026
    // sur l'annuaire réel : TOTALENERGIES SE (542051180) n'a qu'une entrée,
    // `is_active: false`. On préfère le dire.
    if (actives.length === 0) {
      return { adresse: null, candidats: utilisables.map((e) => e.identifier), obstacle: "inactive" };
    }

    // Plusieurs adresses en vigueur : on ne choisit PAS.
    //
    // Le code prenait `[0]` en la qualifiant d'« adresse principale ». Elle ne
    // l'est pas : mesuré le 30/08/2026 sur l'annuaire réel, GALERIES LAFAYETTE
    // HAUSSMANN (572062594) publie cinq adresses en vigueur, toutes suffixées
    // par un code de routage interne — `_BANQUES`, `_FGENERAUX`, `_INTERCOS`…
    // Prendre la première revient à envoyer toutes les factures au service
    // bancaire, silencieusement et sans jamais le dire à personne.
    //
    // Seul le client sait à quel service sa facture doit arriver. On remonte
    // donc la liste pour qu'il soit demandé, plutôt que de tirer au sort.
    if (actives.length > 1) {
      return { adresse: null, candidats: actives.map((e) => e.identifier), obstacle: "ambigu" };
    }

    return { adresse: actives[0].identifier, candidats: [actives[0].identifier], obstacle: null };
  } catch {
    // Non raccordé, session en attente, réseau : aucun de ces cas ne justifie
    // de faire échouer l'émission ici. Le repli SIREN prend le relais.
    return vide;
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
): Promise<{
  adresse: string | null;
  source: "saisie" | "annuaire" | "siren" | "aucune";
  /** Adresses proposées à l'utilisateur quand on refuse de trancher. */
  candidats?: string[];
  obstacle?: "ambigu" | "inactive" | null;
}> {
  const saisie = facture.client_directory_address?.trim();
  if (saisie) return { adresse: saisie, source: "saisie" };

  const lu = await adresseAnnuaire(workspaceId, facture.client_siren);
  if (lu.adresse) return { adresse: lu.adresse, source: "annuaire" };

  // Plusieurs adresses en vigueur : on bloque. Le SIREN nu ne peut pas
  // remplacer un choix entre cinq services — on sait que l'entreprise exige un
  // routage précis, donc que le SIREN nu ne suffit pas.
  if (lu.obstacle === "ambigu") {
    return { adresse: null, source: "aucune", candidats: lu.candidats, obstacle: "ambigu" };
  }

  // Adresses connues mais aucune encore en vigueur : on NE bloque PAS.
  //
  // Premier réflexe : refuser, au motif qu'adresser une ligne pas encore
  // ouverte revient à écrire à une boîte non posée. La mesure du 30/08/2026 sur
  // l'annuaire réel a montré que c'était trop sévère, et pour deux raisons.
  //
  // D'abord parce que c'est l'état NORMAL à la veille de l'échéance : sur trois
  // entreprises réelles trouvées dans l'annuaire, aucune n'avait d'entrée en
  // vigueur. Bloquer aurait interdit d'émettre vers la quasi-totalité des
  // grandes entreprises françaises — un remède bien pire que le mal.
  //
  // Ensuite parce que le repli n'est pas arbitraire ici : CARREFOUR
  // (652014051) publie `0225:652014051` et `0225:652014051_FG`. Le SIREN nu
  // *est* l'une de ses adresses publiées. Le repli tombe juste.
  //
  // Le risque résiduel — une facture jamais remise — est couvert en aval : le
  // badge ambre « adresse déduite » sur la liste, puis la détection de blocage
  // à 24 h. On préfère un envoi surveillé à un refus systématique.
  const replis = toSiren(facture.client_siren);
  if (lu.obstacle === "inactive" && replis) {
    return { adresse: `0225:${replis}`, source: "siren", candidats: lu.candidats, obstacle: "inactive" };
  }

  const siren = toSiren(facture.client_siren);
  if (siren) return { adresse: `0225:${siren}`, source: "siren" };

  return { adresse: null, source: "aucune" };
}
