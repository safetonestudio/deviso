import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { estTitulaire } from "@/lib/droits";
import type { AchatInternational } from "@/lib/superpdp-achats";
import { SaisieAchatForm } from "./SaisieAchatForm";
import { AchatsListe } from "./AchatsListe";

export const metadata: Metadata = { title: "Achats à l'étranger" };
export const dynamic = "force-dynamic";

/**
 * Achats auprès de fournisseurs étrangers — e-reporting d'acquisition.
 *
 * L'obligation manquante que l'écran « Déclarations » signalait sans pouvoir la
 * remplir : une entreprise française qui achète hors de France doit déclarer
 * ces acquisitions (article 290-II du CGI), et leurs factures n'arrivent pas
 * par la Plateforme Agréée. On les saisit ici, et Deviso les déclare.
 *
 * Réservé au titulaire : c'est une obligation déclarative de l'entreprise.
 */
export default async function AchatsInternationaux() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  if (!estTitulaire(user.id, workspaceId)) redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: raccordement }, { data: achats, error }] = await Promise.all([
    admin
      .from("superpdp_connections")
      .select("session_status")
      .eq("user_id", workspaceId)
      .maybeSingle(),
    admin
      .from("superpdp_achats_int")
      .select("*")
      .eq("user_id", workspaceId)
      .order("date_facture", { ascending: false })
      .limit(200),
  ]);

  const raccorde = raccordement?.session_status === "verified";
  const liste = (achats ?? []) as AchatInternational[];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Achats à l&apos;étranger</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Quand vous achetez un bien ou un service à un fournisseur établi hors de France, vous
          devez déclarer cette acquisition à l&apos;administration (article 290-II du CGI). Sa
          facture ne passe pas par la Plateforme Agréée&nbsp;: saisissez-la ici, Deviso s&apos;occupe
          de la déclaration.
        </p>
      </div>

      {!raccorde ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 text-center">
          <p className="text-white font-medium mb-1">Vous n&apos;êtes pas encore raccordé</p>
          <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
            La déclaration de vos achats étrangers passe par votre Plateforme Agréée. Le
            raccordement se fait depuis vos paramètres.
          </p>
          <a
            href="/profil"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Aller aux paramètres
          </a>
        </section>
      ) : (
        <div className="space-y-6">
          <SaisieAchatForm />

          {error ? (
            <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-white font-medium mb-1">Impossible de lire vos achats étrangers</p>
              <p className="text-xs font-mono text-red-400/90 mt-2 break-all">{error.message}</p>
            </section>
          ) : (
            <AchatsListe achats={liste} />
          )}
        </div>
      )}
    </div>
  );
}
