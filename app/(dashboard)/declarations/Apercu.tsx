"use client";

import { useState } from "react";

/**
 * L'aperçu de ce qui partira.
 *
 * « This only applies for data that has not yet been sent. » C'est la seule
 * occasion de corriger une erreur avant qu'elle devienne une déclaration —
 * ce qui vaut infiniment mieux qu'un constat après coup.
 *
 * Aucune période n'est calculée ici : la documentation ne détaille le
 * découpage que pour le régime mensuel, et par décades (« déclarer tous les
 * 10 jours »). On passe la date que la personne regarde et on affiche la
 * période que la plateforme considère être la bonne.
 */
export function Apercu() {
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<"transaction" | "payment">("transaction");
  const [role, setRole] = useState<"SE" | "BY">("SE");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<
    { vide: boolean; periode?: { debut: string; fin: string } | null; nombreMontants?: number; xml?: string } | null
  >(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const consulter = async () => {
    setChargement(true);
    setErreur(null);
    setResultat(null);
    try {
      const r = await fetch(
        `/api/superpdp/ereportings/apercu?date=${date}&kind=${kind}&role_code=${role}`
      );
      const d = await r.json();
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "Aperçu indisponible.");
        return;
      }
      setResultat(d);
    } catch {
      setErreur("Aperçu indisponible : connexion interrompue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
      >
        Voir ce qui n&apos;est pas encore parti
      </button>
      <p className="text-xs text-gray-500 mt-1">
        La seule occasion de corriger avant que ça devienne une déclaration.
      </p>

      {ouvert && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-xs text-gray-400">
              Une date dans la période
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block mt-1 bg-ds-elevated border border-ds-border rounded-md px-2 py-1.5 text-sm text-gray-200"
              />
            </label>
            <label className="text-xs text-gray-400">
              Nature
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "transaction" | "payment")}
                className="block mt-1 bg-ds-elevated border border-ds-border rounded-md px-2 py-1.5 text-sm text-gray-200"
              >
                <option value="transaction">Transactions</option>
                <option value="payment">Encaissements</option>
              </select>
            </label>
            <label className="text-xs text-gray-400">
              Sens
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "SE" | "BY")}
                className="block mt-1 bg-ds-elevated border border-ds-border rounded-md px-2 py-1.5 text-sm text-gray-200"
              >
                <option value="SE">Ventes</option>
                <option value="BY">Achats</option>
              </select>
            </label>
            <button
              onClick={consulter}
              disabled={chargement}
              className="self-end px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {chargement ? "Lecture…" : "Consulter"}
            </button>
          </div>

          {erreur && <p className="text-xs text-red-400">{erreur}</p>}

          {resultat?.vide && (
            <p className="text-sm text-gray-400">
              Rien à déclarer sur cette période. Ce n&apos;est pas une erreur.
            </p>
          )}

          {resultat && !resultat.vide && (
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                Période retenue par la Plateforme Agréée :{" "}
                <span className="text-white font-medium">
                  {resultat.periode ? `${resultat.periode.debut} — ${resultat.periode.fin}` : "non précisée"}
                </span>
                {typeof resultat.nombreMontants === "number" && (
                  <span className="text-gray-500"> · {resultat.nombreMontants} montant(s)</span>
                )}
              </p>
              <details>
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                  Voir le document tel qu&apos;il partira
                </summary>
                <pre className="mt-2 text-[11px] text-gray-400 bg-ds-elevated rounded-md p-3 overflow-x-auto max-h-72">
                  {resultat.xml}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
