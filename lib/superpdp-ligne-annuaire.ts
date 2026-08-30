import { superpdpFetch, isSandbox } from "@/lib/superpdp";
import { toSiren } from "@/lib/facturx-helpers";

/**
 * La ligne d'annuaire : ce qui rend une entreprise JOIGNABLE.
 *
 * Pourquoi ce fichier existe. Le raccordement affichait « Raccordé — Vous
 * pouvez recevoir des factures électroniques » dès que la session était
 * vérifiée, sans jamais regarder si une ligne d'annuaire existait. Or c'est la
 * ligne, et elle seule, qui fait qu'un fournisseur peut adresser une facture.
 * Une entreprise pouvait donc se croire en règle au 1ᵉʳ septembre 2026 tout en
 * restant strictement injoignable — et rien dans Deviso ne le lui disait.
 *
 * Pire : la création de la ligne était confiée à un paramètre d'autorisation
 * (`superpdp_send_and_receive`) qui n'apparaît nulle part dans la
 * spécification. On ne bâtit pas la promesse centrale du produit sur un
 * paramètre non documenté. On vérifie donc après coup, et on sait créer la
 * ligne nous-mêmes.
 *
 * La spec (`directory_entry`) impose de regarder trois champs, pas un :
 *   - `is_replyto` : adresse technique Peppol, jamais une adresse de réception ;
 *   - `status` : `pending` | `created` | `error` — une ligne en erreur ne reçoit
 *     rien, et une ligne en attente pas encore ;
 *   - `effective_date` : « the date at which the directory entry will
 *     effectively come into effect ». Une ligne datée du 1ᵉʳ septembre 2026 ne
 *     reçoit rien avant cette date, et le dire est plus utile que se taire.
 */

export type EtatLigne =
  | { etat: "joignable"; adresse: string; id: number | null }
  | { etat: "programmee"; adresse: string; id: number | null; aPartirDu: string }
  | { etat: "en_cours"; adresse: string; id: number | null }
  | { etat: "en_erreur"; adresse: string; id: number | null; message: string | null }
  | { etat: "absente" };

type LigneBrute = {
  id?: number;
  identifier?: string;
  is_replyto?: boolean;
  status?: "pending" | "created" | "error";
  status_message?: string | null;
  effective_date?: string | null;
};

/** Lit l'état réel de la ligne de réception de l'espace de travail. */
export async function lireLigneAnnuaire(workspaceId: string): Promise<EtatLigne | null> {
  const res = await superpdpFetch(workspaceId, "/directory_entries");
  if (!res.ok) return null;

  const body = (await res.json()) as { data?: LigneBrute[] };
  const lignes = (body.data ?? []).filter((l) => !l.is_replyto && l.identifier);
  if (!lignes.length) return { etat: "absente" };

  // Une ligne en service prime sur une ligne en attente, qui prime sur une
  // ligne en erreur : on montre le meilleur état réellement atteint.
  const rang = (l: LigneBrute) => (l.status === "created" ? 0 : l.status === "pending" ? 1 : 2);
  const ligne = [...lignes].sort((a, b) => rang(a) - rang(b))[0];
  const adresse = ligne.identifier as string;
  const id = ligne.id ?? null;

  if (ligne.status === "error") {
    return { etat: "en_erreur", adresse, id, message: ligne.status_message ?? null };
  }
  if (ligne.status === "pending") {
    return { etat: "en_cours", adresse, id };
  }
  const effet = ligne.effective_date ? ligne.effective_date.slice(0, 10) : null;
  if (effet && effet > new Date().toISOString().slice(0, 10)) {
    return { etat: "programmee", adresse, id, aPartirDu: effet };
  }
  return { etat: "joignable", adresse, id };
}

/**
 * Ouvre la ligne de réception.
 *
 * L'identifiant suit le format `SIREN`, `SIREN_SIRET` ou `SIREN_SUFFIXE` pour
 * l'annuaire français — sans préfixe `0225:`, contrairement à Peppol. On envoie
 * le SIRET quand on l'a : c'est l'établissement, donc l'adressage le plus
 * précis, et la spec l'admet explicitement.
 *
 * `directory: "ppf"` et non `peppol` : « In production, for french identifiers,
 * it is only possible to create directory entries in the `ppf` directory — we
 * handle the creation of the corresponding entries in the Peppol directory ».
 * En bac à sable l'annuaire français n'existe pas, on passe donc par Peppol,
 * avec le préfixe que ce format impose.
 */
export async function ouvrirLigneAnnuaire(
  workspaceId: string,
  profil: { siret?: string | null }
): Promise<{ ok: true; adresse: string } | { ok: false; raison: string }> {
  const siren = toSiren(profil.siret);
  if (!siren) {
    return { ok: false, raison: "Renseignez votre SIRET dans Paramètres avant d'ouvrir votre ligne." };
  }

  // Le SIREN nu, et pas `SIREN_SIRET`.
  //
  // Leur documentation est explicite : « pour faire simple et comme tout le
  // monde, on vous conseille de choisir comme adresse électronique de
  // facturation le numéro SIREN de votre entreprise », et « la plupart des
  // entreprises feront le choix pragmatique de n'avoir qu'une seule adresse ».
  // Les formes composées existent pour l'organisation interne des grandes
  // structures — un freelance n'en a aucun usage, et une adresse plus longue
  // est une adresse de plus à communiquer sans erreur.
  const corps = isSandbox()
    ? { directory: "peppol", identifier: `0225:${siren}` }
    : {
        directory: "ppf",
        identifier: siren,
        // Date d'entrée en vigueur de l'obligation de réception. La spec en
        // fait son exemple littéral : une ligne peut être ouverte à l'avance.
        effective_date: "2026-09-01",
      };

  const res = await superpdpFetch(workspaceId, "/directory_entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });

  const texte = await res.text();
  if (!res.ok) {
    console.error(`[superpdp/ligne] HTTP ${res.status} ${texte.slice(0, 300)}`);
    return {
      ok: false,
      raison: "La Plateforme Agréée a refusé l'ouverture de la ligne. Réessayez dans un moment.",
    };
  }
  let cree: LigneBrute = {};
  try { cree = JSON.parse(texte); } catch { /* réponse non JSON : l'appel a réussi quand même */ }
  return { ok: true, adresse: cree.identifier ?? corps.identifier };
}
