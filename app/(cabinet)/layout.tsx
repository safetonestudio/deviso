import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardThemeProvider, ThemeToggleIcone } from "@/components/DashboardTheme";
import { policesApp } from "@/app/polices-app";
import { SignOutButton } from "@/components/SignOutButton";
import { CabinetNav } from "@/components/cabinet/CabinetNav";

/**
 * Espace cabinet : une surface dediee, separee de l'interface du
 * micro-entrepreneur. Le comptable n'y voit ni « Nouveau devis » ni la
 * navigation de facturation : uniquement son portefeuille de dossiers.
 */
export default async function CabinetLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardThemeProvider className={policesApp}>
      <div className="min-h-screen bg-app-relief">
        <header className="sticky top-0 z-30 bg-ds-surface/95 backdrop-blur border-b border-ds-border">
          <div className="px-4 sm:px-6 lg:px-10 flex flex-wrap lg:flex-nowrap items-center gap-x-3 lg:gap-x-8">
            <a href="/cabinet" className="flex items-center gap-2 min-w-0 py-3">
              <div className="w-7 h-7 rounded-[7px] bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-on-accent font-display font-semibold text-[15px]">D</span>
              </div>
              <span className="font-display font-semibold text-[19px] tracking-tight text-ink">Deviso</span>
              <span className="text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-sm">
                Cabinet
              </span>
            </a>
            <div className="order-3 lg:order-none w-full lg:w-auto lg:flex-1 self-end border-t border-ds-border lg:border-0">
              <CabinetNav />
            </div>
            <div className="ml-auto lg:order-none flex items-center gap-2 sm:gap-3 py-3">
              <span className="hidden md:inline-block text-sm text-gray-400 max-w-[220px] truncate">
                {profile?.company_name || profile?.full_name || user.email}
              </span>
              <ThemeToggleIcone />
              <SignOutButton compact />
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-10 py-8">{children}</main>
      </div>
    </DashboardThemeProvider>
  );
}
