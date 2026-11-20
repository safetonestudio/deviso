import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers, lireFacturesDossiers } from "@/lib/cabinet-dossiers";
import { calendrierTva } from "@/lib/cabinet-tva-calendrier";
import { CabinetCalendrierTva } from "@/components/CabinetCalendrierTva";

export const metadata: Metadata = { title: "TVA à déclarer" };
export const dynamic = "force-dynamic";

/** Calendrier de TVA du portefeuille, sorti de la page Portefeuille (20/11/2026). */
export default async function CabinetTva() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const maintenant = new Date();
  const dossiers = await syntheseDossiers(admin, ownerIds, maintenant);
  const factures = await lireFacturesDossiers(admin, ownerIds, `${maintenant.getFullYear() - 1}-01-01`);
  const calendrier = calendrierTva(dossiers, factures, maintenant);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="titre-page">TVA à déclarer</h1>
        <p className="sous-titre-page">
          Pour chaque dossier assujetti : la période close, prête à déclarer, et la période en cours.
        </p>
      </div>
      <CabinetCalendrierTva lignes={calendrier} />
    </div>
  );
}
