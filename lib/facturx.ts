/**
 * Génère un fichier Factur-X (PDF avec XML CII embarqué)
 * Implémentation 100% pure JS — aucun module natif requis
 *
 * Flow :
 * 1. Génère le PDF visuel avec @react-pdf/renderer
 * 2. Génère le XML CII avec invoice-xml.ts
 * 3. Utilise pdf-lib pour embarquer le XML dans le PDF
 */
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import React from "react";
import { InvoicePDF } from "./invoice-pdf";
import { generateFacturXml } from "./invoice-xml";
import type { Invoice } from "@/types";
import type { ReactElement } from "react";

export async function generateFacturXPdf(invoice: Invoice): Promise<Buffer> {
  // 1. Génération du PDF visuel (React PDF → Buffer)
  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoicePDF, { invoice }) as ReactElement<React.ComponentProps<typeof Document>>
  );

  // 2. Génération du XML CII
  const xml = generateFacturXml(invoice);
  const xmlBytes = new TextEncoder().encode(xml);

  // 3. Chargement du PDF avec pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // 4. Embarquement du XML — le standard Factur-X impose le nom "factur-x.xml"
  await pdfDoc.attach(xmlBytes, "factur-x.xml", {
    mimeType: "application/xml",
    description: "Factur-X BASIC Invoice Data",
    creationDate: new Date(invoice.issue_date),
    modificationDate: new Date(),
  });

  // 5. Métadonnées PDF
  pdfDoc.setTitle(`Facture ${invoice.invoice_number}`);
  pdfDoc.setAuthor(invoice.seller_company || invoice.seller_name || "Deviso");
  pdfDoc.setSubject(
    `Facture ${invoice.invoice_number} — ${invoice.client_company || invoice.client_name || ""}`
  );
  pdfDoc.setCreator("Deviso — deviso.fr");
  pdfDoc.setProducer("Deviso Factur-X Generator");
  pdfDoc.setKeywords(["Factur-X", "BASIC", "Invoice", invoice.invoice_number]);

  const result = await pdfDoc.save();
  return Buffer.from(result);
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
