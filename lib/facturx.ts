/**
 * Génère un fichier Factur-X (PDF avec XML CII embarqué)
 * Implémentation 100% pure JS, aucun module natif requis
 *
 * Flow :
 * 1. Génère le PDF visuel avec @react-pdf/renderer
 * 2. Génère le XML CII avec invoice-xml.ts
 * 3. Utilise pdf-lib pour embarquer le XML dans le PDF
 */
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { PDFDocument, PDFName, AFRelationship } from "pdf-lib";
import React from "react";
import { InvoicePDF, PaymentInfo } from "./invoice-pdf";
import { generateFacturXml } from "./invoice-xml";
import type { Invoice } from "@/types";
import type { ReactElement } from "react";

export async function generateFacturXPdf(invoice: Invoice, accentColor?: string, paymentInfo?: PaymentInfo, linkedInvoiceNumber?: string | null): Promise<Buffer> {
  // 1. Génération du PDF visuel (React PDF → Buffer)
  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoicePDF, { invoice, accentColor, paymentInfo, linkedInvoiceNumber }) as ReactElement<React.ComponentProps<typeof Document>>
  );

  // 2. Génération du XML CII
  const xml = generateFacturXml(invoice, linkedInvoiceNumber, paymentInfo);
  const xmlBytes = new TextEncoder().encode(xml);

  // 3. Chargement du PDF avec pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // 4. Embarquement du XML. Le standard Factur-X impose le nom "factur-x.xml"
  //    et la relation AFRelationship = Data.
  await pdfDoc.attach(xmlBytes, "factur-x.xml", {
    mimeType: "application/xml",
    description: "Factur-X EN 16931 Invoice Data",
    creationDate: new Date(invoice.issue_date),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Data,
  });

  // 5. Métadonnées PDF
  pdfDoc.setTitle(`Facture ${invoice.invoice_number}`);
  pdfDoc.setAuthor(invoice.seller_company || invoice.seller_name || "Deviso");
  pdfDoc.setSubject(
    `Facture ${invoice.invoice_number}, ${invoice.client_company || invoice.client_name || ""}`
  );
  pdfDoc.setCreator("Deviso, getdeviso.fr");
  pdfDoc.setProducer("Deviso Factur-X Generator");
  pdfDoc.setKeywords(["Factur-X", "EN 16931", "Invoice", invoice.invoice_number]);

  // 6. Métadonnées XMP Factur-X : c'est ce bloc qui permet à un logiciel
  //    destinataire d'identifier le PDF comme une facture Factur-X et de savoir
  //    quel fichier joint contient les données structurées.
  setFacturXXmpMetadata(pdfDoc, invoice);

  const result = await pdfDoc.save();
  return Buffer.from(result);
}

/**
 * Injecte les métadonnées XMP Factur-X dans le catalogue du PDF.
 *
 * Le schéma d'extension `fx` déclare le type de document, le nom du fichier
 * joint et le profil de conformité — c'est la signature qui distingue un
 * Factur-X d'un simple PDF avec une pièce jointe.
 *
 * Note : on ne revendique pas `pdfaid:part = 3` (PDF/A-3). L'archivage PDF/A
 * exige l'incorporation de toutes les polices et un profil ICC, ce que la
 * génération actuelle (polices Helvetica standard) ne fournit pas encore.
 * Annoncer une conformité PDF/A non atteinte serait une fausse déclaration.
 */
function setFacturXXmpMetadata(pdfDoc: PDFDocument, invoice: Invoice): void {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Facture ${esc(invoice.invoice_number)}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${esc(invoice.seller_company || invoice.seller_name || "Deviso")}</rdf:li></rdf:Seq></dc:creator>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>Deviso Factur-X Generator</pdf:Producer>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentFileName</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description></rdf:li>
                <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentType</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>INVOICE</pdfaProperty:description></rdf:li>
                <rdf:li rdf:parseType="Resource"><pdfaProperty:name>Version</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The version of the Factur-X standard</pdfaProperty:description></rdf:li>
                <rdf:li rdf:parseType="Resource"><pdfaProperty:name>ConformanceLevel</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The conformance level of the embedded XML</pdfaProperty:description></rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const bytes = new TextEncoder().encode(xmp);
  const stream = pdfDoc.context.stream(bytes, {
    Type: "Metadata",
    Subtype: "XML",
    Length: bytes.length,
  });
  pdfDoc.catalog.set(PDFName.of("Metadata"), pdfDoc.context.register(stream));
}

/**
 * Nom de fichier conventionnel pour une facture Factur-X
 * ex: "factur-x_2026-001_MARTIN.pdf"
 */
export function facturxFilename(invoice: Invoice): string {
  const clientSlug = (invoice.client_company || invoice.client_name || "CLIENT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .slice(0, 20);
  return `factur-x_${invoice.invoice_number}_${clientSlug}.pdf`;
}
