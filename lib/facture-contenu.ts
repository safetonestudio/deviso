/**
 * Contenu d'une facture tel que l'imprime son PDF : titres, libellés, mentions,
 * lignes de TVA, modalités de paiement, pied de page.
 *
 * Source UNIQUE pour deux rendus :
 * - le PDF Factur-X (lib/invoice-pdf.tsx, @react-pdf, côté serveur) ;
 * - la feuille affichée dans l'application (components/document/FeuilleFacture.tsx).
 *
 * Ce que l'utilisateur voit à l'écran doit être exactement ce que reçoit son
 * client : les deux rendus lisent donc les mêmes chaînes, calculées ici, et
 * `npm run test:feuille-facture` vérifie qu'aucune ne diverge. Ce fichier ne
 * doit rien importer de serveur (ni `fs`, ni `path`, ni @react-pdf) : il est
 * chargé dans le navigateur.
 */
import type { Invoice } from "@/types";
import { digitsOnly, parseAddress, resolveVatNumber } from "./facturx-helpers";
import { motifExoneration } from "./exoneration";
import { ventilationTva } from "./tva";

/** Couleur d'accent par défaut des documents (sans couleur choisie au profil). */
export const ACCENT_DEFAUT = "#4f46e5";

export interface PaymentInfo {
  method?: string | null; // "none" | "link" | "bank" | "both"
  linkProvider?: string | null;
  linkUrl?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  bankAccountName?: string | null;
}

/**
 * Libellé exact de l'identifiant : SIRET (14 chiffres, établissement) ou
 * SIREN (9, entreprise). Afficher « SIRET » devant un SIREN serait faux.
 */
export function idLabel(value: string | null | undefined): string | null {
  const d = digitsOnly(value);
  if (d.length === 14) return `SIRET : ${d}`;
  if (d.length === 9) return `SIREN : ${d}`;
  return value ? `SIRET : ${value}` : null;
}

/** Adresse sur plusieurs lignes : rue puis « CP Ville », comme sur un courrier. */
export function addressLines(raw: string | null | undefined): string[] {
  const a = parseAddress(raw);
  const lines: string[] = [];
  if (a.street) lines.push(a.street);
  const cityLine = [a.postcode, a.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (!lines.length && raw) lines.push(raw);
  return lines;
}

export function fmtMontant(n: number) {
  // Intl fr-FR utilise l'espace fine insécable (U+202F) comme séparateur de
  // milliers, glyphe absent de Helvetica dans @react-pdf, qui rend "/" à la
  // place. On normalise vers une espace classique.
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })
    .format(n)
    .replace(/[  ]/g, " ");
}

