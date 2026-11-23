import { arrondi2, tvaSurBase } from "@/lib/montants";
import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { lireEntreprise } from "@/lib/superpdp-entreprise";
import { getWorkspaceProfile } from "@/lib/workspace";
import { resolveVatNumber } from "@/lib/facturx-helpers";
import { paysFrancais } from "@/lib/superpdp-nature";
import { cadreFacturation } from "@/lib/cadre-facturation";
import { estCompteDemo } from "@/lib/garde-demo";
import { estNatureTva, estTauxFrancais, estImportation, motifHorsChamp, natureTva, PAYS_UE, TAUX_FRANCAIS, type NatureTva } from "@/lib/achats-tva";
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
  /** Nature de la TVA de la facture (lib/achats-tva.ts) ; NULL = achat saisi avant ce choix. */
  tva_facturee: NatureTva | null;
  /** Taux français de l'autoliquidation (défaut 20). */
  taux_autoliquidation: number;
  superpdp_id: number | null;
  /** hors_champ : achat hors du périmètre de l'e-reporting (lib/achats-tva.ts, motifHorsChamp), jamais transmis. */
  transmission_status: "en_attente" | "transmis" | "echec" | "action_requise" | "hors_champ";
  /** Avoir du fournisseur : montants positifs, écriture et déclaration en sens inverse. */
  est_avoir: boolean;
  transmission_error: string | null;
  transmitted_at: string | null;
  retry_count: number;
  /**
   * Identifiant de l'e-reporting envoye au PPF. Null tant que la Plateforme
   * Agreee n'a pas reellement envoye la declaration a l'administration : un
   * achat « transmis » sans cet identifiant est ENREGISTRE, pas DECLARE.
   */
  ppf_ereporting_id: number | null;
  declared_at: string | null;
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
  tva_facturee?: NatureTva | null;
  taux_autoliquidation?: number | null;
  est_avoir?: boolean | null;
}

// ─────────────────────────── Validation ───────────────────────────

/** Montant à deux décimales, format attendu par l'API (chaîne « 1000.00 »). */
export function montantStr(n: number): string {
  return arrondi2(n).toFixed(2);
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

  // Code ISO à trois lettres : « US$ » ou « EURO » rendaient la conversion en
  // euros de la comptabilité impossible (lib/achats-export.ts).
  const devise = (s.devise ?? "EUR").trim().toUpperCase() || "EUR";
  if (!/^[A-Z]{3}$/.test(devise)) manques.push("une devise en code à trois lettres (EUR, USD, GBP…)");

  const ht = Number(s.montant_ht);
  if (!Number.isFinite(ht) || ht <= 0) manques.push("un montant HT valide");

  const tva = Number(s.montant_tva);
  if (!Number.isFinite(tva) || tva < 0) manques.push("un montant de TVA valide");

  const taux = Number(s.taux_tva);
  if (!Number.isFinite(taux) || taux < 0) manques.push("un taux de TVA valide");

  // Cohérence taux / montant : un taux nul avec de la TVA, ou l'inverse, est
  // presque toujours une erreur de saisie qui fausserait la déclaration.
  if (Number.isFinite(ht) && Number.isFinite(tva) && Number.isFinite(taux)) {
    const attendu = tvaSurBase(ht, taux);
    if (Math.abs(attendu - arrondi2(tva)) > 0.02) {
      manques.push(
        `un montant de TVA cohérent avec le taux (${taux}% de ${montantStr(ht)} = ${montantStr(attendu)})`
      );
    }
  }

  // Nature de la TVA (21/11/2026) : elle doit dire la même chose que les
  // montants, sinon la comptabilité et la déclaration se contrediraient.
  if (s.tva_facturee === undefined || s.tva_facturee === null) {
    manques.push("la TVA de la facture (aucune, aucune hors de France, française ou étrangère)");
  } else {
    if (!estNatureTva(s.tva_facturee)) {
      manques.push("la TVA de la facture (aucune, aucune hors de France, française ou étrangère)");
    } else if (s.tva_facturee === "aucune" || s.tva_facturee === "hors_france") {
      if (Number.isFinite(tva) && tva !== 0) manques.push("un montant de TVA nul : la facture ne porte pas de TVA (autoliquidation)");
    } else if (Number.isFinite(tva) && !(tva > 0)) {
      manques.push(`un montant de TVA : la facture porte une TVA ${s.tva_facturee === "francaise" ? "française" : "étrangère"}`);
    }
    if (s.tva_facturee === "francaise" && Number.isFinite(taux) && !estTauxFrancais(taux)) {
      manques.push(`un taux de TVA française (${TAUX_FRANCAIS.join(", ")} %)`);
    }
  }
  if (s.taux_autoliquidation !== undefined && s.taux_autoliquidation !== null && !estTauxFrancais(s.taux_autoliquidation)) {
    manques.push(`un taux français d'autoliquidation (${TAUX_FRANCAIS.join(", ")} %)`);
  }

  return manques;
}

