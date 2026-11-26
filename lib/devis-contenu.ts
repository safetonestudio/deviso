/**
 * Contenu d'un devis, dans la même construction que la facture
 * (lib/facture-contenu.ts, `ContenuDocument`).
 *
 * Depuis le 24/11/2026 (décision de Selim), le devis a l'allure de la facture
 * et suit le même modèle visuel (Classique, Moderne, Épuré), dans l'application
 * comme sur le lien de signature du client (/p/[token]). Les textes sont ceux
 * de l'ancien components/ProposalDocument.tsx, rangés dans les mêmes blocs que
 * la facture : rien n'est ajouté ni retiré de ce que le client lisait.
 *
 * Client et serveur : aucun import serveur ici.
 */
import type { Proposal, Profile } from "@/types";
import {
  ACCENT_DEFAUT, LABELS, addressLines, fmtDateDoc, fmtMontant, fmtQty, idLabel, modeleDocument,
  type ContenuDocument, type Habillage,
} from "./facture-contenu";

export const CLAUSE_PENALITES =
  "En cas de retard de paiement, des pénalités de retard sont exigibles dès le lendemain de la date d'échéance au taux de 3× le taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (Art. L441-10 C.Com.).";

export type ProfilDevis = Pick<
  Partial<Profile>,
  "company_name" | "full_name" | "address" | "siret" | "tva_number" | "email" | "cgv_text"
> & { proposal_color?: string | null; proposal_template?: string | null };

const jourMois = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

export function contenuDevis(
  proposal: Proposal,
  profile: ProfilDevis | null,
  options: { marque?: boolean; habillage?: Habillage } = {}
): ContenuDocument {
  const t = LABELS.fr;
  const accent = options.habillage?.accent || profile?.proposal_color || ACCENT_DEFAUT;
  const modele = modeleDocument(options.habillage?.modele ?? profile?.proposal_template);
  const nomVendeur = profile?.company_name || profile?.full_name || "";
  const assujetti = proposal.tva_rate > 0;

  const vendeurLignes = [
    ...(profile?.company_name && profile?.full_name ? [profile.full_name] : []),
    ...addressLines(profile?.address),
    ...(idLabel(profile?.siret) ? [idLabel(profile?.siret) as string] : []),
    ...(profile?.tva_number ? [`${t.vatNo} : ${profile.tva_number}`] : []),
    ...(profile?.email ? [profile.email] : []),
  ];
  const clientLignes = [
    ...(proposal.client_name && proposal.client_company ? [proposal.client_name] : []),
    ...addressLines(proposal.client_address),
    ...(idLabel(proposal.client_siren) ? [idLabel(proposal.client_siren) as string] : []),
    ...(proposal.client_email ? [proposal.client_email] : []),
  ];

  const conditions = [
    ...(proposal.payment_terms ? [`${t.paymentPrefix} ${proposal.payment_terms}`] : []),
    ...(proposal.notes ? [proposal.notes] : []),
  ];
  const mentions = [
    ...(assujetti ? [] : ["TVA non applicable, art. 293 B du CGI"]),
    CLAUSE_PENALITES,
    ...(profile?.cgv_text
      ? ["L'acceptation de ce devis vaut acceptation de nos Conditions Générales de Vente annexées au présent document."]
      : []),
  ];

  const signature = proposal.signer_name
    ? `Signé électroniquement par ${proposal.signer_name}${
        proposal.signed_at
          ? `, le ${new Date(proposal.signed_at).toLocaleDateString("fr-FR", {
              timeZone: "Europe/Paris", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}`
          : ""
      }`
    : null;

  const id = idLabel(profile?.siret);

  return {
    accent,
    modele,
    t,
    title: "DEVIS",
    sousTitre: nomVendeur,
    numero: proposal.proposal_number ? `${t.numberPrefix} ${proposal.proposal_number}` : "",
    dates: [
      `Émis le ${fmtDateDoc(proposal.created_at)}`,
      ...(proposal.valid_until ? [`Valable jusqu'au ${jourMois(proposal.valid_until)}`] : []),
    ],
    bandeau: null,
    vendeur: { nom: nomVendeur, lignes: vendeurLignes },
    client: { nom: proposal.client_company || proposal.client_name || "Client", lignes: clientLignes },
    objet: proposal.title || null,
    lignes: proposal.items.map((item) => ({
      description: item.description,
      qte: fmtQty(item.quantity, item.unit),
      unite: item.unit,
      pu: fmtMontant(item.unit_price),
      total: fmtMontant(item.total),
    })),
    totalHt: fmtMontant(proposal.total_ht),
    tva: [
      assujetti
        ? { libelle: `${t.vatRate} ${proposal.tva_rate}%`, montant: fmtMontant(proposal.total_ttc - proposal.total_ht) }
        : { libelle: t.vatNotApplicable, montant: fmtMontant(0) },
    ],
    totalFinal: { libelle: assujetti ? t.totalInclVat : "Total net", montant: fmtMontant(proposal.total_ttc) },
    encadres: [
      ...(conditions.length ? [{ titre: t.termsNotes, paragraphes: conditions }] : []),
      { titre: t.legalHeading, paragraphes: [mentions.join("\n")] },
    ],
    signature,
    pied: { gauche: `${nomVendeur}${id ? ` • ${id}` : ""}`, droite: null },
    marque: options.marque ? "Devis créé avec Deviso, l'outil de devis IA pour freelances" : null,
    annexe: profile?.cgv_text ? { titre: "Conditions générales de vente", texte: profile.cgv_text } : null,
  };
}