export function fmtDateDoc(d: string, locale: string = "fr-FR") {
  return new Date(d).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une quantité selon l'unité.
 * "heure" + quantité non entière → notation horaire : 2.25 → "2h15", 0.25 → "15min".
 * Sinon → nombre brut sans zéros superflus.
 */
export function fmtQty(quantity: number, unit: string): string {
  if (unit === "heure" && !Number.isInteger(quantity)) {
    const hours = Math.floor(quantity);
    const minutes = Math.round((quantity - hours) * 60);
    if (hours === 0) return `${minutes}min`;
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }
  return String(quantity);
}

export type PdfLang = "fr" | "en";

/**
 * Habillage du PDF par langue. Les mentions legales (art. L441-10, 293 B CGI,
 * nature de l'operation, regime TVA) restent TOUJOURS en francais : elles sont
 * imposees par le droit francais, leur traduction fragiliserait leur valeur.
 */
export const LABELS: Record<PdfLang, {
  titleFacture: string; titleAcompte: string; titleSolde: string; titleAvoir: string;
  numberPrefix: string; issuedOn: string; dueOn: string;
  from: string; billTo: string; vatNo: string;
  colDesc: string; colQty: string; colUnit: string; colPrice: string; colTotal: string;
  subtotal: string; vatNotApplicable: string; vatRate: string;
  totalInclVat: string; totalCredit: string;
  paymentDetails: string; bankTransfer: string; accountHolder: string; onlinePayment: string;
  termsNotes: string; paymentPrefix: string; legalHeading: string; footerBadge: string;
}> = {
  fr: {
    titleFacture: "FACTURE", titleAcompte: "FACTURE D'ACOMPTE", titleSolde: "FACTURE DE SOLDE", titleAvoir: "AVOIR",
    numberPrefix: "N°", issuedOn: "Émise le", dueOn: "Échéance le",
    from: "Émetteur", billTo: "Destinataire", vatNo: "N° TVA",
    colDesc: "Prestation", colQty: "Qté", colUnit: "Unité", colPrice: "P.U. HT", colTotal: "Total HT",
    subtotal: "Total HT", vatNotApplicable: "TVA non applicable", vatRate: "TVA",
    totalInclVat: "Total TTC", totalCredit: "Total TTC à votre crédit",
    paymentDetails: "Modalités de paiement", bankTransfer: "Virement bancaire", accountHolder: "Titulaire", onlinePayment: "Paiement en ligne sécurisé",
    termsNotes: "Conditions & notes", paymentPrefix: "Paiement :", legalHeading: "Mentions légales",
    footerBadge: "Factur-X EN 16931, Conforme réforme 2026",
  },
  en: {
    titleFacture: "INVOICE", titleAcompte: "DEPOSIT INVOICE", titleSolde: "BALANCE INVOICE", titleAvoir: "CREDIT NOTE",
    numberPrefix: "No.", issuedOn: "Issued on", dueOn: "Due on",
    from: "From", billTo: "Bill to", vatNo: "VAT No.",
    colDesc: "Description", colQty: "Qty", colUnit: "Unit", colPrice: "Unit price", colTotal: "Amount",
    subtotal: "Subtotal", vatNotApplicable: "VAT not applicable", vatRate: "VAT",
    totalInclVat: "Total", totalCredit: "Total credited to you",
    paymentDetails: "Payment details", bankTransfer: "Bank transfer", accountHolder: "Account holder", onlinePayment: "Secure online payment",
    termsNotes: "Terms & notes", paymentPrefix: "Payment:", legalHeading: "Legal notices",
    footerBadge: "Factur-X EN 16931, 2026 e-invoicing compliant",
  },
};

export interface ContenuFacture {
  accent: string;
  t: (typeof LABELS)["fr"];
  title: string;
  numero: string;
  emise: string;
  echeance: string | null;
  /** Bandeau acompte / solde, ou null. */
  bandeau: string | null;
  vendeur: { nom: string; lignes: string[] };
  client: { nom: string; lignes: string[] };
  lignes: { description: string; qte: string; unite: string; pu: string; total: string }[];
  totalHt: string;
  tva: { libelle: string; montant: string }[];
  totalFinal: { libelle: string; montant: string };
  /** Modalités de paiement (lignes), ou null : jamais sur un avoir. */
  paiement: string[] | null;
  /** Conditions et notes (lignes), ou null. */
  conditions: string[] | null;
  mentions: string;
  pied: string;
}

/**
 * Tout le texte de la facture, dans l'ordre où le PDF l'imprime.
 * Les multi-lignes sont des chaînes jointes par "\n" (contrainte PDF/A, voir
 * lib/invoice-pdf.tsx) ; la feuille à l'écran les découpe de la même façon.
 */
export function contenuFacture(
  invoice: Invoice,
  accentColor?: string | null,
  paymentInfo?: PaymentInfo | null,
  linkedInvoiceNumber?: string | null
): ContenuFacture {
  const accent = accentColor || ACCENT_DEFAUT;
  // Le motif de l'absence de TVA, déterminé par la même règle que le XML
  // (lib/exoneration.ts). `isFranchise` ne désigne plus « taux à zéro » mais
  // bien le régime de franchise en base : le PDF imprimait « art. 293 B du
  // CGI » sur toute facture à 0 %, y compris une livraison intracommunautaire
  // émise par un assujetti, une déclaration écrite, et fausse, de son régime
  // fiscal.
  const exo = motifExoneration(invoice);
  const exonere = exo.categorie !== "S";
  const isFranchise = exo.categorie === "E" && /293 B/.test(exo.mention);
  const isAcompte = invoice.invoice_type === "acompte";
  const isSolde = invoice.invoice_type === "solde";
  const isAvoir = invoice.invoice_type === "avoir";
  const lang: PdfLang = invoice.language === "en" ? "en" : "fr";
  const t = LABELS[lang];
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const linkedNumber = linkedInvoiceNumber ?? invoice.linked_invoice_number ?? null;
  // Même n° de TVA que celui injecté dans le XML : le PDF lisible et les données
  // structurées doivent dire strictement la même chose.
  const sellerVatDisplay = resolveVatNumber(
    invoice.seller_tva_number,
    invoice.seller_siren,
    isFranchise
  ).value;

  const showBank =
    !!paymentInfo &&
    (paymentInfo.method === "bank" || paymentInfo.method === "both") &&
    !!paymentInfo.bankIban;
  const showLink =
    !!paymentInfo &&
    (paymentInfo.method === "link" || paymentInfo.method === "both") &&
    !!paymentInfo.linkUrl;

  // Un avoir doit se lire comme un avoir dès la première ligne. Le PDF est ce
  // que le client ouvre et ce que son comptable classe : lui présenter
  // « FACTURE » sur un document qui rend de l'argent, c'est provoquer une
  // écriture à l'envers.
  const title = isAvoir
    ? t.titleAvoir
    : isAcompte
    ? t.titleAcompte
    : isSolde
    ? t.titleSolde
    : t.titleFacture;

  const bandeau = isAcompte
    ? `Facture d'acompte${
        invoice.deposit_percentage
          ? `, ${invoice.deposit_percentage}% du montant total de la prestation`
          : ""
      }. Le solde fera l'objet d'une facture distincte.`
    : isSolde
    ? `Facture de solde${
        linkedNumber ? `, vient en déduction de la facture d'acompte n° ${linkedNumber}` : ""
      }.`
    : null;

  const bankText = [
    `${t.bankTransfer}${paymentInfo?.bankAccountName ? `, ${t.accountHolder} : ${paymentInfo.bankAccountName}` : ""}`,
    `IBAN : ${paymentInfo?.bankIban ?? ""}`,
    paymentInfo?.bankBic ? `BIC : ${paymentInfo.bankBic}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const linkText = `${t.onlinePayment}${
    paymentInfo?.linkProvider ? ` (${paymentInfo.linkProvider})` : ""
  } : ${paymentInfo?.linkUrl ?? ""}`;

  // Rien à payer sur un avoir : c'est le vendeur qui doit. Afficher un IBAN ou
  // un lien de paiement inviterait le client à régler un document qui le crédite.
  const paiement =
    !isAvoir && (showBank || showLink)
      ? [...(showBank ? [bankText] : []), ...(showLink ? [linkText] : [])]
      : null;

  const conditions =
    invoice.payment_terms || invoice.notes
      ? [
          ...(invoice.payment_terms ? [`${t.paymentPrefix} ${invoice.payment_terms}`] : []),
          ...(invoice.notes ? [invoice.notes] : []),
        ]
      : null;

  const operationLabel =
    invoice.operation_category === "services"
      ? "Prestation de services"
      : invoice.operation_category === "goods"
      ? "Livraison de biens"
      : "Livraison de biens et prestation de services";

  const mentions = [
    exonere
      ? exo.mention
      : `Facture soumise à TVA, Taux applicable : ${invoice.tva_rate}%${
          invoice.payment_on_debit
            ? ", TVA acquittée sur les débits (art. 1693 bis CGI)"
            : ", TVA acquittée sur les encaissements"
        }`,
    `Nature de l'opération : ${operationLabel}`,
    "En cas de retard de paiement, des pénalités de retard sont exigibles dès le lendemain de la date d'échéance au taux de 3× le taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (Art. L441-10 C.Com.).",
    "Aucun escompte accordé pour paiement anticipé.",
  ].join("\n");

  const vendeurLignes = [
    ...addressLines(invoice.seller_address),
    ...(idLabel(invoice.seller_siren) ? [idLabel(invoice.seller_siren) as string] : []),
    ...(sellerVatDisplay ? [`${t.vatNo} : ${sellerVatDisplay}`] : []),
  ];
  const clientLignes = [
    ...(invoice.client_name && invoice.client_company ? [invoice.client_name] : []),
    ...addressLines(invoice.client_address),
    ...(idLabel(invoice.client_siren) ? [idLabel(invoice.client_siren) as string] : []),
    ...(invoice.client_vat_number ? [`${t.vatNo} : ${invoice.client_vat_number}`] : []),
  ];

  const ventil = ventilationTva(invoice.items, invoice.tva_rate);
  const tva =
    ventil.multiTaux && !exonere
      ? ventil.groupes.map((g) => ({ libelle: `${t.vatRate} ${g.taux}%`, montant: fmtMontant(g.montant_tva) }))
      : [
          {
            libelle: exonere ? t.vatNotApplicable : `${t.vatRate} ${invoice.tva_rate}%`,
            montant: fmtMontant(invoice.total_ttc - invoice.total_ht),
          },
        ];

  const sellerId = idLabel(invoice.seller_siren);
  const pied = `${invoice.seller_company || invoice.seller_name || ""}${sellerId ? ` • ${sellerId}` : ""}`;

  return {
    accent,
    t,
    title,
    numero: `${t.numberPrefix} ${invoice.invoice_number}`,
    emise: `${t.issuedOn} ${fmtDateDoc(invoice.issue_date, dateLocale)}`,
    echeance: invoice.due_date ? `${t.dueOn} ${fmtDateDoc(invoice.due_date, dateLocale)}` : null,
    bandeau,
    vendeur: { nom: invoice.seller_company || invoice.seller_name || "", lignes: vendeurLignes },
    client: { nom: invoice.client_company || invoice.client_name || "", lignes: clientLignes },
    lignes: invoice.items.map((item) => ({
      description: item.description,
      qte: fmtQty(item.quantity, item.unit),
      unite: item.unit,
      pu: fmtMontant(item.unit_price),
      total: fmtMontant(item.total),
    })),
    totalHt: fmtMontant(invoice.total_ht),
    tva,
    totalFinal: { libelle: isAvoir ? t.totalCredit : t.totalInclVat, montant: fmtMontant(invoice.total_ttc) },
    paiement,
    conditions,
    mentions,
    pied,
  };
}
