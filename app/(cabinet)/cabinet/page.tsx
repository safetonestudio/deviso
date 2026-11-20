import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers, lireFacturesDossiers } from "@/lib/cabinet-dossiers";
import { calendrierTva } from "@/lib/cabinet-tva-calendrier";
import { CabinetInvitations } from "@/components/CabinetInvitations";
import { CabinetPortefeuille } from "@/components/CabinetPortefeuille";

export const metadata: Metadata = { title: "Portefeuille cabinet" };
export const dynamic = "force-dynamic";

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default async function CabinetCockpit() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const maintenant = new Date();
  const dossiers = await syntheseDossiers(admin, ownerIds, maintenant);
  const factures = await lireFacturesDossiers(admin, ownerIds, `${maintenant.getFullYear() - 1}-01-01`);
  const calendrier = calendrierTva(dossiers, factures, maintenant);
  const conformite = dossiers.map((d) => ({ id: d.id, nom: d.nom, conformite: d.conformite }));

  const rouges = dossiers.filter((d) => d.niveau === "rouge").length;
  const oranges = dossiers.filter((d) => d.niveau === "orange").length;
  const caMois = dossiers.reduce((s, d) => s + d.caHtMois, 0);
  const moisLibelle = maintenant.toLocaleDateString("fr-FR", { month: "long" });
  const prets = conformite.filter((c) => c.conformite.pret).length;
  const tvaADeclarer = calendrier.filter((l) => l.aDeclarer && l.aDeclarer.tva > 0);
  const tvaTotale = tvaADeclarer.reduce((s, l) => s + (l.aDeclarer?.tva ?? 0), 0);
  const pl = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titre-page">Portefeuille</h1>
          <p className="sous-titre-page">
            Vos dossiers clients Deviso, en lecture seule. Ceux qui demandent une action apparaissent en premier.
          </p>
        </div>
        <a
          href="#inviter"
          className="h-9 inline-flex items-center px-3.5 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Inviter un client
        </a>
      </div>

      {dossiers.length === 0 ? (
        <div className="carte p-8 text-center mb-6">
          <p className="text-ink font-semibold mb-1">Aucun dossier rattaché pour l&apos;instant</p>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Générez un code ci-dessous et transmettez-le à votre client : dès qu&apos;il le saisit dans Deviso, son
            dossier apparaît ici. Ses factures de vente y seront déjà, conformes et horodatées : rien à réclamer ni à
            ressaisir.
          </p>
        </div>
      ) : (
        <>
          {/* Synthèse : ce qui demande votre attention, et où le traiter. */}
          <section className="carte carte-heros p-5 sm:p-6 mb-6 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-gray-300">{pl(dossiers.length, "dossier")} suivi{dossiers.length > 1 ? "s" : ""}</div>
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
                <div className="text-xs text-gray-400">TVA à déclarer</div>
                <div className="mt-1 text-xl font-semibold text-ink tabular-nums">{eur(tvaTotale)}</div>
                <div className="mt-1 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {tvaADeclarer.length ? `${pl(tvaADeclarer.length, "dossier")}, période close →` : "Rien à déclarer →"}
                </div>
              </Link>
              <Link href="/cabinet/conformite" className="group rounded-xl border border-ds-border bg-ds-bg/60 p-4 hover:border-gray-600 transition-colors">
                <div className="text-xs text-gray-400">Conformité réforme</div>
                <div className={`mt-1 text-xl font-semibold tabular-nums ${prets === dossiers.length ? "text-emerald-400" : "text-ink"}`}>
                  {prets}/{dossiers.length} prêts
                </div>
                <div className="mt-1 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                  {prets === dossiers.length ? "Tous peuvent recevoir →" : `${pl(dossiers.length - prets, "dossier")} à régulariser →`}
                </div>
              </Link>
            </div>
          </section>

          <CabinetPortefeuille dossiers={dossiers} annee={maintenant.getFullYear()} />
        </>
      )}

      <div id="inviter" className="mt-6 scroll-mt-28">
        <CabinetInvitations />
      </div>
    </div>
  );
}
