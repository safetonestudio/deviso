"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TAUX_FRANCAIS } from "@/lib/achats-tva";

/**
 * Taux français d'une facture reçue en autoliquidation (catégorie AE, par
 * exemple un sous-traitant du bâtiment). La facture ne porte pas de TVA : c'est
 * l'entreprise qui la doit, au taux de l'opération (20 %, ou 10 % / 5,5 % pour
 * certains travaux dans les logements). Tant qu'il n'est pas choisi, la
 * comptabilité présume 20 % et le cabinet est prévenu.
 */
export function TauxAutoliquidation({
  factureId,
  base,
  taux,
  modifiable,
}: {
  factureId: number;
  /** Base autoliquidée, déjà formatée. */
  base: string;
  taux: number | null;
  /** Titulaire seul : c'est la comptabilité de l'entreprise. */
  modifiable: boolean;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(taux === null ? "" : String(taux));
  const [etat, setEtat] = useState<{ envoi?: boolean; ok?: boolean; erreur?: string }>({});

  async function enregistrer(v: string) {
    setValeur(v);
    setEtat({ envoi: true });
    const r = await fetch(`/api/superpdp/factures-recues/${factureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taux_autoliquidation: v === "" ? null : Number(v) }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) return setEtat({ erreur: d.message ?? d.error ?? "Enregistrement impossible." });
    setEtat({ ok: true });
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-lg border border-ds-border p-3 text-sm">
      <p className="text-ink font-medium">Autoliquidation de la TVA</p>
      <p className="text-gray-400 mt-0.5">
        Ce fournisseur ne facture pas la TVA sur {base} : tu la dois et tu la déduis. Indique le taux de
        l&apos;opération{taux === null ? " (20 % retenu tant que tu ne l'as pas choisi)" : ""}.
      </p>
      {modifiable ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor={`taux-ae-${factureId}`}>Taux français applicable</label>
          <select
            id={`taux-ae-${factureId}`}
            aria-label="Taux français applicable"
            value={valeur}
            disabled={etat.envoi}
            onChange={(e) => enregistrer(e.target.value)}
            className="bg-ds-bg border border-ds-border text-ink rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500"
          >
            <option value="">À choisir (20 % présumé)</option>
            {TAUX_FRANCAIS.map((t) => (
              <option key={t} value={String(t)}>{String(t).replace(".", ",")} %</option>
            ))}
          </select>
          {etat.ok && <span className="text-emerald-400">Enregistré.</span>}
          {etat.erreur && <span className="text-red-400">{etat.erreur}</span>}
        </div>
      ) : (
        <p className="mt-1 text-gray-300">Taux retenu : {taux === null ? "20 % (présumé)" : `${String(taux).replace(".", ",")} %`}</p>
      )}
    </div>
  );
}
