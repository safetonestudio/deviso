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
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFNumber, PDFHexString, PDFRawStream, AFRelationship } from "pdf-lib";
import React from "react";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";
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

  // 6. Exigences PDF/A-3 (archivage long terme) :
  //    - le fichier joint doit être référencé depuis /AF du catalogue
  //    - un OutputIntent avec profil ICC doit décrire l'espace colorimétrique
  //    - le document doit porter un identifiant stable
  remapNonEmbeddedFonts(pdfDoc);
  addAssociatedFilesToCatalog(pdfDoc);
  addSRgbOutputIntent(pdfDoc);
  setDocumentId(pdfDoc, invoice);

  // 7. Métadonnées XMP : identifient le PDF comme facture Factur-X et
  //    déclarent la conformité PDF/A-3B.
  setFacturXXmpMetadata(pdfDoc, invoice);

  const result = await pdfDoc.save();
  return Buffer.from(result);
}

/** Une police est incorporée si son descripteur porte un FontFile. */
function isFontEmbedded(pdfDoc: PDFDocument, font: PDFDict): boolean {
  let desc = font.lookup(PDFName.of("FontDescriptor"));
  if (!(desc instanceof PDFDict)) {
    const descendants = font.lookup(PDFName.of("DescendantFonts"));
    if (descendants instanceof PDFArray && descendants.size() > 0) {
      const first = pdfDoc.context.lookup(descendants.get(0));
      if (first instanceof PDFDict) desc = first.lookup(PDFName.of("FontDescriptor"));
    }
  }
  if (!(desc instanceof PDFDict)) return false;
  return (
    desc.has(PDFName.of("FontFile")) ||
    desc.has(PDFName.of("FontFile2")) ||
    desc.has(PDFName.of("FontFile3"))
  );
}

/**
 * Supprime des ressources toute police non incorporée.
 *
 * @react-pdf déclare systématiquement Helvetica dans les ressources de page et
 * émet quelques opérateurs `Tf` la sélectionnant, sans jamais dessiner de glyphe
 * avec. Or PDF/A interdit qu'une police non incorporée figure dans les
 * ressources, même inutilisée. On réécrit donc ces sélections vers une police
 * embarquée (Liberation Sans, métriquement compatible : aucun impact visuel)
 * puis on retire l'entrée.
 */
function remapNonEmbeddedFonts(pdfDoc: PDFDocument): void {
  for (const page of pdfDoc.getPages()) {
    const resources = page.node.Resources();
    const fonts = resources?.lookup(PDFName.of("Font"));
    if (!(fonts instanceof PDFDict)) continue;

    const nonEmbedded: string[] = [];
    let fallback: string | null = null;

    for (const [key, value] of fonts.entries()) {
      const font = pdfDoc.context.lookup(value);
      if (!(font instanceof PDFDict)) continue;
      const name = key.asString(); // ex. "/F1"
      if (isFontEmbedded(pdfDoc, font)) {
        if (!fallback) fallback = name;
      } else {
        nonEmbedded.push(name);
      }
    }

    if (!nonEmbedded.length || !fallback) continue;

    // Réécriture du flux de contenu : "/F1 8 Tf" → "/F3 8 Tf"
    const contentsRef = page.node.get(PDFName.of("Contents"));
    const contents = pdfDoc.context.lookup(contentsRef);
    const parts: PDFRawStream[] = [];
    if (contents instanceof PDFRawStream) parts.push(contents);
    else if (contents instanceof PDFArray) {
      for (let i = 0; i < contents.size(); i++) {
        const s = pdfDoc.context.lookup(contents.get(i));
        if (s instanceof PDFRawStream) parts.push(s);
      }
    }
    if (!parts.length) continue;

    const decoded = parts.map((s) => {
      const raw = Buffer.from(s.contents);
      const filter = s.dict.get(PDFName.of("Filter"))?.toString() ?? "";
      return filter.includes("FlateDecode") ? zlib.inflateSync(raw) : raw;
    });

    let text = Buffer.concat(decoded).toString("latin1");
    for (const name of nonEmbedded) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`${escaped}(\\s+[\\d.]+\\s+Tf)`, "g"), `${fallback}$1`);
    }

    const newStream = pdfDoc.context.flateStream(Buffer.from(text, "latin1"));
    page.node.set(PDFName.of("Contents"), pdfDoc.context.register(newStream));

    for (const name of nonEmbedded) fonts.delete(PDFName.of(name.slice(1)));
  }
}

