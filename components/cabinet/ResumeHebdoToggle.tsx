"use client";

import { useState } from "react";

/**
 * Case « Résumé du lundi par e-mail » de l'accueil cabinet (20/11/2026).
 * Écrit profiles.resume_cabinet_hebdo du cabinet connecté via PATCH
 * /api/profile ; le résumé lui-même vient de lib/cabinet-resume.ts.
 */
export function ResumeHebdoToggle({ initial }: { initial: boolean }) {
  const [actif, setActif] = useState(initial);
  const [etat, setEtat] = useState<"" | "envoi" | "erreur">("");

  async function basculer() {
    const suivant = !actif;
    setActif(suivant);
    setEtat("envoi");
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_cabinet_hebdo: suivant }),
      });
      if (!r.ok) throw new Error();
      setEtat("");
    } catch {
      setActif(!suivant);
      setEtat("erreur");
    }
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={actif} onChange={basculer} disabled={etat === "envoi"} className="mt-0.5 accent-indigo-500" />
      <span>
        <span className="block text-sm font-medium text-ink">Résumé du lundi par e-mail</span>
        <span className="block text-[13px] text-gray-400 mt-0.5">
          Chaque lundi matin : les dossiers à traiter et la TVA à déclarer. Rien à signaler, pas d&apos;e-mail.
          {etat === "erreur" && <span className="text-red-400"> Enregistrement impossible, réessayez.</span>}
        </span>
      </span>
    </label>
  );
}
