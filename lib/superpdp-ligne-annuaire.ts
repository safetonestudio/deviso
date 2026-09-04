import { superpdpFetch, isSandbox, getConnection } from "@/lib/superpdp";
import { toSiren } from "@/lib/facturx-helpers";
import { decisionFermeture } from "@/lib/superpdp-fermeture";

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

/** L'état d'une ligne, dérivé de ses trois champs. */
function etatDeLaLigne(ligne: LigneBrute): EtatLigne {
  const adresse = ligne.identifier as string;
  const id = ligne.id ?? null;
  if (ligne.status === "error") {
    return { etat: "en_erreur", adresse, id, message: ligne.status_message ?? null };
  }
  if (ligne.status === "pending") return { etat: "en_cours", adresse, id };
  const effet = ligne.effective_date ? ligne.effective_date.slice(0, 10) : null;
  if (effet && effet > new Date().toISOString().slice(0, 10)) {
    return { etat: "programmee", adresse, id, aPartirDu: effet };
  }
  return { etat: "joignable", adresse, id };
}

/**
 * Toutes les lignes de réception, pas seulement la meilleure.
 *
 * L'annuaire autorise plusieurs lignes par entreprise — « toutes les entreprises
 * sont libres de créer autant de lignes d'annuaires qu'elles le souhaitent, pour
 * leur organisation interne ». `lireLigneAnnuaire` n'en montre qu'une, et c'est
 * le bon choix pour l'écran : un freelance n'en a qu'une. Mais pour en FERMER
 * une précise, il faut pouvoir les désigner.
 */
