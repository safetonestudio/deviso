const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;
const INITIALES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/**
 * Chiffre d'affaires encaisse mois par mois, du mois de janvier au mois en
 * cours. Barres a l'echelle du meilleur mois, mois en cours en couleur pleine.
 * Widget autonome : ne depend que de ses props.
 */
export function CaMensuelBarres({ mensuelHt, moisCourant, annee }: { mensuelHt: number[]; moisCourant: number; annee: number }) {
  const mois = mensuelHt.slice(0, moisCourant + 1);
  const max = Math.max(0, ...mois);
  const ecoules = mois.length;
  const moyenne = ecoules ? mois.reduce((s, v) => s + v, 0) / ecoules : 0;
  const meilleur = mois.indexOf(max);

  return (
    <section className="carte p-6 min-w-0 h-full">
      <h2 className="text-[17px] font-semibold text-ink">Chiffre d&apos;affaires encaissé</h2>
      <p className="text-[13px] text-gray-400 mb-4">Mois par mois, {annee}, hors taxes</p>

      {max <= 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">
          Tes encaissements apparaîtront ici dès ta première facture payée.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2 sm:gap-4 h-48" role="img" aria-label={`Chiffre d'affaires encaissé par mois en ${annee}`}>
            {mois.map((v, i) => {
              const h = Math.max(2, Math.round((v / max) * 100));
              const courant = i === moisCourant;
              return (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 min-w-0" title={`${MOIS[i]} : ${euros(v)}`}>
                  <div
                    className={`w-full max-w-[40px] rounded-md ${courant ? "bg-indigo-500" : "bg-indigo-500/20"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`text-[12px] ${courant ? "text-ink font-semibold" : "text-gray-400"}`}>{INITIALES[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-between gap-2 mt-4 pt-4 border-t border-ds-border text-[13px] text-gray-400">
            <span>
              Moyenne mensuelle <span className="font-display font-semibold text-ink">{euros(moyenne)}</span>
            </span>
            <span>
              Meilleur mois, {MOIS[meilleur]} <span className="font-display font-semibold text-ink">{euros(max)}</span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
