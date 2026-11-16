"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { planFeatures, proOnlyFeatures } from "@/lib/plans";

/**
 * Tarifs de la page d'accueil : deux formules côte à côte, sur deux surfaces
 * de même hauteur. Les fonctionnalités viennent de lib/plans.ts (source
 * unique). Solo et Pro ne diffèrent que par l'équipe : la carte Pro le dit
 * en quelques lignes, la liste complète se déplie dessous.
 */
const COMMUNES = planFeatures("solo");
const PRO_SEUL = proOnlyFeatures();
const NB = "\u00a0";

const BOUTON = "inline-flex items-center justify-center h-12 rounded-lg text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

function Ligne({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[17px] leading-snug text-ink">
      <Check size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-indigo-400" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export function TarifsTable() {
  const [annuel, setAnnuel] = useState(false);

  const formules = [
    {
      nom: "Solo",
      pour: "Pour travailler seul, avec des documents soignés et ta gestion à jour.",
      prix: annuel ? "14,40" : "18",
      note: annuel ? "Facturé 172,80 € HT par an, soit 207,36 € TTC" : "Sans engagement, soit 21,60 € TTC",
      lien: "/signup?plan=solo",
      lignes: ["Toutes les fonctions de Deviso", "1 utilisateur" + NB + ": toi", "Ton expert-comptable invité gratuitement"],
    },
    {
      nom: "Pro",
      pour: "Pour les petites entreprises qui travaillent à plusieurs.",
      prix: annuel ? "27,20" : "34",
      note: annuel ? "Facturé 326,40 € HT par an, soit 391,68 € TTC" : "Sans engagement, soit 40,80 € TTC",
      lien: "/signup?plan=pro",
      lignes: ["Toutes les fonctions de Deviso", "3 utilisateurs inclus" + NB + ": toi et 2 collaborateurs, puis 5 € HT par mois et par personne", ...PRO_SEUL],
    },
  ];

  return (
    <div>
      <div className="reveal flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-[760px]">
          <h2 className="text-[clamp(30px,2.9vw,46px)] leading-[1.08] font-semibold tracking-[-0.035em] text-ink">Deux formules, une seule différence : l&apos;équipe.</h2>
          <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed text-gray-300">14 jours gratuits, sans carte bancaire, sans engagement.</p>
        </div>
        <div className="inline-flex gap-1 p-1 rounded-lg bg-ds-surface" role="group" aria-label="Périodicité de facturation">
          {[
            { libelle: "Mensuel", valeur: false },
            { libelle: "Annuel, 20 % de moins", valeur: true },
          ].map((o) => (
            <button
              key={o.libelle}
              type="button"
              onClick={() => setAnnuel(o.valeur)}
              aria-pressed={annuel === o.valeur}
              className={`h-10 px-4 rounded-md text-[14px] font-semibold transition-colors ${
                annuel === o.valeur ? "bg-ds-elevated text-ink" : "text-gray-400 hover:text-ink"
              }`}
            >
              {o.libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2 items-stretch">
        {formules.map((f) => (
          <div key={f.nom} className="reveal rounded-xl bg-ds-surface p-7 sm:p-10 flex flex-col">
            <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">{f.nom}</h3>
            <p className="mt-2 text-[17px] leading-relaxed text-gray-300 max-w-[40ch]">{f.pour}</p>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-[clamp(44px,4vw,60px)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">{f.prix} €</span>
              <span className="text-[17px] text-gray-400">par mois, HT</span>
            </div>
            <p className="mt-2 text-[14px] text-gray-400">{f.note}</p>

            <ul className="mt-8 space-y-3.5 flex-1">
              {f.lignes.map((x) => (
                <Ligne key={x}>{x}</Ligne>
              ))}
            </ul>

            <Link
              href={f.lien}
              className={`mt-10 ${BOUTON} bg-indigo-600 hover:bg-indigo-700 text-on-accent`}
            >
              Essayer {f.nom} gratuitement
            </Link>
          </div>
        ))}
      </div>

      <div className="reveal mt-6 rounded-xl bg-ds-surface px-7 py-8 sm:px-10 sm:py-10">
        <h3 className="text-[17px] font-semibold text-ink">Compris dans les deux formules</h3>
        <ul className="mt-6 grid gap-x-10 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNES.map((x) => (
            <Ligne key={x}>{x}</Ligne>
          ))}
        </ul>
      </div>
    </div>
  );
}
