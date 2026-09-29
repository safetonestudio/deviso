import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { lireEntreprise } from "@/lib/superpdp-entreprise";
import { getWorkspaceProfile } from "@/lib/workspace";
import { resolveVatNumber } from "@/lib/facturx-helpers";
import { paysFrancais } from "@/lib/superpdp-nature";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Achats internationaux, e-reporting des acquisitions auprès de fournisseurs
 * étrangers (endpoint b2bint_invoices, direction "in").
 *
 * Pourquoi ce module existe. La réforme n'impose pas seulement de déclarer nos
 * VENTES : une entreprise française qui achète un bien ou un service à un
 * fournisseur établi hors de France doit aussi déclarer cette ACQUISITION
 * (e-reporting des transactions internationales). Nos ventes passent par
 * `/invoices` avec `processing_rule=B2BInt` ; les achats, eux, n'ont pas de
 * document que nous émettons, nous recevons la facture du fournisseur. Le seul
 * canal pour les déclarer est `POST /b2bint_invoices` avec `direction: "in"`,
 * où le vendeur est le fournisseur étranger et l'acheteur, nous.
 */

/** Catégorie de l'opération : la réforme ne gère pas les factures mixtes. */
export type CategorieAchat = "biens" | "services";

/** Un achat international tel qu'il est stocké (table superpdp_achats_int). */
export interface AchatInternational {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  fournisseur_nom: string;
  fournisseur_pays: string;
  fournisseur_tva: string | null;
  numero: string | null;
  date_facture: string;
  categorie: CategorieAchat;
  devise: string;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  superpdp_id: number | null;
  transmission_status: "en_attente" | "transmis" | "echec" | "action_requise";
  transmission_error: string | null;
  transmitted_at: string | null;
  retry_count: number;
}

/** Ce que le formulaire fournit pour créer un achat (avant stockage). */
export interface SaisieAchat {
  fournisseur_nom: string;
  fournisseur_pays: string;
  fournisseur_tva?: string | null;
  numero?: string | null;
  date_facture: string;
  categorie: CategorieAchat;
  devise?: string | null;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
}

// ─────────────────────────── Validation ───────────────────────────

