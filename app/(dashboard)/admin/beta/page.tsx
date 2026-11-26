import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estAdmin } from "@/lib/admin";
import { listerCandidatures } from "@/lib/beta-candidatures";
import { BETA } from "@/lib/beta";
import { DecisionsBeta } from "./DecisionsBeta";
import { createAdminClient } from "@/lib/supabase/admin";
import { lignesAFermer } from "@/lib/fin-beta";

export const metadata: Metadata = { title: "Bêta, candidatures" };
export const dynamic = "force-dynamic";

/**
 * Candidatures à la bêta : Selim accepte ou refuse, et invite directement les
 * clients du cabinet pilote (ou le cabinet lui-même). Réservé aux adresses
 * ADMIN_EMAILS ; tout autre compte reçoit une 404.
 */
export default async function PageBeta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/beta");
  if (!estAdmin(user.email)) notFound();

  const candidatures = await listerCandidatures();
  const aFermer = await lignesAFermer(createAdminClient(), new Date());
  const acceptes = candidatures.filter((c) => c.statut === "acceptee" && c.type_acces === "testeur").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="titre-page">Bêta, candidatures</h1>
      <p className="mt-2 text-[15px] text-gray-400">
        {acceptes} testeur{acceptes > 1 ? "s" : ""} accepté{acceptes > 1 ? "s" : ""} sur {BETA.places} places annoncées.
        Candidatures ouvertes jusqu&apos;au{" "}
        {BETA.finCandidatures.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}.
      </p>
      {aFermer.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-[16px] font-semibold text-ink">Adresses de réception à fermer</h2>
          <p className="mt-1 text-[14px] text-gray-300">
            Bêta terminée depuis {BETA.joursReceptionApres} jours, sans abonnement : la fermeture se fait depuis la
            production, jamais depuis le poste. Prévenus 7 jours avant par courriel.
          </p>
          <ul className="mt-3 text-[14px] text-ink space-y-1">
            {aFermer.map((l) => (
              <li key={l.id}>{l.email ?? l.id}</li>
            ))}
          </ul>
        </section>
      )}
      <DecisionsBeta candidatures={candidatures} />
    </div>
  );
}
