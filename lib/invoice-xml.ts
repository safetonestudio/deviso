/**
 * Génère le XML CII (Cross Industry Invoice) au profil **EN 16931 (Comfort)**
 * — le profil exigé par la réforme française de la facturation électronique.
 *
 * ⚠️ Le profil BASIC utilisé jusqu'au 13/07/2026 n'est PAS couvert par les
 * validateurs de la réforme (« Aucun validateur trouvé pour ce format »).
 * Voir docs/facturx/ecart-basic-vers-en16931.md pour l'analyse complète.
 *
 * Conformité vérifiée contre le validateur officiel :
 *   POST https://api.superpdp.tech/v1.beta/validation_reports
 */
import type { Invoice } from "@/types";
import {
  toSiren,
  parseAddress,
  resolveVatNumber,
  electronicAddress,
} from "./facturx-helpers";
import type { PaymentInfo } from "./invoice-pdf";
import { resolveAddress } from "@/lib/address";

function xmlDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function xmlAmount(n: number): string {
  return n.toFixed(2);
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Codes unités UN/ECE Rec. 20 attendus par EN 16931. C62 = unité par défaut. */
function unitCode(unit: string | null | undefined): string {
  switch ((unit ?? "").toLowerCase().trim()) {
    case "heure":
    case "heures":
    case "h":
      return "HUR";
    case "jour":
    case "jours":
      return "DAY";
    case "mois":
      return "MON";
    case "km":
      return "KMT";
    case "kg":
      return "KGM";
    case "m2":
    case "m²":
      return "MTK";
    case "m":
    case "mètre":
    case "metre":
      return "MTR";
    default:
      return "C62";
  }
}

/**
 * Mentions légales françaises obligatoires en notes structurées (BR-FR-05).
 * Elles doivent figurer dans le XML, pas seulement dans le PDF lisible.
 */
const LEGAL_NOTES: { code: string; content: string }[] = [
  {
    code: "PMT",
    content:
      "Indemnite forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 EUR (art. L441-10 du Code de commerce)",
  },
  {
    code: "PMD",
    content:
      "Penalites de retard : 3 fois le taux d'interet legal en vigueur, exigibles des le lendemain de la date d'echeance",
  },
  { code: "AAB", content: "Aucun escompte accorde pour paiement anticipe" },
];

/**
 * Adresse postale structurée (BG-5 / BG-8). Ordre XSD strict.
 *
 * On lit d'abord les colonnes séparées, saisies dans le formulaire. Le découpage
 * du texte libre ne sert plus que de repli pour les documents créés avant leur
 * introduction : deviner un code postal par expression régulière produisait des
 * factures non conformes sans qu'aucun contrôle ne le signale.
 */
function postalAddress(
  parts: { street?: string | null; postcode?: string | null; city?: string | null; country?: string | null },
  raw: string | null | undefined
): string {
  const a = resolveAddress(parts, raw);
  return [
    "<ram:PostalTradeAddress>",
    a.postcode ? `<ram:PostcodeCode>${esc(a.postcode)}</ram:PostcodeCode>` : "",
    a.street ? `<ram:LineOne>${esc(a.street)}</ram:LineOne>` : "",
    a.city ? `<ram:CityName>${esc(a.city)}</ram:CityName>` : "",
    `<ram:CountryID>${esc(a.country || "FR")}</ram:CountryID>`,
    "</ram:PostalTradeAddress>",
  ].join("");
}

export function generateFacturXml(
  invoice: Invoice,
  linkedInvoiceNumber?: string | null,
  paymentInfo?: PaymentInfo
): string {
  const issueDate = xmlDate(invoice.issue_date);
  const dueDate = invoice.due_date ? xmlDate(invoice.due_date) : null;
  const tvaAmount = xmlAmount(invoice.total_ttc - invoice.total_ht);

  // Catégorie TVA : E = exonéré (franchise art. 293 B CGI), S = taux standard
  const isFranchise = invoice.tva_rate === 0;
  const taxCategory = isFranchise ? "E" : "S";
  const exemptionReason = isFranchise
    ? "<ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>"
    : "";

  // Identifiants dérivés : SIREN 9 chiffres depuis le SIRET, TVA calculée si absente
  const sellerSiren = toSiren(invoice.seller_siren);
  const buyerSiren = toSiren(invoice.client_siren);
  const sellerVat = resolveVatNumber(invoice.seller_tva_number, invoice.seller_siren, isFranchise);
  const sellerEas = electronicAddress(invoice.seller_siren);
  const buyerEas = electronicAddress(invoice.client_siren);

  const lines = invoice.items
    .map(
      (item, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${idx + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${esc(item.description)}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${xmlAmount(item.unit_price)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${unitCode(item.unit)}">${item.quantity}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode>${exemptionReason}<ram:CategoryCode>${taxCategory}</ram:CategoryCode><ram:RateApplicablePercent>${invoice.tva_rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${xmlAmount(item.total)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`
    )
    .join("");

  // Notes : mentions légales obligatoires + note libre de l'utilisateur
  const notes = [
    ...LEGAL_NOTES.map(
      (n) => `<ram:IncludedNote><ram:Content>${esc(n.content)}</ram:Content><ram:SubjectCode>${n.code}</ram:SubjectCode></ram:IncludedNote>`
    ),
    invoice.notes ? `<ram:IncludedNote><ram:Content>${esc(invoice.notes)}</ram:Content></ram:IncludedNote>` : "",
  ].join("\n    ");

  // Moyens de paiement structurés (BG-16) : virement SEPA si IBAN renseigné
  const useBank =
    paymentInfo && (paymentInfo.method === "bank" || paymentInfo.method === "both") && paymentInfo.bankIban;
  const paymentMeans = useBank
    ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(
        (paymentInfo?.bankIban ?? "").replace(/\s/g, "")
      )}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>`
    : "";

  const paymentTerms =
    dueDate || invoice.payment_terms
      ? `<ram:SpecifiedTradePaymentTerms>${
          invoice.payment_terms ? `<ram:Description>${esc(invoice.payment_terms)}</ram:Description>` : ""
        }${
          dueDate
            ? `<ram:DueDateDateTime><udt:DateTimeString format="102">${dueDate}</udt:DateTimeString></ram:DueDateDateTime>`
            : ""
        }</ram:SpecifiedTradePaymentTerms>`
      : "";

  // Référence à la facture d'acompte (BG-3) — se place APRÈS les totaux en CII
  const referencedDoc = linkedInvoiceNumber
    ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${esc(linkedInvoiceNumber)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>B1</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(invoice.invoice_number)}</ram:ID>
    <ram:TypeCode>${invoice.type_code || "380"}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${issueDate}</udt:DateTimeString></ram:IssueDateTime>
    ${notes}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(invoice.seller_company || invoice.seller_name || "")}</ram:Name>
        ${sellerSiren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(sellerSiren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${postalAddress(
          { street: invoice.seller_street, postcode: invoice.seller_postcode, city: invoice.seller_city, country: invoice.seller_country },
          invoice.seller_address
        )}
        ${sellerEas ? `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${esc(sellerEas)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
        ${
          sellerVat.value
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(sellerVat.value)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : // Franchise en base : BR-E-02 exige tout de même un identifiant fiscal
              // vendeur. À défaut de n° de TVA, on fournit BT-32 (schemeID "FC") = SIREN.
              sellerSiren
              ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(sellerSiren)}</ram:ID></ram:SpecifiedTaxRegistration>`
              : ""
        }
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(invoice.client_company || invoice.client_name || "")}</ram:Name>
        ${buyerSiren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(buyerSiren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${postalAddress(
          { street: invoice.client_street, postcode: invoice.client_postcode, city: invoice.client_city, country: invoice.client_country },
          invoice.client_address
        )}
        ${buyerEas ? `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${esc(buyerEas)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
        ${invoice.client_vat_number ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(invoice.client_vat_number)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${issueDate}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${paymentMeans}
      <ram:ApplicableTradeTax><ram:CalculatedAmount>${tvaAmount}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>${exemptionReason}<ram:BasisAmount>${xmlAmount(invoice.total_ht)}</ram:BasisAmount><ram:CategoryCode>${taxCategory}</ram:CategoryCode>${invoice.payment_on_debit ? "<ram:DueDateTypeCode>72</ram:DueDateTypeCode>" : ""}<ram:RateApplicablePercent>${invoice.tva_rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
      ${paymentTerms}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>${xmlAmount(invoice.total_ht)}</ram:LineTotalAmount><ram:TaxBasisTotalAmount>${xmlAmount(invoice.total_ht)}</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">${tvaAmount}</ram:TaxTotalAmount><ram:GrandTotalAmount>${xmlAmount(invoice.total_ttc)}</ram:GrandTotalAmount><ram:DuePayableAmount>${xmlAmount(invoice.total_ttc)}</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      ${referencedDoc}
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`.replace(/^\s*\n/gm, "");
}
