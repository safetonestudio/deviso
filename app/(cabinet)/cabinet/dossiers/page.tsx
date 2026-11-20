import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers } from "@/lib/cabinet-dossiers";
import { CabinetPortefeuille } from "@/components/CabinetPortefeuille";

export const metadata: Metadata = { title: "Portefeuille" };
export const dynamic = "force-dynamic";

/** Liste complète des dossiers, triés par urgence (sortie de l'accueil le 20/11/2026). */
export default async function CabinetDossiers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const maintenant = new Date();
  const dossiers = await syntheseDossiers(admin, ownerIds, maintenant);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titre-page">Portefeuille</h1>
          <p className="sous-titre-page">Vos dossiers clients, en lecture seule. Ceux qui demandent une action apparaissent en premier.</p>
        </div>
        <Link
          href="/cabinet/inviter"
          className="h-9 inline-flex items-center px-3.5 bg-indigo-600 text-on-accent rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Inviter un client
        </Link>
      </div>
      {dossiers.length === 0 ? (
        <div className="carte p-8 text-center">
          <p className="text-ink font-semibold mb-1">Aucun dossier rattaché pour l&apos;instant</p>
          <p className="text-gray-500 text-sm">
            <Link href="/cabinet/inviter" className="text-indigo-400 hover:text-indigo-300">Invitez un client</Link> : dès
            qu&apos;il saisit votre code dans Deviso, son dossier apparaît ici.
          </p>
        </div>
      ) : (
        <CabinetPortefeuille dossiers={dossiers} annee={maintenant.getFullYear()} />
      )}
    </div>
  );
}
