"use client";

import { useEffect, useRef, useState } from "react";

type Niveau = "rouge" | "orange" | "vert";
type DossierExport = { id: string; nom: string; niveau: Niveau };

const POINT: Record<Niveau, string> = { rouge: "bg-red-500", orange: "bg-amber-500", vert: "bg-emerald-500" };

/**
 * Export comptable du portefeuille, dans une fenêtre dédiée (20/11/2026).
 *
 * Remplace les cases à cocher de la liste et les deux menus déroulants
 * (retour Selim : « des petites fenêtres à cliquer »). Trois choix, chacun en
 * grandes zones cliquables, et un résumé de ce qui sera téléchargé avant de
 * cliquer. Pas d'animation : règle de l'app.
 */
export function ExportPortefeuille({ dossiers, annee }: { dossiers: DossierExport[]; annee: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [format, setFormat] = useState<"fec" | "csv">("fec");
  const [an, setAn] = useState(annee);
  const [portee, setPortee] = useState<"tout" | "choix">("tout");
  const [choix, setChoix] = useState<Set<string>>(new Set());
  const [avecPdf, setAvecPdf] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", surTouche);
    boite.current?.focus();
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  const ids = portee === "tout" ? [] : [...choix];
  const nb = portee === "tout" ? dossiers.length : choix.size;
  const pret = nb > 0;
  const pdf = format === "fec" && avecPdf;
  const lien =
    `/api/cabinet/export?format=${format}&year=${an}` + (ids.length ? `&clients=${ids.join(",")}` : "") + (pdf ? "&pdf=1" : "");
  const fichier = pdf
    ? "une archive zip, le FEC et les PDF des factures de chaque dossier"
    : nb === 1
      ? `un fichier ${format === "fec" ? "FEC" : "CSV"}`
      : `une archive zip, un fichier ${format === "fec" ? "FEC" : "CSV"} par dossier`;

  function basculer(id: string) {
    setChoix((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const option = (choisi: boolean) =>
    `text-left rounded-xl border p-3.5 transition-colors ${
      choisi ? "border-indigo-500 bg-indigo-500/10" : "border-ds-border hover:border-gray-600"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="h-9 inline-flex items-center gap-2 px-3.5 border border-ds-border text-gray-200 rounded-lg hover:bg-ink/5 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Export comptable
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOuvert(false)} aria-hidden="true" />
          <div
            ref={boite}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-export"
            className="relative carte carte-lg w-full sm:max-w-lg max-h-[90vh] flex flex-col outline-hidden rounded-b-none sm:rounded-b-[18px]"
          >
            <div className="p-5 pb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="titre-export" className="text-lg font-semibold text-ink">Export comptable</h2>
                <p className="text-sm text-gray-400 mt-0.5">Les factures de vos clients, prêtes pour votre logiciel.</p>
              </div>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:text-ink hover:bg-ink/5 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto space-y-5">
              <fieldset>
                <legend className="text-sm font-medium text-gray-300 mb-2">Format</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={format === "fec"} onClick={() => setFormat("fec")} className={option(format === "fec")}>
                    <div className="font-semibold text-ink">FEC</div>
                    <div className="text-[13px] text-gray-400 mt-0.5">Écritures comptables, à importer dans votre logiciel</div>
                  </button>
                  <button type="button" aria-pressed={format === "csv"} onClick={() => setFormat("csv")} className={option(format === "csv")}>
                    <div className="font-semibold text-ink">CSV</div>
                    <div className="text-[13px] text-gray-400 mt-0.5">Liste des factures, à ouvrir dans un tableur</div>
                  </button>
                </div>
              </fieldset>

              {format === "fec" && (
                <label className="flex items-start gap-3 rounded-xl border border-ds-border p-3.5 cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={avecPdf}
                    onChange={(e) => setAvecPdf(e.target.checked)}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">Joindre les PDF des factures</span>
                    <span className="block text-[13px] text-gray-400 mt-0.5">
                      Chaque PDF porte le numéro de sa pièce dans le FEC : votre logiciel les rattache aux écritures.
                    </span>
                  </span>
                </label>
              )}

              <fieldset>
                <legend className="text-sm font-medium text-gray-300 mb-2">Exercice</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[annee, annee - 1].map((a) => (
                    <button key={a} type="button" aria-pressed={an === a} onClick={() => setAn(a)} className={`${option(an === a)} font-semibold text-ink`}>
                      {a}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-gray-300 mb-2">Dossiers</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={portee === "tout"} onClick={() => setPortee("tout")} className={option(portee === "tout")}>
                    <div className="font-semibold text-ink">Tout le portefeuille</div>
                    <div className="text-[13px] text-gray-400 mt-0.5">{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}</div>
                  </button>
                  <button type="button" aria-pressed={portee === "choix"} onClick={() => setPortee("choix")} className={option(portee === "choix")}>
                    <div className="font-semibold text-ink">Choisir</div>
                    <div className="text-[13px] text-gray-400 mt-0.5">Un ou plusieurs dossiers</div>
                  </button>
                </div>

                {portee === "choix" && (
                  <div className="mt-3 rounded-xl border border-ds-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-ds-elevated text-[13px] text-gray-400">
                      <span>{choix.size} sélectionné{choix.size > 1 ? "s" : ""}</span>
                      <span className="flex gap-3">
                        <button type="button" onClick={() => setChoix(new Set(dossiers.map((d) => d.id)))} className="hover:text-ink transition-colors">Tous</button>
                        <button type="button" onClick={() => setChoix(new Set())} className="hover:text-ink transition-colors">Aucun</button>
                      </span>
                    </div>
                    <ul className="divide-y divide-ds-border max-h-60 overflow-y-auto">
                      {dossiers.map((d) => {
                        const coche = choix.has(d.id);
                        return (
                          <li key={d.id}>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={coche}
                              onClick={() => basculer(d.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${coche ? "bg-indigo-500/8" : "hover:bg-ink/5"}`}
                            >
                              <span className={`w-5 h-5 shrink-0 rounded-md border grid place-items-center ${coche ? "bg-indigo-600 border-indigo-600 text-on-accent" : "border-gray-600"}`}>
                                {coche && (
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                              <span className="flex-1 min-w-0 truncate text-sm text-ink">{d.nom}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${POINT[d.niveau]}`} aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </fieldset>
            </div>

            <div className="p-5 pt-4 border-t border-ds-border flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <p className="text-sm text-gray-400">
                {pret ? (
                  <>
                    <span className="text-ink font-medium">{nb} dossier{nb > 1 ? "s" : ""}</span> · {format.toUpperCase()} {an} · {fichier}
                  </>
                ) : (
                  "Choisissez au moins un dossier."
                )}
              </p>
              {pret ? (
                <a
                  href={lien}
                  onClick={() => setOuvert(false)}
                  className="h-10 inline-flex items-center justify-center px-4 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Télécharger
                </a>
              ) : (
                <span className="h-10 inline-flex items-center justify-center px-4 bg-indigo-600/40 text-on-accent/70 rounded-lg text-sm font-semibold cursor-not-allowed">
                  Télécharger
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
