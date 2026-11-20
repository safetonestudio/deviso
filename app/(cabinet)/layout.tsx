import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardThemeProvider, ThemeToggleIcone } from "@/components/DashboardTheme";
import { policesApp } from "@/app/polices-app";
import { SignOutButton } from "@/components/SignOutButton";
import { CabinetMobileNav, CabinetSidebarNav } from "@/components/cabinet/CabinetNav";

/**
 * Espace cabinet : une surface dediee, separee de l'interface du
 * micro-entrepreneur. Le comptable n'y voit ni « Nouveau devis » ni la
 * navigation de facturation : uniquement son portefeuille de dossiers.
 *
 * Depuis le 20/11/2026, meme cadre que l'app du client (barre laterale,
 * barre du haut, menu tiroir sur telephone) : les deux espaces se lisent
 * comme un seul produit.
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

  const nomCabinet = profile?.company_name || profile?.full_name || "Mon cabinet";
  const initiales = nomCabinet
    .split(/\s+/)
    .filter(Boolean)
    .map((m: string) => m[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <DashboardThemeProvider className={policesApp}>
      <div className="min-h-screen bg-ds-bg flex overflow-x-clip">
        <CabinetMobileNav nomCabinet={nomCabinet} email={user.email || ""} initiales={initiales} />

        <aside className="hidden lg:flex w-64 bg-ds-surface border-r border-ds-border flex-col fixed h-full">
          <div className="px-5 py-4 border-b border-ds-border flex items-center justify-between gap-2">
            <a href="/cabinet" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-[7px] bg-indigo-600 flex items-center justify-center">
                <span className="text-on-accent font-display font-semibold text-[15px]">D</span>
              </div>
              <span className="font-display font-semibold text-[19px] tracking-tight text-ink">Deviso</span>
              <span className="ml-1 text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-sm">
                Cabinet
              </span>
            </a>
            <ThemeToggleIcone />
          </div>

          <CabinetSidebarNav />

          <div className="p-4 border-t border-ds-border">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ds-elevated mb-2">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm flex items-center justify-center shrink-0">
                {initiales}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{nomCabinet}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="barre-haut hidden lg:flex sticky top-0 z-30 h-14 items-center justify-between gap-4 px-10 bg-ds-bg/85 backdrop-blur-sm border-b border-ds-border">
            <span className="text-sm text-gray-400 first-letter:uppercase">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })}
            </span>
            <span className="text-sm text-gray-500">Lecture seule</span>
          </div>
          <div className="p-4 sm:px-6 lg:px-10 lg:py-6 pt-18">{children}</div>
        </main>
      </div>
    </DashboardThemeProvider>
  );
}
