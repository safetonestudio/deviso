import type { CSSProperties } from "react";
import type { ContenuDocument } from "@/lib/facture-contenu";

/**
 * Un devis ou une facture tel que le reçoit le client.
 *
 * Reproduction à l'écran du PDF de facture (lib/invoice-pdf.tsx) : mêmes
 * blocs, même ordre, mêmes couleurs, mêmes textes. Les textes viennent de
 * `contenuFacture()` ou `contenuDevis()`, que lit aussi le PDF ; le modèle
 * (Classique, Moderne, Épuré, choisi dans Profil) est le même des deux côtés.
 * Les dimensions sont celles du PDF, en points A4 (595 de large), converties
 * à la largeur de la colonne par l'unité `--pt` (globals.css, `.ff-*`). La
 * feuille reste blanche en thème sombre : c'est du papier.
 *
 * Sur téléphone, la feuille se recompose au lieu de rétrécir (un A4 réduit à
 * 375 px serait illisible) : marges réduites, parties l'une sous l'autre,
 * colonnes Unité et P.U. masquées. Le texte, lui, ne change pas.
 */
export function FeuilleDocument({ contenu: c, libelle }: { contenu: ContenuDocument; libelle: string }) {
  const { t } = c;
  const style = { "--accent": c.accent } as CSSProperties;

  return (
    <div className="ff-cadre" style={style} aria-label={libelle}>
      <article className={`ff-page ff-modele-${c.modele}`}>
        <header className="ff-entete">
          <div>
            <p className="ff-titre">{c.title}</p>
            <p className="ff-sous-titre">{c.sousTitre}</p>
          </div>
          <div className="ff-meta">
            {c.numero && <p className="ff-numero">{c.numero}</p>}
            {c.dates.map((d, i) => <p key={i}>{d}</p>)}
          </div>
        </header>

        {c.bandeau && <p className="ff-bandeau">{c.bandeau}</p>}

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

        {c.objet && <p className="ff-objet">{c.objet}</p>}

        <table className="ff-table">
          <thead>
            <tr>
              <th className="ff-c-desc">{t.colDesc}</th>
              <th className="ff-c-qte">{t.colQty}</th>
              <th className="ff-c-unite">{t.colUnit}</th>
              <th className="ff-c-pu">{t.colPrice}</th>
              <th className="ff-c-total">{t.colTotal}</th>
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
          <div className="ff-tot-final">
            <span>{c.totalFinal.libelle}</span><span>{c.totalFinal.montant}</span>
          </div>
        </div>

        {c.encadres.map((e, i) => (
          <section key={i} className="ff-boite">
            <p className="ff-label">{e.titre}</p>
            {e.paragraphes.map((p, j) => <p key={j} className="ff-texte">{p}</p>)}
          </section>
        ))}

        {c.signature && <p className="ff-signature">{c.signature}</p>}

        {c.marque && (
          <p className="ff-marque">
            <a href="https://getdeviso.fr" target="_blank" rel="noopener noreferrer">{c.marque}</a>
          </p>
        )}

        <footer className="ff-pied">
          <span>{c.pied.gauche}</span>
          {c.pied.droite && <strong>{c.pied.droite}</strong>}
        </footer>
      </article>

      {c.annexe && (
        <article className={`ff-page ff-annexe ff-modele-${c.modele} saut-page-avant`}>
          <p className="ff-label">{c.annexe.titre}</p>
          <p className="ff-texte">{c.annexe.texte}</p>
        </article>
      )}
    </div>
  );
}
