"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const ETAT: Record<Niveau, { libelle: string; puce: string; point: string }> = {
  rouge: { libelle: "Action requise", puce: "bg-red-500/12 text-red-400 border-red-500/25", point: "bg-red-500" },
  orange: { libelle: "À surveiller", puce: "bg-amber-500/12 text-amber-400 border-amber-500/25", point: "bg-amber-500" },
  vert: { libelle: "À jour", puce: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", point: "bg-emerald-500" },
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const plurielPoint = (n: number) => `${n} autre${n > 1 ? "s" : ""} point${n > 1 ? "s" : ""}`;

// Colonnes partagées par l'en-tête et les lignes (écran large).
const GRILLE = "lg:grid lg:grid-cols-[28px_minmax(0,1fr)_150px_110px_130px_140px_20px] lg:items-center lg:gap-4";

/**
 * Portefeuille du cockpit cabinet : un dossier par ligne, triés par urgence.
 *
 * Refait le 20/11/2026 (retour Selim : « très mal foutu ») : les étiquettes
 * des chiffres étaient répétées sur chaque ligne et l'état se lisait à une
 * pastille de 10 px. Désormais : une en-tête de colonnes unique, l'état en
 * toutes lettres, des filtres par état, et un export dont on comprend ce
 * qu'il fait avant de cliquer.
 */
export function CabinetPortefeuille({ dossiers, annee }: { dossiers: DossierVue[]; annee: number }) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<"fec" | "csv">("fec");
  const [an, setAn] = useState(annee);
  const [filtre, setFiltre] = useState<Niveau | "tous">("tous");

  const compte = useMemo(
    () => ({
      tous: dossiers.length,
      rouge: dossiers.filter((d) => d.niveau === "rouge").length,
      orange: dossiers.filter((d) => d.niveau === "orange").length,
      vert: dossiers.filter((d) => d.niveau === "vert").length,
    }),
    [dossiers]
  );
  const visibles = filtre === "tous" ? dossiers : dossiers.filter((d) => d.niveau === filtre);
  const tousCoches = visibles.length > 0 && visibles.every((d) => selection.has(d.id));

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
    "h-9 bg-ds-bg border border-ds-border rounded-lg px-2.5 text-sm text-ink focus:outline-hidden focus:border-indigo-500";
  const filtres: { id: Niveau | "tous"; libelle: string }[] = [
    { id: "tous", libelle: "Tous" },
    { id: "rouge", libelle: "Action requise" },
    { id: "orange", libelle: "À surveiller" },
    { id: "vert", libelle: "À jour" },
  ];

  return (
    <section className="carte overflow-hidden">
      {/* Barre d'outils : filtres à gauche, export à droite. */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-ds-border">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par état">
          {filtres.map((f) => {
            const n = compte[f.id];
            const choisi = filtre === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltre(f.id)}
                aria-pressed={choisi}
                disabled={n === 0 && f.id !== "tous"}
                className={`h-8 px-3 rounded-full text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  choisi ? "bg-ink/10 border-ink/20 text-ink" : "border-ds-border text-gray-400 hover:text-ink"
                }`}
              >
                {f.libelle} <span className="tabular-nums text-gray-500">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:inline">Export comptable</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as "fec" | "csv")} className={selecteur} aria-label="Format d'export">
            <option value="fec">FEC</option>
            <option value="csv">CSV des factures</option>
          </select>
          <select value={an} onChange={(e) => setAn(Number(e.target.value))} className={selecteur} aria-label="Exercice">
            {[annee, annee - 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {selection.size > 0 ? (
            <>
              <a
                href={lien([...selection])}
                className="h-9 inline-flex items-center px-3.5 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                Exporter {selection.size} dossier{selection.size > 1 ? "s" : ""}
              </a>
              <button
                type="button"
                onClick={() => setSelection(new Set())}
                className="h-9 px-3 text-sm text-gray-400 hover:text-ink transition-colors"
              >
                Annuler
              </button>
            </>
          ) : (
            <a
              href={lien([])}
              className="h-9 inline-flex items-center px-3.5 border border-ds-border text-gray-200 rounded-lg hover:bg-ink/5 text-sm font-medium transition-colors"
            >
              Exporter tout le portefeuille
            </a>
          )}
        </div>
      </div>

      {/* En-tête de colonnes, une seule fois (écran large). */}
      <div className={`hidden ${GRILLE} px-4 py-2.5 bg-ds-elevated border-b border-ds-border text-xs font-semibold text-gray-400`}>
        <input
          type="checkbox"
          checked={tousCoches}
          onChange={() =>
            setSelection((prev) => {
              const s = new Set(prev);
              visibles.forEach((d) => (tousCoches ? s.delete(d.id) : s.add(d.id)));
              return s;
            })
          }
          className="accent-indigo-500 cursor-pointer"
          aria-label="Sélectionner les dossiers affichés"
        />
        <span>Dossier</span>
        <span>État</span>
        <span className="text-right">Factures du mois</span>
        <span className="text-right">CA HT du mois</span>
        <span className="text-right">CA HT {annee}</span>
        <span />
      </div>

      {visibles.length === 0 ? (
        <p className="p-6 text-sm text-gray-500 text-center">Aucun dossier dans cet état.</p>
      ) : (
        <ul className="divide-y divide-ds-border">
          {visibles.map((d) => {
            const e = ETAT[d.niveau];
            const premiere = d.anomalies[0];
            return (
              <li key={d.id} className="relative group hover:bg-ds-elevated/60 transition-colors">
                {/* Toute la ligne mène au dossier ; la case, au-dessus, sert à l'export. */}
                <Link href={`/cabinet/${d.id}`} className="absolute inset-0" aria-label={`Ouvrir le dossier ${d.nom}`} />
                <div className={`${GRILLE} p-4 flex flex-wrap items-start gap-x-3 gap-y-2`}>
                  <input
                    type="checkbox"
                    checked={selection.has(d.id)}
                    onChange={() => basculer(d.id)}
                    className="relative z-10 mt-1 lg:mt-0 accent-indigo-500 cursor-pointer"
                    aria-label={`Sélectionner ${d.nom} pour l'export`}
                  />
                  <div className="min-w-0 flex-1 basis-[70%] lg:basis-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink truncate">{d.nom}</span>
                      <span className={`lg:hidden shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${e.puce}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${e.point}`} />
                        {e.libelle}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 flex min-w-0 gap-1">
                      <span className="truncate">{premiere ? premiere.libelle : "Rien à signaler"}</span>
                      {d.anomalies.length > 1 && (
                        <span className="shrink-0 text-gray-500">· et {plurielPoint(d.anomalies.length - 1)}</span>
                      )}
                    </p>
                  </div>
                  <span className={`hidden lg:inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${e.puce}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${e.point}`} />
                    {e.libelle}
                  </span>
                  {/* Chiffres : en colonnes sur grand écran, en ligne étiquetée sur téléphone. */}
                  <dl className="w-full lg:contents grid grid-cols-3 gap-2 pl-7 lg:pl-0 text-sm tabular-nums">
                    <div className="lg:text-right">
                      <dt className="lg:hidden text-xs text-gray-500">Factures du mois</dt>
                      <dd className="text-gray-200 font-medium">{d.nbFacturesMois}</dd>
                    </div>
                    <div className="lg:text-right">
                      <dt className="lg:hidden text-xs text-gray-500">CA HT du mois</dt>
                      <dd className="text-gray-200 font-medium">{eur(d.caHtMois)}</dd>
                    </div>
                    <div className="lg:text-right">
                      <dt className="lg:hidden text-xs text-gray-500">CA HT {annee}</dt>
                      <dd className="text-ink font-semibold">{eur(d.caHtAnnee)}</dd>
                    </div>
                  </dl>
                  <svg className="hidden lg:block w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
