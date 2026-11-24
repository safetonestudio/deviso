import type { Invoice } from "@/types";
import { contenuFacture, type PaymentInfo } from "@/lib/facture-contenu";

/**
 * La facture telle que son client la reçoit : reproduction à l'écran du PDF
 * Factur-X (lib/invoice-pdf.tsx).
 *
 * Mêmes blocs, même ordre, mêmes couleurs, mêmes textes : tous viennent de
 * `contenuFacture()`, la fonction que lit aussi le PDF. Les dimensions sont
 * celles du PDF, exprimées en points A4 (595 de large) et converties à la
 * largeur de la colonne par l'unité `--pt` (globals.css, `.ff-*`). La feuille
 * reste blanche en thème sombre : c'est du papier.
 *
 * Sur téléphone, la feuille se recompose au lieu de rétrécir (un A4 réduit à
 * 375 px serait illisible) : marges réduites, parties l'une sous l'autre,
 * colonnes Unité et P.U. masquées. Le texte, lui, ne change pas.
 */
export function FeuilleFacture({
  invoice,
  accentColor,
  paymentInfo,
  linkedInvoiceNumber,
}: {
  invoice: Invoice;
  accentColor?: string | null;
  paymentInfo?: PaymentInfo | null;
  linkedInvoiceNumber?: string | null;
}) {
  const c = contenuFacture(invoice, accentColor, paymentInfo, linkedInvoiceNumber);
  const { t } = c;
  const accent = { backgroundColor: c.accent };
  // Les cellules d'en-tête se touchent : une ombre d'un pixel de la même
  // couleur comble le liseré clair que le navigateur laisse entre elles, pour
  // retrouver la barre continue du PDF.
  const entete = { backgroundColor: c.accent, boxShadow: `1px 0 0 ${c.accent}` };

  return (
    <div className="ff-cadre" aria-label={`Aperçu de la facture ${invoice.invoice_number}, identique au PDF`}>
      <article className="ff-page">
        <header className="ff-entete">
          <div>
            <p className="ff-titre" style={{ color: c.accent }}>{c.title}</p>
            <p className="ff-sous-titre">{c.vendeur.nom}</p>
          </div>
          <div className="ff-meta">
            <p className="ff-numero">{c.numero}</p>
            <p>{c.emise}</p>
            {c.echeance && <p>{c.echeance}</p>}
          </div>
        </header>

        {c.bandeau && (
          <p className="ff-bandeau" style={accent}>{c.bandeau}</p>
        )}

        <div className="ff-filet" />

        <div className="ff-parties">
          <div>
            <p className="ff-label">{t.from}</p>
            <p className="ff-nom">{c.vendeur.nom}</p>
            {c.vendeur.lignes.map((l, i) => <p key={i} className="ff-detail">{l}</p>)}
          </div>
          <div className="ff-droite">
            <p className="ff-label">{t.billTo}</p>
            <p className="ff-nom">{c.client.nom}</p>
            {c.client.lignes.map((l, i) => <p key={i} className="ff-detail">{l}</p>)}
          </div>
        </div>

        <table className="ff-table">
          <thead>
            <tr>
              <th className="ff-c-desc" style={entete}>{t.colDesc}</th>
              <th className="ff-c-qte" style={entete}>{t.colQty}</th>
              <th className="ff-c-unite" style={entete}>{t.colUnit}</th>
              <th className="ff-c-pu" style={entete}>{t.colPrice}</th>
              <th className="ff-c-total" style={accent}>{t.colTotal}</th>
            </tr>
          </thead>
          <tbody>
            {c.lignes.map((l, i) => (
              <tr key={i} className={i % 2 === 1 ? "ff-alt" : undefined}>
                <td className="ff-c-desc ff-gras">{l.description}</td>
                <td className="ff-c-qte">{l.qte}<span className="ff-unite-inline"> {l.unite}</span></td>
                <td className="ff-c-unite">{l.unite}</td>
                <td className="ff-c-pu">{l.pu}</td>
                <td className="ff-c-total ff-gras">{l.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ff-totaux">
          <div className="ff-tot-ligne"><span>{t.subtotal}</span><span>{c.totalHt}</span></div>
          {c.tva.map((g, i) => (
            <div key={i} className="ff-tot-ligne"><span>{g.libelle}</span><span>{g.montant}</span></div>
          ))}
          <div className="ff-tot-final" style={accent}>
            <span>{c.totalFinal.libelle}</span><span>{c.totalFinal.montant}</span>
          </div>
        </div>

        {c.paiement && (
          <section className="ff-boite">
            <p className="ff-label">{t.paymentDetails}</p>
            {c.paiement.map((p, i) => <p key={i} className="ff-texte">{p}</p>)}
          </section>
        )}

        {c.conditions && (
          <section className="ff-boite">
            <p className="ff-label">{t.termsNotes}</p>
            {c.conditions.map((p, i) => <p key={i} className="ff-texte">{p}</p>)}
          </section>
        )}

        <section className="ff-boite">
          <p className="ff-label">{t.legalHeading}</p>
          <p className="ff-texte">{c.mentions}</p>
        </section>

        <footer className="ff-pied">
          <span>{c.pied}</span>
          <strong style={{ color: c.accent }}>{t.footerBadge}</strong>
        </footer>
      </article>
    </div>
  );
}
