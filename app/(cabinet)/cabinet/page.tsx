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

  const tuiles = [
    { label: "Dossiers suivis", valeur: String(dossiers.length), ton: "text-white" },
    { label: "Action requise", valeur: String(rouges), ton: rouges ? "text-red-400" : "text-white" },
    { label: "À surveiller", valeur: String(oranges), ton: oranges ? "text-amber-400" : "text-white" },
    { label: `CA HT cumulé, ${moisLibelle}`, valeur: eur(caMois), ton: "text-white" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Portefeuille</h1>
          <p className="text-sm text-gray-400 mt-1">
            Vos dossiers clients Deviso, en lecture seule. Ceux qui demandent une action apparaissent en premier.
          </p>
        </div>
        <Link
          href="/cabinet/journal"
          className="text-sm px-3 py-1.5 border border-ds-border text-gray-300 rounded-lg hover:bg-white/5 font-medium transition-colors whitespace-nowrap"
        >
          Journal des accès
        </Link>
      </div>

      {dossiers.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {tuiles.map((t) => (
            <div key={t.label} className="bg-ds-surface border border-ds-border rounded-xl p-4">
              <div className="text-xs text-gray-500">{t.label}</div>
              <div className={`text-xl font-semibold mt-1 ${t.ton}`}>{t.valeur}</div>
            </div>
          ))}
        </div>
      )}

      {dossiers.length === 0 ? (
        <div className="bg-ds-surface border border-ds-border rounded-xl p-8 text-center mb-6">
          <p className="text-white font-semibold mb-1">Aucun dossier rattaché pour l&apos;instant</p>
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
