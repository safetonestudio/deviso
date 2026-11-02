import type { JaugeFranchise } from "@/lib/seuils-micro";

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;

type Props = {
  annee: number;
  caAnneeHt: number;
  caTrimestreHt: number;
  trimestre: number;
  caMoisTtc: number;
  /** null quand le regime de TVA n'est pas la franchise : pas de seuil a suivre. */
  jauge: JaugeFranchise | null;
};

/**
 * Bloc heros du tableau de bord : le chiffre d'affaires encaisse de l'annee,
 * et la distance au seuil de franchise de TVA. Le montant est l'element le
 * plus grand de l'ecran : c'est la question que se pose un micro-entrepreneur
 * en ouvrant son outil (ou j'en suis, et quand vais-je devoir facturer la TVA).
 * Widget autonome : ne depend que de ses props.
 */
export function HeroCa({ annee, caAnneeHt, caTrimestreHt, trimestre, caMoisTtc, jauge }: Props) {
  const pct = jauge ? Math.min(100, Math.round(jauge.ratio * 100)) : 0;
  const etat = !jauge ? null : jauge.ratio >= 1 ? "depasse" : jauge.ratio >= 0.85 ? "proche" : "ok";
  const remplissage = etat === "depasse" ? "bg-red-600" : etat === "proche" ? "bg-amber-500" : "bg-indigo-600";

  return (
    <section className="carte p-6 sm:p-7 grid gap-7 lg:grid-cols-[1.15fr_1fr] items-center">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-gray-400">Chiffre d&apos;affaires encaissé, {annee}</div>
        <div className="font-display font-bold text-ink leading-none tracking-[-0.03em] text-[44px] sm:text-[60px] mt-2 mb-3 break-words">
          {nombre.format(Math.round(caAnneeHt))}
          <span className="text-[0.5em] text-gray-400 font-semibold ml-1.5">€</span>
        </div>
        <p className="text-sm text-gray-400">
          Hors taxes, à l&apos;encaissement, comme ton livre des recettes.{" "}
          <span className="text-ink font-semibold">{euros(caTrimestreHt)}</span> encaissés au {trimestre}
          <sup>e</sup> trimestre.
        </p>
      </div>

      {jauge ? (
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="flex justify-between gap-3 text-[13px] text-gray-400">
            <span>
              Seuil de franchise TVA{jauge.categorie === "services" ? ", prestations" : ""}
            </span>
            <span className="text-ink font-semibold">{euros(jauge.seuil)}</span>
          </div>
          <div
            className="relative h-3 rounded-full bg-ds-elevated border border-ds-border overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Part du seuil de franchise de TVA atteinte"
          >
            <div className={`jauge-remplir absolute inset-y-0 left-0 rounded-full ${remplissage}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[13px] text-gray-400">
            <span>0 €</span>
            <span>{pct} % atteint</span>
          </div>
          <p className="text-[13px] text-gray-400">
            {etat === "depasse" ? (
              <span className="text-red-400 font-semibold">
                Seuil dépassé : tes factures doivent maintenant porter la TVA.
              </span>
            ) : (
              <>
                Il te reste{" "}
                <span className={`font-bold ${etat === "proche" ? "text-amber-400" : "text-indigo-400"}`}>{euros(jauge.reste)}</span>{" "}
                avant de devoir facturer la TVA.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ds-elevated p-4">
            <div className="text-[13px] text-gray-400">Ce trimestre</div>
            <div className="font-display text-2xl font-bold text-ink mt-1">{euros(caTrimestreHt)}</div>
            <div className="text-xs text-gray-400 mt-1">hors taxes</div>
          </div>
          <div className="rounded-xl bg-ds-elevated p-4">
            <div className="text-[13px] text-gray-400">Ce mois</div>
            <div className="font-display text-2xl font-bold text-ink mt-1">{euros(caMoisTtc)}</div>
            <div className="text-xs text-gray-400 mt-1">encaissés, TTC</div>
          </div>
        </div>
      )}
    </section>
  );
}
