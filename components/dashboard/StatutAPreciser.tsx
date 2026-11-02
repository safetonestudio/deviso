"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUTS, type StatutJuridique } from "@/lib/statut-entreprise";

/**
 * Demande le statut de l'entreprise quand il n'est pas renseigne. Sans lui, le
 * tableau de bord ne montre aucune echeance URSSAF : il ne la devine pas.
 */
export function StatutAPreciser() {
  const router = useRouter();
  const [envoi, setEnvoi] = useState<StatutJuridique | null>(null);
  const [erreur, setErreur] = useState(false);

  async function choisir(statut: StatutJuridique) {
    setEnvoi(statut);
    setErreur(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut_juridique: statut }),
    });
    if (res.ok) router.refresh();
    else { setErreur(true); setEnvoi(null); }
  }

  return (
    <section className="carte p-6 space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold text-ink">Quel est le statut de ton entreprise ?</h2>
        <p className="text-[14px] text-gray-400">
          Ton tableau de bord s&apos;adapte : échéances URSSAF pour un micro-entrepreneur, échéances de TVA si tu y es assujetti.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUTS.map((st) => (
          <button
            key={st.value}
            type="button"
            disabled={envoi !== null}
            onClick={() => choisir(st.value)}
            className="text-left p-4 rounded-xl border border-ds-border hover:border-indigo-500 transition-colors disabled:opacity-60"
          >
            <div className="text-[15px] font-semibold text-ink">{envoi === st.value ? "Enregistrement…" : st.label}</div>
            <div className="text-[13px] text-gray-500 mt-1">{st.description}</div>
          </button>
        ))}
      </div>
      {erreur && <p className="text-[14px] text-red-400">L&apos;enregistrement a échoué, réessaie ou passe par les paramètres.</p>}
    </section>
  );
}
