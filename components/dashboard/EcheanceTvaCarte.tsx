import Link from "next/link";

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;

/**
 * Prochaine declaration de TVA d'une entreprise assujettie (CA3 ou CA12).
 * Memes montants que le calendrier TVA du cabinet (lib/cabinet-tva-calendrier.ts) :
 * l'entrepreneur et son comptable lisent le meme chiffre.
 * Widget autonome : ne depend que de ses props.
 */
export function EcheanceTvaCarte({
  formulaire,
  periode,
  depot,
  baseHt,
  tva,
  enCours,
}: {
  /** null : periodicite non renseignee, la carte la demande. */
  formulaire: "CA3" | "CA12" | null;
  periode: string;
  depot: string;
  baseHt: number;
  tva: number;
  enCours: boolean;
}) {
  return (
    <section className="carte p-6 flex flex-col gap-4 min-w-0 h-full">
      <div>
        <h2 className="text-[20px] font-semibold text-ink">Prochaine échéance</h2>
        <p className="text-[14px] text-gray-400">
          {formulaire ? `Déclaration de TVA (${formulaire}), ${periode}` : "Déclaration de TVA"}
        </p>
      </div>

      {formulaire ? (
        <>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[17px] font-semibold text-gray-400">À déposer</span>
            <span className="font-display text-[26px] leading-none font-bold text-ink">{depot}</span>
          </div>

          <div className="divide-y divide-ds-border border-y border-ds-border text-[15px]">
            <div className="flex items-center justify-between gap-3 py-4">
              <span className="text-gray-400">Base HT{enCours ? " à ce jour" : ""}</span>
              <span className="font-display font-semibold text-ink">{euros(baseHt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <span className="text-gray-400">TVA collectée{enCours ? " à ce jour" : ""}</span>
              <span className="font-display font-semibold text-ink">{euros(tva)}</span>
            </div>
          </div>

          <p className="text-[14px] text-gray-400 bg-ds-elevated rounded-xl px-4 py-3.5">
            TVA facturée à tes clients sur la période. La TVA de tes achats vient en déduction lors de la déclaration.
          </p>
        </>
      ) : (
        <p className="text-[15px] text-gray-400">
          Indique si tu déclares ta TVA chaque mois, chaque trimestre ou une fois par an pour voir ta prochaine échéance.{" "}
          <Link href="/profil" className="text-indigo-400 font-semibold hover:underline">Préciser ma périodicité</Link>
        </p>
      )}
    </section>
  );
}
