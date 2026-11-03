import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers, lireFacturesDossiers } from "@/lib/cabinet-dossiers";
import { calendrierTva } from "@/lib/cabinet-tva-calendrier";
import { KpiCard } from "@/components/ui/KpiCard";
import { CabinetInvitations } from "@/components/CabinetInvitations";
import { CabinetPortefeuille } from "@/components/CabinetPortefeuille";
import { CabinetCalendrierTva } from "@/components/CabinetCalendrierTva";
import { CabinetConformite } from "@/components/CabinetConformite";

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

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="titre-page">Portefeuille</h1>
          <p className="sous-titre-page">
            Vos dossiers clients Deviso, en lecture seule. Ceux qui demandent une action apparaissent en premier.
          </p>
        </div>
        <Link
          href="/cabinet/journal"
          className="text-sm px-3 py-1.5 border border-ds-border text-gray-300 rounded-lg hover:bg-ds-elevated font-medium transition-colors whitespace-nowrap"
        >
          Journal des accès
        </Link>
      </div>

      {dossiers.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <KpiCard label="Dossiers suivis" value={String(dossiers.length)} point="info" trend="dans votre portefeuille" />
          <KpiCard
            label="Action requise"
            value={String(rouges)}
            point={rouges ? "alerte" : "bon"}
            trend={rouges ? `dossier${rouges > 1 ? "s" : ""} à traiter en priorité` : "aucun blocage"}
          />
          <KpiCard
            label="À surveiller"
            value={String(oranges)}
            point={oranges ? "alerte" : "bon"}
            trend={oranges ? `point${oranges > 1 ? "s" : ""} de vigilance` : "rien à signaler"}
          />
          <KpiCard label={`CA HT cumulé · ${moisLibelle}`} value={eur(caMois)} point="neutre" trend="ce mois-ci" />
        </div>
      )}

      {dossiers.length === 0 ? (
        <div className="carte p-8 text-center mb-6">
          <p className="text-ink font-semibold mb-1">Aucun dossier rattaché pour l&apos;instant</p>
          <p className="text-gray-500 text-sm">
            Générez un code ci-dessous et transmettez-le à votre client : dès qu&apos;il le saisit dans Deviso, son dossier apparaît ici.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-6 text-sm text-indigo-200">
            Les factures de vente de vos clients sont créées dans Deviso : elles sont déjà là, conformes et
            horodatées. Aucune pièce de vente à réclamer, rien à ressaisir.
          </div>
          <CabinetConformite lignes={conformite} />
          <CabinetPortefeuille dossiers={dossiers} annee={maintenant.getFullYear()} />
          <CabinetCalendrierTva lignes={calendrier} />
        </>
      )}

      <CabinetInvitations />
    </div>
  );
}
