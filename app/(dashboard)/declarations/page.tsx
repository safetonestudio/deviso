import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { Apercu } from "./Apercu";

export const metadata: Metadata = { title: "Déclarations au fisc" };
export const dynamic = "force-dynamic";

/**
 * Ce que la Plateforme Agréée déclare à l'administration en votre nom.
 *
 * Pourquoi cet écran existe. Deviso ne fabrique pas l'e-reporting : Super PDP
 * agrège seul les données de transaction et de paiement, et les dépose au
 * rythme dicté par le régime de TVA. Leur documentation le confirme — pour une
 * facture B2B, « en nous confiant une facture, nous satisfaisons les deux
 * obligations d'e-invoicing et d'e-reporting ».
 *
 * Conséquence : tout partait **sans que l'utilisateur en voie jamais rien**.
 * Ni le contenu, ni l'accusé, ni le rejet. Or `events[].status_code` est le
 * seul endroit où l'on apprend qu'une déclaration a été refusée par
 * l'administration.
 */

type Declaration = {
  id: number;
  nature: string;
  role: string;
  debut: string;
  fin: string;
  statut: string;
  ton: "neutre" | "bien" | "attention";
  le: string | null;
  aTraiter: boolean;
};

const jour = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function Declarations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  const [{ data: raccordement }, profil] = await Promise.all([
    admin
      .from("superpdp_connections")
      .select("session_status")
      .eq("user_id", workspaceId)
      .maybeSingle(),
    getWorkspaceProfile<{ company_name: string | null }>(workspaceId, "company_name"),
  ]);

  const raccorde = raccordement?.session_status === "verified";
  const nomCompte = profil?.company_name?.trim() || user.email || "compte sans nom";

  // On lit par la route, et non en direct : elle porte déjà la traduction des
  // statuts et le repérage de ce qui demande une action.
  let declarations: Declaration[] = [];
  let erreur: string | null = null;
  if (raccorde) {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://getdeviso.fr";
    try {
      const res = await fetch(`${base}/api/superpdp/ereportings`, {
        headers: { cookie: jar.toString() },
        cache: "no-store",
      });
      const corps = await res.json();
      if (res.ok) declarations = corps.declarations ?? [];
      else erreur = corps.message ?? corps.error ?? "Lecture impossible";
    } catch {
      erreur = "La Plateforme Agréée n'a pas répondu.";
    }
  }

  const aTraiter = declarations.filter((d) => d.aTraiter).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-white">Déclarations au fisc</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ce que la Plateforme Agréée déclare à l&apos;administration en votre nom. Pour tout ce que
          vous facturez, vous n&apos;avez rien à envoyer&nbsp;: transmettre la facture suffit.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Compte affiché : <span className="text-gray-300 font-medium">{nomCompte}</span>
        </p>
      </div>

      {!raccorde ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Vous n&apos;êtes pas encore raccordé</p>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Les déclarations d&apos;e-reporting sont produites par votre Plateforme Agréée. Sans
            raccordement, il n&apos;y en a aucune.
          </p>
          <a
            href="/profil"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Aller aux paramètres
          </a>
        </section>
      ) : (
        <>
          {aTraiter > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mt-6">
              <p className="text-sm text-red-300">
                <span className="font-semibold">
                  {aTraiter} déclaration{aTraiter > 1 ? "s" : ""} en échec
                </span>{" "}
                <span className="text-red-400/80">
                  — l&apos;administration ne l&apos;a pas acceptée. C&apos;est la seule alerte qui
                  existe sur ce sujet.
                </span>
              </p>
            </div>
          )}

          <Apercu />

          {/* La seule obligation que Deviso ne couvre pas, dite à l'endroit où
              l'utilisateur croit justement que tout est couvert.

              L'article 290-II du CGI oblige l'entreprise française à déclarer
              aussi ses ACHATS auprès d'un fournisseur étranger — le sens
              « Bi2B ». Ces factures-là n'arrivent pas par la Plateforme
              Agréée : elles arrivent par courriel, en PDF, comme avant. Deviso
              ne les saisit pas, donc ne les déclare pas, et la ligne « Achats »
              du tableau ci-dessous restera vide même quand l'obligation court.

              Un écran qui affirme « vous n'avez rien à envoyer » et se tait
              là-dessus ne laisse à l'utilisateur aucune chance de découvrir le
              trou avant un contrôle. Le dire coûte quatre lignes. */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mt-6">
            <p className="text-sm text-amber-300 font-medium mb-1">
              Vos achats à l&apos;étranger ne sont pas couverts
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Si vous achetez à un fournisseur établi hors de France, c&apos;est à vous de déclarer
              ces achats (article 290-II du CGI) — sa facture ne passe pas par votre Plateforme
              Agréée. Deviso ne saisit pas les factures d&apos;achat&nbsp;: cette déclaration se fait
              aujourd&apos;hui auprès de votre Plateforme Agréée ou de votre comptable. Vos ventes,
              elles, sont entièrement couvertes.
            </p>
          </div>

          {erreur ? (
            <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 mt-6 text-center">
              <p className="text-white font-medium mb-1">Impossible de lire vos déclarations</p>
              <p className="text-xs font-mono text-red-400/90 mt-2 break-all">{erreur}</p>
            </section>
          ) : declarations.length === 0 ? (
            <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
              <p className="text-white font-medium mb-1">Aucune déclaration pour l&apos;instant</p>
              <p className="text-sm text-gray-500 max-w-lg mx-auto">
                Les déclarations sont déposées selon un calendrier qui dépend de votre périodicité
                de TVA. Elles apparaîtront ici une fois envoyées.
              </p>
            </section>
          ) : (
            <section className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ds-border text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">Période</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Nature</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Sens</th>
                    <th className="px-4 py-3 font-medium text-gray-400">État</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Le</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map((d) => (
                    <tr key={d.id} className="border-b border-ds-border last:border-0">
                      <td className="px-4 py-3 text-white">
                        {jour(d.debut)} — {jour(d.fin)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{d.nature}</td>
                      <td className="px-4 py-3 text-gray-400">{d.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            d.ton === "bien"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : d.ton === "attention"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-ds-elevated text-gray-400"
                          }`}
                        >
                          {d.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{jour(d.le)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
