"use client";

import { NATURES_TVA, TAUX_FRANCAIS, type NatureTva } from "@/lib/achats-tva";

/**
 * Choix de la TVA que porte la facture d'un achat à l'étranger (21/11/2026),
 * commun à la saisie et à la correction. Il décide de l'écriture comptable
 * (déductible, en charge, autoliquidée) et de la catégorie déclarée à la
 * plateforme : il doit être explicite, pas déduit du montant.
 */
const etiquette = "block text-xs font-medium text-gray-400 mb-1.5";
const champ =
  "w-full bg-ds-bg border border-ds-border text-ink rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500";

export function ChoixTvaAchat({
  nature,
  onNature,
  tauxAutoliq,
  onTauxAutoliq,
  importation,
  prefixe,
}: {
  nature: NatureTva;
  onNature: (n: NatureTva) => void;
  tauxAutoliq: string;
  onTauxAutoliq: (t: string) => void;
  /** Biens achetés hors UE : sans TVA sur la facture, la TVA se liquide en douane. */
  importation: boolean;
  /** Préfixe des identifiants, pour que deux formulaires ouverts n'aient pas les mêmes. */
  prefixe: string;
}) {
  const aide = NATURES_TVA.find((n) => n.valeur === nature)?.aide;
  return (
    <div className="sm:col-span-2">
      <fieldset>
        <legend className={etiquette}>TVA sur la facture du fournisseur</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {NATURES_TVA.map((n) => {
            const choisi = nature === n.valeur;
            return (
              <button
                key={n.valeur}
                type="button"
                role="radio"
                aria-checked={choisi}
                onClick={() => onNature(n.valeur)}
                className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                  choisi ? "border-indigo-500 bg-indigo-500/10 text-ink font-medium" : "border-ds-border text-gray-300 hover:border-gray-600"
                }`}
              >
                {n.libelle}
              </button>
            );
          })}
        </div>
        {aide && <p className="text-xs text-gray-500 mt-1.5">{aide}</p>}
      </fieldset>

      {nature === "aucune" &&
        (importation ? (
          <p className="text-xs text-gray-500 mt-3">
            Biens achetés hors de l&apos;Union européenne : la TVA se paie à l&apos;importation, sur la
            déclaration en douane. Ton comptable la passe depuis ce document.
          </p>
        ) : (
          <div className="mt-3 sm:max-w-xs">
            <label className={etiquette} htmlFor={`${prefixe}-taux-autoliq`}>Taux français applicable</label>
            <select
              id={`${prefixe}-taux-autoliq`}
              aria-label="Taux français applicable"
              className={champ}
              value={tauxAutoliq}
              onChange={(e) => onTauxAutoliq(e.target.value)}
            >
              {TAUX_FRANCAIS.map((t) => (
                <option key={t} value={String(t)}>
                  {String(t).replace(".", ",")} %{t === 20 ? " (taux normal)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Le taux qu&apos;appliquerait un fournisseur français pour le même achat.
            </p>
          </div>
        ))}
    </div>
  );
}
