"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Forme locale (et non un import de lib/cabinet-dossiers) : ce composant est
// envoye au navigateur, il ne doit rien tirer du code serveur.
type Niveau = "rouge" | "orange" | "vert";
type DossierVue = {
  id: string;
  nom: string;
  niveau: Niveau;
  anomalies: { niveau: "rouge" | "orange"; libelle: string }[];
  nbFacturesMois: number;
  caHtMois: number;
  caHtAnnee: number;
};

const PASTILLE: Record<Niveau, string> = {
  rouge: "bg-red-500",
  orange: "bg-amber-500",
  vert: "bg-emerald-500",
};
const LIBELLE: Record<Niveau, string> = {
  rouge: "Action requise",
  orange: "À surveiller",
  vert: "À jour",
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

/**
 * Portefeuille du cockpit cabinet : un dossier par ligne, tries par urgence,
 * avec selection et export (un client, plusieurs, ou tout le portefeuille).
 */
export function CabinetPortefeuille({ dossiers, annee }: { dossiers: DossierVue[]; annee: number }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<"fec" | "csv">("fec");
  const [an, setAn] = useState(annee);

  const tousCoches = dossiers.length > 0 && selection.size === dossiers.length;
  const lien = (ids: string[]) =>
    `/api/cabinet/export?format=${format}&year=${an}` + (ids.length ? `&clients=${ids.join(",")}` : "");

  function basculer(id: string) {
    setSelection((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const selecteur =
    "bg-ds-bg border border-ds-border rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl mb-6 overflow-hidden">
      <div className="p-4 border-b border-ds-border flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={tousCoches}
            onChange={() => setSelection(tousCoches ? new Set() : new Set(dossiers.map((d) => d.id)))}
            className="accent-indigo-500"
          />
          Tout sélectionner
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select value={format} onChange={(e) => setFormat(e.target.value as "fec" | "csv")} className={selecteur} aria-label="Format">
            <option value="fec">FEC</option>
            <option value="csv">CSV des factures</option>
          </select>
          <select value={an} onChange={(e) => setAn(Number(e.target.value))} className={selecteur} aria-label="Année">
            {[annee, annee - 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {selection.size > 0 ? (
            <a
              href={lien([...selection])}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              Exporter la sélection ({selection.size})
            </a>
          ) : (
            <span className="px-3 py-1.5 bg-indigo-600/40 text-white/60 rounded-lg text-sm font-medium cursor-not-allowed">
              Exporter la sélection
            </span>
          )}
          <a
            href={lien([])}
            className="px-3 py-1.5 border border-ds-border text-gray-300 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors"
          >
            Tout le portefeuille
          </a>
        </div>
      </div>

      <ul className="divide-y divide-ds-border">
        {dossiers.map((d) => (
          <li
            key={d.id}
            onClick={() => router.push(`/cabinet/${d.id}`)}
            className="p-4 flex flex-wrap items-center gap-x-5 gap-y-3 cursor-pointer hover:bg-ds-elevated/50 transition-colors"
          >
            {/* La case reste independante : la cocher pour un export ne doit pas
                ouvrir le dossier. Le reste de la ligne mene au dossier. */}
            <input
              type="checkbox"
              checked={selection.has(d.id)}
              onChange={() => basculer(d.id)}
              onClick={(e) => e.stopPropagation()}
              className="accent-indigo-500 cursor-pointer"
              aria-label={`Sélectionner ${d.nom}`}
            />
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PASTILLE[d.niveau]}`} title={LIBELLE[d.niveau]} />
            <div className="min-w-0 flex-1 basis-56">
              <div className="font-medium text-white truncate">{d.nom}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {LIBELLE[d.niveau]}
                {d.anomalies.length > 0
                  ? ` · ${d.anomalies[0].libelle}${d.anomalies.length > 1 ? ` (+${d.anomalies.length - 1})` : ""}`
                  : " · Aucune anomalie"}
              </div>
            </div>
            <div className="flex items-center gap-5 text-sm">
              <div className="text-right">
                <div className="text-gray-500 text-xs">Factures ce mois</div>
                <div className="text-gray-200 font-semibold">{d.nbFacturesMois}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">CA HT du mois</div>
                <div className="text-gray-200 font-semibold">{eur(d.caHtMois)}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-gray-500 text-xs">CA HT {annee}</div>
                <div className="text-gray-200 font-semibold">{eur(d.caHtAnnee)}</div>
              </div>
              <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
