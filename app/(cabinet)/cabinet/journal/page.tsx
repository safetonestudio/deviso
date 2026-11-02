import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { lireJournal, LIBELLE_ACTION } from "@/lib/cabinet-journal";

export const metadata: Metadata = { title: "Journal des accès" };
export const dynamic = "force-dynamic";

const horodatage = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default async function JournalCabinet() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  // Controle d'acces : on ne travaille que sur le portefeuille du cabinet. Sert
  // aussi a nommer les dossiers cites dans le journal.
  const ownerIds = await dossiersDuCabinet(admin, user.id);
  const [{ data: profils }, entrees] = await Promise.all([
    ownerIds.length
      ? admin.from("profiles").select("id, company_name, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string | null; full_name: string | null }[] }),
    lireJournal(admin, user.id),
  ]);

  const nom = (id: string | null) => {
    if (!id) return "Tout le portefeuille";
    const p = (profils ?? []).find((x) => x.id === id);
    return p?.company_name || p?.full_name || "Dossier retiré";
  };

  return (
    <div>
      <Link href="/cabinet" className="text-sm text-gray-400 hover:text-ink">
        ← Portefeuille
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold text-ink">Journal des accès et exports</h1>
        <p className="text-sm text-gray-400 mt-1">
          Chaque consultation de dossier et chaque export de votre cabinet est tracé ici. Vous seul y avez accès.
        </p>
      </div>

      {entrees.length === 0 ? (
        <div className="carte p-8 text-center">
          <p className="text-ink font-semibold mb-1">Aucune activité pour l&apos;instant</p>
          <p className="text-gray-500 text-sm">Les consultations et exports apparaîtront ici au fil de l&apos;eau.</p>
        </div>
      ) : (
        <div className="carte overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-ds-border">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Dossier</th>
                  <th className="px-4 py-2 font-medium">Détail</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map((e) => (
                  <tr key={e.id} className="border-b border-ds-border last:border-0">
                    <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{horodatage(e.created_at)}</td>
                    <td className="px-4 py-2 text-gray-200">{LIBELLE_ACTION[e.action]}</td>
                    <td className="px-4 py-2 text-gray-300">{nom(e.client_id)}</td>
                    <td className="px-4 py-2 text-gray-500">{e.details ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