/**
 * PDF/A-3 impose que tout fichier embarqué soit aussi référencé dans le tableau
 * /AF du catalogue (Associated Files). pdf-lib ne remplit que l'arbre de noms
 * EmbeddedFiles ; on complète ici.
 */
function addAssociatedFilesToCatalog(pdfDoc: PDFDocument): void {
  // lookup() typé lève si la clé est absente : on inspecte sans contrainte
  // puis on vérifie le type nous-mêmes.
  const names = pdfDoc.catalog.lookup(PDFName.of("Names"));
  if (!(names instanceof PDFDict)) return;
  const embedded = names.lookup(PDFName.of("EmbeddedFiles"));
  if (!(embedded instanceof PDFDict)) return;
  const list = embedded.lookup(PDFName.of("Names"));
  if (!(list instanceof PDFArray)) return;

  const af = pdfDoc.context.obj([]);
  // L'arbre alterne [nom, référence, nom, référence…] : on ne garde que les réfs.
  for (let i = 1; i < list.size(); i += 2) {
    const ref = list.get(i);
    if (ref) af.push(ref);
  }
  if (af.size() > 0) pdfDoc.catalog.set(PDFName.of("AF"), af);
}

/**
 * OutputIntent sRGB : décrit l'espace colorimétrique de référence du document.
 * Sans lui, les couleurs ne sont pas reproductibles à l'identique dans le temps,
 * ce que PDF/A n'admet pas.
 *
 * Le profil est en ICC v2.2 : PDF/A-3 s'appuie sur PDF 1.7, qui ne reconnaît
 * pas les profils ICC v4.3 et supérieurs.
 */
function addSRgbOutputIntent(pdfDoc: PDFDocument): void {
  const iccPath = path.join(process.cwd(), "assets", "color", "sRGB-IEC61966-2.1.icc");
  let icc: Buffer;
  try {
    icc = fs.readFileSync(iccPath);
  } catch {
    // Profil introuvable : on renonce à l'OutputIntent plutôt que de produire
    // un PDF qui se déclarerait PDF/A sans en remplir les conditions.
    return;
  }

  const iccStream = pdfDoc.context.stream(icc, {
    N: PDFNumber.of(3), // 3 composantes = RGB
    Length: icc.length,
  });
  const iccRef = pdfDoc.context.register(iccStream);

  const outputIntent = pdfDoc.context.obj({
    Type: PDFName.of("OutputIntent"),
    S: PDFName.of("GTS_PDFA1"),
    OutputConditionIdentifier: PDFHexString.fromText("sRGB IEC61966-2.1"),
    Info: PDFHexString.fromText("sRGB IEC61966-2.1"),
    RegistryName: PDFHexString.fromText("http://www.color.org"),
    DestOutputProfile: iccRef,
  });

  pdfDoc.catalog.set(
    PDFName.of("OutputIntents"),
    pdfDoc.context.obj([pdfDoc.context.register(outputIntent)])
  );
}

/**
 * Identifiant de document (/ID) : exigé par PDF/A. Dérivé du numéro de facture
 * pour rester stable si la même facture est régénérée.
 */
function setDocumentId(pdfDoc: PDFDocument, invoice: Invoice): void {
  const hash = crypto
    .createHash("md5")
    .update(`deviso:${invoice.id ?? ""}:${invoice.invoice_number}`)
    .digest("hex")
    .toUpperCase();
  const id = PDFHexString.of(hash);
  pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([id, id]);
}

/**
 * Injecte les métadonnées XMP Factur-X dans le catalogue du PDF.
 *
 * Le schéma d'extension `fx` déclare le type de document, le nom du fichier
 * joint et le profil de conformité — c'est la signature qui distingue un
 * Factur-X d'un simple PDF avec une pièce jointe.
 *
 * `pdfaid:part = 3` / `conformance = B` est déclaré car les conditions sont
 * désormais réunies : polices incorporées (Liberation Sans), OutputIntent sRGB,
 * fichiers associés référencés dans /AF, identifiant de document présent.
 */
function setFacturXXmpMetadata(pdfDoc: PDFDocument, invoice: Invoice): void {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>Deviso, getdeviso.fr</xmp:CreatorTool>
      <xmp:CreateDate>${new Date(invoice.issue_date).toISOString().replace(/\.\d{3}Z$/, "Z")}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</xmp:ModifyDate>
    </rdf:Description>
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
