import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { DashboardThemeProvider, ThemeToggle } from "@/components/DashboardTheme";
import { MobileNav } from "@/components/MobileNav";
import { SidebarNav } from "@/components/SidebarNav";
import { NotificationBell } from "@/components/NotificationBell";
import { SessionGuard } from "@/components/SessionGuard";
import { SignOutButton } from "@/components/SignOutButton";
import { SupportButton } from "@/components/SupportButton";
import { PlanProvider } from "@/components/PlanContext";

// Pages inaccessibles aux membres invités
const MEMBER_RESTRICTED_PATHS = ["/billing", "/paiements", "/stats", "/crm"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Détection du rôle (owner vs membre invité) + plan workspace
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const workspaceUserId = await getWorkspaceUserId(user.id);
  const isMember = workspaceUserId !== user.id;

  const [{ data: profile }, { data: workspacePlan }] = await Promise.all([
    supabase.from("profiles").select("full_name, company_name, is_demo").eq("id", user.id).single(),
    supabase.from("profiles").select("plan").eq("id", workspaceUserId).single(),
  ]);

  // NOTE : "free" n'est plus un plan commercialisé (supprimé le 30/06/2026).
  // C'est l'état transitoire d'un compte sans abonnement (avant souscription,
  // ou après expiration) — les gates Solo/Pro s'appliquent alors partout.
  const plan = workspacePlan?.plan ?? "free";

  // Redirect new owners to onboarding if they haven't set their company name yet
  // Team members (collaborators) are exempt, they use the owner's company profile
  if (!profile?.company_name && !pathname.startsWith("/onboarding") && !isMember) {
    redirect("/onboarding");
  }

  // Membres : bloquer l'accès aux pages sensibles
  if (isMember && MEMBER_RESTRICTED_PATHS.some((p) => pathname.startsWith(p))) {
    redirect("/dashboard");
  }

  const initials = (profile?.full_name || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isDemo = !!profile?.is_demo;

  return (
    <DashboardThemeProvider>
    <PlanProvider plan={plan} isMember={isMember}>
      <div className="min-h-screen bg-ds-bg flex overflow-x-hidden">
        <MobileNav
          initials={initials}
          userName={profile?.full_name || ""}
          userEmail={user.email || ""}
          isMember={isMember}
        />

        <aside className="hidden lg:flex w-64 bg-ds-surface border-r border-ds-border flex-col fixed h-full">
          <div className="p-5 border-b border-ds-border">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">D</span>
              </div>
              <span className="font-semibold text-white">Deviso</span>
              {isDemo && (
                <span className="ml-1 text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  démo
                </span>
              )}
            </a>
          </div>

          <SidebarNav isMember={isMember} />

          <div className="p-4 border-t border-ds-border">
            {isDemo && (
              <a
                href="/signup"
                className="flex items-center gap-2 w-full mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <span>✨</span>
                <span>Créer mon vrai compte →</span>
              </a>
            )}

            {/* Toggle mode clair/sombre, juste au dessus du profil */}
            <ThemeToggle />

            {/* Bloc profil */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ds-elevated mb-2">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {profile?.full_name || "Mon compte"}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <NotificationBell placement="sidebar" />
            </div>

            {/* Actions profil */}
            <div className="space-y-0.5">
              <SupportButton />
              <SignOutButton />
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-w-0 pt-14">
          <SessionGuard />
          {/* Bandeau démo inline (mobile uniquement, scroll avec la page) */}
          {isDemo && (
            <div className="lg:hidden mb-4 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <span className="text-xs text-amber-400 font-medium">🎮 Mode démo, données fictives</span>
              <a href="/signup" className="text-xs font-semibold text-amber-400 underline underline-offset-2 shrink-0">
                Créer mon compte →
              </a>
            </div>
          )}
          {children}
        </main>
      </div>

    </PlanProvider>
      {/* Crisp Chat Widget */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="3eb0e10f-5c5d-4119-b8c3-90edacbdfb61";
            (function(){
              var d=document;
              var s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `,
        }}
      />
    </DashboardThemeProvider>
  );
}
