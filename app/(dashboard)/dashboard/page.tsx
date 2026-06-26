import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Proposal } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-slate-100 text-slate-600" },
  sent:     { label: "Envoyé",     color: "bg-blue-100 text-blue-700" },
  viewed:   { label: "Consulté",   color: "bg-yellow-100 text-yellow-700" },
  signed:   { label: "Signé ✓",   color: "bg-green-100 text-green-700" },
  declined: { label: "Refusé",     color: "bg-red-100 text-red-700" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

async function startCheckout() {
  "use server";
  const { stripe } = await import("@/lib/stripe");
  const { createClient: sc } = await import("@/lib/supabase/server");
  const supabase = await sc();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  redirect(session.url!);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: proposals = [] } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user!.id)
    .single();

  const p = proposals as Proposal[];
  const isPro = profile?.plan === "pro";

  const stats = {
    total: p.length,
    sent: p.filter((x) => ["sent", "viewed", "signed"].includes(x.status)).length,
    signed: p.filter((x) => x.status === "signed").length,
    revenue: p.filter((x) => x.status === "signed").reduce((s, x) => s + x.total_ttc, 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-1">Vue d&apos;ensemble de ton activité</p>
        </div>
        <Link
          href="/proposals/new"
          className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
        >
          ✨ Nouveau devis
        </Link>
      </div>

      {/* Banner upgrade plan Free */}
      {!isPro && (
        <form action={startCheckout} className="mb-6">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-500 rounded-2xl p-5 flex items-center justify-between gap-4 text-white">
            <div>
              <div className="font-bold text-sm">Plan gratuit — {p.length}/3 devis utilisés</div>
              <div className="text-xs text-indigo-100 mt-0.5">
                Passez Pro pour des devis illimités + factures Factur-X
              </div>
            </div>
            <button
              type="submit"
              className="shrink-0 bg-white text-brand-600 hover:bg-indigo-50 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              ⚡ Passer Pro — 49€/mois
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total devis", value: stats.total, icon: "📄" },
          { label: "Envoyés", value: stats.sent, icon: "📤" },
          { label: "Signés", value: stats.signed, icon: "✅" },
          { label: "CA signé", value: fmt(stats.revenue), icon: "💶" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent proposals */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Devis récents</h2>
          <Link href="/proposals" className="text-brand-600 text-sm font-medium hover:underline">
            Voir tout →
          </Link>
        </div>

        {p.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 mb-4">Aucun devis pour l&apos;instant</p>
            <Link
              href="/proposals/new"
              className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
            >
              Créer mon premier devis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {p.map((proposal) => {
              const s = STATUS_LABELS[proposal.status] || STATUS_LABELS.draft;
              return (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">
                      {proposal.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {proposal.client_name || "Client non défini"} •{" "}
                      {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="font-semibold text-slate-900 text-sm">
                      {fmt(proposal.total_ttc)}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
