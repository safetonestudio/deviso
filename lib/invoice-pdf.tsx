/**
 * Génère le PDF visuel d'une facture avec @react-pdf/renderer
 * Ce PDF sera ensuite enrichi avec le XML CII pour produire un Factur-X
 *
 * Features :
 * - Couleur d'accent personnalisée (Pro) via prop accentColor
 * - Section « Modalités de paiement » (IBAN / lien de paiement) via prop paymentInfo
 * - Formatage des durées : quantity 2.25 + unit "heure" → "2h15" (fmtQty)
 * - Mentions légales : L441-10 C.Com. (Loi PACTE), SIRET, franchise TVA art. 293 B CGI
 * - Factures d'acompte / de solde : bandeau type + référence facture liée (linkedInvoiceNumber)
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import type { Invoice } from "@/types";
import { digitsOnly, parseAddress, resolveVatNumber } from "./facturx-helpers";

/**
 * Polices incorporées au PDF.
 *
 * PDF/A-3 interdit de dépendre des polices installées sur la machine du lecteur :
 * tout doit être embarqué. Les 14 polices « standard » PDF (Helvetica…) ne le sont
 * jamais, d'où le passage à Liberation Sans — métriquement compatible avec
 * Helvetica, donc le rendu des factures existantes est inchangé.
 */
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

const FONT_REGULAR = path.join(FONT_DIR, "LiberationSans-Regular.ttf");
const FONT_BOLD = path.join(FONT_DIR, "LiberationSans-Bold.ttf");

Font.register({
  family: "LiberationSans",
  fonts: [
    { src: FONT_REGULAR, fontWeight: 400 },
    { src: FONT_BOLD, fontWeight: 700 },
  ],
});

// Filet de sécurité PDF/A : @react-pdf retombe sur Helvetica pour certains
// nœuds (runs de texte vides, polices manquantes). Helvetica étant une police
// « standard » jamais incorporée au fichier, sa seule présence dans les
// ressources d'une page suffit à casser la conformité PDF/A. On redirige donc
// ces noms vers nos fichiers embarqués.
Font.register({
  family: "Helvetica",
  fonts: [
    { src: FONT_REGULAR, fontWeight: 400 },
    { src: FONT_BOLD, fontWeight: 700 },
  ],
});
Font.register({ family: "Helvetica-Bold", src: FONT_BOLD });

// Césure désactivée : le comportement par défaut coupe les mots français
// de façon incorrecte dans les libellés de prestation.
Font.registerHyphenationCallback((word) => [word]);

/**
 * Libellé exact de l'identifiant : SIRET (14 chiffres, établissement) ou
 * SIREN (9, entreprise). Afficher « SIRET » devant un SIREN serait faux.
 */
function idLabel(value: string | null | undefined): string | null {
  const d = digitsOnly(value);
  if (d.length === 14) return `SIRET : ${d}`;
  if (d.length === 9) return `SIREN : ${d}`;
  return value ? `SIRET : ${value}` : null;
}

