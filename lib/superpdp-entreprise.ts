import { superpdpFetch, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";

/**
 * Régime de TVA déclaré à la Plateforme Agréée.
 *
 * Pourquoi ça existe. Super PDP construit les déclarations d'e-reporting selon
 * un calendrier qui dépend du régime de TVA de l'entreprise — leur documentation
 * est explicite : « Pour faire fonctionner l'e-reporting, il faut paramétrer le
 * régime de TVA au niveau de son entreprise. » Tant que ce champ est vide chez
 * eux, **toute facture B2C est refusée** avec « Le régime de TVA est invalide ».
 *
 * Ce réglage n'existe que par l'API : il n'apparaît ni dans l'interface de Super
 * PDP, ni nulle part ailleurs. Sans cette fonction, aucun client raccordé
 * n'aurait jamais pu facturer un particulier — et rien ne le lui aurait
 * expliqué.
 *
 * ⚠️ Deux notions à ne pas confondre, elles ne se recouvrent pas :
 *   - `profiles.tva_regime` (franchise / normal / intermediaire) décrit le
 *     **taux appliqué** sur les factures ;
 *   - `vat_regime` chez Super PDP décrit la **périodicité de déclaration**.
 * Un seul cas se déduit : la franchise en base n'a pas de calendrier de
 * déclaration puisqu'il n'y a pas de TVA à déclarer, d'où `vat_exemption`. Pour
 * les assujettis, l'information n'existe pas dans Deviso : elle est demandée à
 * l'utilisateur (`profiles.tva_periodicite`), et rien n'est déduit à sa place.
 */

/** Les quatre valeurs admises par `PATCH /v1.beta/companies`. */
export type VatRegime = "monthly" | "quarterly" | "simplified" | "vat_exemption";

export const PERIODICITES_TVA = [
  { value: "monthly", label: "Mensuelle — régime réel normal" },
  { value: "quarterly", label: "Trimestrielle — régime réel normal" },
  { value: "simplified", label: "Annuelle — régime simplifié (RSI)" },
] as const;

/**
 * Traduit le profil Deviso en régime Super PDP.
 *
 * Renvoie `null` quand l'information manque — un assujetti qui n'a pas encore
 * renseigné sa périodicité. On ne devine pas : envoyer `monthly` par défaut
 * ferait déclarer au mauvais rythme, ce qui est une faute déclarative, pas un
 * détail de configuration.
 */
export function regimeSuperPdp(profil: {
  tva_regime?: string | null;
  tva_periodicite?: string | null;
}): VatRegime | null {
  if (profil.tva_regime === "franchise") return "vat_exemption";
  const p = profil.tva_periodicite;
  if (p === "monthly" || p === "quarterly" || p === "simplified") return p;
  return null;
}

export type ResultatRegime =
  | { ok: true; regime: VatRegime }
  | { ok: false; raison: "inconnu" | "non_raccorde" | "verification_en_cours" | "refuse"; detail?: string };

/**
 * Pousse le régime de TVA à Super PDP.
 *
 * Best-effort par construction : appelée au raccordement et à chaque
 * enregistrement du profil, elle ne doit jamais empêcher l'une ou l'autre
 * d'aboutir. Un échec est journalisé et se rattrapera au prochain passage.
 */
export async function pousserRegimeTva(
  workspaceId: string,
  profil: { tva_regime?: string | null; tva_periodicite?: string | null }
): Promise<ResultatRegime> {
  const regime = regimeSuperPdp(profil);
  if (!regime) return { ok: false, raison: "inconnu" };

  try {
    const res = await superpdpFetch(workspaceId, "/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vat_regime: regime }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error(`[superpdp/regime] ${workspaceId} : HTTP ${res.status} ${detail}`);
      return { ok: false, raison: "refuse", detail };
    }
    return { ok: true, regime };
  } catch (err) {
    if (err instanceof SuperPdpNotConnected) return { ok: false, raison: "non_raccorde" };
    if (err instanceof SuperPdpSessionPending) return { ok: false, raison: "verification_en_cours" };
    console.error("[superpdp/regime]", err instanceof Error ? err.message : err);
    return { ok: false, raison: "refuse" };
  }
}