/** Montant à deux décimales, format attendu par l'API (chaîne « 1000.00 »). */
export function montantStr(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Le numéro que porte la déclaration : celui de la facture du fournisseur, ou à
 * défaut notre propre référence. Défini une seule fois pour que la construction
 * du payload et le contrôle d'idempotence (réessai) parlent du même numéro.
 */
export function numeroDeclaration(achat: { numero: string | null; id: string }): string {
  return achat.numero?.trim() || `ACHAT-${achat.id.slice(0, 8)}`;
}

/**
 * Contrôle la saisie AVANT stockage et transmission, en français.
 *
 * On refuse ce qui rendrait la déclaration fausse ou impossible plutôt que de
 * laisser la Plateforme Agréée renvoyer un code brut : un pays français sur un
 * achat « international » n'a pas de sens (ce serait un achat national, hors de
 * ce circuit), un montant de TVA incohérent avec le taux fausse la déclaration.
 */
export function validerSaisie(s: Partial<SaisieAchat>): string[] {
  const manques: string[] = [];

  if (!s.fournisseur_nom?.trim()) manques.push("le nom du fournisseur");

  const pays = (s.fournisseur_pays ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(pays)) {
    manques.push("le pays du fournisseur (code à deux lettres)");
  } else if (paysFrancais(pays)) {
    manques.push(
      "un pays étranger : un achat auprès d'un fournisseur français n'est pas un achat international"
    );
  }

  if (!s.date_facture || Number.isNaN(Date.parse(s.date_facture))) {
    manques.push("la date de la facture");
  }

  if (s.categorie !== "biens" && s.categorie !== "services") {
    manques.push("la nature de l'achat (biens ou services)");
  }

  const ht = Number(s.montant_ht);
  if (!Number.isFinite(ht) || ht <= 0) manques.push("un montant HT valide");

  const tva = Number(s.montant_tva);
  if (!Number.isFinite(tva) || tva < 0) manques.push("un montant de TVA valide");

  const taux = Number(s.taux_tva);
  if (!Number.isFinite(taux) || taux < 0) manques.push("un taux de TVA valide");

  // Cohérence taux / montant : un taux nul avec de la TVA, ou l'inverse, est
  // presque toujours une erreur de saisie qui fausserait la déclaration.
  if (Number.isFinite(ht) && Number.isFinite(tva) && Number.isFinite(taux)) {
    const attendu = Math.round(ht * (taux / 100) * 100) / 100;
    if (Math.abs(attendu - Math.round(tva * 100) / 100) > 0.02) {
      manques.push(
        `un montant de TVA cohérent avec le taux (${taux}% de ${montantStr(ht)} = ${montantStr(attendu)})`
      );
    }
  }

  return manques;
}

// ───────────────────── Construction du payload b2bint ─────────────────────

/**
 * Notre entreprise telle que la Plateforme Agréée nous connaît, côté acheteur.
 *
 * `number` / `country` viennent de `/companies/me` (ce que la PA a enregistré,
 * pas ce que l'utilisateur a saisi, c'est ce qui fait foi, exactement comme à
 * l'émission d'une vente). Le n° de TVA vient du profil, calculé au besoin.
 */
export interface NotreIdentite {
  number: string;
  scheme_id: string;
  country: string;
  vat: string | null;
}

/** ICD 0002 = SIRENE (répertoire des entreprises françaises), schéma du SIREN. */
const SCHEME_SIREN = "0002";

/**
 * Schéma d'identification d'un vendeur étranger par son numéro de TVA.
 *
 * `POST /b2bint_invoices` exige, pour le vendeur, un `company_id` ET son
 * `company_id_scheme_id` (constaté en bac à sable le 28/09/2026 : sans eux,
 * 400 « missing seller company_id[_scheme_id] for b2bint invoice »). Le seul
 * identifiant stable dont nous disposons pour un fournisseur étranger est son
 * numéro de TVA intracommunautaire ; le schéma correspondant est le code EAS
 * Peppol du pays (« Electronic Address Scheme », liste officielle
 * docs.peppol.eu et liste EAS de l'UE).
 *
 * On n'inscrit ici que des codes explicitement libellés « <pays> VAT number »
 * (ou l'équivalent national reconnu). Un pays absent de cette table n'est pas
 * transmis : l'achat reste en attente plutôt que de partir avec un schéma faux,
 * qui serait rejeté par la Plateforme Agréée. DK, FI et le hors-UE ne sont pas
 * encore couverts (schéma non confirmé), volontairement.
 *
 * Les 16 codes ci-dessous ont été vérifiés le 28/09/2026 sur la liste EAS
 * Peppol (croisement de deux sources). Deux pièges évités :
 *  - Italie : 0211 = Partita IVA (n° de TVA). NE PAS « corriger » en 0210, qui
 *    est le Codice Fiscale (code fiscal), un identifiant différent.
 *  - Espagne, Autriche : identifiés par le schéma fiscal national (Agencia
 *    Tributaria / USt-IdNr.), il n'existe pas de code EAS « Spain/Austria VAT
 *    number » distinct.
 * Reste à confirmer à la bascule prod, quand PPF validera vraiment le schéma :
 * la forme exacte de l'identifiant (n° de TVA avec ou sans préfixe pays) par
 * schéma. Le bac à sable a accepté la forme préfixée (« DE811569869 »).
 */
const EAS_TVA_PAR_PAYS: Record<string, string> = {
  AT: "9914", // Autriche (USt-IdNr.)
  BE: "9925", // Belgique (VAT number)
  CZ: "9929", // Tchéquie (VAT number)
  DE: "9930", // Allemagne (VAT number)
  ES: "9920", // Espagne (Agencia Tributaria, identifiant fiscal)
  FR: "9957", // France (VAT number)
  GR: "9933", // Grèce (VAT number)
  HU: "9910", // Hongrie (VAT number)
  IE: "9935", // Irlande (VAT number)
  IT: "0211", // Italie : Partita IVA (VAT). PAS 0210 = Codice Fiscale.
  LU: "9938", // Luxembourg (VAT number)
  NL: "9944", // Pays-Bas (VAT number)
  PL: "9945", // Pologne (VAT number)
  PT: "9946", // Portugal (VAT number)
  RO: "9947", // Roumanie (VAT number)
  SE: "9955", // Suède (VAT number)
};

/** Code EAS du schéma « n° de TVA » pour un pays (ISO 2 lettres), ou null. */
export function schemaTvaPays(pays: string | null | undefined): string | null {
  const p = (pays ?? "").trim().toUpperCase();
  return EAS_TVA_PAR_PAYS[p] ?? null;
}

/** Normalise un n° de TVA pour servir d'identifiant (majuscules, sans espaces). */
function normaliserTva(tva: string | null | undefined): string {
  return (tva ?? "").replace(/\s+/g, "").toUpperCase();
}

export async function lireNotreIdentite(workspaceId: string): Promise<NotreIdentite | null> {
  const entreprise = await lireEntreprise(workspaceId);
  if (!entreprise) return null;

  const profil = await getWorkspaceProfile<{
    siret: string | null;
    tva_number: string | null;
    tva_regime: string | null;
  }>(workspaceId, "siret, tva_number, tva_regime");

  // `siret` est la colonne du profil (SIRET ou SIREN saisi) ; resolveVatNumber
  // en dérive le SIREN 9 chiffres pour calculer le n° de TVA au besoin.
  const vat = profil
    ? resolveVatNumber(profil.tva_number, profil.siret, profil.tva_regime === "franchise").value
    : null;

  return {
    number: entreprise.number,
    scheme_id: SCHEME_SIREN,
    country: entreprise.country || "FR",
    vat,
  };
}

/**
 * Construit le corps de `POST /b2bint_invoices` pour un achat (direction "in").
 *
 * Le vendeur est le fournisseur étranger, l'acheteur est nous. La forme reprend
 * exactement celle validée en bac à sable (champs `required` du schéma
 * b2bint_invoice) : `direction`, `number`, `issue_date`, `business_process`,
 * `seller`, `buyer`, `tax_due_date_type_code`, `notes`, `tax_subtotals`, `total`.
 *
 * Catégorie de TVA : une TVA facturée par le fournisseur (montant > 0) est
 * déclarée « S » au taux correspondant ; une acquisition en autoliquidation
 * (montant nul, cas le plus fréquent des services intra-UE) est déclarée « AE »
 * avec le motif d'exonération EN 16931 correspondant.
 */
export function construirePayloadB2bint(
  achat: Pick<
    AchatInternational,
    | "fournisseur_pays"
    | "fournisseur_tva"
    | "numero"
    | "date_facture"
    | "devise"
    | "montant_ht"
    | "montant_tva"
    | "taux_tva"
    | "id"
  >,
  nous: NotreIdentite,
  // Code EAS du schéma de TVA du fournisseur (voir EAS_TVA_PAR_PAYS). Résolu et
  // garanti non vide par l'appelant (transmettreAchat), qui garde l'achat en
  // attente si le pays n'est pas couvert plutôt que d'envoyer un schéma faux.
  schemaVendeur: string
) {
  const ht = montantStr(achat.montant_ht);
  const tva = montantStr(achat.montant_tva);
  const autoliquidation = achat.montant_tva <= 0;

  // Le vendeur (fournisseur étranger) doit porter un `company_id` et son
  // `company_id_scheme_id`, tous deux exigés par l'API. Faute d'autre
  // identifiant, on l'identifie par son n° de TVA sous le schéma EAS du pays.
  const tvaVendeur = normaliserTva(achat.fournisseur_tva);
  const seller: Record<string, unknown> = {
    country: achat.fournisseur_pays,
    company_id: tvaVendeur,
    company_id_scheme_id: schemaVendeur,
  };
  if (tvaVendeur) {
    seller.tax_registration_id = tvaVendeur;
    seller.tax_registration_id_qualifying_id = "VA";
  }

  const buyer: Record<string, unknown> = {
    country: nous.country,
    company_id: nous.number,
    company_id_scheme_id: nous.scheme_id,
  };
  if (nous.vat) {
    buyer.tax_registration_id = nous.vat;
    buyer.tax_registration_id_qualifying_id = "VA";
  }

  const tax_category: Record<string, unknown> = autoliquidation
    ? {
        code: "AE",
        percent: "0.00",
        exemption_reason_code: "VATEX-EU-AE",
        exemption_reason: "Autoliquidation",
      }
    : { code: "S", percent: montantStr(achat.taux_tva) };

  return {
    data: [
      {
        direction: "in",
        // Numéro de la facture du fournisseur ; à défaut, notre propre
        // référence, pour que la déclaration soit toujours identifiable.
        number: numeroDeclaration(achat),
        issue_date: achat.date_facture,
        currency_code: achat.devise,
        // Code type de document (BT-3, UNTDID 1001), requis par l'API depuis le
        // 28/09/2026. Un achat déclaré est toujours la facture commerciale reçue
        // du fournisseur : 380. (Son absence renvoyait un 500, désormais un 400
        // « missing type_code for b2bint invoice ».)
        type_code: "380",
        business_process: { id: "B1", type_id: "urn:cen.eu:en16931:2017" },
        seller,
        buyer,
        tax_due_date_type_code: "72",
        notes: [] as string[],
        tax_subtotals: [{ taxable_amount: ht, tax_amount: tva, tax_category }],
        total: {
          currency_code: achat.devise,
          tax_exclusive_amount: ht,
          tax_amount: tva,
        },
      },
    ],
  };
}

// ─────────────────────────── Transmission ───────────────────────────

/**
 * Suite a donner a un echec de transmission :
 *  - "reessayer" : incident transitoire (raccordement, reseau, 5xx, TVA a
 *    ajouter). L'achat reste en_attente, le cron retentera.
 *  - "action_requise" : rien qu'un reessai automatique ne changera (date hors
 *    delai de declaration, pays non pris en charge). Etat terminal, l'humain agit.
 *  - "refuse" : refus de contenu par la Plateforme Agreee, saisie a corriger.
 */
export type SuiteEchec = "reessayer" | "action_requise" | "refuse";
export type ResultatTransmission =
  | { ok: true; superpdpId: number | null }
  | { ok: false; suite: SuiteEchec; message: string; detail: string };

/** Statut de base stocke pour chaque suite d'echec. */
const STATUT_PAR_SUITE: Record<SuiteEchec, "en_attente" | "action_requise" | "echec"> = {
  reessayer: "en_attente",
  action_requise: "action_requise",
  refuse: "echec",
};

/**
 * Au-dela de ce nombre de tentatives automatiques, un achat reste "en attente"
 * ne se debloquera pas seul (raccordement jamais fait, TVA jamais ajoutee, cas
 * futile inconnu) : le cron le bascule en action_requise pour qu'il cesse de
 * boucler en silence et apparaisse a l'utilisateur. Cron horaire => ~7 jours.
 */
const SEUIL_ABANDON = 168;

/**
 * Un refus qui ne vient pas de notre payload, mais d'une règle de période ou
 * d'un incident serveur : on garde alors l'achat en attente et on retentera.
 *
 * Historique : jusqu'au 28/09/2026, `POST /b2bint_invoices` répondait 500 sur
 * les dates récentes, ce qu'on avait pris pour une règle de fenêtre du bac à
 * sable. La cause réelle était un champ requis manquant, `type_code` : Super
 * PDP a corrigé l'endpoint (500 -> 400 « missing type_code ») et nous l'avons
 * ajouté au payload (voir construirePayloadB2bint). Restent des refus
 * légitimes de période (« is in the future », « cannot add invoice at date »)
 * et d'éventuels 5xx transitoires : dans ces cas on n'accuse JAMAIS « échec »
 * une saisie correcte, on retente.
 */
function classerRefus(status: number, message: string, dateFacture: string): SuiteEchec {
  if (status >= 500) return "reessayer"; // incident serveur transitoire
  const m = message.toLowerCase();
  const erreurDeFenetre =
    /cannot add invoice at date|is in the future|dans le futur|future|period|période|fenêtre|hors délai|too old|closed/.test(
      m
    );
  if (erreurDeFenetre) {
    // Le discriminant n'est PAS le texte (fragile, non contractuel) mais la
    // position de la date : une date future entrera dans la fenetre (on
    // retente), une date passee hors fenetre n'y reviendra jamais (action requise).
    const aujourdhui = new Date().toISOString().slice(0, 10);
    return dateFacture > aujourdhui ? "reessayer" : "action_requise";
  }
  return "refuse";
}

/**
 * Transmet un achat à la Plateforme Agréée (e-reporting d'acquisition).
 *
 * Best-effort : l'appelant a déjà stocké l'achat. Cette fonction ne fait
 * qu'essayer de le déclarer et rend un verdict que la route traduit en statut
 * (`transmis`, `en_attente` pour un réessai, `echec` pour un vrai refus).
 */
export async function transmettreAchat(
  workspaceId: string,
  achat: AchatInternational
): Promise<ResultatTransmission> {
  let nous: NotreIdentite | null;
  try {
    nous = await lireNotreIdentite(workspaceId);
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return { ok: false, suite: "reessayer", message: "Compte non raccordé à la Plateforme Agréée.", detail: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { ok: false, suite: "reessayer", message: "Vérification du raccordement en cours.", detail: "session_pending" };
    }
    throw err;
  }

  if (!nous) {
    return {
      ok: false,
      suite: "reessayer",
      message: "Impossible de lire votre fiche entreprise chez la Plateforme Agréée.",
      detail: "identite_illisible",
    };
  }

  // L'API exige un `company_id` + `company_id_scheme_id` pour le vendeur. On
  // identifie le fournisseur étranger par son n° de TVA sous le schéma EAS de
  // son pays. Sans TVA, ou pour un pays dont le schéma n'est pas encore
  // vérifié, on ne transmet pas : l'achat reste en attente avec un message
  // clair, plutôt que de partir avec une identité fausse. Best-effort, jamais
  // « échec » : une saisie à compléter n'est pas une saisie fautive.
  if (!normaliserTva(achat.fournisseur_tva)) {
    return {
      ok: false,
      suite: "reessayer",
      message:
        "Le numéro de TVA du fournisseur est nécessaire pour déclarer cet achat. " +
        "Ajoutez-le : la déclaration repartira automatiquement.",
      detail: "tva_fournisseur_absente",
    };
  }
  const schemaVendeur = schemaTvaPays(achat.fournisseur_pays);
  if (!schemaVendeur) {
    return {
      ok: false,
      suite: "action_requise",
      message:
        "La déclaration des achats auprès de ce pays n'est pas prise en charge. " +
        "Contactez le support pour l'ajouter : un réessai automatique n'y changera rien.",
      detail: `pays_non_pris_en_charge:${(achat.fournisseur_pays ?? "").toUpperCase()}`,
    };
  }

  const payload = construirePayloadB2bint(achat, nous, schemaVendeur);

  try {
    const res = await superpdpFetch(workspaceId, "/b2bint_invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const texte = await res.text();

    if (res.ok) {
      let superpdpId: number | null = null;
      try {
        const body = JSON.parse(texte) as { data?: { id?: number }[]; id?: number };
        superpdpId = body.data?.[0]?.id ?? body.id ?? null;
      } catch {
        // 200 sans corps lisible : la déclaration est passée, l'identifiant nous
        // échappe. On la considère transmise plutôt que de la renvoyer en double.
      }
      return { ok: true, superpdpId };
    }

    let message = texte.slice(0, 300);
    try {
      const ko = JSON.parse(texte) as { message?: string };
      if (ko.message) message = ko.message;
    } catch {
      /* réponse non JSON : on garde le texte brut */
    }

    const suite = classerRefus(res.status, message, achat.date_facture);
    const messages: Record<SuiteEchec, string> = {
      reessayer:
        "La Plateforme Agréée n'accepte pas encore cette déclaration (fenêtre de déclaration). L'achat est conservé et sera retransmis automatiquement.",
      action_requise:
        "Cette facture est hors du délai de déclaration accepté par la Plateforme Agréée. À régulariser avec votre comptable : un réessai automatique ne la fera pas passer.",
      refuse: `La Plateforme Agréée a refusé la déclaration : ${message}`,
    };
    return {
      ok: false,
      suite,
      message: messages[suite],
      detail: `[${res.status}] ${message}`.slice(0, 900),
    };
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return { ok: false, suite: "reessayer", message: "Compte non raccordé à la Plateforme Agréée.", detail: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { ok: false, suite: "reessayer", message: "Vérification du raccordement en cours.", detail: "session_pending" };
    }
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      suite: "reessayer",
      message: "La transmission a échoué pour une raison technique. L'achat est conservé et sera retransmis.",
      detail: detail.slice(0, 900),
    };
  }
}

// ─────────────────────── Réessai automatique (cron) ───────────────────────

/**
 * Le patch de statut à partir d'un verdict de transmission. Une seule règle,
 * partagée par la route de saisie et le réessai, pour qu'ils ne divergent pas.
 */
export function patchStatut(resultat: ResultatTransmission) {
  return resultat.ok
    ? {
        transmission_status: "transmis" as const,
        superpdp_id: resultat.superpdpId,
        transmission_error: null,
        transmitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : {
        transmission_status: STATUT_PAR_SUITE[resultat.suite],
        // On persiste le message lisible (affiché sous le badge), pas le detail
        // technique : l'utilisateur doit savoir quoi faire, pas lire un code HTTP.
        transmission_error: resultat.message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      };
}

/**
 * Numéros de déclaration d'achat déjà présents chez la Plateforme Agréée pour
 * ce compte (direction "in"), avec leur identifiant.
 *
 * Sert de garde d'idempotence au réessai : si une coupure réseau est survenue
 * APRÈS un 200, l'achat est resté « en attente » chez nous alors que la
 * déclaration existe déjà chez eux. Retransmettre en aveugle créerait un
 * doublon de déclaration fiscale. On regarde donc d'abord ce qui existe.
 */
async function numerosDejaDeclares(workspaceId: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const res = await superpdpFetch(workspaceId, "/b2bint_invoices?limit=1000");
    if (!res.ok) return map;
    const body = JSON.parse(await res.text()) as {
      data?: { id?: number; number?: string; direction?: string }[];
    };
    for (const it of body.data ?? []) {
      if (it.number && typeof it.id === "number" && (it.direction ?? "in") === "in" && !map.has(it.number)) {
        map.set(it.number, it.id);
      }
    }
  } catch {
    // Compte injoignable ou réponse illisible : carte vide, le réessai suivra
    // son cours normal (au pire un « en attente » de plus, jamais un doublon).
  }
  return map;
}

/**
 * Réessaie toutes les déclarations d'achat restées « en attente ».
 *
 * Appelée par le cron horaire : l'utilisateur n'a pas à revenir cliquer
 * « Retransmettre ». Sûr contre les doublons : un achat « en attente » n'a
 * jamais reçu de 200 (un 200 le marque « transmis »), et avant toute
 * retransmission on vérifie que son numéro n'est pas déjà déclaré. On ne touche
 * jamais aux « transmis » ni aux « echec » (refus réel, qui demande une
 * correction de saisie, pas un énième essai identique).
 */
export async function retenterAchatsEnAttente(
  admin: SupabaseClient,
  limite = 200
): Promise<{ examines: number; transmis: number; encore: number; echecs: number; abandonnes: number }> {
  const { data: achats } = await admin
    .from("superpdp_achats_int")
    .select("*")
    .eq("transmission_status", "en_attente")
    .order("updated_at", { ascending: true })
    .limit(limite);

  let transmis = 0;
  let encore = 0;
  let echecs = 0;
  let abandonnes = 0;
  const cacheNumeros = new Map<string, Map<string, number>>();

  for (const brut of achats ?? []) {
    const achat = brut as AchatInternational;
    const ws = achat.user_id;

    if (!cacheNumeros.has(ws)) cacheNumeros.set(ws, await numerosDejaDeclares(ws));
    const dejaMap = cacheNumeros.get(ws)!;
    const num = numeroDeclaration(achat);

    let resultat: ResultatTransmission;
    if (dejaMap.has(num)) {
      // Déjà déclaré (200 perdu en route) : on ne recrée pas, on réconcilie.
      resultat = { ok: true, superpdpId: dejaMap.get(num) ?? null };
    } else {
      resultat = await transmettreAchat(ws, achat);
    }

    let patch: Record<string, unknown> = patchStatut(resultat);
    if (resultat.ok) {
      transmis++;
    } else if (resultat.suite === "reessayer") {
      // Garde d'abandon : au-dela de SEUIL_ABANDON tentatives, on cesse de
      // boucler et on bascule en action_requise (attrape toute la classe des
      // "en_attente" qui ne se resoudront jamais seuls, pas un cas nomme).
      const tentatives = (achat.retry_count ?? 0) + 1;
      if (tentatives >= SEUIL_ABANDON) {
        patch = {
          transmission_status: "action_requise",
          transmission_error: `Non déclaré automatiquement après ${tentatives} tentatives. ${resultat.message}`.slice(0, 1000),
          retry_count: tentatives,
          updated_at: new Date().toISOString(),
        };
        abandonnes++;
      } else {
        patch = { ...patch, retry_count: tentatives };
        encore++;
      }
    } else if (resultat.suite === "action_requise") {
      abandonnes++;
    } else {
      echecs++;
    }

    await admin.from("superpdp_achats_int").update(patch).eq("id", achat.id).eq("user_id", ws);
  }

  return { examines: (achats ?? []).length, transmis, encore, echecs, abandonnes };
}