/** Adresse sur plusieurs lignes : rue puis « CP Ville », comme sur un courrier. */
function addressLines(raw: string | null | undefined): string[] {
  const a = parseAddress(raw);
  const lines: string[] = [];
  if (a.street) lines.push(a.street);
  const cityLine = [a.postcode, a.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (!lines.length && raw) lines.push(raw);
  return lines;
}

// Palette de couleurs
const BRAND = "#4f46e5";
const SLATE_900 = "#0f172a";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_100 = "#f1f5f9";

export interface PaymentInfo {
  method?: string | null; // "none" | "link" | "bank" | "both"
  linkProvider?: string | null;
  linkUrl?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  bankAccountName?: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "LiberationSans",
    fontSize: 9,
    color: SLATE_900,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brandName: {
    fontFamily: "LiberationSans",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
  },
  invoiceLabel: {
    fontFamily: "LiberationSans",
    fontSize: 11,
    fontWeight: 700,
    color: SLATE_900,
    textAlign: "right",
  },
  invoiceMeta: {
    color: SLATE_600,
    fontFamily: "LiberationSans",
    fontSize: 8.5,
    textAlign: "right",
    marginTop: 2,
  },
  // Bandeau acompte / solde
  typeBanner: {
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  typeBannerText: {
    fontFamily: "LiberationSans",
    fontSize: 8.5,
    fontWeight: 700,
    color: "#ffffff",
  },
  // Parties
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 20,
  },
  partyBox: {
    flex: 1,
  },
  partyLabel: {
    fontFamily: "LiberationSans",
    fontSize: 7,
    fontWeight: 700,
    color: SLATE_400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  partyName: {
    fontFamily: "LiberationSans",
    fontSize: 10,
    fontWeight: 700,
    color: SLATE_900,
    marginBottom: 2,
  },
  partyDetail: {
    fontFamily: "LiberationSans",
    fontSize: 8.5,
    color: SLATE_600,
    lineHeight: 1.5,
  },
  // Tableau
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontWeight: 700,
    fontFamily: "LiberationSans",
    fontSize: 7.5,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  cellText: {
    fontFamily: "LiberationSans",
    fontSize: 8.5,
    color: SLATE_600,
  },
  cellTextBold: {
    fontFamily: "LiberationSans",
    fontSize: 8.5,
    fontWeight: 700,
    color: SLATE_900,
  },
  // Totaux
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  totalLabel: { fontFamily: "LiberationSans",
    fontSize: 8.5, color: SLATE_600 },
  totalValue: { fontFamily: "LiberationSans",
    fontSize: 8.5, color: SLATE_600 },
  totalLabelFinal: { fontFamily: "LiberationSans",
    fontSize: 9, fontWeight: 700, color: "#ffffff" },
  totalValueFinal: { fontFamily: "LiberationSans",
    fontSize: 9, fontWeight: 700, color: "#ffffff" },
  // Notes
  notesBox: {
    backgroundColor: SLATE_100,
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  notesLabel: {
    fontFamily: "LiberationSans",
    fontSize: 7,
    fontWeight: 700,
    color: SLATE_400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: "LiberationSans",
    fontSize: 8,
    color: SLATE_600,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 45,
    right: 45,
    borderTopWidth: 1,
    borderTopColor: SLATE_100,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontFamily: "LiberationSans",
    fontSize: 7,
    color: SLATE_400,
  },
  facturxBadge: {
    fontFamily: "LiberationSans",
    fontSize: 7,
    fontWeight: 700,
  },
  divider: {
    height: 1,
    backgroundColor: SLATE_100,
    marginBottom: 20,
  },
});

function fmt(n: number) {
  // Intl fr-FR utilise l'espace fine insécable (U+202F) comme séparateur de
  // milliers — glyphe absent de Helvetica dans @react-pdf, qui rend "/" à la
  // place. On normalise vers une espace classique.
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })
    .format(n)
    .replace(/[\u202F\u00A0]/g, " ");
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
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
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}

interface Props {
  invoice: Invoice;
  accentColor?: string;
  paymentInfo?: PaymentInfo;
  linkedInvoiceNumber?: string | null;
}