export async function lireLignesAnnuaire(workspaceId: string): Promise<EtatLigne[] | null> {
  const res = await superpdpFetch(workspaceId, "/directory_entries");
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: LigneBrute[] };
  return (body.data ?? [])
    .filter((l) => !l.is_replyto && l.identifier)
    .map(etatDeLaLigne);
}

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
  profil: { siret?: string | null },
  /**
   * Suffixe d'organisation interne, ajouté au SIREN (`SIREN_SUFFIXE`).
   *
   * Existe pour une raison précise et une seule : permettre à la traversée de
   * créer une ligne SECONDAIRE, distincte de l'adresse principale, pour
   * éprouver la fermeture sans toucher à celle qui rend le compte joignable.
   *
   * Règles d'identifiant, en retenant la plus restrictive de la DGFiP et de
   * Peppol (article « Annuaire ») : cent caractères au plus, chiffres et
   * lettres sans accent uniquement, seul `_` admis, insensible à la casse.
   */
  suffixe?: string
): Promise<{ ok: true; adresse: string } | { ok: false; raison: string }> {
  // Le SIREN du profil, et à défaut celui que la Plateforme Agréée a elle-même
  // enregistré pour l'entreprise.
  //
  // Constaté le 04/09/2026 sur le compte de test : raccordé, ligne d'annuaire
  // ouverte par le tunnel, `company_number` renseigné — et pourtant « Ouvrir ma
  // ligne de réception » répondait « Renseignez votre SIRET dans Paramètres ».
  // On réclamait à l'utilisateur une information que nous avions déjà, et sous
  // une forme (le SIRET) dont nous n'utilisons que les neuf premiers chiffres.
  // Un utilisateur qui perd sa ligne se retrouvait bloqué sans raison.
  //
  // Le repli n'est valable que si le schéma est `fr_siren` : c'est alors, par
  // définition, un SIREN. En bac à sable le numéro est fictif (000000002) et ne
  // désigne rien dans l'annuaire français — on ne s'en sert donc pas.
  const conn = await getConnection(workspaceId);
  const sirenPlateforme =
    conn?.company_number_scheme === "fr_siren" ? toSiren(conn.company_number) : null;
  const siren = toSiren(profil.siret) ?? sirenPlateforme;
  if (!siren) {
    return { ok: false, raison: "Renseignez votre SIRET dans Paramètres avant d'ouvrir votre ligne." };
  }

  if (suffixe !== undefined && !/^[A-Za-z0-9_]{1,100}$/.test(suffixe)) {
    return {
      ok: false,
      raison: "Suffixe invalide : chiffres, lettres sans accent et « _ » uniquement, 100 caractères au plus.",
    };
  }
  const identifiantFr = suffixe ? `${siren}_${suffixe}` : siren;

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
    ? { directory: "peppol", identifier: `0225:${identifiantFr}` }
    : {
        directory: "ppf",
        identifier: identifiantFr,
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

export type EchecFermeture =
  /** Aucune ligne à fermer : ce n'est pas une erreur. */
  | "absente"
  /** Portabilité en cours — fermer casserait le transfert. */
  | "migration"
  /** La plateforme a refusé. */
  | "refuse";

/**
 * Ferme la ligne de réception.
 *
 * Pourquoi cette fonction existe. Deviso savait ouvrir une ligne, pas la
 * fermer. Un utilisateur qui cesse son activité se débranchait, et la ligne
 * restait : l'annuaire continuait d'annoncer qu'il était joignable via
 * Super PDP alors que Deviso ne lisait plus rien. Les factures qu'on lui
 * adressait tombaient dans le vide, sans que personne ne le lui dise. On le
 * prévenait, et on l'envoyait finir la manœuvre sur l'interface de Super PDP —
 * une moitié de cycle de vie.
 *
 * ⚠️ Le garde-fou est le cœur de cette fonction, pas la suppression.
 *
 * Une ligne « en erreur » est l'état **normal** d'une portabilité en cours :
 * quand une entreprise arrive d'une autre Plateforme Agréée, « pendant le temps
 * de la migration, la ligne d'annuaire est en erreur côté SUPER PDP, mais ça
 * n'est pas grave, **il ne faut pas la supprimer** » (documentation Super PDP,
 * article « Annuaire »). L'ancienne plateforme a cinq jours pour rendre la
 * main. Supprimer à cet instant, c'est interrompre son propre transfert — et
 * l'utilisateur qui vient de voir un encadré ambre « erreur » est précisément
 * celui qui aura envie d'appuyer sur le bouton.
 *
 * On refuse donc, plutôt que de faire confiance au texte d'avertissement.
 *
 * Les adresses `is_replyto` ne sont de toute façon pas supprimables — « Reply-to
 * addresses are technical addresses and cannot be deleted » — et
 * `lireLigneAnnuaire` les écarte déjà.
 */
export async function fermerLigneAnnuaire(
  workspaceId: string,
  /**
   * Ferme CETTE ligne plutôt que celle que l'écran montre.
   *
   * Sans ce paramètre, la fonction ne sait fermer que la ligne principale, et
   * l'éprouver revient donc à rendre le compte injoignable puis à le rouvrir —
   * ce qui, en bac à sable, ne restitue même pas la même adresse : `ouvrir`
   * reconstruit `0225:SIREN` alors que les sociétés de test se distinguent par
   * un suffixe. Le seul chemin destructeur de l'intégration serait resté le
   * seul jamais joué.
   *
   * Avec, on peut créer une ligne secondaire, la fermer, et vérifier que la
   * principale n'a pas bougé. Le garde-fou s'applique à la ligne désignée,
   * pas à une autre.
   */
  idLigne?: number
): Promise<{ ok: true; adresse: string } | { ok: false; raison: EchecFermeture; message: string }> {
  const ligne =
    idLigne != null
      ? (await lireLignesAnnuaire(workspaceId))?.find(
          (l) => l.etat !== "absente" && l.id === idLigne
        ) ?? { etat: "absente" as const }
      : await lireLigneAnnuaire(workspaceId);

  // La règle qui décide vit dans lib/superpdp-fermeture.ts, sans dépendance,
  // pour être éprouvable sans fermer de vraie ligne. Voir ce fichier : le refus
  // pendant une portabilité est le garde-fou central de cette fonction.
  const decision = decisionFermeture(ligne?.etat);
  if (!decision.fermer) {
    return { ok: false, raison: decision.raison, message: decision.message };
  }

  if (!ligne || ligne.etat === "absente" || ligne.id == null) {
    return {
      ok: false,
      raison: "refuse",
      message: "La Plateforme Agréée n'a pas communiqué l'identifiant de votre ligne.",
    };
  }

  const res = await superpdpFetch(workspaceId, `/directory_entries/${ligne.id}`, {
    method: "DELETE",
  });

  // La spec annonce un 204. On accepte tout 2xx : un 200 avec corps ne serait
  // pas un échec, et se montrer plus strict que la plateforme ferait échouer
  // une fermeture qui a eu lieu.
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    console.error(`[superpdp/ligne] fermeture ${ligne.id} : HTTP ${res.status} ${detail.slice(0, 300)}`);
    return {
      ok: false,
      raison: "refuse",
      message: "La Plateforme Agréée a refusé la fermeture de la ligne. Réessayez dans un moment.",
    };
  }

  return { ok: true, adresse: ligne.adresse };
}
