import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { validerPlan, PLAN_PAR_DEFAUT } from "@/lib/plan-comptes-fec";
import { ReglagesFec } from "@/components/cabinet/ReglagesFec";

export const metadata: Metadata = { title: "Comptes du FEC" };
export const dynamic = "force-dynamic";

/** Plan de comptes appliqué aux FEC exportés par le cabinet (20/11/2026). */
export default async function CabinetComptesFec() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Son propre profil : la connexion de l'utilisateur suffit (pas de clé de service).
  const { data: p } = await supabase.from("profiles").select("plan_comptes_fec").eq("id", user.id).maybeSingle();
  const lu = validerPlan(p?.plan_comptes_fec ?? null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="titre-page">Comptes du FEC</h1>
        <p className="sous-titre-page">
          Les comptes et journaux de vos exports FEC, alignés sur votre logiciel de production pour un import
          sans retouche. Ils s&apos;appliquent à tous les dossiers que vous exportez ; le compte de chaque client
          reste son compte auxiliaire, tiré de son SIREN.
        </p>
      </div>
      <ReglagesFec initial={"plan" in lu ? lu.plan : PLAN_PAR_DEFAUT} />
    </div>
  );
}
