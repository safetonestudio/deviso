"use client";

import { useState } from "react";
import {
  FREQUENCES,
  JOURS,
  prochainEnvoi,
  type FrequenceResume,
} from "@/lib/cabinet-resume-frequence";

export type ReglageResume = { actif: boolean; frequence: FrequenceResume; jour: number; dernierPassage: string | null };

const dateLongue = (d: Date) =>
  d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Résumé par e-mail du cabinet (20/11/2026) : le recevoir ou non, à quel rythme
 * et quel jour. La validation fait foi côté serveur (PATCH /api/profile).
 */
export function ReglagesResume({ initial }: { initial: ReglageResume }) {
  const [r, setR] = useState(initial);
  const [etat, setEtat] = useState<{ ok?: boolean; erreur?: string; envoi?: boolean }>({});
  const maj = (p: Partial<ReglageResume>) => {
    setR({ ...r, ...p });
    setEtat({});
  };

  async function enregistrer() {
    setEtat({ envoi: true });
    const rep = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_cabinet_hebdo: r.actif, resume_cabinet_frequence: r.frequence, resume_cabinet_jour: r.jour }),
    }).catch(() => null);
    const data = rep ? await rep.json().catch(() => ({})) : {};
    if (!rep || !rep.ok) return setEtat({ erreur: data.error || "Enregistrement impossible" });
    setEtat({ ok: true });
  }

  const option = (choisi: boolean) =>
    `text-left rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
      choisi ? "border-indigo-500 bg-indigo-500/10 text-ink font-medium" : "border-ds-border text-gray-300 hover:border-gray-600"
    }`;
  const prochain = prochainEnvoi(new Date(), r.frequence, r.jour, r.dernierPassage);

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={r.actif} onChange={(e) => maj({ actif: e.target.checked })} className="mt-0.5 accent-indigo-500" />
        <span>
          <span className="block text-sm font-medium text-ink">Recevoir le résumé par e-mail</span>
          <span className="block text-[13px] text-gray-400 mt-0.5">
            Les dossiers à traiter et la TVA à déclarer. Rien à signaler, pas d&apos;e-mail.
          </span>
        </span>
      </label>

      {r.actif && (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-gray-300 mb-2">Rythme</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {FREQUENCES.map((f) => (
                <button key={f.id} type="button" aria-pressed={r.frequence === f.id} onClick={() => maj({ frequence: f.id })} className={option(r.frequence === f.id)}>
                  {f.libelle}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-gray-300 mb-2">Jour d&apos;envoi</legend>
            <div className="grid grid-cols-5 gap-2">
              {JOURS.map((j) => (
                <button key={j.id} type="button" aria-pressed={r.jour === j.id} onClick={() => maj({ jour: j.id })} className={`${option(r.jour === j.id)} text-center px-1`}>
                  <span className="hidden sm:inline">{j.libelle.charAt(0).toUpperCase() + j.libelle.slice(1)}</span>
                  <span className="sm:hidden">{j.libelle.slice(0, 3)}.</span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-[13px] text-gray-400">
            Prochain envoi possible : <span className="text-ink font-medium">{dateLongue(prochain)}</span>, en début de matinée.
          </p>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={etat.envoi}
          className="h-10 px-4 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Enregistrer
        </button>
        {etat.ok && <span className="text-sm text-emerald-400">Enregistré.</span>}
        {etat.erreur && <span className="text-sm text-red-400">{etat.erreur}</span>}
      </div>
    </div>
  );
}
