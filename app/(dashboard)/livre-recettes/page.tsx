import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { estTitulaire, estComptable } from "@/lib/droits";
import { can } from "@/lib/plans";
import { getPlan } from "@/lib/stripe";
import { TuileSynthese, PuceCouleur } from "@/components/ui/CarteDepliable";
import { lireFacturesPayees, lignesRecettes, totauxParCategorie, MODES_REGLEMENT, type LigneRecette } from "@/lib/recettes";

export const metadata: Metadata = { title: "Livre des recettes" };
export const dynamic = "force-dynamic";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/[  ]/g, " ");

const jour = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Livre des recettes du micro-entrepreneur, tenu automatiquement.
 *
 * Obligatoire pour tous les micro-entrepreneurs : une ligne par encaissement,
 * dans l'ordre chronologique, avec la date d'encaissement, la reference de la
 * facture, le client, la nature de la prestation, le montant et le mode de
 * reglement. Les lignes viennent de lib/recettes.ts, la meme source que le
 * recapitulatif CA/URSSAF du tableau de bord : les deux ne peuvent pas diverger.
 *
 * Reserve au titulaire : c'est la comptabilite de l'entreprise.
 *
 * Habillage aligne sur la finition des pages a donnees (Factures recues,
 * Declarations) : tuiles de synthese partagees (TuileSynthese), pastilles
 * partagees (PuceCouleur) et tableau en relief. Le livre reste volontairement
 * un VRAI tableau, pas des cartes depliables : c'est un registre comptable
 * chronologique qui doit se lire et se controler ligne a ligne.
 */
