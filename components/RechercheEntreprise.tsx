"use client";

import { useState } from "react";
import { Search } from "lucide-react";

/**
 * Chercher un client dans l'Annuaire national plutôt que lui demander son SIREN.
 *
 * Pourquoi ça existe. Pour émettre une facture B2B, il faut le SIREN du
 * destinataire — et Deviso le demandait à l'utilisateur, qui devait le réclamer
 * à son client ou le recopier depuis un document. Une faute de frappe se solde
 * par une facture rejetée, constatée bien plus tard.
 *
 * `GET /french_directory/companies` rend d'un coup le SIREN, la raison sociale
 * et l'adresse postale complète — tous les champs requis du Factur-X. Et
 * « Companies in this directory are eligible to the french invoicing law » : y
 * figurer, c'est relever de la réforme, ce qui est en soi une information.
 */
export function RechercheEntreprise({
  onChoisir,
}: {
  onChoisir: (e: {
    siren: string;
    nom: string;
    rue: string;
    code_postal: string;
    ville: string;
    pays: string;
  }) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [cp, setCp] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<
    { siren: string; nom: string; rue: string; code_postal: string; ville: string; pays: string }[]
  >([]);
  const [tronque, setTronque] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const chercher = async () => {
    if (!nom.trim()) return;
    setChargement(true);
    setMessage(null);
    setResultats([]);
    try {
      const p = new URLSearchParams({ nom: nom.trim() });
      if (cp.trim()) p.set("code_postal", cp.trim());
      const r = await fetch(`/api/annuaire/entreprises?${p}`);
      const d = await r.json();
      if (!r.ok) {
        setMessage(d.message ?? d.error ?? "Recherche impossible.");
        return;
      }
      setResultats(d.entreprises ?? []);
      setTronque(d.tronque === true);
      if ((d.entreprises ?? []).length === 0) {
        setMessage("Aucune entreprise trouvée. La recherche porte sur le début du nom officiel.");
      }
    } catch {
      setMessage("Recherche impossible : connexion interrompue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="col-span-2">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors"
      >
        <Search size={13} />
        Chercher mon client dans l&apos;Annuaire national
      </button>

      {ouvert && (
        <div className="mt-2 bg-ds-elevated border border-ds-border rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), chercher())}
              placeholder="Début du nom officiel"
              className="flex-1 text-sm bg-ds-surface border border-ds-border rounded-md px-2 py-1.5 text-gray-200 placeholder:text-gray-600"
            />
            <input
              value={cp}
              onChange={(e) => setCp(e.target.value)}
              placeholder="Code postal"
              className="w-28 text-sm bg-ds-surface border border-ds-border rounded-md px-2 py-1.5 text-gray-200 placeholder:text-gray-600"
            />
            <button
              type="button"
              onClick={chercher}
              disabled={chargement || !nom.trim()}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {chargement ? "…" : "Chercher"}
            </button>
          </div>

          {message && <p className="text-xs text-gray-500">{message}</p>}

          {resultats.map((e) => (
            <button
              type="button"
              key={e.siren}
              onClick={() => {
                onChoisir(e);
                setOuvert(false);
              }}
              className="block w-full text-left px-2 py-1.5 rounded-md hover:bg-ds-surface transition-colors"
            >
              <span className="text-sm text-white">{e.nom}</span>
              <span className="block text-xs text-gray-500">
                {e.siren} · {e.code_postal} {e.ville}
              </span>
            </button>
          ))}

          {/* « has_more is true when the results have been truncated. In this
              case, you must pass more precise filters. » Le taire ferait croire
              que l'entreprise n'existe pas alors qu'elle est au-delà. */}
          {tronque && (
            <p className="text-xs text-amber-400/90">
              Trop de résultats : précisez le nom ou ajoutez le code postal.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
