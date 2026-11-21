"use client";

import { useState } from "react";
import { LIBELLES_PLAN, PLAN_PAR_DEFAUT, type PlanComptesFec } from "@/lib/plan-comptes-fec";

/**
 * Seize réglages en trois groupes (21/11/2026) : à plat, la liste devenait
 * illisible depuis l'ajout des comptes d'achat. Chaque clé du plan figure dans
 * exactement un groupe (contrôlé à l'affichage : une clé oubliée s'ajoute à la fin).
 */
const GROUPES: { titre: string; aide: string; cles: (keyof PlanComptesFec)[] }[] = [
  { titre: "Journaux", aide: "Codes de 1 à 6 caractères, différents dès les 2 premiers (Quadra n'en lit que 2).", cles: ["journalVentes", "journalAchats", "journalBanque"] },
  { titre: "Ventes et encaissements", aide: "Factures émises par le dossier et leur règlement.", cles: ["clients", "ventesServices", "ventesBiens", "tvaCollectee", "tvaNonExigible", "banque"] },
  { titre: "Achats", aide: "Factures reçues et achats à l'étranger.", cles: ["fournisseurs", "avancesFournisseurs", "achatsServices", "achatsBiens", "tvaDeductible", "tvaDeductibleAutoliq", "tvaAutoliquidee", "tvaAutoliquideeHorsUe", "tvaAutoliquideeFrance"] },
];

const inputCls =
  "w-full h-10 bg-ds-bg border border-ds-border rounded-lg px-3 text-sm text-ink tabular-nums focus:outline-hidden focus:border-indigo-500";

/**
 * Réglage des comptes et journaux du FEC par le cabinet (20/11/2026).
 * La validation fait foi côté serveur (PATCH /api/profile, validerPlan).
 */
export function ReglagesFec({ initial }: { initial: PlanComptesFec }) {
  const [plan, setPlan] = useState<PlanComptesFec>(initial);
  const [etat, setEtat] = useState<{ ok?: boolean; erreur?: string; envoi?: boolean }>({});
  const toutes = Object.keys(PLAN_PAR_DEFAUT) as (keyof PlanComptesFec)[];
  const rangees = GROUPES.flatMap((g) => g.cles);
  const oubliees = toutes.filter((c) => !rangees.includes(c));
  const groupes = oubliees.length ? [...GROUPES, { titre: "Autres comptes", aide: "", cles: oubliees }] : GROUPES;

  async function enregistrer(valeur: PlanComptesFec | null) {
    setEtat({ envoi: true });
    const r = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_comptes_fec: valeur }),
    }).catch(() => null);
    const data = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) return setEtat({ erreur: data.error || "Enregistrement impossible" });
    if (valeur === null) setPlan(PLAN_PAR_DEFAUT);
    setEtat({ ok: true });
  }

  return (
    <div className="carte p-5">
      <div className="space-y-6">
      {groupes.map((g) => (
      <fieldset key={g.titre}>
        <legend className="text-sm font-semibold text-ink">{g.titre}</legend>
        {g.aide && <p className="text-[13px] text-gray-400 mt-0.5 mb-3">{g.aide}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
        {g.cles.map((cle) => (
          <label key={cle} className="block">
            <span className="block text-sm font-medium text-gray-300 mb-1.5">{LIBELLES_PLAN[cle]}</span>
            <input
              value={plan[cle]}
              onChange={(e) => {
                setPlan({ ...plan, [cle]: e.target.value.toUpperCase() });
                setEtat({});
              }}
              placeholder={PLAN_PAR_DEFAUT[cle]}
              className={inputCls}
              inputMode={cle.startsWith("journal") ? "text" : "numeric"}
              maxLength={12}
            />
          </label>
        ))}
      </div>
      </fieldset>
      ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => enregistrer(plan)}
          disabled={etat.envoi}
          className="h-10 px-4 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => enregistrer(null)}
          disabled={etat.envoi}
          className="h-10 px-4 border border-ds-border text-gray-300 rounded-lg hover:bg-ink/5 text-sm font-medium transition-colors"
        >
          Revenir au plan par défaut
        </button>
        {etat.ok && <span className="text-sm text-emerald-400">Enregistré. Vos prochains exports l&apos;utilisent.</span>}
        {etat.erreur && <span className="text-sm text-red-400">{etat.erreur}</span>}
      </div>
    </div>
  );
}
