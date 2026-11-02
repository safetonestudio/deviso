import Link from "next/link";

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;

/**
 * Prochaine echeance de declaration URSSAF du micro-entrepreneur en franchise,
 * avec le CA du trimestre et les cotisations estimees. Affichee seulement
 * quand l'echeance s'applique : pas de variante de remplacement.
 * Widget autonome : ne depend que de ses props.
 */
export function EcheanceCarte({
  echeance,
  trimestre,
  caTrimestreHt,
  annee,
  cotisations = null,
  acre = false,
}: {
  /** "31 janvier", "30 avril"... */
  echeance: string;
  trimestre: number;
  caTrimestreHt: number;
  annee: number;
  /** CA du trimestre x taux 2026 de la categorie Urssaf. null : categorie inconnue. */
  cotisations?: number | null;
  /** L'ACRE reduit les cotisations : l'estimation affichee ne la deduit pas. */
  acre?: boolean;
}) {
  const [jour, ...reste] = echeance.split(" ");
  // L'echeance du 4e trimestre tombe en janvier de l'annee suivante.
  const anneeEcheance = trimestre === 4 ? annee + 1 : annee;

  return (
    <section className="carte p-6 flex flex-col gap-4 min-w-0 h-full">
      <div>
        <h2 className="text-[20px] font-semibold text-ink">Prochaine échéance</h2>
        <p className="text-[14px] text-gray-400">Déclaration URSSAF, {trimestre}e trimestre</p>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-[38px] leading-none font-bold text-ink">{jour}</span>
        <span className="text-[17px] font-semibold text-gray-400">
          {reste.join(" ")} {anneeEcheance}
        </span>
      </div>

      <div className="divide-y divide-ds-border border-y border-ds-border text-[15px]">
        <div className="flex items-center justify-between gap-3 py-4">
          <span className="text-gray-400">CA du trimestre à ce jour</span>
          <span className="font-display font-semibold text-ink">{euros(caTrimestreHt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-4">
          <span className="text-gray-400">Cotisations estimées{acre && cotisations !== null ? ", hors ACRE" : ""}</span>
          {cotisations !== null ? (
            <span className="font-display font-semibold text-ink">{euros(cotisations)}</span>
          ) : (
            <Link href="/declarations" className="text-indigo-400 font-semibold hover:underline">
              Préciser mon activité
            </Link>
          )}
        </div>
      </div>

      <p className="text-[14px] text-gray-400 bg-ds-elevated rounded-xl px-4 py-3.5">
        Montants prêts à reporter. Deviso les calcule depuis tes encaissements, tu n&apos;as plus qu&apos;à déclarer.
      </p>
    </section>
  );
}
