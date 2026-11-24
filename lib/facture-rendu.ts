/**
 * Ce que le rendu d'une facture lit en plus de la facture elle-même : la
 * couleur d'accent et les modalités de paiement de l'ESPACE, et le document
 * lié (acompte d'une facture de solde, facture annulée par un avoir).
 *
 * Une seule lecture pour le PDF téléchargé (`/api/invoices/[id]/download`) et
 * pour la feuille affichée dans l'application (`/api/invoices/[id]/feuille`) :
 * les deux montrent ainsi le même IBAN, la même couleur, la même référence.
 *
 * Le profil lu est celui de l'espace, jamais celui de la personne connectée :
 * un collaborateur verrait sinon son propre IBAN (ou aucun) sur la facture.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invoice } from "@/types";
import type { PaymentInfo } from "./facture-contenu";
import { getWorkspaceProfile } from "./workspace";
import { documentLie, type DocumentLie } from "./document-lie";

export interface DonneesRendu {
  accentColor: string | undefined;
  paymentInfo: PaymentInfo | undefined;
  lie: DocumentLie;
}

export async function donneesRenduFacture(
  supabase: SupabaseClient,
  invoice: Invoice,
  workspaceId: string
): Promise<DonneesRendu> {
  const profileData = await getWorkspaceProfile<{
    proposal_color: string | null; payment_method: string | null; payment_link_provider: string | null;
    payment_link_profile: string | null; bank_iban: string | null; bank_bic: string | null; bank_account_name: string | null;
  }>(
    workspaceId,
    "proposal_color, payment_method, payment_link_provider, payment_link_profile, bank_iban, bank_bic, bank_account_name"
  );

  const accentColor = profileData?.proposal_color ?? undefined;
  const paymentInfo: PaymentInfo | undefined = profileData
    ? {
        method: (profileData.payment_method || "none") as "none" | "link" | "bank" | "both",
        linkProvider: profileData.payment_link_provider,
        linkUrl: profileData.payment_link_profile,
        bankIban: profileData.bank_iban,
        bankBic: profileData.bank_bic,
        bankAccountName: profileData.bank_account_name,
      }
    : undefined;

  // Solde ET avoir : numéro et date du document lié, voir lib/document-lie.ts.
  const lie = await documentLie(supabase, invoice, workspaceId);
  return { accentColor, paymentInfo, lie };
}
