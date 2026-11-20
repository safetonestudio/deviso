import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers } from "@/lib/cabinet-dossiers";
import { CabinetConformite } from "@/components/CabinetConformite";

export const metadata: Metadata = { title: "Conformité réforme" };
export const dynamic = "force-dynamic";

/** Tableau de conformité à la réforme, sorti de la page Portefeuille (20/11/2026). */
export default async function CabinetConformitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const dossiers = await syntheseDossiers(admin, ownerIds, new Date());
  const lignes = dossiers.map((d) => ({ id: d.id, nom: d.nom, conformite: d.conformite }));

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="titre-page">Conformité réforme</h1>
        <p className="sous-titre-page">
          Qui peut émettre et recevoir des factures électroniques conformes, dossier par dossier.
        </p>
      </div>
      <CabinetConformite lignes={lignes} />
    </div>
  );
}
