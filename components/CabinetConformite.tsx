"use client";

import { useRouter } from "next/navigation";

// Forme locale : composant navigateur, aucun import du code serveur cabinet.
type Conformite = {
  raccordePA: boolean;
  joignableAnnuaire: boolean;
  siretValide: boolean;
  tvaConforme: boolean;
  pret: boolean;
};
type Ligne = { id: string; nom: string; conformite: Conformite };

function Pastille({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400" title="Conforme" aria-label="conforme">
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-400" title="À régulariser" aria-label="à régulariser">
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2a1 1 0 01.9.55l7 13A1 1 0 0117 17H3a1 1 0 01-.9-1.45l7-13A1 1 0 0110 2zm0 5a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1zm0 7.5a1 1 0 100 2 1 1 0 000-2z" /></svg>
    </span>
  );
}

/**
 * Tableau de conformite a la reforme, par dossier. Le cabinet voit d'un coup
 * d'oeil qui peut emettre ET recevoir des factures electroniques conformes, et
 * qui doit etre regularise avant la fin de la tolerance (31 decembre 2026).
 */
export function CabinetConformite({ lignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  if (lignes.length === 0) return null;
  const prets = lignes.filter((l) => l.conformite.pret).length;

  return (
    <div className="carte mb-6 overflow-hidden">
      <div className="p-4 border-b border-ds-border flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-ink font-semibold">Conformité à la réforme</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Qui peut émettre et recevoir des factures électroniques conformes. Après la fin de la tolérance
            (31 décembre 2026), une facture non conforme coûte 50 € (plafond 15 000 €/an).
          </p>
        </div>
        <span className={`text-sm font-semibold ${prets === lignes.length ? "text-emerald-400" : "text-amber-400"}`}>
          {prets}/{lignes.length} prêts
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 bg-ds-elevated border-b border-ds-border">
              <th className="px-4 py-2.5 font-semibold">Dossier</th>
              <th className="px-4 py-2.5 font-semibold text-center">Plateforme</th>
              <th className="px-4 py-2.5 font-semibold text-center">Reçoit</th>
              <th className="px-4 py-2.5 font-semibold text-center">SIRET</th>
              <th className="px-4 py-2.5 font-semibold text-center">TVA</th>
              <th className="px-4 py-2.5 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr
                key={l.id}
                onClick={() => router.push(`/cabinet/${l.id}`)}
                className="border-b border-ds-border last:border-0 cursor-pointer hover:bg-ds-elevated transition-colors"
              >
                <td className="px-4 py-2 text-ink font-medium">{l.nom}</td>
                <td className="px-4 py-2 text-center"><div className="flex justify-center"><Pastille ok={l.conformite.raccordePA} /></div></td>
                <td className="px-4 py-2 text-center"><div className="flex justify-center"><Pastille ok={l.conformite.joignableAnnuaire} /></div></td>
                <td className="px-4 py-2 text-center"><div className="flex justify-center"><Pastille ok={l.conformite.siretValide} /></div></td>
                <td className="px-4 py-2 text-center"><div className="flex justify-center"><Pastille ok={l.conformite.tvaConforme} /></div></td>
                <td className="px-4 py-2">
                  {l.conformite.pret ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Prêt</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">À régulariser</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
