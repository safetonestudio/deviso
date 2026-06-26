import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .single();

  const initials = (profile?.full_name || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-slate-900">Deviso</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span>🏠</span> Tableau de bord
          </Link>
          <Link href="/proposals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span>📄</span> Mes devis
          </Link>
          <Link href="/proposals/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors">
            <span>✨</span> Nouveau devis
          </Link>

          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturation</p>
          </div>
          <Link href="/invoices" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span>🧾</span> Mes factures
          </Link>
          <Link href="/invoices/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span>➕</span> Nouvelle facture
          </Link>

          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Compte</p>
          </div>
          <Link href="/profil" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span>👤</span> Mon profil
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {profile?.full_name || "Mon compte"}
              </div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              formAction={async () => {
                "use server";
                const { createClient: sc } = await import("@/lib/supabase/server");
                const sb = await sc();
                await sb.auth.signOut();
                const { redirect: redir } = await import("next/navigation");
                redir("/login");
              }}
              className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 text-left px-2 py-1 transition-colors"
            >
              Se déconnecter →
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
