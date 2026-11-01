import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estComptableDe } from "@/lib/cabinet-acces";
import {
  syntheseDossiers,
  lireFacturesDossiers,
  tvaParTaux,
  estEmise,
  signe,
  type FactureCabinet,
} from "@/lib/cabinet-dossiers";
import { estAvoir } from "@/lib/exports-comptables";

export const metadata: Metadata = { title: "Dossier client" };
export const dynamic = "force-dynamic";

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const pct = (t: number) => `${String(t).replace(".", ",")} %`;
const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR");

const STATUT: Record<string, string> = {
  draft: "Brouillon",
  sent: "Émise",
  paid: "Payée",
  cancelled: "Annulée",
};

function plateforme(f: FactureCabinet): { texte: string; ton: string } {
  if (!estEmise(f)) return { texte: "", ton: "" };
  if (f.superpdp_error) return { texte: "Erreur", ton: "text-red-400" };
  if (f.superpdp_status) return { texte: "Transmise", ton: "text-emerald-400" };
  return { texte: "Non transmise", ton: "text-gray-500" };
}

export default async function FicheClient({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ annee?: string }>;
}) {
  const { id } = await params;
  const { annee: anneeParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  // Un dossier hors portefeuille n'existe pas, vu du cabinet.
  if (!(await estComptableDe(admin, user.id, id))) notFound();

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const annee = /^\d{4}$/.test(anneeParam ?? "") ? Number(anneeParam) : anneeCourante;

  const [[synthese], toutes] = await Promise.all([
    syntheseDossiers(admin, [id], maintenant),
    lireFacturesDossiers(admin, [id], `${annee}-01-01`),
  ]);
  const factures = toutes.filter((f) => f.issue_date.startsWith(String(annee)));
  const emises = factures.filter(estEmise);

  const caHt = Math.round(emises.reduce((s, f) => s + signe(f) * Number(f.total_ht ?? 0), 0) * 100) / 100;
  const tvaAn = tvaParTaux(factures);
  const tvaTotale = Math.round(tvaAn.reduce((s, t) => s + t.tva, 0) * 100) / 100;

  // TVA collectee mois par mois, le plus recent en tete : c'est la base de la
  // declaration du mois (ou du trimestre, en additionnant trois lignes).
  const moisMax = annee === anneeCourante ? maintenant.getMonth() + 1 : 12;
  const taux = [...new Set(tvaAn.map((t) => t.taux))].sort((a, b) => b - a);
  const lignesTva = Array.from({ length: moisMax }, (_, i) => {
    const prefixe = `${annee}-${String(i + 1).padStart(2, "0")}`;
    const parTaux = tvaParTaux(factures.filter((f) => f.issue_date.startsWith(prefixe)));
    return {
      mois: new Date(annee, i, 1).toLocaleDateString("fr-FR", { month: "long" }),
      base: parTaux.reduce((s, t) => s + t.base_ht, 0),
      tva: parTaux.reduce((s, t) => s + t.tva, 0),
      parTaux,
    };
  }).reverse();

  const exportUrl = (format: "fec" | "csv") => `/api/cabinet/export?format=${format}&year=${annee}&clients=${id}`;
  const badge = "text-xs px-2 py-0.5 rounded-full border";
  const tuiles = [
    { label: `CA HT ${annee}`, valeur: eur(caHt) },
    { label: `TVA collectée ${annee}`, valeur: eur(tvaTotale) },
    { label: `Factures émises ${annee}`, valeur: String(emises.length) },
    {
      label: "Impayés échus",
      valeur: synthese.impayes.nb ? `${synthese.impayes.nb} · ${eur(synthese.impayes.montant)}` : "Aucun",
    },
  ];

  return (
    <div>
      <Link href="/cabinet" className="text-sm text-gray-400 hover:text-white">
        ← Portefeuille
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white truncate">{synthese.nom}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {synthese.siret && <span className="text-xs text-gray-500">SIRET {synthese.siret}</span>}
            {synthese.raccorde ? (
              <span className={`${badge} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`}>
                Raccordé à une plateforme agréée
              </span>
            ) : (
              <span className={`${badge} border-red-500/30 bg-red-500/10 text-red-400`}>Non raccordé</span>
            )}
            <span className={`${badge} border-ds-border text-gray-400`}>Lecture seule</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[anneeCourante, anneeCourante - 1].map((a) => (
            <Link
              key={a}
              href={`/cabinet/${id}?annee=${a}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                a === annee ? "border-indigo-500 text-white" : "border-ds-border text-gray-400 hover:text-white"
              }`}
            >
              {a}
            </Link>
          ))}
          <a href={exportUrl("fec")} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
            Exporter le FEC {annee}
          </a>
          <a href={exportUrl("csv")} className="text-sm px-3 py-1.5 border border-ds-border text-gray-300 rounded-lg hover:bg-white/5 font-medium transition-colors">
            CSV des factures
          </a>
        </div>
      </div>

      {synthese.anomalies.length > 0 && (
        <div className="bg-ds-surface border border-ds-border rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-2">À traiter</h2>
          <ul className="space-y-1.5">
            {synthese.anomalies.map((a) => (
              <li key={a.libelle} className="flex items-start gap-2 text-sm text-gray-300">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.niveau === "rouge" ? "bg-red-500" : "bg-amber-500"}`} />
                {a.libelle}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tuiles.map((t) => (
          <div key={t.label} className="bg-ds-surface border border-ds-border rounded-xl p-4">
            <div className="text-xs text-gray-500">{t.label}</div>
            <div className="text-xl font-semibold mt-1 text-white">{t.valeur}</div>
          </div>
        ))}
      </div>

      <div className="bg-ds-surface border border-ds-border rounded-xl mb-6 overflow-hidden">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-white font-semibold">TVA collectée par mois</h2>
          <p className="text-xs text-gray-500 mt-0.5">Avoirs déduits. Pour une déclaration trimestrielle, additionnez les trois mois.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-ds-border">
                <th className="px-4 py-2 font-medium">Mois</th>
                <th className="px-4 py-2 font-medium text-right">Base HT</th>
                {taux.map((t) => (
                  <th key={t} className="px-4 py-2 font-medium text-right">TVA {pct(t)}</th>
                ))}
                <th className="px-4 py-2 font-medium text-right">TVA totale</th>
              </tr>
            </thead>
            <tbody>
              {lignesTva.map((l) => (
                <tr key={l.mois} className="border-b border-ds-border last:border-0">
                  <td className="px-4 py-2 text-gray-300 capitalize">{l.mois}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{eur(l.base)}</td>
                  {taux.map((t) => (
                    <td key={t} className="px-4 py-2 text-right text-gray-300">
                      {eur(l.parTaux.find((x) => x.taux === t)?.tva ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right text-white font-medium">{eur(l.tva)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-white font-semibold">Factures {annee}</h2>
        </div>
        {factures.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Aucune facture sur {annee}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-ds-border">
                  <th className="px-4 py-2 font-medium">Numéro</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium text-right">HT</th>
                  <th className="px-4 py-2 font-medium text-right">TTC</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Plateforme</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => {
                  const s = signe(f);
                  const pf = plateforme(f);
                  return (
                    <tr key={f.id} className="border-b border-ds-border last:border-0">
                      <td className="px-4 py-2 text-gray-200 whitespace-nowrap">
                        {f.invoice_number || "Brouillon"}
                        {estAvoir(f) && <span className="ml-2 text-xs text-amber-400">Avoir</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{dateFr(f.issue_date)}</td>
                      <td className="px-4 py-2 text-gray-300">{f.client_company || f.client_name || ""}</td>
                      <td className="px-4 py-2 text-right text-gray-300 whitespace-nowrap">{eur(s * Number(f.total_ht ?? 0))}</td>
                      <td className="px-4 py-2 text-right text-gray-300 whitespace-nowrap">{eur(s * Number(f.total_ttc ?? 0))}</td>
                      <td className="px-4 py-2 text-gray-400">{STATUT[f.status] ?? f.status}</td>
                      <td className={`px-4 py-2 ${pf.ton}`} title={f.superpdp_error ?? undefined}>{pf.texte}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
