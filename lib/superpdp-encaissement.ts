import { createAdminClient } from "@/lib/supabase/admin";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { estCloture, libelleStatut } from "@/lib/superpdp-statuts";

export type ResultatEncaissement =
  | { ok: true; dejaEncaissee?: boolean }
  | {
      ok: false;
      raison:
        | "non_transmise"
        | "non_raccorde"
        | "verification_en_cours"
        | "refuse"
        /** Déclaré auprès de la plateforme, mais pas noté chez nous : ne pas rejouer. */
        | "non_enregistre"
        /**
         * L'appel est parti et on n'a jamais su ce qu'il est devenu — coupure,
         * délai dépassé. La réservation est CONSERVÉE : rejouer risquerait une
         * seconde déclaration de paiement au PPF pour le même encaissement.
         */
        | "incertain"
        /**
         * La facture a déjà fini sa vie autrement — rejetée, refusée. Aucun
         * encaissement ne peut s'y rattacher, et réessayer n'y changera rien.
         */
        | "facture_close";
      detail?: string;
      /** Message prêt à afficher, quand la cause est connue précisément. */
      message?: string;
    };

/**
 * Envoie le statut de cycle de vie « Encaissée » (fr:212) à Super PDP pour une
 * facture Deviso déjà émise.
 *
 * Statut obligatoire posé par le fournisseur (art. 290 A du CGI, tableau 8 des
 * spécifications externes DGFiP v3.2) — voir CLAUDE.md, section Super PDP.
 *
 * Corps minimal volontaire : `{ invoice_id, status_code: "fr:212" }`, sans
 * `details`. Vérifié en bac à sable le 29/08/2026 : Super PDP calcule
 * lui-même la ventilation des montants par taux de TVA à partir de la
 * facture déjà connue de leur côté (réponse HTTP 200, événement créé avec
 * `amounts` peuplé automatiquement). Envoyer un détail explicite ne serait
 * utile que pour un encaissement partiel, qu'on ne gère pas ici : « Marquer
 * comme payée » sur Deviso ne représente qu'un encaissement total.
 *
 * Appelée depuis deux endroits — le bouton « Marquer comme payée » et le
 * webhook Stripe (paiement par lien) — et centralisée ici pour que les deux
 * chemins se comportent identiquement. Ne pas la dupliquer : c'est
 * exactement le défaut qui avait fait diverger `superpdp_connections` avant
 * la leçon de `saveConnection` (12/08/2026).
 *
 * Best-effort : ne lève jamais d'exception. Un échec de transmission à la PA
 * ne doit pas empêcher Deviso de considérer la facture payée — ce sont deux
 * systèmes distincts. Le résultat typé permet à l'appelant de prévenir
 * l'utilisateur sans bloquer son propre flux.
 */
