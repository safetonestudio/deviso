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
import { contenuFacture, fmtQty, type PaymentInfo } from "./facture-contenu";

// Réexportés : facturx.ts et invoice-xml.ts les importent d'ici.
export { fmtQty };
export type { PaymentInfo };

/**
 * Polices incorporées au PDF.
 *
 * PDF/A-3 interdit de dépendre des polices installées sur la machine du lecteur :
 * tout doit être embarqué. Les 14 polices « standard » PDF (Helvetica…) ne le sont
 * jamais, d'où le passage à Liberation Sans, métriquement compatible avec
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


// Palette de couleurs
const SLATE_900 = "#0f172a";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_100 = "#f1f5f9";


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

interface Props {
  invoice: Invoice;
  accentColor?: string;
  paymentInfo?: PaymentInfo;
  linkedInvoiceNumber?: string | null;
}

/**
 * Tous les textes viennent de `contenuFacture()` (lib/facture-contenu.ts), la
 * même source que la feuille affichée dans l'application : l'écran et le PDF
 * ne peuvent plus dire deux choses différentes.
 *
 * Les textes multi-lignes sont des chaînes uniques jointes par "\n" : un
 * <Text> à enfants multiples fait émettre à @react-pdf un run de texte vide
 * dans la police par défaut (Helvetica), non incorporée, ce qui suffit à
 * invalider la conformité PDF/A. Un enfant unique de type chaîne l'évite.
 */
export function InvoicePDF({ invoice, accentColor, paymentInfo, linkedInvoiceNumber }: Props) {
  const c = contenuFacture(invoice, accentColor, paymentInfo, linkedInvoiceNumber);
  const { t, accent } = c;

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
            <Text style={[styles.brandName, { color: accent }]}>{c.title}</Text>
            <Text style={{ fontSize: 8, color: SLATE_400, marginTop: 2 }}>{c.vendeur.nom}</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>{c.numero}</Text>
            <Text style={styles.invoiceMeta}>{c.emise}</Text>
            {c.echeance && <Text style={styles.invoiceMeta}>{c.echeance}</Text>}
          </View>
        </View>

        {/* ── Bandeau acompte / solde ── */}
        {c.bandeau && (
          <View style={[styles.typeBanner, { backgroundColor: accent }]}>
            <Text style={styles.typeBannerText}>{c.bandeau}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{t.from}</Text>
            <Text style={styles.partyName}>{c.vendeur.nom}</Text>
            {c.vendeur.lignes.map((l, i) => (
              <Text key={i} style={styles.partyDetail}>{l}</Text>
            ))}
          </View>

          <View style={styles.partyBox}>
            <Text style={[styles.partyLabel, { textAlign: "right" }]}>{t.billTo}</Text>
            <Text style={[styles.partyName, { textAlign: "right" }]}>{c.client.nom}</Text>
            {c.client.lignes.map((l, i) => (
              <Text key={i} style={[styles.partyDetail, { textAlign: "right" }]}>{l}</Text>
            ))}
          </View>
        </View>

        {/* ── Tableau ── */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: accent }]}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>{t.colDesc}</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>{t.colQty}</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>{t.colUnit}</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>{t.colPrice}</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>{t.colTotal}</Text>
          </View>

          {c.lignes.map((l, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.cellTextBold, styles.colDesc]}>{l.description}</Text>
              <Text style={[styles.cellText, styles.colQty]}>{l.qte}</Text>
              <Text style={[styles.cellText, styles.colUnit]}>{l.unite}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>{l.pu}</Text>
              <Text style={[styles.cellTextBold, styles.colTotal]}>{l.total}</Text>
            </View>
          ))}
        </View>

        {/* ── Totaux ── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.subtotal}</Text>
              <Text style={styles.totalValue}>{c.totalHt}</Text>
            </View>
            {c.tva.map((g, gi) => (
              <View style={styles.totalRow} key={gi}>
                <Text style={styles.totalLabel}>{g.libelle}</Text>
                <Text style={styles.totalValue}>{g.montant}</Text>
              </View>
            ))}
            <View style={[styles.totalRowFinal, { backgroundColor: accent }]}>
              <Text style={styles.totalLabelFinal}>{c.totalFinal.libelle}</Text>
              <Text style={styles.totalValueFinal}>{c.totalFinal.montant}</Text>
            </View>
          </View>
        </View>

        {/* ── Modalités de paiement (jamais sur un avoir, voir contenuFacture) ── */}
        {c.paiement && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t.paymentDetails}</Text>
            {c.paiement.map((p, i) => (
              <Text key={i} style={styles.notesText}>{p}</Text>
            ))}
          </View>
        )}

        {/* ── Notes / Conditions ── */}
        {c.conditions && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t.termsNotes}</Text>
            {c.conditions.map((p, i) => (
              <Text key={i} style={styles.notesText}>{p}</Text>
            ))}
          </View>
        )}

        {/* ── Mentions légales 2026 ── */}
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>{t.legalHeading}</Text>
          <Text style={styles.notesText}>{c.mentions}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{c.pied}</Text>
          <Text style={[styles.facturxBadge, { color: accent }]}>{t.footerBadge}</Text>
        </View>
      </Page>
    </Document>
  );
}
