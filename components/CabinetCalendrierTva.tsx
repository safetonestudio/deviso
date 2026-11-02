"use client";

import { useRouter } from "next/navigation";

// Forme locale : composant envoye au navigateur, aucun import du code serveur
// cabinet (check:cabinet, regle 7).
type Periodicite = "monthly" | "quarterly" | "simplified";
type Periode = { cle: string; libelle: string; base_ht: number; tva: number } | null;
type Ligne = {
  id: string;
  nom: string;
  periodicite: Periodicite | null;
  franchise: boolean;
  aDeclarer: Periode;
  enCours: Periode;
};

const LIBELLE: Record<Periodicite, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  simplified: "Annuelle",
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Calendrier TVA du portefeuille : par dossier assujetti, la TVA de la derniere
 * periode close (prete a declarer) et celle qui s'accumule sur la periode en
 * cours. Les dossiers en franchise n'ont rien a declarer.
 */
export function CabinetCalendrierTva({ lignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  const assujettis = lignes.filter((l) => !l.franchise);
  const franchises = lignes.filter((l) => l.franchise);

  if (assujettis.length === 0) {
    return (
      <div className="carte p-4 mb-6">
        <h2 className="text-ink font-semibold mb-1">TVA à déclarer</h2>
        <p className="text-sm text-gray-500">
          Aucun dossier assujetti à la TVA dans votre portefeuille : rien à déclarer
          {franchises.length > 0 ? ` (${franchises.length} dossier${franchises.length > 1 ? "s" : ""} en franchise en base).` : "."}
        </p>
      </div>
    );
  }

  return (
    <div className="carte mb-6 overflow-hidden">
      <div className="p-4 border-b border-ds-border">
        <h2 className="text-ink font-semibold">TVA à déclarer par dossier</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          TVA collectée (avoirs déduits), prête pour la déclaration. La période close est à déclarer ;
          la période en cours n&apos;est pas encore terminée.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-ds-border">
              <th className="px-4 py-2 font-medium">Dossier</th>
              <th className="px-4 py-2 font-medium">Périodicité</th>
              <th className="px-4 py-2 font-medium">Période à déclarer</th>
              <th className="px-4 py-2 font-medium text-right">TVA à déclarer</th>
              <th className="px-4 py-2 font-medium">Période en cours</th>
              <th className="px-4 py-2 font-medium text-right">TVA en cours</th>
            </tr>
          </thead>
          <tbody>
            {assujettis.map((l) => (
              <tr
                key={l.id}
                onClick={() => router.push(`/cabinet/${l.id}`)}
                className="border-b border-ds-border last:border-0 cursor-pointer hover:bg-ds-elevated transition-colors"
              >
                <td className="px-4 py-2 text-ink font-medium">{l.nom}</td>
                <td className="px-4 py-2 text-gray-400">{l.periodicite ? LIBELLE[l.periodicite] : "À renseigner"}</td>
                {l.periodicite ? (
                  <>
                    <td className="px-4 py-2 text-gray-300 capitalize">{cap(l.aDeclarer?.libelle ?? "")}</td>
                    <td className="px-4 py-2 text-right text-ink font-semibold">{eur(l.aDeclarer?.tva ?? 0)}</td>
                    <td className="px-4 py-2 text-gray-400 capitalize">{cap(l.enCours?.libelle ?? "")}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{eur(l.enCours?.tva ?? 0)}</td>
                  </>
                ) : (
                  <td className="px-4 py-2 text-amber-400" colSpan={4}>
                    Renseignez la périodicité de TVA dans le profil du client pour calculer l&apos;échéance.
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {franchises.length > 0 && (
        <div className="px-4 py-3 border-t border-ds-border text-xs text-gray-500">
          {franchises.length} dossier{franchises.length > 1 ? "s" : ""} en franchise en base : rien à déclarer.
        </div>
      )}
    </div>
  );
}
