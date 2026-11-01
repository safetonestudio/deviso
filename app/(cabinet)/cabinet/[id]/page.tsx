import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estComptableDe } from "@/lib/cabinet-acces";
import { journaliser } from "@/lib/cabinet-journal";
import { signalementsDuDossier } from "@/lib/cabinet-signalements";
import { CabinetSignalements } from "@/components/CabinetSignalements";
import {
  syntheseDossiers,
  lireFacturesDossiers,
  tvaParTaux,
  estEmise,
  signe,
  type FactureCabinet,
} from "@/lib/cabinet-dossiers";
import { estAvoir } from "@/lib/exports-comptables";
import { libelleStatut } from "@/lib/superpdp-statuts";

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

// Libelle officiel du cycle de vie (lib/superpdp-statuts.ts) : une facture
// refusee ou rejetee ne doit jamais apparaitre comme « transmise ».
function plateforme(f: FactureCabinet): { texte: string; ton: string } {
  if (!estEmise(f)) return { texte: "", ton: "" };
  if (f.superpdp_error) return { texte: "Erreur de transmission", ton: "text-red-400" };
  const st = libelleStatut(f.superpdp_status);
  if (!st) {
    // Code hors table : affiche brut plutot que sous un libelle invente.
    return f.superpdp_status
      ? { texte: f.superpdp_status, ton: "text-gray-400" }
      : { texte: "Non transmise", ton: "text-gray-500" };
  }
  const ton = st.ton === "attention" ? (st.cloture ? "text-red-400" : "text-amber-400") : st.ton === "bien" ? "text-emerald-400" : "text-gray-300";
  return { texte: st.texte, ton };
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

  // Trace l'acces au dossier (best-effort, ne bloque jamais l'affichage).
  await journaliser(admin, user.id, "consultation", id);

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const annee = /^\d{4}$/.test(anneeParam ?? "") ? Number(anneeParam) : anneeCourante;

  const [[synthese], toutes] = await Promise.all([
    syntheseDossiers(admin, [id], maintenant),
    // On lit aussi l'annee precedente : elle sert a la comparaison N-1.
    lireFacturesDossiers(admin, [id], `${annee - 1}-01-01`),
  ]);
  const factures = toutes.filter((f) => f.issue_date.startsWith(String(annee)));
  const emises = factures.filter(estEmise);

  // Comparaison N-1 sur une base comparable : pour l'annee en cours, on arrete
  // les deux periodes a la meme date du calendrier (year-to-date), sinon on
  // compare deux annees pleines. Sans cela, le « YTD » de cette annee serait
  // compare a une annee complete et afficherait toujours une baisse.
  const finPeriode = annee === anneeCourante ? maintenant.toISOString().slice(5, 10) : "12-31";
  const totauxPeriode = (an: number) => {
    const em = toutes.filter(
      (f) => estEmise(f) && f.issue_date >= `${an}-01-01` && f.issue_date <= `${an}-${finPeriode}`,
    );
    return {
      caHt: Math.round(em.reduce((s, f) => s + signe(f) * Number(f.total_ht ?? 0), 0) * 100) / 100,
      tva: Math.round(tvaParTaux(em).reduce((s, t) => s + t.tva, 0) * 100) / 100,
      nb: em.filter((f) => !estAvoir(f)).length,
    };
  };
  const nActuel = totauxPeriode(annee);
  const nPrecedent = totauxPeriode(annee - 1);

  const signalements = await signalementsDuDossier(admin, user.id, id);

  const caHt = Math.round(emises.reduce((s, f) => s + signe(f) * Number(f.total_ht ?? 0), 0) * 100) / 100;
  const nbAvoirs = emises.filter((f) => estAvoir(f)).length;
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
    {
      label: `Factures émises ${annee}`,
      valeur: String(emises.filter((f) => !estAvoir(f)).length) + (nbAvoirs ? ` + ${nbAvoirs} avoir${nbAvoirs > 1 ? "s" : ""}` : ""),
    },
    {
      label: "Impayés échus",
      valeur: synthese.impayes.nb ? `${synthese.impayes.nb} · ${eur(synthese.impayes.montant)}` : "Aucun",
    },
  ];

  const comparaisons = [
    { label: "CA HT", actuel: nActuel.caHt, precedent: nPrecedent.caHt, fmt: eur },
    { label: "TVA collectée", actuel: nActuel.tva, precedent: nPrecedent.tva, fmt: eur },
    { label: "Factures émises", actuel: nActuel.nb, precedent: nPrecedent.nb, fmt: (n: number) => String(n) },
  ];
  const evolution = (actuel: number, precedent: number): { texte: string; ton: string } | null => {
    if (!precedent) return actuel ? { texte: "nouveau", ton: "text-gray-500" } : null;
    const pct = Math.round(((actuel - precedent) / Math.abs(precedent)) * 100);
    return { texte: `${pct > 0 ? "+" : ""}${pct} %`, ton: pct > 0 ? "text-emerald-400" : pct < 0 ? "text-amber-400" : "text-gray-500" };
  };

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

      <CabinetSignalements clientId={id} initiaux={signalements} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tuiles.map((t) => (
          <div key={t.label} className="bg-ds-surface border border-ds-border rounded-xl p-4">
            <div className="text-xs text-gray-500">{t.label}</div>
            <div className="text-xl font-semibold mt-1 text-white">{t.valeur}</div>
          </div>
        ))}
      </div>

      <div className="bg-ds-surface border border-ds-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-white font-semibold">Comparaison avec {annee - 1}</h2>
          <span className="text-xs text-gray-500">
            {annee === anneeCourante ? "À date, du 1er janvier à aujourd'hui" : "Année complète"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comparaisons.map((c) => {
            const ev = evolution(c.actuel, c.precedent);
            return (
              <div key={c.label} className="bg-ds-bg border border-ds-border rounded-lg p-3">
                <div className="text-xs text-gray-500">{c.label}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-semibold text-white">{c.fmt(c.actuel)}</span>
                  {ev && <span className={`text-xs font-medium ${ev.ton}`}>{ev.texte}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{annee - 1} : {c.fmt(c.precedent)}</div>
              </div>
            );
          })}
        </div>
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
