"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AchatInternational } from "@/lib/superpdp-achats";
import { PAYS_FACTURATION } from "@/lib/superpdp-nature";

const nomPays = (code: string) =>
  PAYS_FACTURATION.find((p) => p.code === code)?.nom ?? code;

const jour = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const montant = (n: number, devise: string) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise || "EUR" }).format(n);

const STATUT: Record<AchatInternational["transmission_status"], { texte: string; ton: string }> = {
  transmis: { texte: "Déclaré", ton: "bg-emerald-500/15 text-emerald-400" },
  en_attente: { texte: "En attente", ton: "bg-amber-500/15 text-amber-400" },
  echec: { texte: "En échec", ton: "bg-red-500/15 text-red-400" },
};

export function AchatsListe({ achats }: { achats: AchatInternational[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const retransmettre = async (id: string) => {
    setEnCours(id);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/achats/${id}/retransmettre`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "La retransmission n'a pas abouti.");
        return;
      }
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(null);
    }
  };

  if (achats.length === 0) {
    return (
      <section className="bg-ds-surface border border-ds-border rounded-xl p-6 text-center">
        <p className="text-white font-medium mb-1">Aucun achat étranger saisi</p>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Quand vous achetez à un fournisseur établi hors de France, saisissez sa facture ici pour
          en déclarer l&apos;acquisition à l&apos;administration.
        </p>
      </section>
    );
  }

  return (
    <>
      {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}
      <section className="bg-ds-surface border border-ds-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ds-border text-left">
              <th className="px-4 py-3 font-medium text-gray-400">Fournisseur</th>
              <th className="px-4 py-3 font-medium text-gray-400">Pays</th>
              <th className="px-4 py-3 font-medium text-gray-400">Date</th>
              <th className="px-4 py-3 font-medium text-gray-400">Nature</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">HT</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">TVA</th>
              <th className="px-4 py-3 font-medium text-gray-400">État</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {achats.map((a) => {
              const s = STATUT[a.transmission_status];
              return (
                <tr key={a.id} className="border-b border-ds-border last:border-0 align-top">
                  <td className="px-4 py-3 text-white">
                    {a.fournisseur_nom}
                    {a.numero && <span className="block text-xs text-gray-500">{a.numero}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{nomPays(a.fournisseur_pays)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{jour(a.date_facture)}</td>
                  <td className="px-4 py-3 text-gray-400">{a.categorie === "biens" ? "Biens" : "Services"}</td>
                  <td className="px-4 py-3 text-gray-300 text-right whitespace-nowrap">{montant(a.montant_ht, a.devise)}</td>
                  <td className="px-4 py-3 text-gray-300 text-right whitespace-nowrap">{montant(a.montant_tva, a.devise)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${s.ton}`}>{s.texte}</span>
                    {a.transmission_status !== "transmis" && a.transmission_error && (
                      <span className="block text-xs text-gray-500 mt-1 max-w-[16rem]">{a.transmission_error}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.transmission_status !== "transmis" && (
                      <button
                        onClick={() => retransmettre(a.id)}
                        disabled={enCours === a.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-ds-border text-gray-300 hover:text-white hover:bg-ds-elevated transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {enCours === a.id ? "…" : "Retransmettre"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
