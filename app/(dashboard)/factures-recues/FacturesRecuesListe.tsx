import { SignalerProbleme } from "./SignalerProbleme";
import { libelleStatut, estCloture } from "@/lib/superpdp-statuts";

/**
 * Liste des factures reçues, une carte dépliable par facture.
 *
 * ⚠️ Composant SERVEUR volontairement, et dépliage en <details>/<summary>
 * NATIF. La première version était un composant client avec useState : le
 * formatage des montants/dates s'exécutait alors des deux côtés et différait
 * (espaces Intl entre Node et le navigateur) — erreur React #418, hydratation
 * cassée, plus aucun clic. Le <details> natif est géré par le navigateur sans
 * JavaScript à hydrater : le dépliage marche quoi qu'il arrive, et le
 * formatage ne tourne plus que sur le serveur.
 */

type Facture = {
  id: number;
  number: string | null;
  issue_date: string | null;
  payment_due_date: string | null;
  seller_name: string | null;
  total_with_vat: number | null;
  currency_code: string | null;
  last_status_code: string | null;
  received_at: string | null;
};

const ESP = " ";
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const euros = (v: number | null, devise: string | null) => {
  if (v === null) return "—";
  const [ent, dec] = Math.abs(v).toFixed(2).split(".");
  const groupe = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ESP);
  const signe = v < 0 ? "-" : "";
  const code = devise && devise !== "EUR" ? " " + devise : ESP + "€";
  return signe + groupe + "," + dec + code;
};

const jour = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  const jj = String(d.getUTCDate()).padStart(2, "0");
  return jj + " " + MOIS[d.getUTCMonth()] + " " + d.getUTCFullYear();
};

function estEnRetard(f: { payment_due_date: string | null; last_status_code: string | null }) {
  if (!f.payment_due_date) return false;
  if (estCloture(f.last_status_code)) return false;
  return new Date(f.payment_due_date) < new Date();
}

function Puce({ statut, code }: { statut: ReturnType<typeof libelleStatut>; code: string | null }) {
  const ton = statut?.ton;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
        ton === "bien"
          ? "bg-emerald-500/15 text-emerald-400"
          : ton === "attention"
            ? "bg-amber-500/15 text-amber-400"
            : "bg-ds-elevated text-gray-400"
      }`}
    >
      {statut?.texte ?? code ?? "—"}
    </span>
  );
}

function Tuile({ libelle, valeur, alerte }: { libelle: string; valeur: string; alerte?: boolean }) {
  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400">{libelle}</p>
      <p className={`text-xl font-semibold mt-0.5 ${alerte ? "text-red-400" : "text-white"}`}>{valeur}</p>
    </div>
  );
}

export function FacturesRecuesListe({
  factures,
  adresseAnnuaire,
}: {
  factures: Facture[];
  adresseAnnuaire: string | null;
}) {
  const totalDu = factures
    .filter((f) => !estCloture(f.last_status_code))
    .reduce((s, f) => s + (f.total_with_vat ?? 0), 0);
  const nbRetard = factures.filter(estEnRetard).length;
  const nbATraiter = factures.filter((f) => libelleStatut(f.last_status_code)?.ton === "attention").length;

  return (
    <>
      {/* Bandeau de synthèse : la lecture d'un coup d'œil, avant le détail. */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <Tuile libelle="Total à payer" valeur={euros(totalDu, "EUR")} />
        <Tuile libelle="En retard" valeur={String(nbRetard)} alerte={nbRetard > 0} />
        <Tuile libelle="À traiter" valeur={String(nbATraiter)} alerte={nbATraiter > 0} />
      </div>

      <div className="space-y-2.5 mt-4">
        {factures.map((f) => {
          const statut = libelleStatut(f.last_status_code);
          const enRetard = estEnRetard(f);
          return (
            <details
              key={f.id}
              className="group bg-ds-surface border border-ds-border rounded-xl overflow-hidden shadow-sm transition-colors hover:border-gray-600 open:border-indigo-500/40 open:shadow-md"
            >
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-ds-elevated/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium truncate">{f.seller_name ?? "—"}</span>
                    <Puce statut={statut} code={f.last_status_code} />
                  </div>
                  <p className={`text-xs mt-0.5 ${enRetard ? "text-red-400 font-medium" : "text-gray-400"}`}>
                    {enRetard ? "En retard depuis le" : "Échéance"} {jour(f.payment_due_date)}
                  </p>
                </div>
                <span className="text-white font-semibold whitespace-nowrap shrink-0">
                  {euros(f.total_with_vat, f.currency_code)}
                </span>
                <svg
                  className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>

              <div className="px-4 pb-4 pt-1 bg-ds-bg/40">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
                  <div>
                    <dt className="text-xs text-gray-400">Numéro</dt>
                    <dd className="text-gray-300 font-mono text-xs">{f.number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Émise le</dt>
                    <dd className="text-gray-300">{jour(f.issue_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Reçue le</dt>
                    <dd className="text-gray-300">{jour(f.received_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Échéance</dt>
                    <dd className={enRetard ? "text-red-400 font-medium" : "text-gray-300"}>
                      {jour(f.payment_due_date)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`/api/superpdp/invoices/${f.id}/download`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ds-border text-indigo-400 text-sm font-semibold hover:bg-ds-elevated transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Télécharger la facture
                  </a>
                  <SignalerProbleme
                    factureId={f.id}
                    fournisseur={f.seller_name ?? "ce fournisseur"}
                    statutActuel={f.last_status_code}
                  />
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {adresseAnnuaire && (
        <p className="text-xs text-gray-400 mt-3">
          Vos fournisseurs vous adressent leurs factures à{" "}
          <span className="font-mono text-gray-400 select-all">{adresseAnnuaire}</span>
        </p>
      )}
    </>
  );
}