export default async function LivreRecettes({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  // Page verrouillée au titulaire, mais ouverte à l'expert-comptable en
  // lecture seule : le livre des recettes est un livrable comptable.
  if (!estTitulaire(user.id, workspaceId) && !(await estComptable(user.id, workspaceId))) {
    redirect("/dashboard");
  }

  const profil = await getWorkspaceProfile<{ plan: string | null }>(workspaceId, "plan");
  const plan = getPlan(profil?.plan);
  const autorise = can(plan, "livreRecettes");

  const anneeCourante = new Date().getFullYear();
  const demandee = Number((await searchParams).annee);
  const annee = Number.isInteger(demandee) && demandee >= 2000 && demandee <= anneeCourante ? demandee : anneeCourante;

  let lignes: LigneRecette[] = [];
  let erreur: string | null = null;
  if (autorise) {
    try {
      lignes = lignesRecettes(await lireFacturesPayees(supabase, workspaceId, annee), annee);
    } catch (e) {
      erreur = e instanceof Error ? e.message : "Lecture impossible";
    }
  }

  const parMois = MOIS.map((nom, i) => {
    const l = lignes.filter((x) => Number(x.date.slice(5, 7)) === i + 1);
    return { nom, lignes: l, ht: l.reduce((s, x) => s + x.ht, 0), ttc: l.reduce((s, x) => s + x.ttc, 0) };
  }).filter((m) => m.lignes.length > 0);

  const totalHt = lignes.reduce((s, x) => s + x.ht, 0);
  const totalTtc = lignes.reduce((s, x) => s + x.ttc, 0);
  const parCategorie = totauxParCategorie(lignes);
  const sansDate = lignes.filter((l) => l.dateEstimee).length;
  const sansMode = lignes.filter((l) => !l.mode).length;
  const annees = [anneeCourante, anneeCourante - 1, anneeCourante - 2];

  return (
    <div className="w-full">
      <GuidedTourBanner pageKey="livre-recettes" />
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="titre-page">Livre des recettes</h1>
          <p className="sous-titre-page">
            Tenu automatiquement à partir de vos factures payées, dans l&apos;ordre des encaissements.
          </p>
        </div>
        {autorise && (
          <div className="flex items-center gap-2">
            {annees.map((a) => (
              <Link
                key={a}
                href={`/livre-recettes?annee=${a}`}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${a === annee ? "border-indigo-500 text-ink" : "border-ds-border text-gray-400 hover:text-ink hover:bg-ds-elevated/40"}`}
              >
                {a}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!autorise ? (
        <div className="carte p-6 text-sm text-gray-300">
          Le livre des recettes est inclus dans les formules Solo et Pro.{" "}
          <Link href="/billing" className="text-indigo-400 hover:underline">Voir les formules</Link>
        </div>
      ) : erreur ? (
        // Une lecture qui échoue ne doit pas se lire comme « aucun encaissement » :
        // une panne doit se voir, et le détail doit être signalable.
        <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-ink font-medium mb-1">Impossible de lire votre livre des recettes</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Vous avez peut-être des encaissements : cette page n&apos;a pas pu les charger, alors
            elle ne prétend pas le contraire. Réessayez dans un instant ; si le problème persiste,
            signalez-le avec ce détail&nbsp;:
          </p>
          <p className="mt-3 text-xs font-mono text-red-400/90 break-all max-w-md mx-auto">{erreur}</p>
        </section>
      ) : (
        <>
          {/* Bandeau de synthèse : la lecture d'un coup d'œil, avant le détail. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <TuileSynthese libelle={`Encaissé ${annee} (HT)`} valeur={eur(totalHt)} />
            <TuileSynthese libelle={`Encaissé ${annee} (TTC)`} valeur={eur(totalTtc)} />
            <TuileSynthese libelle="Encaissements" valeur={String(lignes.length)} />
          </div>

          <div className="carte p-4 mb-6">
            <h2 className="text-ink font-semibold text-sm">Répartition pour la déclaration</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Le CA micro se déclare séparément : prestations de services et ventes de biens n&apos;ont pas le même abattement ni le même seuil.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <PuceCouleur classe="border-violet-500/30 bg-violet-500/10 text-violet-300" texte="Services" />
                  <p className="text-xs text-gray-400">Prestations de services (HT)</p>
                </div>
                <p className="text-lg font-semibold text-ink tabular-nums mt-1.5">{eur(parCategorie.services.ht)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{parCategorie.services.nb} encaissement{parCategorie.services.nb > 1 ? "s" : ""}</p>
              </div>
              <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <PuceCouleur classe="border-sky-500/30 bg-sky-500/10 text-sky-300" texte="Biens" />
                  <p className="text-xs text-gray-400">Ventes de biens (HT)</p>
                </div>
                <p className="text-lg font-semibold text-ink tabular-nums mt-1.5">{eur(parCategorie.biens.ht)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{parCategorie.biens.nb} encaissement{parCategorie.biens.nb > 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          <div className="carte p-4 mb-6">
            <h2 className="text-ink font-semibold text-sm">Exports comptables {annee}</h2>
            <p className="text-xs text-gray-400 mt-0.5">À transmettre à votre comptable ou à conserver en cas de contrôle.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a href={`/api/export/livre-recettes?annee=${annee}`} className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-ink font-medium transition-colors">
                Livre des recettes (CSV)
              </a>
              <a href={`/api/export/fec?year=${annee}`} className="text-sm px-3 py-1.5 rounded-lg border border-ds-border text-gray-300 hover:bg-ds-elevated transition-colors font-medium">
                Écritures comptables (FEC)
              </a>
              <a href={`/api/export/invoices-csv?year=${annee}`} className="text-sm px-3 py-1.5 rounded-lg border border-ds-border text-gray-300 hover:bg-ds-elevated transition-colors font-medium">
                Factures de l&apos;année (CSV)
              </a>
              <a href={`/api/export/monthly-recap?year=${annee}`} className="text-sm px-3 py-1.5 rounded-lg border border-ds-border text-gray-300 hover:bg-ds-elevated transition-colors font-medium">
                Récapitulatif mensuel CA (CSV)
              </a>
            </div>
          </div>

          {(sansDate > 0 || sansMode > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-sm text-amber-400">
              {sansDate > 0 && (
                <p>
                  {sansDate} encaissement(s) sans date réelle : la date d&apos;émission de la facture est affichée à la place.
                </p>
              )}
              {sansMode > 0 && <p>{sansMode} encaissement(s) sans mode de règlement renseigné.</p>}
              <p className="text-gray-400 mt-1">
                Ce sont des factures marquées payées avant que Deviso ne demande ces informations. Les suivantes les auront.
              </p>
            </div>
          )}

          {lignes.length === 0 ? (
            <section className="carte p-6 text-center">
              <p className="text-ink font-medium mb-1">Aucun encaissement en {annee}</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Une facture apparaît ici dès que vous la marquez payée.
              </p>
            </section>
          ) : (
            <div className="carte overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ds-elevated border-b border-ds-border text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">Encaissé le</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">Facture</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Client</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Catégorie</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400">Nature</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right whitespace-nowrap">HT</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right whitespace-nowrap">Encaissé (TTC)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">Règlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parMois.map((m) => (
                      <Fragment key={m.nom}>
                        {m.lignes.map((l) => (
                          <tr key={l.id} className="border-b border-ds-border align-top hover:bg-ds-elevated/40 transition-colors">
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                              {jour(l.date)}
                              {l.dateEstimee && <span className="block text-xs text-amber-400">date d&apos;émission</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-mono text-xs">{l.numero}</td>
                            <td className="px-4 py-3 text-ink">{l.client}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <PuceCouleur
                                classe={l.categorie === "biens" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" : "border-violet-500/30 bg-violet-500/10 text-violet-300"}
                                texte={l.categorie === "biens" ? "Biens" : "Services"}
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-400 max-w-88">{l.nature}</td>
                            <td className="px-4 py-3 text-gray-300 text-right tabular-nums whitespace-nowrap">{eur(l.ht)}</td>
                            <td className="px-4 py-3 text-ink text-right tabular-nums whitespace-nowrap font-medium">{eur(l.ttc)}</td>
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                              {l.mode ? MODES_REGLEMENT[l.mode] : <span className="text-amber-400">non renseigné</span>}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-b border-ds-border bg-ds-elevated/40">
                          <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-gray-400">Total {m.nom.toLowerCase()}</td>
                          <td className="px-4 py-2 text-right text-xs font-semibold text-gray-300 tabular-nums">{eur(m.ht)}</td>
                          <td className="px-4 py-2 text-right text-xs font-semibold text-ink tabular-nums">{eur(m.ttc)}</td>
                          <td />
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
