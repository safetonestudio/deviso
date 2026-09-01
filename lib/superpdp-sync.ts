import { createAdminClient } from "@/lib/supabase/admin";
import {
  getConnection,
  saveConnection,
  superpdpFetch,
  lireEtatSession,
  statutDepuisEtat,
  SuperPdpNotConnected,
  SuperPdpSessionPending,
} from "@/lib/superpdp";

/**
 * Synchronisation des factures échangées via la Plateforme Agréée.
 *
 * Super PDP ne nous prévient de rien : il n'y a pas de webhook, c'est à nous
 * d'aller demander ce qui est nouveau. Leur documentation « Synchronisation »
 * décrit le seul procédé qui garantisse de ne rien manquer :
 *
 *   - les id sont des bigint **strictement croissants** ;
 *   - la liste est triée par id croissant ;
 *   - `starting_after_id` ne renvoie que ce qui dépasse un id donné ;
 *   - `has_after` indique qu'il reste des pages.
 *
 * D'où le curseur `last_invoice_id`. Filtrer sur une date de création à la
 * place semblerait équivalent et ne l'est pas — deux écritures concurrentes
 * peuvent produire des dates dans le désordre, et on perdrait des factures sans
 * jamais le voir. C'est le piège que leur documentation prend soin de nommer.
 *
 * Deux détails qui ont dicté la forme du code, constatés sur une vraie facture
 * reçue le 12/08/2026 :
 *   1. la liste est **maigre** — elle ne contient ni montant ni nom de vendeur.
 *      Il faut un appel de détail par facture ;
 *   2. elle contient les deux sens. `direction` vaut `in` ou `out` ; on garde
 *      les deux, l'affichage filtrera.
 */

/**
 * Le statut qui fait foi, parmi une liste d'événements.
 *
 * ⚠️ Ne pas simplifier en `events.at(-1)`. La spécification s'ouvre sur cet
 * avertissement : « **this is not a state machine** — This property is an array
 * of statuses. There is no formal state machine governing the transitions. »
 *
 * L'énumération mélange trois familles : les `fr:*` (cycle de vie officiel
 * DGFiP), les `api:*` (internes Super PDP) et vingt-deux `ppf:*` qui sont des
 * accusés d'acheminement vers le Portail Public de Facturation. Et la spec
 * précise qu'ils arrivent EN MÊME TEMPS : « `ppf:refused` represents the event
 * which is emitted at the same time as the `fr:210` event », suivi de son
 * `-ack`. Prendre le dernier donne donc `ppf:refused-ack` là où l'utilisateur
 * doit lire « Refusée ».
 *
 * Conséquences si on se trompe, toutes constatées en revue le 29/08/2026 : la
 * pastille affiche un code brut, la facture refusée repasse « en retard » en
 * rouge parce qu'elle n'est plus reconnue comme clôturée, et l'écran du
 * fournisseur cesse d'afficher « Refusée par le client » — c'est-à-dire
 * l'information qui l'oblige à passer un avoir.
 *
 * On retient donc le dernier `fr:*`, et à défaut le dernier `api:*` (une
 * facture Peppol n'a que ceux-là). Les `ppf:*` sont de la traçabilité
 * d'acheminement : ils n'ont rien à dire à l'utilisateur.
 */
export function statutQuiFaitFoi(
  evenements: { status_code?: string | null }[] | null | undefined
): string | null {
  const codes = (evenements ?? []).map((e) => e?.status_code).filter(Boolean) as string[];
  const officiels = codes.filter((c) => c.startsWith("fr:"));
  if (officiels.length) return officiels[officiels.length - 1];
  const internes = codes.filter((c) => c.startsWith("api:"));
  return internes.length ? internes[internes.length - 1] : null;
}

/** Un statut `ppf:*` ne remplace jamais un statut lisible par l'utilisateur. */
const estStatutAffichable = (code: string) => code.startsWith("fr:") || code.startsWith("api:");

/** Borne de sécurité : une synchronisation ne doit pas tourner indéfiniment. */
const PAGES_MAX = 20;

export type ResultatSync = {
  recuperees: number;
  entrantes: number;
  jusquA: number | null;
  /** Nombre de statuts mis à jour depuis les événements de cycle de vie. */
  statuts?: number;
  /** Total connu de la plateforme, toutes pages confondues (`count`). */
  total?: number | null;
  /** Vrai quand la borne de pages a été atteinte : il reste des factures. */
  tronque?: boolean;
  /** Renseigné quand la synchronisation n'a pas pu se faire. */
  raison?: "non_raccorde" | "verification_en_cours" | "erreur";
  detail?: string;
};

