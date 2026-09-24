import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { SyncButton } from "./SyncButton";
import { FacturesRecuesListe } from "./FacturesRecuesListe";

export const metadata: Metadata = { title: "Factures reçues" };
export const dynamic = "force-dynamic";

type Facture = {
  id: number;
  number: string | null;
  issue_date: string | null;
  payment_due_date: string | null;
  seller_name: string | null;
  total_with_vat: number | null;
  currency_code: string | null;
  last_status_code: string | null;
  received_at: string | null;
};

export default async function FacturesRecues() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  // Quelle entreprise regarde-t-on, au juste.
  //
  // Le 29/08/2026, Selim a cherché pendant deux heures des factures reçues qui
  // existaient bel et bien — sur son compte. Son navigateur était connecté au
  // compte fournisseur, dont la boîte est vide par construction. Une page qui
  // montre le contenu d'un compte doit dire de quel compte il s'agit.
  const profil = await getWorkspaceProfile<{ company_name: string | null }>(
    workspaceId,
    "company_name"
  );
  const nomCompte = profil?.company_name?.trim() || user.email || "compte sans nom";

  const [{ data: raccordement }, { data: factures, error: erreurLecture }] = await Promise.all([
    admin
      .from("superpdp_connections")
      .select("session_status, directory_address, last_sync_at")
      .eq("user_id", workspaceId)
      .maybeSingle(),
    // Seules les entrantes : les sortantes sont déjà dans « Factures ».
    supabase
      .from("superpdp_invoices")
      .select("id, number, issue_date, payment_due_date, seller_name, total_with_vat, currency_code, last_status_code, received_at")
      .eq("direction", "in")
      .order("issue_date", { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  const raccorde = raccordement?.session_status === "verified";
  const liste = (factures ?? []) as Facture[];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Factures reçues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Les factures électroniques que vos fournisseurs vous adressent via la Plateforme Agréée.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Compte affiché :{" "}
            <span className="text-gray-300 font-medium">{nomCompte}</span>
            {user.email && nomCompte !== user.email && (
              <span className="text-gray-600"> · {user.email}</span>
            )}
          </p>
        </div>
        {raccorde && <SyncButton derniere={raccordement?.last_sync_at ?? null} />}
      </div>

      {!raccorde ? (
        // Sans raccordement, l'absence de factures ne veut pas dire qu'on n'en a
        // pas reçu — elle veut dire qu'on ne peut pas en recevoir.
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Vous n&apos;êtes pas encore raccordé</p>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            À partir du 1ᵉʳ septembre 2026, toutes les entreprises doivent pouvoir recevoir des
            factures électroniques. Le raccordement se fait depuis vos paramètres.
          </p>
          <a
            href="/profil"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Aller aux paramètres
          </a>
        </section>
      ) : erreurLecture ? (
        // Une lecture qui échoue ne doit pas se lire comme « aucune facture » :
        // une panne doit se voir. Il n'y a pas de repli acceptable ici.
        <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Impossible de lire vos factures reçues</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vous en avez peut-être. Cette page n&apos;a pas pu les charger, alors elle ne
            prétend pas que vous n&apos;en avez aucune. Réessayez dans un instant ; si le
            problème persiste, signalez-le avec ce détail&nbsp;:
          </p>
          <p className="mt-3 text-xs font-mono text-red-400/90 break-all max-w-md mx-auto">
            {erreurLecture.message}
          </p>
        </section>
      ) : liste.length === 0 ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Aucune facture reçue pour l&apos;instant</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vos fournisseurs peuvent vous adresser leurs factures à l&apos;adresse{" "}
            <span className="font-mono text-gray-400 select-all">
              {raccordement?.directory_address ?? "—"}
            </span>
            .
          </p>
        </section>
      ) : (
        <FacturesRecuesListe
          factures={liste}
          adresseAnnuaire={raccordement?.directory_address ?? null}
        />
      )}
    </div>
  );
}
