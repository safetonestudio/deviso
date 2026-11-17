/**
 * Le document de la page d'accueil : un devis composé comme une pièce
 * imprimée, qui peut devenir facture puis être payé. Construit en HTML pour
 * rester net à toute taille ; toutes les mesures sont en em, et la taille de
 * base suit la largeur du conteneur (unités cqw), pour que le document garde
 * ses proportions de la page d'accueil au téléphone.
 *
 * Contenu d'exemple : émetteur, client, prestations et montants fictifs,
 * totaux exacts (4 500 € HT, TVA 20 %, 5 400 € TTC).
 */
export type EtatDocument = "devis" | "envoye" | "signe" | "facture" | "paye";

const PAPIER = "#F6F7F5";
const ENCRE = "#16211C";
const GRIS = "#5A6460";
const FILET = "#E3E5DF";
const VERT = "#0F7A55";
const NB = "\u00a0";

/** Statuts aux couleurs de l'application : brouillon gris, envoyé bleu,
    signé vert, transmise bleu, payée vert plein. */
const STATUT: Record<EtatDocument, { texte: string; fond: string; encre: string }> = {
  devis: { texte: "Brouillon", fond: "#E9ECE8", encre: "#4B5550" },
  envoye: { texte: "Envoyé", fond: "#E1EBF2", encre: "#2F556C" },
  signe: { texte: "Signé", fond: "#E1F0E7", encre: "#0C6B4C" },
  facture: { texte: "Transmise", fond: "#E1EBF2", encre: "#2F556C" },
  paye: { texte: "Payée", fond: "#0F7A55", encre: "#FFFFFF" },
};