type FactureListe = {
  id: number;
  company_id?: number | string;
  created_at?: string;
  direction: "in" | "out";
  processing_rule?: string;
  /** Présents seulement si `expand[]` a été demandé — voir la boucle. */
  en_invoice?: Record<string, unknown> | null;
  events?: { status_code?: string }[] | null;
};

const nombre = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(typeof v === "object" ? (v as { value?: string }).value : v);
  return Number.isFinite(n) ? n : null;
};

/** Une date EN 16931 absente doit rester nulle, pas devenir « aujourd'hui ». */
const date = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;

export async function synchroniserFactures(userId: string): Promise<ResultatSync> {
  const conn = await getConnection(userId);
  if (!conn) return { recuperees: 0, entrantes: 0, jusquA: null, raison: "non_raccorde" };

  const admin = createAdminClient();
  let curseur = conn.last_invoice_id ?? null;
  let recuperees = 0;
  let entrantes = 0;
  /** `count` renvoyé par la plateforme : le total de toutes les pages. */
  let total: number | null = null;
  /** Vrai si on est sorti par épuisement de PAGES_MAX, pas par fin de liste. */
  let tronque = false;

  try {
    // État réel de la session, demandé à la source plutôt que déduit d'un 403.
    // C'est ce qui permet de distinguer « en cours de vérification » de
    // « vérification échouée » : deux situations opposées, jusqu'ici confondues
    // dans un seul message qui laissait attendre un utilisateur bloqué.
    const etat = await lireEtatSession(userId);
    if (etat) {
      const statut = statutDepuisEtat(etat);
      if (statut !== conn.session_status) {
        await saveConnection(userId, {
          session_status: statut,
          ...(statut === "error"
            ? { last_error: "Super PDP n'a pas pu vérifier le rattachement de votre entreprise. Refaites le raccordement." }
            : statut === "verified"
              ? { last_error: null }
              : {}),
        });
      }
      if (statut !== "verified") {
        return {
          recuperees,
          entrantes,
          jusquA: curseur,
          raison: statut === "error" ? "erreur" : "verification_en_cours",
          detail: `company_verification_status = ${etat.entreprise}`,
        };
      }
    }

    // Rattrapage de l'adresse de réception.
    //
    // Elle est renseignée au moment du raccordement, mais tout raccordement
    // établi avant l'ajout de ce champ l'a laissée vide — et l'écran, qui
    // n'affiche le bloc que si l'adresse existe, ne montrait alors rien du
    // tout. Une migration ne pouvait pas la remplir : l'information est chez
    // Super PDP, pas chez nous. On la récupère donc à la première occasion.
    if (!conn.directory_address) {
      const annuaire = await superpdpFetch(userId, "/directory_entries");
      if (annuaire.ok) {
        const body = (await annuaire.json()) as {
          data?: { id?: number; identifier?: string; is_replyto?: boolean }[];
        };
        const ligne = (body.data ?? []).find((e) => !e.is_replyto);
        if (ligne?.identifier) {
          await saveConnection(userId, {
            directory_address: ligne.identifier,
            directory_id: ligne.id != null ? String(ligne.id) : null,
          });
        }
      }
    }

    for (let page = 0; page < PAGES_MAX; page++) {
      // `expand[]` et `limit` : cent un appels HTTP deviennent un seul.
      //
      // Le commentaire de tête de ce fichier affirmait que « la liste est
      // maigre — il faut un appel de détail par facture ». C'était vrai de
      // l'observation faite sans paramètre, et la spec en donne la raison :
      // « By default, the `en_invoice` property is not returned, **for
      // performance reasons**. Use the expand parameter to control the amount
      // of expanded data in the response. »
      //
      // `en_invoice_overview` déclare `number`, `issue_date`, `currency_code`
      // et `totals` comme requis, plus `seller`, `buyer` et
      // `payment_due_date` — c'est-à-dire exactement tout ce que l'écriture
      // ci-dessous allait chercher une facture à la fois.
      //
      // Ce que ça change au-delà du coût : une page de cent factures faisait
      // cent-un appels SÉQUENTIELS dans une seule invocation serverless. Le
      // curseur n'étant sauvegardé qu'après la page complète, une expiration à
      // la soixantième facture perdait les cinquante-neuf précédentes — et une
      // page qui ne tient jamais dans le budget bloquait la synchronisation
      // pour toujours, en boucle.
      //
      // `limit=1000` est le maximum documenté : la borne de sécurité couvre
      // désormais vingt mille factures au lieu de deux mille.
      const params = new URLSearchParams();
      if (curseur) params.set("starting_after_id", String(curseur));
      params.set("limit", "1000");
      params.append("expand[]", "en_invoice");
      params.append("expand[]", "events");
      const chemin = `/invoices?${params}`;

      const res = await superpdpFetch(userId, chemin);
      if (!res.ok) {
        // Sans cette écriture, un 500 persistant de la plateforme laissait
        // l'écran afficher un raccordement sain pendant que plus rien
        // n'arrivait — le cas que le bloc catch plus bas déclare inacceptable,
        // mais qui passait par ce chemin-ci sans laisser de trace.
        const detail = `HTTP ${res.status} sur ${chemin}`;
        await saveConnection(userId, { last_error: detail.slice(0, 500) }).catch(() => {});
        return { recuperees, entrantes, jusquA: curseur, raison: "erreur", detail };
      }

      const body = (await res.json()) as {
        data?: FactureListe[];
        has_after?: boolean;
        count?: number;
      };
      const lot = body.data ?? [];
      total = body.count ?? total;
      if (lot.length === 0) break;

      for (const brute of lot) {
        // `expand[]` ne ramène PAS tout, contrairement à ce qu'on a cru.
        //
        // La liste renvoie un `en_invoice_overview`, dont le schéma précise :
        // « the same structure as ENInvoice, except some fields are optional
        // (buyer, lines and seller) ». En pratique la plateforme les omet.
        // L'optimisation `expand[]`, introduite pour supprimer le N+1,
        // enregistrait donc des factures reçues sans émetteur : l'écran
        // « Factures reçues » ne pouvait plus dire de qui venait la facture.
        // Une facture reçue sans expéditeur n'est pas une facture, c'est une
        // ligne comptable orpheline.
        //
        // On garde l'expansion — elle évite l'appel de détail quand elle
        // suffit — mais on redescend chercher le détail dès qu'il manque
        // l'identité des parties. Le coût reste borné : le curseur ne repasse
        // jamais sur une facture déjà écrite, donc chaque facture n'est
        // détaillée qu'une fois dans sa vie.
        let en = brute.en_invoice ?? null;
        let evenements = brute.events ?? null;

        const partiesManquantes = !en?.seller || !en?.buyer;

        if (!en || !evenements || partiesManquantes) {
          const d = await superpdpFetch(userId, `/invoices/${brute.id}`);
          if (!d.ok) {
          // ⚠️ Surtout pas `continue`. Le curseur est commun au lot : sauter
          // cette facture et laisser les suivantes le faire avancer la rend
          // INATTEIGNABLE pour toujours — `starting_after_id` ne ramène que les
          // identifiants strictement supérieurs. L'utilisateur serait
          // légalement destinataire d'une facture qu'il ne verra jamais, et
          // rien ne le lui dirait.
          //
          // On arrête donc la page ici : le curseur reste sur la dernière
          // facture réellement écrite, et le prochain passage reprend
          // exactement là. Une panne passagère coûte un délai, pas une facture.
            await saveConnection(userId, { last_invoice_id: curseur, last_sync_at: new Date().toISOString() });
            return {
              recuperees, entrantes, jusquA: curseur, raison: "erreur",
            detail: `Détail de la facture ${brute.id} illisible (HTTP ${d.status}). Reprise au prochain passage.`,
            };
          }

          const facture = (await d.json()) as {
            en_invoice?: Record<string, unknown>;
            events?: { status_code?: string }[];
          };
          en = (facture.en_invoice ?? {}) as Record<string, unknown>;
          evenements = facture.events ?? [];
        }

        const champs = (en ?? {}) as Record<string, any>;
        const totaux = (champs.totals ?? {}) as Record<string, unknown>;
        const journal = evenements ?? [];

        const { error: erreurEcriture } = await admin.from("superpdp_invoices").upsert(
          {
            id: brute.id,
            user_id: userId,
            company_id: brute.company_id != null ? String(brute.company_id) : null,
            direction: brute.direction,
            processing_rule: brute.processing_rule ?? null,
            number: champs.number ?? null,
            issue_date: date(champs.issue_date),
            payment_due_date: date(champs.payment_due_date),
            currency_code: champs.currency_code ?? null,
            seller_name: champs.seller?.name ?? null,
            buyer_name: champs.buyer?.name ?? null,
            total_without_vat: nombre(totaux.total_without_vat),
            total_vat: nombre(totaux.total_vat_amount),
            total_with_vat: nombre(totaux.total_with_vat),
            amount_due: nombre(totaux.amount_due_for_payment),
            last_status_code: statutQuiFaitFoi(journal),
            en_invoice: champs,
            received_at: brute.created_at ?? null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        // Le commentaire disait « le curseur n'avance qu'après écriture
        // réussie » — mais l'erreur n'était pas lue, donc la garantie
        // n'existait pas. Une contrainte violée, une colonne absente après
        // migration, et la facture était perdue pendant que le compteur
        // annonçait fièrement l'avoir récupérée.
        if (erreurEcriture) {
          await saveConnection(userId, {
            last_invoice_id: curseur,
            last_error: `Écriture de la facture ${brute.id} impossible : ${erreurEcriture.message}`.slice(0, 500),
          });
          return {
            recuperees, entrantes, jusquA: curseur, raison: "erreur",
            detail: `Écriture de la facture ${brute.id} impossible : ${erreurEcriture.message}`,
          };
        }

        recuperees++;
        if (brute.direction === "in") entrantes++;
        curseur = Math.max(curseur ?? 0, brute.id);
      }

      await saveConnection(userId, {
        last_invoice_id: curseur,
        last_sync_at: new Date().toISOString(),
      });

      if (!body.has_after) break;
      // Dernier tour sans avoir vidé la liste : on sort par la borne de
      // sécurité, pas parce qu'il n'y a plus rien. Le dire évite d'afficher
      // « à jour » sur une synchronisation tronquée.
      if (page === PAGES_MAX - 1) tronque = true;
    }
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return { recuperees, entrantes, jusquA: curseur, raison: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { recuperees, entrantes, jusquA: curseur, raison: "verification_en_cours" };
    }
    const detail = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[superpdp-sync]", detail);

    // On inscrit l'échec sur le raccordement. Sans cela, une synchronisation qui
    // échoue ne laisse aucune trace visible : l'écran continue d'afficher un
    // raccordement sain pendant que plus rien n'arrive. C'est le pire des cas
    // pour de la facturation électronique — l'utilisateur est légalement
    // destinataire de factures qu'il ne voit jamais, et rien ne le lui signale.
    //
    // `invalid_grant` est à part : le refresh token est mort (rotation OAuth 2.1
    // perdue, révocation, autorisation retirée). Aucun réessai ne le ranimera,
    // il faut refaire le tunnel d'autorisation — d'où le statut `error`, qui
    // permet à l'interface de proposer un rebranchement au lieu d'attendre.
    const grantMort = /invalid_grant/i.test(detail);
    await saveConnection(userId, {
      last_error: detail.slice(0, 500),
      ...(grantMort ? { session_status: "error" as const } : {}),
    }).catch(() => {
      // Ne jamais transformer un échec de journalisation en échec de
      // synchronisation : on a déjà une erreur à remonter.
    });

    return { recuperees, entrantes, jusquA: curseur, raison: "erreur", detail };
  }

  // Les statuts changent après coup : il faut aussi lire les événements.
  //
  // Sous son propre filet : cet appel était HORS du try/catch ci-dessus, donc
  // une session expirée ou une coupure réseau y remontait brute à l'appelant,
  // sans `last_error`, sans horodatage, et sortait en 500 non typé côté route.
  // La moitié de la fonction échappait à la journalisation d'échec que l'autre
  // moitié soigne.
  let statuts = 0;
  try {
    statuts = await synchroniserEvenements(userId);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[superpdp-sync/evenements]", detail);
    await saveConnection(userId, {
      last_error: `Lecture des statuts impossible : ${detail}`.slice(0, 500),
      ...(/invalid_grant/i.test(detail) ? { session_status: "error" as const } : {}),
    }).catch(() => {});
    return { recuperees, entrantes, jusquA: curseur, raison: "erreur", detail };
  }

  // Une synchronisation sans nouveauté est un succès, pas un non-événement :
  // on horodate quand même, sinon l'écran ne peut pas distinguer « rien de
  // nouveau » de « on n'a pas regardé depuis hier ».
  // Le succès efface l'erreur précédente : sans cela, un incident passager
  // laisserait une alerte affichée indéfiniment, et l'utilisateur cesserait de
  // la croire — donc de la lire le jour où elle est vraie.
  await saveConnection(userId, {
    last_sync_at: new Date().toISOString(),
    ...(conn.last_error ? { last_error: null } : {}),
  });

  return { recuperees, entrantes, jusquA: curseur, statuts, total, tronque };
}

type EvenementFacture = {
  id: number;
  invoice_id: number;
  status_code?: string;
  created_at?: string;
};

/**
 * Synchronise les **événements** de cycle de vie.
 *
 * ⚠️ Ne pas supprimer en pensant que la synchronisation des factures suffit.
 * C'est l'erreur commise le 12/08/2026 : le curseur `starting_after_id` ne
 * ramène que les factures dont l'identifiant **dépasse** le dernier connu. Or
 * un changement de statut ne crée pas une nouvelle facture, il crée un nouvel
 * **événement**. Une facture déjà synchronisée n'est donc plus jamais relue.
 *
 * Constaté en traversée : une facture refusée continuait d'afficher « Reçue par
 * la plateforme ». Les statuts se figeaient à leur valeur du jour d'arrivée —
 * Refusée, Approuvée, Encaissée : rien n'aurait jamais remonté. La documentation
 * de Super PDP le dit d'ailleurs explicitement, « pour les invoice_events, il
 * faut procéder de la même manière ». Je ne l'avais pas fait.
 *
 * Second curseur, indépendant : les deux séquences n'avancent pas au même rythme.
 */
async function synchroniserEvenements(userId: string): Promise<number> {
  const conn = await getConnection(userId);
  if (!conn) return 0;

  const admin = createAdminClient();
  let curseur = conn.last_event_id ?? null;
  let appliques = 0;

  for (let page = 0; page < PAGES_MAX; page++) {
    const params = new URLSearchParams();
    if (curseur) params.set("starting_after_id", String(curseur));
    // `limit` vaut 100 par défaut et 1000 au maximum (spécification de
    // `GET /invoice_events`). On ne le posait pas : vingt pages de cent, soit
    // deux mille événements par passage, au-delà desquels la boucle s'arrêtait
    // sans rien dire. Un compte actif après une coupure de synchronisation
    // aurait perdu ses refus et ses encaissements en silence. Dix fois plus de
    // marge pour le même nombre d'appels.
    params.set("limit", "1000");
    const res = await superpdpFetch(userId, `/invoice_events?${params}`);
    // Un `break` muet ici, c'était le mode de défaillance le plus coûteux du
    // domaine : les refus, encaissements et rejets cessaient de remonter sans
    // que rien ne le signale. On le fait remonter comme une erreur.
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} sur /invoice_events`);
    }

    const body = (await res.json()) as { data?: EvenementFacture[]; has_after?: boolean };
    const lot = body.data ?? [];
    if (lot.length === 0) break;

    for (const ev of lot) {
      // Un `ppf:*` fait avancer le curseur mais ne touche à aucun statut : il
      // dit où en est l'acheminement administratif, pas où en est la facture.
      if (ev.status_code && estStatutAffichable(ev.status_code)) {
        // Les événements arrivent par id croissant, donc le dernier appliqué
        // pour une facture donnée est bien le plus récent.
        const { error } = await admin
          .from("superpdp_invoices")
          .update({ last_status_code: ev.status_code })
          .eq("id", ev.invoice_id)
          .eq("user_id", userId);
        // Un événement peut concerner une facture qu'on n'a pas encore : ce
        // n'est pas une erreur, la prochaine synchronisation la ramènera.
        if (!error) appliques++;

        // Et sur NOTRE facture, pas seulement sur la copie miroir.
        //
        // `invoices.superpdp_status` était écrit une fois, à l'émission, avec
        // `api:uploaded`, et plus jamais touché. Constaté le 29/08/2026 : 42
        // factures transmises, 42 figées à `api:uploaded`, pendant que la
        // vérité côté Super PDP était `fr:202`. Conséquence : une facture
        // **refusée par le client** (fr:210) continuait de s'afficher
        // « Transmise » en vert dans la liste. Le code qui devait la signaler
        // n'était jamais atteint, faute de données.
        //
        // C'est l'écran du fournisseur qui compte ici : il doit voir un refus,
        // parce qu'un refus l'oblige à passer un avoir.
        await admin
          .from("invoices")
          .update({
            superpdp_status: ev.status_code,
            superpdp_status_date: ev.created_at ?? new Date().toISOString(),
          })
          .eq("superpdp_invoice_id", String(ev.invoice_id))
          .eq("user_id", userId);
      }
      curseur = Math.max(curseur ?? 0, ev.id);
    }

    await saveConnection(userId, { last_event_id: curseur });
    if (!body.has_after) break;
    // Sortie par la borne de sécurité plutôt que par épuisement : il reste des
    // événements. Le taire ferait croire la synchronisation complète.
    if (page === PAGES_MAX - 1) {
      console.error(
        `[superpdp/evenements] ${userId} : ${PAGES_MAX} pages atteintes, il reste des événements à lire`
      );
    }
  }

  return appliques;
}
