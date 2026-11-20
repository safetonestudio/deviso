import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers, lireFacturesDossiers } from "@/lib/cabinet-dossiers";
import { calendrierTva } from "@/lib/cabinet-tva-calendrier";
import { ResumeHebdoToggle } from "@/components/cabinet/ResumeHebdoToggle";

export const metadata: Metadata = { title: "Accueil cabinet" };
export const dynamic = "force-dynamic";

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

/**
 * Accueil de l'espace cabinet (20/11/2026) : un tableau de bord, comme
 * l'accueil de l'app du client. La synthèse en haut, puis les dossiers à
 * traiter et la TVA à déclarer ; la liste complète vit sur /cabinet/dossiers.
 */
export default async function CabinetAccueil() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const maintenant = new Date();
  const dossiers = await syntheseDossiers(admin, ownerIds, maintenant);
  const factures = await lireFacturesDossiers(admin, ownerIds, `${maintenant.getFullYear() - 1}-01-01`);
  const calendrier = calendrierTva(dossiers, factures, maintenant);
  const { data: prefs } = await admin.from("profiles").select("resume_cabinet_hebdo").eq("id", user.id).maybeSingle();
  const conformite = dossiers.map((d) => ({ id: d.id, nom: d.nom, conformite: d.conformite }));

  const rouges = dossiers.filter((d) => d.niveau === "rouge").length;
  const oranges = dossiers.filter((d) => d.niveau === "orange").length;
  const caMois = dossiers.reduce((s, d) => s + d.caHtMois, 0);
  const moisLibelle = maintenant.toLocaleDateString("fr-FR", { month: "long" });
  const prets = conformite.filter((c) => c.conformite.pret).length;
  const tvaADeclarer = calendrier.filter((l) => l.aDeclarer && l.aDeclarer.tva > 0);
  const tvaTotale = tvaADeclarer.reduce((s, l) => s + (l.aDeclarer?.tva ?? 0), 0);
  const pl = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
  const prioritaires = dossiers.filter((d) => d.niveau !== "vert").slice(0, 5);
  const tvaTriee = [...tvaADeclarer].sort((a, b) => (b.aDeclarer?.tva ?? 0) - (a.aDeclarer?.tva ?? 0)).slice(0, 5);
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titre-page">Accueil</h1>
          <p className="sous-titre-page">Ce qui demande votre attention dans votre portefeuille, en un coup d&apos;œil.</p>
        </div>
        <Link
          href="/cabinet/inviter"
          className="h-9 inline-flex items-center px-3.5 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Inviter un client
        </Link>
      </div>

      {dossiers.length === 0 ? (
        <div className="carte carte-heros p-8 text-center">
          <p className="text-ink font-semibold mb-1">Aucun dossier rattaché pour l&apos;instant</p>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            <Link href="/cabinet/inviter" className="text-indigo-400 hover:text-indigo-300">Invitez un client</Link> : dès
            qu&apos;il saisit votre code dans Deviso, son dossier apparaît ici. Ses factures de vente y seront déjà,
            conformes et horodatées : rien à réclamer ni à ressaisir.
          </p>
        </div>
      ) : (
        <>
          {/* Synthèse : ce qui demande votre attention, et où le traiter. */}
          <section className="carte carte-heros p-5 sm:p-6 mb-6 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-gray-300">
                {pl(dossiers.length, "dossier")} suivi{dossiers.length > 1 ? "s" : ""}
              </div>
              <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                <span className={`font-semibold leading-none tracking-[-0.02em] text-[44px] sm:text-[52px] tabular-nums ${rouges ? "text-ink" : "text-emerald-400"}`}>
                  {rouges}
                </span>
                <span className="text-lg text-gray-300">
                  {rouges ? `dossier${rouges > 1 ? "s" : ""} demande${rouges > 1 ? "nt" : ""} une action` : "aucun dossier bloqué"}
                </span>
              </div>
              <p className="mt-3 text-[13px] text-gray-400">
                {oranges ? `${oranges} ${oranges > 1 ? "autres dossiers" : "autre dossier"} à surveiller. ` : ""}
                CA HT cumulé en {moisLibelle} : <span className="text-gray-200 font-medium tabular-nums">{eur(caMois)}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/cabinet/tva" className="group rounded-xl border border-ds-border bg-ds-bg/60 p-4 hover:border-gray-600 transition-colors">
                <div className="text-[13px] text-gray-300">TVA à déclarer</div>
                <div className="mt-1 text-xl font-semibold text-ink tabular-nums">{eur(tvaTotale)}</div>
                <div className="mt-1 text-[13px] text-gray-400 group-hover:text-gray-200 transition-colors">
                  {tvaADeclarer.length ? `${pl(tvaADeclarer.length, "dossier")}, période close →` : "Rien à déclarer →"}
                </div>
              </Link>
              <Link href="/cabinet/conformite" className="group rounded-xl border border-ds-border bg-ds-bg/60 p-4 hover:border-gray-600 transition-colors">
                <div className="text-[13px] text-gray-300">Conformité réforme</div>
                <div className={`mt-1 text-xl font-semibold tabular-nums ${prets === dossiers.length ? "text-emerald-400" : "text-ink"}`}>
                  {prets}/{dossiers.length} prêts
                </div>
                <div className="mt-1 text-[13px] text-gray-400 group-hover:text-gray-200 transition-colors">
                  {prets === dossiers.length ? "Tous peuvent recevoir →" : `${pl(dossiers.length - prets, "dossier")} à régulariser →`}
                </div>
              </Link>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="carte overflow-hidden">
              <div className="px-5 py-4 border-b border-ds-border flex items-center justify-between gap-3">
                <h2 className="text-ink font-semibold">À traiter en priorité</h2>
                <Link href="/cabinet/dossiers" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Tout le portefeuille →
                </Link>
              </div>
              {prioritaires.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400">Tous vos dossiers sont à jour.</p>
              ) : (
                <ul className="divide-y divide-ds-border">
                  {prioritaires.map((d) => (
                    <li key={d.id}>
                      <Link href={`/cabinet/${d.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-ds-elevated/60 transition-colors">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${d.niveau === "rouge" ? "bg-red-500" : "bg-amber-500"}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink truncate">{d.nom}</span>
                          <span className="flex gap-1 text-sm text-gray-400 min-w-0">
                            <span className="truncate">{d.anomalies[0]?.libelle}</span>
                            {d.anomalies.length > 1 && (
                              <span className="shrink-0 text-gray-500">
                                · et {d.anomalies.length - 1} autre{d.anomalies.length > 2 ? "s" : ""}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className={`hidden sm:inline shrink-0 text-xs font-medium ${d.niveau === "rouge" ? "text-red-400" : "text-amber-400"}`}>
                          {d.niveau === "rouge" ? "Action requise" : "À surveiller"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="carte overflow-hidden">
              <div className="px-5 py-4 border-b border-ds-border flex items-center justify-between gap-3">
                <h2 className="text-ink font-semibold">TVA à déclarer</h2>
                <Link href="/cabinet/tva" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Calendrier →
                </Link>
              </div>
              {tvaTriee.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400">Aucune TVA à déclarer sur les périodes closes.</p>
              ) : (
                <ul className="divide-y divide-ds-border">
                  {tvaTriee.map((l) => (
                    <li key={l.id}>
                      <Link href={`/cabinet/${l.id}#tva`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-ds-elevated/60 transition-colors">
                        <span className="min-w-0">
                          <span className="block font-medium text-ink truncate">{l.nom}</span>
                          <span className="block text-sm text-gray-400">{cap(l.aDeclarer?.libelle ?? "")}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-ink tabular-nums">{eur(l.aDeclarer?.tva ?? 0)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <section className="carte p-5 mt-6">
        <ResumeHebdoToggle initial={prefs?.resume_cabinet_hebdo !== false} />
      </section>
    </div>
  );
}
