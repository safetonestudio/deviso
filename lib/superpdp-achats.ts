import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { lireEntreprise } from "@/lib/superpdp-entreprise";
import { getWorkspaceProfile } from "@/lib/workspace";
import { resolveVatNumber } from "@/lib/facturx-helpers";
import { paysFrancais } from "@/lib/superpdp-nature";

/**
 * Achats internationaux — e-reporting des acquisitions auprès de fournisseurs
 * étrangers (endpoint b2bint_invoices, direction "in").
 *
 * Pourquoi ce module existe. La réforme n'impose pas seulement de déclarer nos
 * VENTES : une entreprise française qui achète un bien ou un service à un
 * fournisseur établi hors de France doit aussi déclarer cette ACQUISITION
 * (e-reporting des transactions internationales). Nos ventes passent par
 * `/invoices` avec `processing_rule=B2BInt` ; les achats, eux, n'ont pas de
 * document que nous émettons — nous recevons la facture du fournisseur. Le seul
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
  transmission_status: "en_attente" | "transmis" | "echec";
  transmission_error: string | null;
  transmitted_at: string | null;
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
 * pas ce que l'utilisateur a saisi — c'est ce qui fait foi, exactement comme à
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
  nous: NotreIdentite
) {
  const ht = montantStr(achat.montant_ht);
  const tva = montantStr(achat.montant_tva);
  const autoliquidation = achat.montant_tva <= 0;

  const seller: Record<string, unknown> = { country: achat.fournisseur_pays };
  if (achat.fournisseur_tva?.trim()) {
    seller.tax_registration_id = achat.fournisseur_tva.trim().toUpperCase();
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
        number: achat.numero?.trim() || `ACHAT-${achat.id.slice(0, 8)}`,
        issue_date: achat.date_facture,
        currency_code: achat.devise,
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

export type ResultatTransmission =
  | { ok: true; superpdpId: number | null }
  | { ok: false; reessayable: boolean; message: string; detail: string };

/**
 * Un refus qui vient de la fenêtre de déclaration, pas de notre payload.
 *
 * Constaté en bac à sable (25/09/2026) : `POST /b2bint_invoices` refuse toute
 * date — une date future en 400 « is in the future », une date récente en 500,
 * une date ancienne en 400 « cannot add invoice at date ». Les endpoints
 * frères (b2bint_payments, b2c_*) répondent 200 avec un payload identique dans
 * sa forme. Le payload est donc correct ; c'est une règle de période côté
 * plateforme (doublée d'un incident 500 sur les dates récentes), très
 * probablement un artefact du bac à sable. On garde l'achat en attente et on
 * retentera : on ne marque JAMAIS « échec » un achat dont la déclaration est
 * refusée pour cette raison, ce serait accuser une saisie correcte.
 */
function refusDeFenetre(status: number, message: string): boolean {
  if (status >= 500) return true;
  return /future|cannot add invoice at date|period|période|fenêtre|date/i.test(message);
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
      return { ok: false, reessayable: true, message: "Compte non raccordé à la Plateforme Agréée.", detail: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { ok: false, reessayable: true, message: "Vérification du raccordement en cours.", detail: "session_pending" };
    }
    throw err;
  }

  if (!nous) {
    return {
      ok: false,
      reessayable: true,
      message: "Impossible de lire votre fiche entreprise chez la Plateforme Agréée.",
      detail: "identite_illisible",
    };
  }

  const payload = construirePayloadB2bint(achat, nous);

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

    const reessayable = refusDeFenetre(res.status, message);
    return {
      ok: false,
      reessayable,
      message: reessayable
        ? "La Plateforme Agréée n'accepte pas encore cette déclaration (fenêtre de déclaration). L'achat est conservé et sera retransmis automatiquement."
        : `La Plateforme Agréée a refusé la déclaration : ${message}`,
      detail: `[${res.status}] ${message}`.slice(0, 900),
    };
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) {
      return { ok: false, reessayable: true, message: "Compte non raccordé à la Plateforme Agréée.", detail: "non_raccorde" };
    }
    if (err instanceof SuperPdpSessionPending) {
      return { ok: false, reessayable: true, message: "Vérification du raccordement en cours.", detail: "session_pending" };
    }
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reessayable: true,
      message: "La transmission a échoué pour une raison technique. L'achat est conservé et sera retransmis.",
      detail: detail.slice(0, 900),
    };
  }
}
