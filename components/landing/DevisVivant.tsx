"use client";

import { useState } from "react";

/**
 * Le devis du haut de page : le visiteur choisit un métier et lit le brief
 * puis le devis qui en sort. Contenu d'exemple (missions, clients, montants
 * inventés pour la démonstration, totaux exacts), présenté comme un exemple.
 * Sans JavaScript, le premier métier reste affiché.
 */
const EXEMPLES = [
  {
    metier: "Graphiste",
    brief:
      "Identité visuelle pour une boulangerie artisanale à Nantes : logo, palette, carte de visite et enseigne. Livraison sous trois semaines.",
    client: "Boulangerie Le Fournil, Nantes",
    numero: "DEV-2026-047",
    lignes: [
      ["Atelier de cadrage et recherches", 450],
      ["Logo, trois pistes puis finalisation", 1200],
      ["Palette et typographies", 350],
      ["Carte de visite et enseigne", 600],
    ],
  },
  {
    metier: "Développeur web",
    brief:
      "Refonte du site vitrine d'un cabinet d'avocats à Lyon : cinq pages, formulaire de contact, mise en ligne. Délai de trois semaines.",
    client: "Cabinet Durand et Associés, Lyon",
    numero: "DEV-2026-048",
    lignes: [
      ["Audit et arborescence", 500],
      ["Maquettes des cinq pages", 1400],
      ["Intégration et adaptation mobile", 1800],
      ["Formulaire de contact et RGPD", 400],
      ["Mise en ligne et formation", 400],
    ],
  },
  {
    metier: "Coach",
    brief:
      "Accompagnement d'une équipe de huit commerciaux : diagnostic, deux journées d'atelier, suivi individuel sur un mois.",
    client: "Maison Verdier, Bordeaux",
    numero: "DEV-2026-049",
    lignes: [
      ["Entretiens de diagnostic", 600],
      ["Deux journées d'atelier", 2400],
      ["Suivi individuel, huit séances", 1200],
      ["Synthèse et plan d'action", 300],
    ],
  },
] as const;

const euros = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} €`;

export function DevisVivant() {
  const [choix, setChoix] = useState(0);
  const ex = EXEMPLES[choix];
  const total = ex.lignes.reduce((s, [, m]) => s + m, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choisir un métier pour l'exemple">
        {EXEMPLES.map((e, i) => (
          <button
            key={e.metier}
            type="button"
            onClick={() => setChoix(i)}
            aria-pressed={i === choix}
            className={`h-11 px-4 rounded-lg text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
              i === choix ? "bg-ink text-(color:--ds-bg)" : "bg-ds-surface text-ink hover:bg-ds-elevated"
            }`}
          >
            {e.metier}
          </button>
        ))}
      </div>

      <p className="mt-6 mb-6 text-[clamp(18px,1.5vw,22px)] leading-relaxed text-ink" aria-live="polite">
        « {ex.brief} »
      </p>

      {/* Le devis : un vrai fragment du produit, sur sa feuille. */}
      <div
        data-ui
        className="ds-papier mt-auto rounded-lg p-5 sm:p-6"
        style={{ backgroundColor: "#FFFFFF", color: "rgb(22 33 28)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold">Devis {ex.numero}</div>
            <div className="text-[13px] text-gray-500 mt-0.5 break-words">{ex.client}</div>
          </div>
          <span className="shrink-0 text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700">
            Rédigé en 30 s
          </span>
        </div>
        <table className="w-full mt-4 text-[14px]">
          <tbody>
            {ex.lignes.map(([libelle, montant]) => (
              <tr key={libelle} className="border-t border-gray-200">
                <td className="py-2 pr-3">{libelle}</td>
                <td className="py-2 text-right font-semibold tabular-nums whitespace-nowrap">{euros(montant)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-700">
              <td className="pt-3 font-semibold">Total hors taxes</td>
              <td className="pt-3 text-right text-[20px] font-semibold tabular-nums whitespace-nowrap">{euros(total)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 text-[13px] text-gray-500">TVA non applicable, article 293 B du CGI. Exemple de démonstration.</p>
      </div>
    </div>
  );
}