/**
 * Colonnes de TVA à enregistrer depuis une saisie validée. Sans nature
 * fournie (ancien client de l'API), on la déduit du montant comme avant.
 */
export function champsTva(s: Partial<SaisieAchat>) {
  return {
    tva_facturee: natureTva({ tva_facturee: s.tva_facturee ?? null, montant_tva: Number(s.montant_tva) }),
    taux_autoliquidation: s.taux_autoliquidation != null ? Number(s.taux_autoliquidation) : 20,
    est_avoir: s.est_avoir === true,
  };
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

/**
 * Identifiant du vendeur (le fournisseur étranger) dans l'e-reporting d'achat.
 *
 * `POST /b2bint_invoices` exige, pour le vendeur, un `company_id` ET son
 * `company_id_scheme_id` (constaté en bac à sable le 28/09/2026 et le
 * 03/11/2026 : sans eux, 400 « missing seller company_id[_scheme_id] for
 * b2bint invoice »). Le bac à sable accepte n'importe quel schéma : la règle
 * vient donc des textes, pas des essais.
 *
 * Source : spécifications externes DGFiP v3.2 (impots.gouv.fr,
 * « specifications-externes-b2b », paquet du 30/04/2026), relues le 23/11/2026.
 *  - Annexe 7 (règles de gestion v1.9), règle G2.19 « Identifiant du Vendeur et
 *    de l'Acheteur » : l'identifiant du vendeur (TT-33-1) est qualifié par l'un
 *    des schémas ICD 6523 suivants, et seulement eux :
 *      0002 : SIREN sur 9 caractères numériques ;
 *      0223 : UE_HORS_FRANCE, « correspond à l'identifiant de TVA
 *             intracommunautaire », 18 caractères au maximum ;
 *      0227 : HORS_UE (dont Wallis et Futuna), « correspond au code Pays et les
 *             16 premiers caractères de la raison sociale », 18 caractères au
 *             maximum ;
 *      0228 : RIDET, 0229 : TAHITI (sans objet ici : fournisseurs étrangers).
 *  - Annexe 6 (format e-reporting v1.10), TT-33-1 : mêmes valeurs ; TT-33 :
 *    18 caractères.
 *  - Annexe 7, onglet des listes de codes, ISO 6523 0227 : « It starts with 2
 *    characters which must be the Country code of country where the company is
 *    registered - Followed with the first 16 Characters of the company
 *    registered name ». 0223 : commence par le code pays d'un État membre.
 *  - Annexe 7, règle G2.33 : schéma 0002 ou 0223 => le n° de TVA du vendeur
 *    (TT-34) doit être systématiquement renseigné.
 *  - Annexe 7, règle G1.65 : un vendeur assujetti à la TVA en France donne son
 *    SIREN (d'où 0002 pour un fournisseur étranger immatriculé à la TVA
 *    française).
 *
 * Jusqu'au 23/11/2026, Deviso envoyait le code EAS Peppol « VAT number » du pays
 * (9930 pour l'Allemagne, etc.) et 9999 hors UE : aucun de ces codes ne figure
 * dans la liste de G2.19.
 *
 * Ce que le texte ne tranche PAS, et que ce code ne devine donc pas : la
 * normalisation de la raison sociale (majuscules, espaces, accents,
 * ponctuation). Le texte dit « les 16 premiers caractères » et, dans la liste
 * de codes, que l'identifiant est « alphanumeric », sans définir ce mot ni
 * prévoir de transformation. On prend donc la raison sociale telle que saisie,
 * débarrassée seulement des espaces de début et de fin, et on en garde les 16
 * premiers caractères, sans changer la casse ni retirer d'espace intérieur. Si
 * l'administration refusait un espace ou un accent, le refus remonterait comme
 * tel sur l'achat (« refusé, à corriger »), il ne serait pas silencieux.
 */
export const SCHEMA_SIREN = "0002";
export const SCHEMA_UE_HORS_FRANCE = "0223";
export const SCHEMA_HORS_UE = "0227";
/** Longueur maximale de l'identifiant pour 0223 et 0227 (G2.19, TT-33). */
const LONGUEUR_MAX_IDENTIFIANT = 18;
/** Nombre de caractères de la raison sociale repris pour 0227 (G2.19). */
const CARACTERES_RAISON_SOCIALE = 16;

/** Identité du vendeur à déclarer, ou la raison pour laquelle on ne peut pas la construire. */
export type IdentiteVendeur =
  | { ok: true; company_id: string; scheme_id: string; tva: string | null }
  | { ok: false; detail: "tva_absente" | "tva_invalide" | "identite_incomplete"; message: string };

/** Préfixe de TVA d'un État membre : la Grèce utilise EL, pas GR. */
const prefixeTvaUe = (pays: string) => (pays === "GR" ? "EL" : pays);

/**
 * Construit l'identifiant du vendeur selon G2.19.
 *
 * Ordre de décision :
 *  1. n° de TVA française (préfixe FR) : SIREN, schéma 0002 (G1.65), le SIREN
 *     étant les 9 derniers chiffres du n° de TVA français ;
 *  2. n° de TVA d'un autre État membre (préfixe de l'État, EL pour la Grèce) :
 *     schéma 0223, identifiant = le n° de TVA. C'est l'État qui a attribué le
 *     numéro qui compte, pas le pays d'établissement ;
 *  3. fournisseur établi dans l'UE dont le n° est saisi sans préfixe : on y
 *     ajoute le préfixe de son pays (forme du n° de TVA intracommunautaire,
 *     que la liste de codes 0223 impose) ; sans n° du tout, on ne peut pas
 *     déclarer (0223 suppose le n° de TVA, G2.33 l'exige) ;
 *  4. fournisseur établi hors UE : schéma 0227, identifiant = code pays + 16
 *     premiers caractères de la raison sociale. Son éventuel identifiant fiscal
 *     local n'entre pas dans l'identifiant et n'est pas présenté comme une TVA.
 */
export function identiteVendeur(
  pays: string | null | undefined,
  tva: string | null | undefined,
  raisonSociale: string | null | undefined
): IdentiteVendeur {
  const p = (pays ?? "").trim().toUpperCase();
  const numero = normaliserTva(tva);
  const prefixe = numero.slice(0, 2);

  if (prefixe === "FR") {
    const m = numero.match(/^FR[0-9A-Z]{2}(\d{9})$/);
    if (!m) {
      return {
        ok: false,
        detail: "tva_invalide",
        message: "Le n° de TVA français du fournisseur est illisible (attendu : FR, deux caractères de clé, puis les 9 chiffres du SIREN).",
      };
    }
    return { ok: true, company_id: m[1], scheme_id: SCHEMA_SIREN, tva: numero };
  }

  // Préfixe d'un État membre (EL pour la Grèce ; GR n'est pas un préfixe de TVA).
  const etatUe = PAYS_UE.includes(prefixe) && prefixe !== "GR";
  const paysUe = PAYS_UE.includes(p);
  if (etatUe || paysUe) {
    if (!numero) {
      return {
        ok: false,
        detail: "tva_absente",
        message: "Ajoutez le n° de TVA intracommunautaire du fournisseur : la déclaration repartira automatiquement.",
      };
    }
    // Saisi avec un préfixe de deux lettres qui n'est pas celui d'un État
    // membre : ce n'est pas un n° de TVA intracommunautaire, on ne le maquille
    // pas en ajoutant un préfixe devant.
    if (!etatUe && /^[A-Z]{2}/.test(numero)) {
      return {
        ok: false,
        detail: "tva_invalide",
        message: "Le n° saisi ne commence pas par le préfixe d'un État de l'UE (EL pour la Grèce) : saisissez le n° de TVA intracommunautaire du fournisseur.",
      };
    }
    const intracom = etatUe ? numero : prefixeTvaUe(p) + numero;
    if (intracom.length > LONGUEUR_MAX_IDENTIFIANT) {
      return {
        ok: false,
        detail: "tva_invalide",
        message: `Le n° de TVA du fournisseur dépasse ${LONGUEUR_MAX_IDENTIFIANT} caractères : vérifiez-le.`,
      };
    }
    return { ok: true, company_id: intracom, scheme_id: SCHEMA_UE_HORS_FRANCE, tva: intracom };
  }

  const nom = (raisonSociale ?? "").trim();
  if (!/^[A-Z]{2}$/.test(p) || !nom) {
    return {
      ok: false,
      detail: "identite_incomplete",
      message: "Indiquez le pays (code à deux lettres) et la raison sociale du fournisseur : la déclaration repartira automatiquement.",
    };
  }
  // Array.from compte en caractères (points de code), pas en unités UTF-16 :
  // une lettre accentuée ou un caractère hors plan de base compte pour un.
  const id = p + Array.from(nom).slice(0, CARACTERES_RAISON_SOCIALE).join("");
  return { ok: true, company_id: id, scheme_id: SCHEMA_HORS_UE, tva: null };
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
    scheme_id: SCHEMA_SIREN,
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
 * Catégorie de TVA, d'après la TVA que porte la facture (lib/achats-tva.ts) :
 * TVA française ou étrangère, déclarée « S » au taux facturé ; aucune TVA
 * (autoliquidation, cas le plus fréquent des services intra-UE), déclarée « AE »
 * avec le motif d'exonération EN 16931 correspondant. Inchangé pour les achats
 * saisis avant ce choix (nature déduite du montant).
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
  > & { tva_facturee?: NatureTva | null; categorie?: string | null; est_avoir?: boolean | null },
  nous: NotreIdentite,
  // Identité du vendeur selon G2.19 (identiteVendeur). Construite et vérifiée
  // par l'appelant (transmettreAchat), qui garde l'achat en attente quand elle
  // ne peut pas l'être plutôt que d'envoyer une identité fausse.
  vendeur: { company_id: string; scheme_id: string; tva: string | null }
) {
  const ht = montantStr(achat.montant_ht);
  const tva = montantStr(achat.montant_tva);
  // La nature saisie décide (21/11/2026) ; la validation garantit qu'une
  // facture sans TVA a un montant nul et qu'une facture avec TVA en a un.
  const autoliquidation = natureTva(achat) === "aucune";
  // Biens venus d'un État membre sans TVA : acquisition intracommunautaire,
  // catégorie K (livraison intracommunautaire exonérée côté fournisseur) ;
  // services et autres achats sans TVA : autoliquidation, catégorie AE. Les
  // biens hors UE sans TVA (importation) ne sont jamais déclarés (motifHorsChamp).
  const intracomBiens =
    autoliquidation && achat.categorie === "biens" && !estImportation(achat.categorie, achat.fournisseur_pays) && PAYS_UE.includes(String(achat.fournisseur_pays ?? "").toUpperCase());

  // Le vendeur (fournisseur étranger) porte un `company_id` et son
  // `company_id_scheme_id`, tous deux exigés par l'API (TT-33 / TT-33-1).
  const seller: Record<string, unknown> = {
    country: achat.fournisseur_pays,
    company_id: vendeur.company_id,
    company_id_scheme_id: vendeur.scheme_id,
  };
  // n° de TVA (TT-34) : obligatoire sous 0002 et 0223 (G2.33), absent sous
  // 0227 (hors UE), où l'identifiant fiscal local n'est pas une TVA.
  if (vendeur.tva) {
    seller.tax_registration_id = vendeur.tva;
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

  const tax_category: Record<string, unknown> = intracomBiens
    ? {
        code: "K",
        percent: "0.00",
        exemption_reason_code: "VATEX-EU-IC",
        exemption_reason: "Livraison intracommunautaire exonérée",
      }
    : autoliquidation
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
        // Avoir du fournisseur : 381, montants positifs (BR-27), le type porte le sens.
        type_code: achat.est_avoir ? "381" : "380",
        // TT-28, cadre de facturation (annexe 6 v3.2, flux 10.1, règle G1.02).
        // Était `B1` (bien) en dur, y compris pour un achat de services, le cas
        // le plus fréquent. Même règle que nos factures : lib/cadre-facturation.ts.
        // Ni « déjà payé » ni « après acompte » : Deviso ne suit pas le
        // règlement d'un fournisseur étranger, il n'affirme donc rien.
        business_process: {
          id: cadreFacturation({
            categorie: achat.categorie === "biens" ? "goods" : "services",
            typeCode: achat.est_avoir ? "381" : "380",
          }),
          type_id: "urn:cen.eu:en16931:2017",
        },
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
export type SuiteEchec = "reessayer" | "action_requise" | "refuse" | "hors_champ";
export type ResultatTransmission =
  | { ok: true; superpdpId: number | null }
  | { ok: false; suite: SuiteEchec; message: string; detail: string };

/** Statut de base stocke pour chaque suite d'echec. */
const STATUT_PAR_SUITE: Record<SuiteEchec, "en_attente" | "action_requise" | "echec" | "hors_champ"> = {
  reessayer: "en_attente",
  action_requise: "action_requise",
  refuse: "echec",
  hors_champ: "hors_champ",
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
export function classerRefus(status: number, message: string, dateFacture: string): SuiteEchec {
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
  // Compte de démonstration : la transmission est simulée, jamais envoyée à la
  // vraie Plateforme Agréée. L'achat reste "en attente" côté écran.
  // Avant tout : un achat hors du champ de l'e-reporting n'est jamais envoyé.
  const horsChamp = motifHorsChamp(achat);
  if (horsChamp) return { ok: false, suite: "hors_champ", message: horsChamp, detail: "hors_champ" };
  if (await estCompteDemo(workspaceId)) {
    return { ok: false, suite: "reessayer", message: "Transmission à la Plateforme Agréée simulée en mode démonstration.", detail: "demo" };
  }
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

  // Identité du vendeur selon G2.19 (identiteVendeur) : n° de TVA
  // intracommunautaire (0223) dans l'UE, code pays + raison sociale (0227) hors
  // UE, SIREN (0002) pour un n° de TVA française. Quand elle ne peut pas être
  // construite (n° de TVA manquant ou illisible pour un fournisseur de l'UE),
  // on ne transmet pas : l'achat reste en attente avec un message clair, plutôt
  // que de partir avec une identité fausse. Best-effort, jamais « échec » : une
  // saisie à compléter n'est pas une saisie fautive, et l'utilisateur la corrige
  // depuis l'écran.
  const vendeur = identiteVendeur(achat.fournisseur_pays, achat.fournisseur_tva, achat.fournisseur_nom);
  if (!vendeur.ok) {
    return { ok: false, suite: "reessayer", message: vendeur.message, detail: vendeur.detail };
  }

  const payload = construirePayloadB2bint(achat, nous, vendeur);

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
      hors_champ: "Hors du champ de la déclaration.",
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
type LigneB2bint = {
  id?: number;
  number?: string;
  direction?: string;
  ppf_ereporting_id?: number | null;
  issue_date?: string;
  seller?: { company_id?: string; tax_registration_id?: string };
  total?: { tax_exclusive_amount?: string };
};

/**
 * Cet achat est-il déjà parmi les déclarations de la plateforme ? (21/11/2026)
 *
 * Deux fournisseurs peuvent émettre chacun une facture « 1001 » : le numéro
 * seul ne prouve rien. On reconnaît la déclaration au numéro ET à
 * l'identifiant du fournisseur, et on la confirme par la date et le montant HT.
 *  - identique : même numéro, même fournisseur, même date, même HT ;
 *  - ambigu : même numéro et même fournisseur mais autre date ou autre montant
 *    (achat corrigé après un envoi dont la réponse s'est perdue ?), ou
 *    fournisseur illisible dans la liste : on ne conclut rien ;
 *  - absent : aucun autre cas, le numéro appartient à un autre fournisseur.
 */
export function rapprocherDeclaration(
  liste: LigneB2bint[],
  achat: Pick<AchatInternational, "numero" | "id" | "fournisseur_tva" | "date_facture" | "montant_ht"> &
    Partial<Pick<AchatInternational, "fournisseur_pays" | "fournisseur_nom">>
): { etat: "absent" } | { etat: "identique"; id: number | null } | { etat: "ambigu" } {
  const numero = numeroDeclaration(achat);
  // Ce qui peut désigner ce fournisseur dans une déclaration déjà envoyée :
  // l'identifiant G2.19 que l'on enverrait aujourd'hui, et le n° saisi tel
  // quel (forme envoyée avant le 23/11/2026, schémas EAS par pays et 9999).
  const identite = identiteVendeur(achat.fournisseur_pays, achat.fournisseur_tva, achat.fournisseur_nom);
  const nous = new Set(
    [normaliserTva(achat.fournisseur_tva), ...(identite.ok ? [normaliserTva(identite.company_id), normaliserTva(identite.tva)] : [])].filter(Boolean)
  );
  let ambigu = false;
  for (const it of liste) {
    if (it.number !== numero || (it.direction ?? "in") !== "in") continue;
    const leurs = [it.seller?.company_id, it.seller?.tax_registration_id].map(normaliserTva).filter(Boolean);
    if (leurs.length && nous.size && !leurs.some((l) => nous.has(l))) continue;
    if (!leurs.length || !nous.size) { ambigu = true; continue; }
    if (it.issue_date === achat.date_facture && it.total?.tax_exclusive_amount === montantStr(Number(achat.montant_ht))) {
      return { etat: "identique", id: typeof it.id === "number" ? it.id : null };
    }
    ambigu = true;
  }
  return ambigu ? { etat: "ambigu" } : { etat: "absent" };
}

/**
 * Toutes les declarations B2BInt du compte chez la Plateforme Agreee, page par
 * page (1 000 au plus par appel, curseur starting_after_id, spec v1.37).
 *
 * Avant le 18/10/2026, on ne lisait que la premiere page de 1 000 : au-dela, la
 * garde d'idempotence ne voyait plus les declarations anciennes et un reessai
 * pouvait recreer une declaration fiscale existante. Renvoie null si la liste
 * n'a pas pu etre lue EN ENTIER : un appelant ne conclut jamais « absent »
 * d'une liste tronquee.
 */
async function listerDeclarationsB2bint(workspaceId: string): Promise<LigneB2bint[] | null> {
  const toutes: LigneB2bint[] = [];
  let apres: number | null = null;
  for (let page = 0; page < 50; page++) {
    const q = `/b2bint_invoices?limit=1000&order=asc${apres !== null ? `&starting_after_id=${apres}` : ""}`;
    let lot: LigneB2bint[];
    let encore: boolean;
    try {
      const res = await superpdpFetch(workspaceId, q);
      if (!res.ok) return null;
      const body = JSON.parse(await res.text()) as { data?: LigneB2bint[]; has_more?: boolean };
      lot = body.data ?? [];
      encore = body.has_more === true;
    } catch {
      return null;
    }
    toutes.push(...lot);
    if (!encore || lot.length === 0) return toutes;
    const dernier = lot[lot.length - 1]?.id;
    if (typeof dernier !== "number") return null;
    apres = dernier;
  }
  return null; // au-dela de 50 000 lignes, on ne conclut rien
}

/**
 * La Plateforme Agreee detient-elle deja une declaration pour cet achat ?
 * (20/11/2026, suppression d'un achat non transmis.)
 *
 * Un achat reste « en attente » chez nous si la reponse a ete perdue APRES un
 * 200 : la declaration existe alors chez elle. Le supprimer laisserait une
 * declaration fiscale sans piece. On regarde donc avant. Renvoie null si la
 * liste n'a pas pu etre lue en entier : l'appelant ne conclut jamais « absent ».
 * Un compte de demonstration ne transmet jamais (transmettreAchat) : rien a lire.
 */
export async function declarationExisteChezPa(
  workspaceId: string,
  achat: Pick<AchatInternational, "numero" | "id" | "fournisseur_tva" | "date_facture" | "montant_ht"> &
    Partial<Pick<AchatInternational, "fournisseur_pays" | "fournisseur_nom">>
): Promise<ReturnType<typeof rapprocherDeclaration> | null> {
  if (await estCompteDemo(workspaceId)) return { etat: "absent" };
  const liste = await listerDeclarationsB2bint(workspaceId);
  if (liste === null) return null;
  return rapprocherDeclaration(liste, achat);
}

/**
 * Refus à opposer avant de modifier, retransmettre ou supprimer un achat dont
 * la déclaration existe peut-être déjà (21/11/2026). Un achat transmis, ou
 * portant une trace d'envoi, est figé. Sinon on regarde chez la plateforme :
 * une réponse perdue après un envoi réussi laisse un achat « en attente » chez
 * nous alors que la déclaration existe ; on le resynchronise (transmis) et on
 * refuse. Liste illisible : on refuse aussi, sans conclure. Un achat hors champ
 * n'a jamais été envoyé : rien à vérifier. null = l'opération peut continuer.
 */
export async function refusSiDeclare(
  admin: SupabaseClient,
  workspaceId: string,
  achat: Pick<AchatInternational, "id" | "numero" | "transmission_status" | "superpdp_id" | "ppf_ereporting_id" | "fournisseur_tva" | "date_facture" | "montant_ht">,
  action: string
): Promise<{ status: number; error: string; message: string } | null> {
  if (achat.transmission_status === "transmis" || achat.superpdp_id !== null || achat.ppf_ereporting_id !== null) {
    return { status: 409, error: "Déjà transmis", message: `Cet achat a été transmis à la plateforme agréée : sa déclaration existe, il ne peut pas être ${action}.` };
  }
  if (achat.transmission_status === "hors_champ") return null;
  const chezPa = await declarationExisteChezPa(workspaceId, achat);
  if (chezPa === null) {
    return { status: 503, error: "Vérification impossible", message: "Impossible de vérifier auprès de la plateforme agréée que cet achat n'a pas déjà été déclaré. Réessaie dans un instant." };
  }
  if (chezPa.etat === "ambigu") {
    return { status: 409, error: "À vérifier", message: `La plateforme agréée détient une déclaration sous ce numéro pour ce fournisseur, avec une autre date ou un autre montant. Vérifie-la avec ton comptable : cet achat ne peut pas être ${action} sans risquer une déclaration en double.` };
  }
  if (chezPa.etat === "identique") {
    await admin
      .from("superpdp_achats_int")
      .update({ transmission_status: "transmis", superpdp_id: chezPa.id, transmission_error: null, transmitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", achat.id)
      .eq("user_id", workspaceId);
    return { status: 409, error: "Déjà déclaré", message: `La plateforme agréée a déjà reçu la déclaration de cet achat : il est désormais marqué transmis et ne peut pas être ${action}.` };
  }
  return null;
}


/**
 * Fait passer un achat de « enregistre » a « declare » quand il l'est vraiment.
 *
 * Un 200 sur POST /b2bint_invoices veut dire que la Plateforme Agreee a STOCKE
 * la declaration. Elle l'envoie ensuite a l'administration selon le calendrier
 * du regime de TVA (doc de l'API). Le seul signal d'envoi effectif est
 * ppf_ereporting_id, en lecture seule. Jusqu'au 18/10/2026, l'ecran affichait
 * « Declare » des le 200 : il annoncait une declaration fiscale pas encore
 * partie. Appelee par le cron horaire, lecture seule cote Plateforme Agreee.
 */
export async function synchroniserDeclarationsPpf(
  admin: SupabaseClient,
  limite = 500,
  // Workspaces a traiter : comptes verifies de CET environnement, hors demo,
  // calcules par le cron. Sans ce filtre, la synchro PROD lirait aussi les
  // comptes bac a sable (et reciproquement) : leur jeton serait churne en
  // invalid_grant et le compte marque « error » a chaque passage. Absent =
  // tous les comptes (tests unitaires).
  comptesEligibles?: Iterable<string>
): Promise<{ examines: number; declares: number; comptesIllisibles: number }> {
  const eligibles = comptesEligibles ? [...comptesEligibles] : null;
  let requete = admin
    .from("superpdp_achats_int")
    .select("*")
    .eq("transmission_status", "transmis")
    .is("ppf_ereporting_id", null);
  if (eligibles) requete = requete.in("user_id", eligibles);
  const { data } = await requete
    .order("transmitted_at", { ascending: true })
    .limit(limite);

  const parCompte = new Map<string, AchatInternational[]>();
  for (const brut of data ?? []) {
    const a = brut as AchatInternational;
    parCompte.set(a.user_id, [...(parCompte.get(a.user_id) ?? []), a]);
  }

  let declares = 0;
  let comptesIllisibles = 0;
  for (const [ws, achats] of parCompte) {
    const lignes = await listerDeclarationsB2bint(ws);
    if (!lignes) {
      comptesIllisibles++;
      continue;
    }
    const parId = new Map<number, number>();
    const parNumero = new Map<string, number>();
    for (const it of lignes) {
      if (typeof it.ppf_ereporting_id !== "number") continue;
      if (typeof it.id === "number") parId.set(it.id, it.ppf_ereporting_id);
      if (it.number && (it.direction ?? "in") === "in") parNumero.set(it.number, it.ppf_ereporting_id);
    }
    for (const a of achats) {
      const ppf = (a.superpdp_id !== null ? parId.get(a.superpdp_id) : undefined) ?? parNumero.get(numeroDeclaration(a));
      if (ppf === undefined) continue;
      const maintenant = new Date().toISOString();
      const { error } = await admin
        .from("superpdp_achats_int")
        .update({ ppf_ereporting_id: ppf, declared_at: maintenant, updated_at: maintenant })
        .eq("id", a.id)
        .is("ppf_ereporting_id", null);
      if (!error) declares++;
    }
  }
  return { examines: data?.length ?? 0, declares, comptesIllisibles };
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
  limite = 200,
  // Meme filtre d'environnement que synchroniserDeclarationsPpf : on ne retente
  // que les achats des comptes de CET environnement, sinon un passage prod
  // churnerait le jeton des comptes bac a sable (et reciproquement) et les
  // marquerait « error ». Absent = tous les comptes (tests unitaires).
  comptesEligibles?: Iterable<string>
): Promise<{ examines: number; transmis: number; encore: number; echecs: number; abandonnes: number }> {
  const eligibles = comptesEligibles ? [...comptesEligibles] : null;
  let requete = admin
    .from("superpdp_achats_int")
    .select("*")
    .eq("transmission_status", "en_attente");
  if (eligibles) requete = requete.in("user_id", eligibles);
  const { data: achats } = await requete
    .order("updated_at", { ascending: true })
    .limit(limite);

  let transmis = 0;
  let encore = 0;
  let echecs = 0;
  let abandonnes = 0;
  const cacheListes = new Map<string, LigneB2bint[] | null>();

  for (const brut of achats ?? []) {
    const achat = brut as AchatInternational;
    const ws = achat.user_id;

    // Un compte de démonstration ne transmet jamais : rien à lire chez la plateforme.
    if (!cacheListes.has(ws)) cacheListes.set(ws, (await estCompteDemo(ws)) ? [] : await listerDeclarationsB2bint(ws));
    const liste = cacheListes.get(ws)!;
    const rapproche = liste ? rapprocherDeclaration(liste, achat) : null;

    let resultat: ResultatTransmission;
    if (rapproche === null) {
      // Liste illisible : renvoyer en aveugle risquerait une déclaration en double.
      resultat = { ok: false, suite: "reessayer", message: "Vérification des déclarations existantes impossible pour l'instant : nouvel essai automatique.", detail: "liste_illisible" };
    } else if (rapproche.etat === "identique") {
      // Déjà déclaré (200 perdu en route) : on ne recrée pas, on réconcilie.
      resultat = { ok: true, superpdpId: rapproche.id };
    } else if (rapproche.etat === "ambigu") {
      resultat = { ok: false, suite: "action_requise", message: "Une déclaration existe déjà sous ce numéro pour ce fournisseur, avec une autre date ou un autre montant : à vérifier avec ton comptable avant tout nouvel envoi.", detail: "declaration_ambigue" };
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
