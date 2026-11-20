import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { validerPlan, PLAN_PAR_DEFAUT } from "@/lib/plan-comptes-fec";
import { logicielConnu } from "@/lib/logiciels-comptables";
import { ParametresCabinet, type VueParametres } from "@/components/cabinet/ParametresCabinet";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

const VUES: VueParametres[] = ["cabinet", "logiciel", "fec", "notifications"];

/**
 * Paramètres du cabinet (20/11/2026) : identité affichée aux clients, logiciel
 * de production (format d'export par défaut), comptes du FEC, résumé du lundi.
 * Son propre profil : la connexion de l'utilisateur suffit (pas de clé de service).
 */
export default async function CabinetParametres({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase
    .from("profiles")
    .select("company_name, full_name, plan_comptes_fec, resume_cabinet_hebdo, logiciel_comptable, export_pdf_defaut")
    .eq("id", user.id)
    .maybeSingle();
  const lu = validerPlan(p?.plan_comptes_fec ?? null);
  const { vue } = await searchParams;

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="titre-page">Paramètres</h1>
        <p className="sous-titre-page">Ce que vos clients voient de votre cabinet, et la forme de vos exports.</p>
      </div>
      <ParametresCabinet
        vueInitiale={VUES.includes(vue as VueParametres) ? (vue as VueParametres) : "cabinet"}
        email={user.email ?? ""}
        initial={{
          nomCabinet: p?.company_name ?? "",
          nomContact: p?.full_name ?? "",
          plan: "plan" in lu ? lu.plan : PLAN_PAR_DEFAUT,
          resume: p?.resume_cabinet_hebdo !== false,
          logiciel: logicielConnu(p?.logiciel_comptable) ? p!.logiciel_comptable : null,
          pdfDefaut: p?.export_pdf_defaut === true,
        }}
      />
    </div>
  );
}
