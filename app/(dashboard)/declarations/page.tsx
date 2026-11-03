import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { Apercu } from "./Apercu";
import { CarteDepliable, Puce, TuileSynthese, Champ } from "@/components/ui/CarteDepliable";
import { ExplicationProbleme } from "@/components/ui/ExplicationProbleme";
import { expliquerDeclaration } from "@/lib/superpdp-explications";

export const metadata: Metadata = { title: "Déclarations au fisc" };
export const dynamic = "force-dynamic";

/**
 * Ce que la Plateforme Agréée déclare à l'administration en votre nom.
 *
 * Pourquoi cet écran existe. Deviso ne fabrique pas l'e-reporting : Super PDP
 * agrège seul les données de transaction et de paiement, et les dépose au
 * rythme dicté par le régime de TVA. Leur documentation le confirme, pour une
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
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "-";

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
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://getdeviso.fr";
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
    <div className="w-full">
      <GuidedTourBanner pageKey="declarations" />
      <div>
        <h1 className="titre-page">Déclarations au fisc</h1>
        <p className="sous-titre-page">
          Ce que la Plateforme Agréée déclare à l&apos;administration en votre nom. Pour tout ce que
          vous facturez, vous n&apos;avez rien à envoyer&nbsp;: transmettre la facture suffit.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Compte affiché : <span className="text-gray-300 font-medium">{nomCompte}</span>
        </p>
      </div>

      {!raccorde ? (
        <section className="carte p-6 mt-6 text-center">
          <p className="text-ink font-medium mb-1">Vous n&apos;êtes pas encore raccordé</p>
          <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
            Les déclarations d&apos;e-reporting sont produites par votre Plateforme Agréée. Sans
            raccordement, il n&apos;y en a aucune.
          </p>
          <a
            href="/profil"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-ink text-sm font-semibold hover:bg-indigo-700 transition-colors"
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
                  - l&apos;administration ne l&apos;a pas acceptée. C&apos;est la seule alerte qui
                  existe sur ce sujet.
                </span>
              </p>
            </div>
          )}

          {declarations.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              <TuileSynthese libelle="Envoyées" valeur={String(declarations.length)} />
              <TuileSynthese libelle="En échec" valeur={String(aTraiter)} alerte={aTraiter > 0} />
            </div>
          )}

          <Apercu />

          {erreur ? (
            <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 mt-6 text-center">
              <p className="text-ink font-medium mb-1">Impossible de lire vos déclarations</p>
              <p className="text-xs font-mono text-red-400/90 mt-2 break-all">{erreur}</p>
            </section>
          ) : declarations.length === 0 ? (
            <section className="carte p-6 mt-6 text-center">
              <p className="text-ink font-medium mb-1">Aucune déclaration pour l&apos;instant</p>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                Les déclarations sont déposées selon un calendrier qui dépend de votre périodicité
                de TVA. Elles apparaîtront ici une fois envoyées.
              </p>
            </section>
          ) : (
            <div className="space-y-2.5 mt-6">
              {declarations.map((d) => (
                <CarteDepliable
                  key={d.id}
                  titre={`${d.nature} · ${d.role}`}
                  pastilles={<Puce ton={d.ton} texte={d.statut} />}
                  sousTitre={
                    <span className="text-gray-400">
                      Période du {jour(d.debut)} au {jour(d.fin)}
                    </span>
                  }
                  montant={<span className="text-sm font-medium text-gray-400">{jour(d.le)}</span>}
                >
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-4">
                    <Champ libelle="Nature" valeur={d.nature} />
                    <Champ libelle="Sens" valeur={d.role} />
                    <Champ libelle="Période" valeur={`${jour(d.debut)} au ${jour(d.fin)}`} />
                    <Champ libelle="Déposée le" valeur={jour(d.le)} />
                  </dl>
                  {(() => {
                    const ex = expliquerDeclaration(d);
                    return ex ? <ExplicationProbleme ton={ex.ton} probleme={ex.probleme} etapes={ex.etapes} /> : null;
                  })()}
                </CarteDepliable>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
