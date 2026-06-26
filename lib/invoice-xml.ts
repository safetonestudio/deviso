/**
 * Génère le XML CII (Cross Industry Invoice) au format Factur-X BASIC
 * Conforme à EN 16931 / Factur-X 1.09 / réforme française septembre 2026
 *
 * Profil BASIC : mentions obligatoires + lignes détaillées
 * TypeCode 380 = Facture commerciale standard
 */
import type { Invoice } from "@/types";

function xmlDate(dateStr: string): string {
  // "2026-06-26" → "20260626"
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

export function generateFacturXml(invoice: Invoice): string {
  const issueDate = xmlDate(invoice.issue_date);
  const dueDate = invoice.due_date ? xmlDate(invoice.due_date) : null;

  // Calcul TVA
  const tvaAmount = xmlAmount(invoice.total_ttc - invoice.total_ht);

  // Catégorie TVA selon le type d'opération
  // S = Services, G = Goods (biens), M = Mixed
  const taxCategoryMap: Record<string, string> = {
    services: "S",
    goods: "S",
    mixed: "S",
  };
  const taxCategory = taxCategoryMap[invoice.operation_category] || "S";

  const lines = invoice.items
    .map((item, idx) => {
      const lineTotal = xmlAmount(item.total);
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${xmlAmount(item.unit_price)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
          <ram:RateApplicablePercent>${invoice.tva_rate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotal}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <!-- ── Contexte ── -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <!-- ── En-tête ── -->
  <rsm:ExchangedDocument>
    <ram:ID>${esc(invoice.invoice_number)}</ram:ID>
    <ram:TypeCode>${invoice.type_code || "380"}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${invoice.notes ? `<ram:IncludedNote><ram:Content>${esc(invoice.notes)}</ram:Content></ram:IncludedNote>` : ""}
  </rsm:ExchangedDocument>

  <!-- ── Transaction ── -->
  <rsm:SupplyChainTradeTransaction>

    ${lines}

    <!-- ── Accord commercial ── -->
    <ram:ApplicableHeaderTradeAgreement>

      <!-- Vendeur (Seller) -->
      <ram:SellerTradeParty>
        <ram:Name>${esc(invoice.seller_company || invoice.seller_name || "")}</ram:Name>
        ${invoice.seller_siren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(invoice.seller_siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${invoice.seller_address ? `<ram:PostalTradeAddress><ram:LineOne>${esc(invoice.seller_address)}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>` : ""}
        ${invoice.seller_tva_number ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(invoice.seller_tva_number)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>

      <!-- Client (Buyer) -->
      <ram:BuyerTradeParty>
        <ram:Name>${esc(invoice.client_company || invoice.client_name || "")}</ram:Name>
        ${invoice.client_siren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(invoice.client_siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ""}
        ${invoice.client_address ? `<ram:PostalTradeAddress><ram:LineOne>${esc(invoice.client_address)}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>` : ""}
        ${invoice.delivery_address ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="addr">${esc(invoice.delivery_address)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>

    </ram:ApplicableHeaderTradeAgreement>

    <!-- ── Livraison ── -->
    <ram:ApplicableHeaderTradeDelivery/>

    <!-- ── Règlement ── -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>

      <!-- TVA -->
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${tvaAmount}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${xmlAmount(invoice.total_ht)}</ram:BasisAmount>
        <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
        <ram:RateApplicablePercent>${invoice.tva_rate}</ram:RateApplicablePercent>
        ${invoice.payment_on_debit ? "<ram:DueDateTypeCode>72</ram:DueDateTypeCode>" : ""}
      </ram:ApplicableTradeTax>

      <!-- Conditions de paiement -->
      ${dueDate ? `<ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${dueDate}</udt:DateTimeString></ram:DueDateDateTime>${invoice.payment_terms ? `<ram:Description>${esc(invoice.payment_terms)}</ram:Description>` : ""}</ram:SpecifiedTradePaymentTerms>` : ""}

      <!-- Totaux -->
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${xmlAmount(invoice.total_ht)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${xmlAmount(invoice.total_ht)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${tvaAmount}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${xmlAmount(invoice.total_ttc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${xmlAmount(invoice.total_ttc)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>

    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>

</rsm:CrossIndustryInvoice>`;
}
