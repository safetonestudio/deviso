"use client";

import { useState } from "react";

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = (n: number) => `${nombre.format(Math.round(n))} €`;
const INITIALES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Plafond « rond » de l'echelle : 4 600 donne 5 000, 12 300 donne 15 000. */
function plafondRond(max: number) {
  if (max <= 0) return 0;
  const puissance = Math.pow(10, Math.floor(Math.log10(max)));
  for (const pas of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (pas * puissance >= max) return pas * puissance;
  }
  return 10 * puissance;
}

/**
 * Chiffre d'affaires encaisse mois par mois sur l'annee. Echelle a trois
 * reperes, moyenne en pointille, montant du mois au survol, au focus clavier
 * ou au toucher. Les mois a venir gardent leur place, vides, pour que la
 * largeur des barres ne change pas au fil de l'annee.
 * Widget autonome : ne depend que de ses props.
 */
export function CaMensuelBarres({ mensuelHt, moisCourant, annee }: { mensuelHt: number[]; moisCourant: number; annee: number }) {
  const [actif, setActif] = useState<number | null>(null);

  const mois = mensuelHt.slice(0, moisCourant + 1);
  const max = Math.max(0, ...mois);
  const plafond = plafondRond(max);
  const ecoules = mois.length;
  const moyenne = ecoules ? mois.reduce((s, v) => s + v, 0) / ecoules : 0;
  const meilleur = mois.indexOf(max);
  const affiche = actif ?? moisCourant;

  return (
    <section className="carte p-5 min-w-0 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Chiffre d&apos;affaires encaissé</h2>
          <p className="text-[13px] text-gray-400">Mois par mois, {annee}, hors taxes</p>
        </div>
        {max > 0 && (
          <div className="text-right" aria-live="polite">
            <div className="text-[13px] text-gray-400">{MOIS[affiche]} {annee}</div>
            <div className="text-[18px] leading-tight font-semibold text-ink tabular-nums">{euros(mensuelHt[affiche] ?? 0)}</div>
          </div>
        )}
      </div>

      {max <= 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">
          Tes encaissements apparaîtront ici dès ta première facture payée.
        </p>
      ) : (
        <>
          <div className="flex gap-3 mt-4 flex-1 min-h-[188px]">
            {/* Echelle */}
            <div className="flex flex-col justify-between text-[11px] text-gray-400 tabular-nums text-right pb-6 shrink-0" aria-hidden="true">
              <span>{nombre.format(plafond)}</span>
              <span>{nombre.format(plafond / 2)}</span>
              <span>0</span>
            </div>

            <div className="relative flex-1 min-w-0">
              {/* Reperes horizontaux */}
              <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none" aria-hidden="true">
                <div className="border-t border-ds-border" />
                <div className="border-t border-ds-border" />
                <div className="border-t border-ds-border" />
              </div>
              {/* Moyenne */}
              <div
                className="absolute inset-x-0 bottom-6 pointer-events-none"
                style={{ height: `calc((100% - 1.5rem) * ${moyenne / plafond})` }}
                aria-hidden="true"
              >
                <div className="border-t border-dashed border-gray-400" />
              </div>

              <div
                className="relative h-full flex items-stretch gap-1 sm:gap-2"
                role="group"
                aria-label={`Chiffre d'affaires encaissé par mois en ${annee}`}
                onMouseLeave={() => setActif(null)}
              >
                {INITIALES.map((initiale, i) => {
                  const futur = i > moisCourant;
                  const v = futur ? 0 : mensuelHt[i] ?? 0;
                  const h = futur ? 0 : Math.max(1.5, (v / plafond) * 100);
                  const courant = i === moisCourant;
                  const survole = i === actif;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={futur}
                      onMouseEnter={() => !futur && setActif(i)}
                      onFocus={() => !futur && setActif(i)}
                      onBlur={() => setActif(null)}
                      onClick={() => !futur && setActif(i)}
                      aria-label={futur ? `${MOIS[i]} : à venir` : `${MOIS[i]} : ${euros(v)}`}
                      className="group flex-1 min-w-0 flex flex-col justify-end items-center gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-default"
                    >
                      <span className="w-full flex-1 flex items-end justify-center">
                        <span
                          className={`relative block w-full max-w-[38px] rounded-t-[7px] rounded-b-[2px] ${
                            courant ? "barre-ca-courant" : survole ? "barre-ca-survol" : "barre-ca"
                          }`}
                          style={{ height: `${h}%` }}
                        >
                          {survole && (
                            <span className="bulle-graphique absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-left z-10 pointer-events-none">
                              <span className="block text-[11px] text-gray-400 capitalize">{MOIS[i]}</span>
                              <span className="block text-[13px] font-semibold text-ink tabular-nums">{euros(v)}</span>
                            </span>
                          )}
                        </span>
                      </span>
                      <span className={`h-4 text-[11px] leading-4 ${courant || survole ? "text-ink font-semibold" : futur ? "text-gray-500" : "text-gray-400"}`}>
                        {initiale}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 mt-3 pt-3 border-t border-ds-border text-[13px] text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-4 border-t border-dashed border-gray-400" aria-hidden="true" />
              Moyenne mensuelle <span className="font-semibold text-ink tabular-nums">{euros(moyenne)}</span>
            </span>
            <span>
              Meilleur mois, {MOIS[meilleur]} <span className="font-semibold text-ink tabular-nums">{euros(max)}</span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
