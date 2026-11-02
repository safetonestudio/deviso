import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardThemeProvider, ThemeToggle } from "@/components/DashboardTheme";
import { policesApp } from "@/app/polices-app";
import { SignOutButton } from "@/components/SignOutButton";

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
        <header className="bg-ds-surface border-b border-ds-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <a href="/cabinet" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-[7px] bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-ink font-display font-bold text-[15px]">D</span>
              </div>
              <span className="font-display font-bold text-[19px] tracking-tight text-ink">Deviso</span>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                Cabinet
              </span>
            </a>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center rounded-lg border border-ds-border bg-ds-elevated px-3 py-2 text-sm text-gray-300 max-w-[240px] truncate">
                {profile?.company_name || profile?.full_name || user.email}
              </span>
              <ThemeToggle compact />
              <SignOutButton compact />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </DashboardThemeProvider>
  );
}