const LIGNES: [string, string, number][] = [
  ["Audit et arborescence", "1 forfait", 500],
  ["Maquettes des cinq pages", "5 pages", 1400],
  ["Intégration et adaptation mobile", "1 forfait", 1800],
  ["Formulaire de contact et RGPD", "1 forfait", 800],
];
const HT = LIGNES.reduce((s, l) => s + l[2], 0);
const TVA = Math.round(HT * 0.2);
const euros = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)},00\u202f€`;

export function DocumentDevis({ etat, compact = false, className = "" }: { etat: EtatDocument; compact?: boolean; className?: string }) {
  const facture = etat === "facture" || etat === "paye";
  const signe = etat === "signe" || facture;

  return (
    <div className={`@container w-full ${className}`}>
      <div
        data-ui
        role="img"
        aria-label={
          facture
            ? `Facture FAC-2026-031 pour le Cabinet Lefèvre Avocats, 5 400 € TTC${etat === "paye" ? ", payée après une relance" : ""}`
            : `Devis DEV-2026-048 pour le Cabinet Lefèvre Avocats, 5 400 € TTC${signe ? ", signé par le client" : ""}`
        }
        className="relative rounded-[0.6em] overflow-hidden"
        style={{ backgroundColor: PAPIER, color: ENCRE, fontSize: "max(10.5px, 2.35cqw)", padding: "clamp(1.4em, 7.5cqw, 3.2em) clamp(1.2em, 8cqw, 3.4em) clamp(1.3em, 7cqw, 3em)" }}
      >
        {/* En-tête : émetteur et pièce */}
        <div className="flex items-start justify-between" style={{ gap: "2em" }}>
          <div className="flex items-center" style={{ gap: "0.8em" }}>
            <span className="grid place-items-center font-semibold" style={{ width: "2.4em", height: "2.4em", borderRadius: "0.4em", backgroundColor: ENCRE, color: PAPIER, fontSize: "1em" }}>
              SD
            </span>
            <div style={{ lineHeight: 1.35 }}>
              <div className="font-semibold" style={{ fontSize: "1.05em" }}>Studio Durand</div>
              <div style={{ color: GRIS, fontSize: "0.85em" }}>Design et développement web, Lyon</div>
            </div>
          </div>
          <div className="text-right" style={{ lineHeight: 1.35 }}>
            <div className="font-semibold tracking-[0.04em]" style={{ fontSize: "1.45em", lineHeight: 1.05 }}>{facture ? "FACTURE" : "DEVIS"}</div>
            <div className="tabular-nums" style={{ color: GRIS, fontSize: "0.85em", marginTop: "0.35em" }}>
              {facture ? "FAC-2026-031, émise le 03/11/2026" : "DEV-2026-048, du 20/10/2026"}
            </div>
            <span
              className="inline-block font-semibold transition-colors duration-500"
              style={{ marginTop: "0.6em", padding: "0.25em 0.8em", borderRadius: "999px", fontSize: "0.8em", backgroundColor: STATUT[etat].fond, color: STATUT[etat].encre }}
            >
              {STATUT[etat].texte}
            </span>
          </div>
        </div>

        {!compact && (<>
        {/* Parties */}
        <div className="grid grid-cols-2" style={{ gap: "2em", marginTop: "2.6em", lineHeight: 1.45 }}>
          <div style={{ fontSize: "0.85em", color: GRIS }}>
            <div style={{ color: ENCRE, fontWeight: 600, fontSize: "1.1em" }}>Marie Durand, EI</div>
            12 rue Mercière, 69002 Lyon
            <br />
            marie@studio-durand.fr
          </div>
          <div style={{ fontSize: "0.85em", color: GRIS }}>
            <div style={{ fontSize: "0.9em", marginBottom: "0.2em" }}>Adressé à</div>
            <div style={{ color: ENCRE, fontWeight: 600, fontSize: "1.1em" }}>Cabinet Lefèvre Avocats</div>
            8 place Bellecour, 69002 Lyon
          </div>
        </div>

        {/* Objet */}
        <div className="font-semibold" style={{ fontSize: "1.2em", marginTop: "2.4em", letterSpacing: "-0.01em" }}>
          Refonte du site vitrine, cinq pages
        </div>

        {/* Lignes */}
        <table className="w-full tabular-nums" style={{ marginTop: "1.2em", borderCollapse: "collapse", fontSize: "0.92em" }}>
          <thead>
            <tr style={{ color: GRIS, fontSize: "0.85em", textAlign: "left" }}>
              <th className="font-medium" style={{ paddingBottom: "0.7em", borderBottom: `1px solid ${FILET}` }}>Prestation</th>
              <th className="font-medium" style={{ paddingBottom: "0.7em", borderBottom: `1px solid ${FILET}` }}>Quantité</th>
              <th className="font-medium text-right" style={{ paddingBottom: "0.7em", borderBottom: `1px solid ${FILET}` }}>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {LIGNES.map(([libelle, qte, montant]) => (
              <tr key={libelle}>
                <td style={{ padding: "0.85em 1em 0.85em 0", borderBottom: `1px solid ${FILET}` }}>{libelle}</td>
                <td style={{ padding: "0.85em 1em 0.85em 0", borderBottom: `1px solid ${FILET}`, color: GRIS }}>{qte}</td>
                <td className="text-right font-medium" style={{ padding: "0.85em 0", borderBottom: `1px solid ${FILET}` }}>{euros(montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        </>)}

        {/* Totaux, et à leur gauche le tampon de paiement */}
        <div className="flex items-center justify-between" style={{ marginTop: compact ? "2.2em" : "1.4em", gap: "2em" }}>
        <div
          aria-hidden="true"
          className="font-semibold tracking-[0.06em] text-center shrink-0"
          style={{
            marginLeft: "0.6em",
            padding: "0.5em 1em",
            border: `0.16em solid ${VERT}`,
            borderRadius: "0.5em",
            color: VERT,
            fontSize: "1.1em",
            lineHeight: 1.25,
            transform: `rotate(-7deg) scale(${etat === "paye" ? 1 : 1.25})`,
            opacity: etat === "paye" ? 1 : 0,
            transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(.2,.8,.2,1.2)",
          }}
        >
          PAYÉE
          <div className="font-medium tracking-normal" style={{ fontSize: "0.62em" }}>le 12/11/2026, après une relance</div>
        </div>
        <div className="tabular-nums" style={{ width: "48%", fontSize: "0.92em" }}>
          <div className="flex justify-between" style={{ color: GRIS, padding: "0.25em 0" }}><span>Total HT</span><span>{euros(HT)}</span></div>
          <div className="flex justify-between" style={{ color: GRIS, padding: "0.25em 0" }}><span>TVA 20 %</span><span>{euros(TVA)}</span></div>
          <div className="flex justify-between font-semibold" style={{ borderTop: `1.5px solid ${ENCRE}`, marginTop: "0.5em", paddingTop: "0.6em", fontSize: "1.25em" }}>
            <span>Total TTC</span>
            <span>{euros(HT + TVA)}</span>
          </div>
        </div>
        </div>

        {/* Pied : signature du client, puis conformité de la facture */}
        <div className="grid grid-cols-[1.6fr_1fr] items-end" style={{ gap: "2em", marginTop: "2.4em" }}>
          <div style={{ fontSize: "0.82em", color: GRIS, lineHeight: 1.45 }}>
            {facture ? (
              <div style={{ lineHeight: 1.5 }}>
                <div>Échéance</div>
                <div className="tabular-nums" style={{ color: ENCRE, fontWeight: 600, fontSize: "1.15em" }}>10/11/2026, par virement</div>
              </div>
            ) : (<>
            <div style={{ marginBottom: "0.4em" }}>Bon pour accord</div>
            <div className="relative" style={{ height: "3.2em" }}>
              <svg viewBox="0 0 260 90" aria-hidden="true" className="absolute left-0 bottom-0 h-full" fill="none" stroke={ENCRE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: signe ? 1 : 0, transition: "opacity 0.6s ease" }}>
                <path className={signe ? "trace-signature" : ""} d="M8 62c14-30 26-46 34-44 10 3-12 52-2 54 10 2 22-40 34-38 9 2-6 30 4 32 12 2 20-28 32-26 8 2-2 22 8 22 14 0 26-30 40-30 10 0 4 24 16 24 16 0 30-18 78-22" />
              </svg>
              <div className="absolute left-0 right-0 bottom-0" style={{ borderBottom: `1px solid ${FILET}` }} />
            </div>
            <div style={{ marginTop: "0.4em", opacity: signe ? 1 : 0, transition: "opacity 0.6s ease" }}>Signé par Pierre Lefèvre le 21/10/2026 à 10 h 42</div>
            </>)}
          </div>
          <div className="text-right" style={{ fontSize: "0.82em", lineHeight: 1.45 }}>
            <div style={{ opacity: facture ? 1 : 0, transition: "opacity 0.6s ease" }}>
              <span className="inline-block font-semibold" style={{ padding: "0.3em 0.7em", borderRadius: "0.4em", backgroundColor: "#E4F1EA", color: VERT }}>Facture électronique conforme</span>
              <div style={{ color: GRIS, marginTop: "0.5em" }}>Transmise par une plateforme agréée</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const MOIS: [string, number][] = [["Juillet", 5900], ["Août", 4100], ["Septembre", 8400]];

/** Feuille des chiffres : même papier, même gabarit que le document, pour que
    la dernière étape ne change pas d'échelle. */
export function FeuilleChiffres() {
  return (
    <div className="@container w-full">
      <div
        data-ui
        role="img"
        aria-label="Chiffres du 3e trimestre : 18 400 € de chiffre d'affaires encaissé, 3 680 € de TVA collectée, prochaine déclaration de TVA en décembre"
        className="rounded-[0.6em] flex flex-col lg:aspect-[555/696]"
        style={{ backgroundColor: PAPIER, color: ENCRE, fontSize: "max(10.5px, 2.35cqw)", padding: "clamp(1.4em, 7.5cqw, 3.2em) clamp(1.2em, 8cqw, 3.4em)" }}
      >
        <div className="flex items-start justify-between" style={{ gap: "2em" }}>
          <div style={{ lineHeight: 1.35 }}>
            <div className="font-semibold" style={{ fontSize: "1.05em" }}>Studio Durand</div>
            <div style={{ color: GRIS, fontSize: "0.85em" }}>3ᵉ trimestre 2026</div>
          </div>
          <div className="font-semibold tracking-[0.04em]" style={{ fontSize: "1.45em", lineHeight: 1.05 }}>CHIFFRES</div>
        </div>
        <div style={{ marginTop: "3em", color: GRIS, fontSize: "0.9em" }}>Chiffre d&apos;affaires encaissé, hors taxes</div>
        <div className="font-semibold tabular-nums" style={{ fontSize: "3.6em", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.15em" }}>18 400 €</div>
        <div className="grid grid-cols-2" style={{ gap: "0.8em", marginTop: "2.2em" }}>
          <div style={{ backgroundColor: "#E1EBF2", borderRadius: "0.5em", padding: "1em 1.1em" }}>
            <div style={{ color: "#2F556C", fontSize: "0.85em" }}>TVA collectée</div>
            <div className="font-semibold tabular-nums" style={{ fontSize: "1.5em", marginTop: "0.2em" }}>3 680 €</div>
          </div>
          <div style={{ backgroundColor: "#F6EBD9", borderRadius: "0.5em", padding: "1em 1.1em" }}>
            <div style={{ color: "#7A4E12", fontSize: "0.85em" }}>Prochaine déclaration de TVA</div>
            <div className="font-semibold" style={{ fontSize: "1.5em", marginTop: "0.2em" }}>En décembre</div>
          </div>
        </div>
        <table className="w-full tabular-nums" style={{ marginTop: "2.4em", borderCollapse: "collapse", fontSize: "0.92em" }}>
          <tbody>
            {MOIS.map(([mois, m]) => (
              <tr key={mois}>
                <td style={{ padding: "0.7em 0", borderBottom: `1px solid ${FILET}`, color: GRIS }}>{mois}</td>
                <td className="text-right font-medium" style={{ padding: "0.7em 0", borderBottom: `1px solid ${FILET}` }}>{euros(Number(m))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-auto grid grid-cols-3 items-end" style={{ gap: "1.2em", height: "6.5em", paddingTop: "1.6em" }} aria-hidden="true">
          {MOIS.map(([mois, m]) => (
            <div key={mois} className="flex flex-col items-center" style={{ gap: "0.4em" }}>
              <div className="w-full" style={{ height: `${(Number(m) / 8400) * 4}em`, backgroundColor: VERT, opacity: 0.85, borderRadius: "0.3em 0.3em 0 0" }} />
              <div style={{ color: GRIS, fontSize: "0.8em" }}>{String(mois).slice(0, 4)}.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Téléphone : ce qui change à chaque étape, à taille de lecture. */
export function ApercuEtat({ etat }: { etat: EtatDocument }) {
  const facture = etat === "facture" || etat === "paye";
  return (
    <div data-ui className="rounded-xl p-5 text-[15px]" style={{ backgroundColor: PAPIER, color: ENCRE }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold tracking-[0.04em] text-[17px]">{facture ? "FACTURE" : "DEVIS"}</div>
          <div className="tabular-nums text-[13px]" style={{ color: GRIS }}>{facture ? "FAC-2026-031" : "DEV-2026-048"}, Cabinet Lefèvre Avocats</div>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold" style={{ backgroundColor: STATUT[etat].fond, color: STATUT[etat].encre }}>
          {STATUT[etat].texte}
        </span>
      </div>
      <div className="mt-4 pt-4 flex items-end justify-between gap-4" style={{ borderTop: `1px solid ${FILET}` }}>
        {etat === "devis" && (
          <div className="w-full space-y-1.5 tabular-nums">
            {LIGNES.map(([l, , m]) => (
              <div key={l} className="flex justify-between gap-3"><span>{l}</span><span className="whitespace-nowrap">{euros(m)}</span></div>
            ))}
          </div>
        )}
        {etat === "signe" && (
          <div>
            <svg viewBox="0 0 260 90" aria-hidden="true" className="h-10" fill="none" stroke={ENCRE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 62c14-30 26-46 34-44 10 3-12 52-2 54 10 2 22-40 34-38 9 2-6 30 4 32 12 2 20-28 32-26 8 2-2 22 8 22 14 0 26-30 40-30 10 0 4 24 16 24 16 0 30-18 78-22" />
            </svg>
            <div className="mt-1 text-[13px]" style={{ color: GRIS }}>Signé par Pierre Lefèvre, le 21/10/2026</div>
          </div>
        )}
        {etat === "facture" && (
          <div>
            <span className="inline-block rounded-md px-2.5 py-1 text-[13px] font-semibold" style={{ backgroundColor: "#E4F1EA", color: VERT }}>Facture électronique conforme</span>
            <div className="mt-1.5 text-[13px]" style={{ color: GRIS }}>Transmise par une plateforme{NB}agréée</div>
          </div>
        )}
        {etat === "paye" && (
          <div className="font-semibold tracking-[0.06em] text-center -rotate-6 rounded-md px-3 py-1.5" style={{ border: `2px solid ${VERT}`, color: VERT }}>
            PAYÉE
            <div className="font-medium tracking-normal text-[11px]">le 12/11/2026, après une relance</div>
          </div>
        )}
        {etat !== "devis" && (
          <div className="text-right tabular-nums">
            <div className="text-[13px]" style={{ color: GRIS }}>Total TTC</div>
            <div className="font-semibold text-[17px] whitespace-nowrap">{euros(HT + TVA)}</div>
          </div>
        )}
      </div>
      {etat === "devis" && (<>
        <div className="mt-3 space-y-1 tabular-nums text-[13px]" style={{ color: GRIS }}>
          <div className="flex justify-between"><span>Total HT</span><span className="whitespace-nowrap">{euros(HT)}</span></div>
          <div className="flex justify-between"><span>TVA 20{NB}%</span><span className="whitespace-nowrap">{euros(TVA)}</span></div>
        </div>
        <div className="mt-2 pt-2 flex justify-between font-semibold tabular-nums" style={{ borderTop: `1.5px solid ${ENCRE}` }}>
          <span>Total TTC</span><span className="whitespace-nowrap">{euros(HT + TVA)}</span>
        </div>
      </>)}
    </div>
  );
}