export function InvoicePDF({ invoice, accentColor, paymentInfo, linkedInvoiceNumber }: Props) {
  const accent = accentColor || BRAND;
  const isFranchise = invoice.tva_rate === 0;
  const isAcompte = invoice.invoice_type === "acompte";
  const isSolde = invoice.invoice_type === "solde";
  const linkedNumber = linkedInvoiceNumber ?? invoice.linked_invoice_number ?? null;
  // Même n° de TVA que celui injecté dans le XML : le PDF lisible et les données
  // structurées doivent dire strictement la même chose.
  const sellerVatDisplay = resolveVatNumber(
    invoice.seller_tva_number,
    invoice.seller_siren,
    isFranchise
  ).value;

  const showBank =
    paymentInfo &&
    (paymentInfo.method === "bank" || paymentInfo.method === "both") &&
    paymentInfo.bankIban;
  const showLink =
    paymentInfo &&
    (paymentInfo.method === "link" || paymentInfo.method === "both") &&
    paymentInfo.linkUrl;

  const title = isAcompte
    ? "FACTURE D'ACOMPTE"
    : isSolde
    ? "FACTURE DE SOLDE"
    : "FACTURE";

  /**
   * Les textes multi-lignes sont assemblés ici plutôt qu'en JSX.
   *
   * Un <Text> à enfants multiples fait émettre à @react-pdf un run de texte
   * vide dans la police par défaut (Helvetica), non incorporée — ce qui suffit
   * à invalider la conformité PDF/A. Un enfant unique de type chaîne l'évite.
   */
  const bankText = [
    `Virement bancaire${paymentInfo?.bankAccountName ? ` — Titulaire : ${paymentInfo.bankAccountName}` : ""}`,
    `IBAN : ${paymentInfo?.bankIban ?? ""}`,
    paymentInfo?.bankBic ? `BIC : ${paymentInfo.bankBic}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const linkText = `Paiement en ligne sécurisé${
    paymentInfo?.linkProvider ? ` (${paymentInfo.linkProvider})` : ""
  } : ${paymentInfo?.linkUrl ?? ""}`;

  const operationLabel =
    invoice.operation_category === "services"
      ? "Prestation de services"
      : invoice.operation_category === "goods"
      ? "Livraison de biens"
      : "Livraison de biens et prestation de services";

  const legalText = [
    isFranchise
      ? "TVA non applicable, art. 293 B du CGI"
      : `Facture soumise à TVA, Taux applicable : ${invoice.tva_rate}%${
          invoice.payment_on_debit
            ? ", TVA acquittée sur les débits (art. 1693 bis CGI)"
            : ", TVA acquittée sur les encaissements"
        }`,
    `Nature de l'opération : ${operationLabel}`,
    "En cas de retard de paiement, des pénalités de retard sont exigibles dès le lendemain de la date d'échéance au taux de 3× le taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (Art. L441-10 C.Com.).",
    "Aucun escompte accordé pour paiement anticipé.",
  ].join("\n");

  const sellerId = idLabel(invoice.seller_siren);
  const footerText = `${invoice.seller_company || invoice.seller_name || ""}${
    sellerId ? ` • ${sellerId}` : ""
  }`;

  return (
    <Document
      title={`Facture ${invoice.invoice_number}`}
      author={invoice.seller_company || invoice.seller_name || "Deviso"}
      subject={`Facture ${invoice.invoice_number}, ${invoice.client_company || invoice.client_name || ""}`}
      creator="Deviso, getdeviso.fr"
      producer="Deviso Factur-X Generator"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brandName, { color: accent }]}>{title}</Text>
            <Text style={{ fontSize: 8, color: SLATE_400, marginTop: 2 }}>
              {invoice.seller_company || invoice.seller_name || ""}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>N° {invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>
              Émise le {fmtDate(invoice.issue_date)}
            </Text>
            {invoice.due_date && (
              <Text style={styles.invoiceMeta}>
                Échéance le {fmtDate(invoice.due_date)}
              </Text>
            )}
          </View>
        </View>

        {/* ── Bandeau acompte / solde ── */}
        {isAcompte && (
          <View style={[styles.typeBanner, { backgroundColor: accent }]}>
            <Text style={styles.typeBannerText}>
              Facture d&apos;acompte
              {invoice.deposit_percentage
                ? ` — ${invoice.deposit_percentage}% du montant total de la prestation`
                : ""}
              . Le solde fera l&apos;objet d&apos;une facture distincte.
            </Text>
          </View>
        )}
        {isSolde && (
          <View style={[styles.typeBanner, { backgroundColor: accent }]}>
            <Text style={styles.typeBannerText}>
              Facture de solde
              {linkedNumber
                ? ` — vient en déduction de la facture d'acompte n° ${linkedNumber}`
                : ""}
              .
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Émetteur</Text>
            <Text style={styles.partyName}>
              {invoice.seller_company || invoice.seller_name || ""}
            </Text>
            {addressLines(invoice.seller_address).map((l, i) => (
              <Text key={i} style={styles.partyDetail}>{l}</Text>
            ))}
            {idLabel(invoice.seller_siren) && (
              <Text style={styles.partyDetail}>{idLabel(invoice.seller_siren)}</Text>
            )}
            {sellerVatDisplay && (
              <Text style={styles.partyDetail}>N° TVA : {sellerVatDisplay}</Text>
            )}
          </View>

          <View style={styles.partyBox}>
            <Text style={[styles.partyLabel, { textAlign: "right" }]}>
              Destinataire
            </Text>
            <Text style={[styles.partyName, { textAlign: "right" }]}>
              {invoice.client_company || invoice.client_name || ""}
            </Text>
            {invoice.client_name && invoice.client_company && (
              <Text style={[styles.partyDetail, { textAlign: "right" }]}>
                {invoice.client_name}
              </Text>
            )}
            {addressLines(invoice.client_address).map((l, i) => (
              <Text key={i} style={[styles.partyDetail, { textAlign: "right" }]}>{l}</Text>
            ))}
            {idLabel(invoice.client_siren) && (
              <Text style={[styles.partyDetail, { textAlign: "right" }]}>
                {idLabel(invoice.client_siren)}
              </Text>
            )}
            {invoice.client_vat_number && (
              <Text style={[styles.partyDetail, { textAlign: "right" }]}>
                N° TVA : {invoice.client_vat_number}
              </Text>
            )}
          </View>
        </View>

        {/* ── Tableau ── */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: accent }]}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              Prestation
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              P.U. HT
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total HT
            </Text>
          </View>

          {invoice.items.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.cellTextBold, styles.colDesc]}>
                {item.description}
              </Text>
              <Text style={[styles.cellText, styles.colQty]}>
                {fmtQty(item.quantity, item.unit)}
              </Text>
              <Text style={[styles.cellText, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {fmt(item.unit_price)}
              </Text>
              <Text style={[styles.cellTextBold, styles.colTotal]}>
                {fmt(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totaux ── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{fmt(invoice.total_ht)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {isFranchise ? "TVA non applicable" : `TVA ${invoice.tva_rate}%`}
              </Text>
              <Text style={styles.totalValue}>
                {fmt(invoice.total_ttc - invoice.total_ht)}
              </Text>
            </View>
            <View style={[styles.totalRowFinal, { backgroundColor: accent }]}>
              <Text style={styles.totalLabelFinal}>Total TTC</Text>
              <Text style={styles.totalValueFinal}>
                {fmt(invoice.total_ttc)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Modalités de paiement ── */}
        {(showBank || showLink) && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Modalités de paiement</Text>
            {showBank && <Text style={styles.notesText}>{bankText}</Text>}
            {showLink && <Text style={styles.notesText}>{linkText}</Text>}
          </View>
        )}

        {/* ── Notes / Conditions ── */}
        {(invoice.payment_terms || invoice.notes) && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Conditions & notes</Text>
            {invoice.payment_terms && (
              <Text style={styles.notesText}>{`Paiement : ${invoice.payment_terms}`}</Text>
            )}
            {invoice.notes && (
              <Text style={styles.notesText}>{invoice.notes}</Text>
            )}
          </View>
        )}

        {/* ── Mentions légales 2026 ── */}
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Mentions légales</Text>
          <Text style={styles.notesText}>{legalText}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerText}</Text>
          <Text style={[styles.facturxBadge, { color: accent }]}>
            Factur-X EN 16931 — Conforme réforme 2026
          </Text>
        </View>
      </Page>
    </Document>
  );
}