export async function envoyerEncaissementPdp(
  workspaceId: string,
  invoiceId: string,
  /**
   * Date réelle de l'encaissement, au format `YYYY-MM-DD`.
   *
   * Sans elle, la date retenue est celle de l'appel. Or la TVA sur les
   * prestations de services est exigible **à l'encaissement** : quelqu'un qui
   * pointe le 29 un virement reçu le 12 déclarait une date fausse de dix-sept
   * jours, sur la donnée qui détermine précisément l'exigibilité.
   *
   * Le champ existe dans la spec : `invoice_event_reported_data.date`,
   * « indicates an expected date value, particularly the date of the receipt of
   * payment ». Absente, on n'invente rien et on laisse la plateforme dater.
   */
  dateEncaissement?: string | null
): Promise<ResultatEncaissement> {
  const admin = createAdminClient();

  const { data: facture } = await admin
    .from("invoices")
    .select("id, superpdp_invoice_id, superpdp_encaisse_at, total_ttc, tva_rate, superpdp_status")
    .eq("id", invoiceId)
    .eq("user_id", workspaceId)
    .maybeSingle();

  // Facture introuvable ou jamais transmise : rien à faire, et ce n'est pas
  // une erreur. La grande majorité des factures marquées payées ne sont pas
  // passées par Super PDP.
  if (!facture || !facture.superpdp_invoice_id) {
    return { ok: false, raison: "non_transmise" };
  }

  if (facture.superpdp_encaisse_at) {
    return { ok: true, dejaEncaissee: true };
  }

  // ── Une facture dont la vie est finie ne s'encaisse pas ──────────────────
  //
  // Une facture rejetée par la plateforme (`fr:213`) ou refusée par le
  // destinataire (`fr:210`) porte un statut CLÔTURANT. La Plateforme Agréée
  // refuse alors le `fr:212` — « La facture possède déjà un statut final » — et
  // sans ce contrôle on relayait ce refus sous la forme « Réessayez dans un
  // moment ». C'est un mensonge par omission : aucun réessai n'aboutira jamais,
  // et pendant ce temps la vraie information — votre facture a été rejetée, il
  // faut la refaire — n'est pas dite.
  //
  // On s'arrête donc avant l'appel, et on nomme la cause.
  //
  // `fr:212` est lui aussi clôturant : s'il est déjà posé sans que nous l'ayons
  // noté, l'encaissement est fait, pas impossible.
  if (facture.superpdp_status === "fr:212") {
    return { ok: true, dejaEncaissee: true };
  }
  if (estCloture(facture.superpdp_status)) {
    const libelle = libelleStatut(facture.superpdp_status)?.texte ?? facture.superpdp_status;
    return {
      ok: false,
      raison: "facture_close",
      detail: `statut ${facture.superpdp_status}`,
      message:
        `Cette facture porte le statut « ${libelle} » : elle est close, et aucun ` +
        `encaissement ne peut plus s'y rattacher. Établissez une nouvelle facture.`,
    };
  }

  // On n'accepte qu'une date du passé, au bon format : une date d'encaissement
  // dans le futur n'a pas de sens et serait rejetée bien plus loin, sans
  // message exploitable.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const dateValide =
    dateEncaissement && /^\d{4}-\d{2}-\d{2}$/.test(dateEncaissement) && dateEncaissement <= aujourdhui
      ? dateEncaissement
      : null;

  // ─────────────── Le bloc MDG-43 exigé par la nomenclature ────────────────
  //
  // On envoyait `details: [{ reported_data: [{ date }] }]`. La plateforme le
  // refusait, et disait exactement pourquoi :
  //
  //   « [BR-FR-CDV-14/MDT-207] : Si le statut est "Encaissé" (MDT-105 = 212),
  //     ALORS il doit y avoir au moins 1 Bloc MDG-43 avec une valeur de
  //     MDT-207 = MEN et tous les blocs MDG-43 avec une valeur MDT-207 = "MEN"
  //     doivent contenir une valeur MDT-215 (Montant) et une valeur de MDT-224
  //     (pourcentage de TVA). »
  //
  // Le piège : sans `details` du tout, la plateforme construit ce bloc elle-même
  // et tout passe. En fournir un incomplet DÉSACTIVE ce calcul et fait échouer
  // la validation. La branche « date » n'était donc pas seulement inutile, elle
  // empêchait le `fr:212` — le statut obligatoire du fournisseur — de partir.
  // Aucune interface ne l'appelait encore : le défaut était armé, pas déclenché.
  //
  // La forme exacte a été lue sur un bloc que la plateforme a produit seule
  // (facture 404395, 02/09/2026) plutôt que devinée :
  //
  //   { type_code: "MEN", amount: "300.000000", currency_code: "EUR",
  //     value_percent: "20.00" }
  //
  // À noter, et c'est contre-intuitif : `amount` vaut 300 pour une facture de
  // 250 € HT + 20 %. Le « montant encaissé net » est donc le montant TTC
  // réellement reçu, pas le HT.
  //
  // Une facture Deviso n'a qu'un seul taux (`invoices.tva_rate`), donc un seul
  // bloc suffit toujours. Si l'un des deux chiffres manque, on n'invente rien :
  // on retombe sur le corps minimal, que la plateforme sait compléter. On perd
  // la date exacte, jamais la déclaration.
  const ttc = Number(facture.total_ttc);
  const taux = Number(facture.tva_rate);
  const chiffresSurs = Number.isFinite(ttc) && ttc > 0 && Number.isFinite(taux) && taux >= 0;

  const blocMen =
    dateValide && chiffresSurs
      ? {
          type_code: "MEN",
          amount: ttc.toFixed(2),
          currency_code: "EUR",
          value_percent: taux.toFixed(2),
          date: dateValide,
        }
      : null;

  // La date qu'on note chez nous doit être celle qui part réellement. Sans le
  // bloc, c'est la plateforme qui date l'événement — donc aujourd'hui. Noter la
  // date fournie ferait croire à une déclaration qu'on n'a pas faite.
  const horodatage = blocMen
    ? new Date(`${dateValide}T12:00:00Z`).toISOString()
    : new Date().toISOString();

  // ─────────────────── Réservation atomique avant l'appel ───────────────────
  //
  // Le test `if (facture.superpdp_encaisse_at)` ci-dessus lit, puis on écrivait
  // APRÈS l'appel. Entre les deux, la fenêtre est grande ouverte, et elle est
  // empruntée par le scénario le plus banal qui soit : cette fonction a quatre
  // appelants, dont « Marquer comme payée » et le webhook Stripe. Quelqu'un qui
  // clique « payée » à l'instant où Stripe confirme le paiement déclenche les
  // deux. Tous deux lisent `null`, tous deux postent `fr:212`, et la donnée
  // d'e-reporting de paiement part **deux fois** au PPF pour un seul
  // encaissement. Le commentaire du bloc d'écriture décrivait déjà ce danger
  // comme la chose à ne pas laisser arriver — la garde, elle, ne l'empêchait
  // que pour deux clics espacés.
  //
  // On inverse donc l'ordre : on réserve d'abord, par une écriture
  // conditionnelle que la base sérialise, et on relâche si l'envoi n'a pas eu
  // lieu. Le seul cas où l'on garde la réservation sans certitude est celui où
  // l'on ignore ce qu'est devenu l'appel — parce qu'une déclaration fiscale en
  // double est un incident, là où une déclaration manquante se rattrape en
  // reprenant la facture.
  const { data: prise, error: erreurReservation } = await admin
    .from("invoices")
    .update({ superpdp_encaisse_at: horodatage })
    .eq("id", invoiceId)
    .eq("user_id", workspaceId)
    .is("superpdp_encaisse_at", null)
    .select("id")
    .maybeSingle();

  if (erreurReservation) {
    console.error(`[superpdp/encaissement] ${invoiceId} : réservation impossible — ${erreurReservation.message}`);
    return { ok: false, raison: "non_enregistre", detail: erreurReservation.message };
  }

  // Quelqu'un d'autre a réservé entre-temps. Attention au raccourci : « réservé
  // par un autre » ne veut pas dire « déclaré ». Si cet autre échoue et rend sa
  // réservation, répondre « déjà encaissée » annoncerait un succès à un
  // utilisateur dont la facture n'a rien de déclaré — l'échec silencieux, de
  // nouveau, et sur le statut obligatoire du fournisseur.
  //
  // On laisse donc au gagnant le temps de conclure, puis on regarde le
  // résultat : réservation toujours posée = c'est fait ; réservation rendue =
  // il a échoué, et c'est à nous de reprendre.
  if (!prise) {
    await new Promise((r) => setTimeout(r, 1500));
    const { data: apres } = await admin
      .from("invoices")
      .select("superpdp_encaisse_at")
      .eq("id", invoiceId)
      .eq("user_id", workspaceId)
      .maybeSingle();

    if (apres?.superpdp_encaisse_at) return { ok: true, dejaEncaissee: true };

    // Le gagnant a rendu sa réservation : il a échoué, et il a déjà dit
    // pourquoi à son propre appelant. On ne rejoue pas ici — deux appels qui se
    // relancent mutuellement tourneraient en rond. On dit ce qui est vrai.
    return {
      ok: false,
      raison: "refuse",
      detail: "La déclaration menée en parallèle n'a pas abouti.",
    };
  }

  /** Annule la réservation : à n'appeler que si RIEN n'est parti. */
  const rendreReservation = () =>
    admin
      .from("invoices")
      .update({ superpdp_encaisse_at: null })
      .eq("id", invoiceId)
      .eq("user_id", workspaceId)
      .eq("superpdp_encaisse_at", horodatage)
      .then(
        () => undefined,
        () => undefined
      );

  try {
    const res = await superpdpFetch(workspaceId, "/invoice_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(facture.superpdp_invoice_id),
        status_code: "fr:212",
        // Corps minimal par défaut : la plateforme calcule alors elle-même la
        // ventilation par taux à partir de la facture qu'elle connaît déjà. On
        // ne pose `details` que pour porter la date d'encaissement, et
        // seulement avec un bloc MEN complet — un bloc partiel désactive son
        // calcul sans satisfaire BR-FR-CDV-14.
        ...(blocMen ? { details: [{ reported_data: [blocMen] }] } : {}),
      }),
    });

    // Refus explicite de la plateforme : la réponse est arrivée, donc on SAIT
    // qu'aucun événement n'a été créé. La réservation se rend sans risque, et
    // l'utilisateur pourra réessayer.
    if (!res.ok) {
      // 1500 et non 500 : les règles de gestion de la nomenclature (BR-FR-CDV-*)
      // sont citées in extenso dans le message, et c'est justement la fin qui
      // dit ce qu'il faut envoyer. Tronquer à 500 coupait la règle en deux.
      const detail = (await res.text()).slice(0, 1500);
      console.error(`[superpdp/encaissement] ${invoiceId} : HTTP ${res.status} ${detail.slice(0, 300)}`);
      await rendreReservation();
      return { ok: false, raison: "refuse", detail };
    }

    // Rien à écrire : c'est fait depuis la réservation.
    return { ok: true };
  } catch (err) {
    // Ces deux-là sont levées AVANT tout envoi, par `superpdpFetch` lui-même :
    // rien n'est parti, la réservation se rend.
    if (err instanceof SuperPdpNotConnected) {
      await rendreReservation();
      return { ok: false, raison: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      await rendreReservation();
      return { ok: false, raison: "verification_en_cours" };
    }

    // Tout le reste — coupure réseau, délai dépassé, réponse illisible — laisse
    // le sort de l'appel inconnu. On GARDE la réservation, délibérément :
    // rejouer un `fr:212` qui serait déjà passé ferait partir une seconde
    // déclaration de paiement au PPF pour le même encaissement, ce qu'aucun
    // écran ne rattrape. Une facture marquée encaissée à tort se corrige ; une
    // déclaration fiscale en double, non.
    console.error("[superpdp/encaissement]", err instanceof Error ? err.message : err);
    return {
      ok: false,
      raison: "incertain",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
