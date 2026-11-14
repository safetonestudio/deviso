import type { Metadata } from "next";
import Link from "next/link";
import { ExportsComptables } from "@/components/ExportsComptables";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { estTitulaire, estComptable } from "@/lib/droits";
import { can } from "@/lib/plans";
import { getPlan } from "@/lib/stripe";
import { lireFacturesPayees, lignesRecettes, totauxParCategorie, MODES_REGLEMENT, type LigneRecette } from "@/lib/recettes";

export const metadata: Metadata = { title: "Livre des recettes" };
export const dynamic = "force-dynamic";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/[  ]/g, " ");

const jour = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Tuile de synthese du livre : libelle, montant, precision. */
function Tuile({ libelle, valeur, detail }: { libelle: string; valeur: string; detail: string }) {
  return (
    <div className="carte px-4 py-3.5 min-w-0">
      <p className="text-[13px] font-medium text-gray-300 break-words">{libelle}</p>
      <p className="text-[22px] leading-tight font-semibold text-ink tabular-nums mt-1.5 break-words">{valeur}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

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
 * Mise en page (15/11/2026, retour Selim « bordelique ») : une rangee de quatre
 * tuiles, puis un seul bloc registre qui porte son export, ses colonnes a
 * largeur fixe et un en-tete par mois avec ses totaux. Le livre reste volontairement
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
          <div className="inline-flex items-center gap-0.5 p-1 rounded-lg border border-ds-border bg-ds-surface" role="group" aria-label="Année du livre">
            {annees.map((a) => (
              <Link
                key={a}
                href={`/livre-recettes?annee=${a}`}
                aria-current={a === annee ? "page" : undefined}
                className={`text-sm px-3 py-1.5 rounded-md tabular-nums transition-colors ${a === annee ? "bg-ds-elevated text-ink font-semibold" : "text-gray-400 hover:text-ink"}`}
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
          {/* Synthèse : une seule rangée. Les deux totaux, puis la répartition
              services / biens que la déclaration demande séparément. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tuile libelle={`Encaissé ${annee}, hors taxes`} valeur={eur(totalHt)} detail={`${lignes.length} encaissement${lignes.length > 1 ? "s" : ""}`} />
            <Tuile libelle={`Encaissé ${annee}, TTC`} valeur={eur(totalTtc)} detail="TVA comprise" />
            <Tuile libelle="Prestations de services, HT" valeur={eur(parCategorie.services.ht)} detail={`${parCategorie.services.nb} encaissement${parCategorie.services.nb > 1 ? "s" : ""}`} />
            <Tuile libelle="Ventes de biens, HT" valeur={eur(parCategorie.biens.ht)} detail={`${parCategorie.biens.nb} encaissement${parCategorie.biens.nb > 1 ? "s" : ""}`} />
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-6">
            Services et biens se déclarent séparément : ils n&apos;ont ni le même abattement ni le même seuil.
          </p>

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
              {/* Barre d'outils du registre : ce qu'on regarde, et l'export. */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-ds-border">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Registre {annee}</h2>
                  <p className="text-xs text-gray-400">Dans l&apos;ordre des encaissements, total par mois.</p>
                </div>
                <ExportsComptables annee={annee} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[104px]" />
                    <col className="w-[120px]" />
                    <col className="w-[16%]" />
                    <col />
                    <col className="w-[92px]" />
                    <col className="w-[112px]" />
                    <col className="w-[120px]" />
                    <col className="w-[132px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-ds-elevated border-b border-ds-border text-left text-xs font-medium text-gray-400">
                      <th className="px-4 py-2.5 font-medium">Encaissé le</th>
                      <th className="px-4 py-2.5 font-medium">Facture</th>
                      <th className="px-4 py-2.5 font-medium">Client</th>
                      <th className="px-4 py-2.5 font-medium">Nature</th>
                      <th className="px-4 py-2.5 font-medium">Catégorie</th>
                      <th className="px-4 py-2.5 font-medium text-right">HT</th>
                      <th className="px-4 py-2.5 font-medium text-right">Encaissé TTC</th>
                      <th className="px-4 py-2.5 font-medium">Règlement</th>
                    </tr>
                  </thead>
                  {parMois.map((m) => (
                    <tbody key={m.nom}>
                      {/* En-tête de mois : le nom et ses totaux, avant ses lignes. */}
                      <tr className="bg-ds-bg border-b border-ds-border">
                        <th colSpan={5} scope="rowgroup" className="px-4 py-2 text-left text-[13px] font-semibold text-ink">
                          {m.nom}
                          <span className="ml-2 font-normal text-gray-400">{m.lignes.length} encaissement{m.lignes.length > 1 ? "s" : ""}</span>
                        </th>
                        <td className="px-4 py-2 text-right text-[13px] font-semibold text-ink tabular-nums whitespace-nowrap">{eur(m.ht)}</td>
                        <td className="px-4 py-2 text-right text-[13px] font-semibold text-ink tabular-nums whitespace-nowrap">{eur(m.ttc)}</td>
                        <td />
                      </tr>
                      {m.lignes.map((l) => (
                        <tr key={l.id} className="border-b border-ds-border align-top hover:bg-ds-elevated/40 transition-colors">
                          <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                            {jour(l.date)}
                            {l.dateEstimee && <span className="block text-xs text-amber-400">date d&apos;émission</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap font-mono text-xs leading-5">{l.numero}</td>
                          <td className="px-4 py-2.5 text-ink truncate" title={l.client}>{l.client}</td>
                          <td className="px-4 py-2.5 text-gray-400"><span className="line-clamp-2" title={l.nature}>{l.nature}</span></td>
                          <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{l.categorie === "biens" ? "Biens" : "Services"}</td>
                          <td className="px-4 py-2.5 text-gray-300 text-right tabular-nums whitespace-nowrap">{eur(l.ht)}</td>
                          <td className="px-4 py-2.5 text-ink text-right tabular-nums whitespace-nowrap font-medium">{eur(l.ttc)}</td>
                          <td className="px-4 py-2.5 text-gray-400 truncate" title={l.mode ? MODES_REGLEMENT[l.mode] : undefined}>
                            {l.mode ? MODES_REGLEMENT[l.mode] : <span className="text-amber-400">non renseigné</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                  <tfoot>
                    <tr className="bg-ds-elevated">
                      <th colSpan={5} scope="row" className="px-4 py-3 text-left text-sm font-semibold text-ink">Total {annee}</th>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-ink tabular-nums whitespace-nowrap">{eur(totalHt)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-ink tabular-nums whitespace-nowrap">{eur(totalTtc)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
