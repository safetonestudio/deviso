import type { JaugeFranchise } from "@/lib/seuils-micro";
import { Anneau } from "@/components/dashboard/MiniVisuels";

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
  /** Assujettis : TVA percue sur les encaissements du trimestre (null en franchise). */
  tvaTrimestre?: number | null;
};

/**
 * Bloc heros du tableau de bord : le chiffre d'affaires encaisse de l'annee,
 * et la distance au seuil de franchise de TVA. Le montant est l'element le
 * plus grand de l'ecran : c'est la question que se pose un micro-entrepreneur
 * en ouvrant son outil (ou j'en suis, et quand vais-je devoir facturer la TVA).
 * Widget autonome : ne depend que de ses props.
 */
export function HeroCa({ annee, caAnneeHt, caTrimestreHt, trimestre, caMoisTtc, jauge, tvaTrimestre = null }: Props) {
  const pct = jauge ? Math.min(100, Math.round(jauge.ratio * 100)) : 0;
  const etat = !jauge ? null : jauge.ratio >= 1 ? "depasse" : jauge.ratio >= 0.85 ? "proche" : "ok";
  const anneau = etat === "depasse" ? "text-red-500" : etat === "proche" ? "text-amber-500" : "text-indigo-500";

  return (
    <section className="carte carte-heros p-5 sm:p-7 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-center">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-gray-300">Chiffre d&apos;affaires encaissé, {annee}</div>
        <div className="font-semibold text-ink leading-none tracking-[-0.02em] text-[40px] sm:text-[52px] mt-2 mb-3 tabular-nums wrap-break-word">
          {nombre.format(Math.round(caAnneeHt))}
          <span className="text-[0.5em] text-gray-400 font-medium ml-1.5">€</span>
        </div>
        <p className="text-[13px] text-gray-400">
          Base encaissement, comme ton livre des recettes.{" "}
          <span className="text-ink font-semibold">{euros(caTrimestreHt)}</span> encaissés ce trimestre.
        </p>
      </div>

      {jauge ? (
        <div className="flex items-center gap-5 min-w-0 lg:justify-end">
          <Anneau pct={pct} classe={anneau} description="Part du seuil de franchise de TVA atteinte" />
          <div className="min-w-0 flex flex-col gap-1.5">
            <div className="text-[13px] font-medium text-gray-300">
              Seuil de franchise TVA{jauge.categorie === "services" ? ", prestations" : ""}
            </div>
            <div className="text-[20px] leading-none font-semibold text-ink tabular-nums">{euros(jauge.seuil)}</div>
            <p className="text-[13px] text-gray-400 max-w-[260px]">
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
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-ds-elevated p-4">
            <div className="text-[13px] text-gray-400">Encaissé ce mois</div>
            <div className="text-xl font-semibold text-ink mt-1 tabular-nums">{euros(caMoisTtc)}</div>
            <div className="text-xs text-gray-400 mt-1">TTC</div>
          </div>
          <div className="rounded-lg bg-ds-elevated p-4">
            <div className="text-[13px] text-gray-400">TVA perçue ce trimestre</div>
            <div className="text-xl font-semibold text-ink mt-1 tabular-nums">{euros(tvaTrimestre ?? 0)}</div>
            <div className="text-xs text-gray-400 mt-1">sur tes encaissements</div>
          </div>
        </div>
      )}
    </section>
  );
}
