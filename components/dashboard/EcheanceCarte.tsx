import Link from "next/link";

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;

/**
 * Prochaine echeance de declaration URSSAF (micro-entrepreneur en franchise),
 * avec le CA du trimestre deja calcule. Sans echeance connue, la carte montre
 * le CA du trimestre et renvoie vers les declarations.
 * Widget autonome : ne depend que de ses props.
 */
export function EcheanceCarte({
  echeance,
  trimestre,
  caTrimestreHt,
  annee,
}: {
  /** "31 janvier", "30 avril"... ou null si le regime ne permet pas de l'affirmer. */
  echeance: string | null;
  trimestre: number;
  caTrimestreHt: number;
  annee: number;
}) {
  const [jour, ...reste] = (echeance ?? "").split(" ");
  // L'echeance du 4e trimestre tombe en janvier de l'annee suivante.
  const anneeEcheance = trimestre === 4 ? annee + 1 : annee;

  return (
    <section className="carte p-5 flex flex-col gap-4 min-w-0">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{echeance ? "Prochaine échéance" : "Ce trimestre"}</h2>
        <p className="text-[13px] text-gray-400">
          {echeance ? `Déclaration URSSAF, ${trimestre}e trimestre` : `${trimestre}e trimestre ${annee}`}
        </p>
      </div>

      {echeance && (
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[34px] leading-none font-bold text-ink">{jour}</span>
          <span className="text-[15px] font-semibold text-gray-400">
            {reste.join(" ")} {anneeEcheance}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 py-2.5 border-y border-ds-border text-sm">
        <span className="text-gray-400">CA du trimestre à ce jour</span>
        <span className="font-display font-semibold text-ink">{euros(caTrimestreHt)}</span>
      </div>

      <p className="text-[13px] text-gray-400 bg-ds-elevated rounded-xl px-3.5 py-3">
        {echeance
          ? "Montant calculé depuis tes encaissements, prêt à reporter sur ta déclaration."
          : "Calculé depuis tes encaissements, hors taxes."}{" "}
        <Link href="/declarations" className="text-indigo-400 font-semibold hover:underline">
          Voir mes déclarations
        </Link>
      </p>
    </section>
  );
}
