import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TARIFS_DATA,
  getTarifsMetier,
  ALL_METIER_SLUGS,
} from "@/lib/tarifs-data";
import { TjmSimulator } from "@/components/landing/TjmSimulator";

type Props = { params: Promise<{ metier: string }> };

export async function generateStaticParams() {
  return ALL_METIER_SLUGS.map((slug) => ({ metier: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const data = getTarifsMetier(metier);
  if (!data) return {};
  return {
    title: `TJM ${data.name} freelance 2026 : tarifs et simulateur de revenus`,
    description: data.description,
    alternates: {
      canonical: `https://getdeviso.fr/combien-facturer/${data.slug}`,
    },
    openGraph: {
      title: `TJM ${data.name} freelance 2026 : combien facturer ?`,
      description: data.description,
      url: `https://getdeviso.fr/combien-facturer/${data.slug}`,
      images: [{ url: "https://getdeviso.fr/opengraph-image" }],
    },
  };
}

function TjmBadge({
  level,
  label,
  min,
  max,
  highlight,
}: {
  level: string;
  label: string;
  min: number;
  max: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        highlight
          ? "border-indigo-500/40 bg-indigo-500/[0.07]"
          : "border-ds-border bg-ds-surface"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
          highlight ? "text-indigo-400" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${highlight ? "text-indigo-200" : "text-gray-300"}`}>
        {min}–{max} €
      </p>
      <p className="text-xs text-gray-500 mt-1">/jour · HT</p>
      <p className="text-[11px] text-gray-600 mt-2">{level}</p>
    </div>
  );
}

export default async function MetierTarifsPage({ params }: Props) {
  const { metier } = await params;
  const data = getTarifsMetier(metier);
  if (!data) notFound();

  const defaultTjm = Math.round((data.tjm.confirme.min + data.tjm.confirme.max) / 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const otherMetiers = TARIFS_DATA.filter((m) => m.slug !== data.slug).slice(0, 5);

  return (
    <div className="min-h-screen bg-ds-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-ds-bg/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">D</span>
            </div>
            <span className="font-semibold text-base text-white">Deviso</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/combien-facturer" className="text-gray-400 hover:text-white transition-colors hidden sm:block">
              Tous les metiers
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/combien-facturer" className="hover:text-gray-300 transition-colors">Tarifs freelance</Link>
          <span>/</span>
          <span className="text-gray-400">{data.name}</span>
        </nav>

        {/* Hero + TJM grid */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
              Barometre Malt 2026 · URSSAF
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              {data.title}
            </h1>
            <p className="text-base text-gray-400 leading-relaxed max-w-2xl">{data.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <TjmBadge
              level="0–2 ans d'experience"
              label="Junior"
              min={data.tjm.junior.min}
              max={data.tjm.junior.max}
            />
            <TjmBadge
              level="2–5 ans d'experience"
              label="Confirme"
              min={data.tjm.confirme.min}
              max={data.tjm.confirme.max}
              highlight
            />
            <TjmBadge
              level="5+ ans d'experience"
              label="Senior"
              min={data.tjm.senior.min}
              max={data.tjm.senior.max}
            />
          </div>

          <div className="text-xs text-gray-600 flex items-center gap-2">
            <span>Source : Malt Barometre 2026 · Tarifs HT, en €/jour · Marche francais · Mis a jour juillet 2026</span>
          </div>
        </div>

        {/* Simulateur */}
        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              Simulez votre revenu net
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              En <strong className="text-white">micro-BNC</strong> (regime standard pour les{" "}
              {data.label}s), vous versez <strong className="text-white">22 % de cotisations URSSAF</strong>{" "}
              sur votre CA. Le simulateur ci-contre calcule votre revenu net mensuel avant impot, ou le TJM
              a atteindre pour un revenu cible.
            </p>
            <div className="bg-ds-surface border border-ds-border rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jours facturables estimes</span>
                <span className="font-semibold text-white">{data.joursFacturables} j/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">TJM median ({data.name} confirme)</span>
                <span className="font-semibold text-indigo-300">{defaultTjm} €/j</span>
              </div>
              <div className="flex justify-between border-t border-ds-border pt-2 mt-2">
                <span className="text-gray-500">Revenu net estime / mois</span>
                <span className="font-semibold text-emerald-400">
                  {(defaultTjm * data.joursFacturables * 0.78).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                </span>
              </div>
            </div>
          </div>
          <TjmSimulator defaultTjm={defaultTjm} defaultJours={data.joursFacturables} />
        </section>

        {/* Specialites */}
        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Specialites qui augmentent le TJM
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Par rapport au TJM moyen d&apos;un {data.label} confirme ({defaultTjm} €/j).
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.specialites.map((s) => {
              const premium = Math.round(defaultTjm * (1 + s.premium / 100));
              return (
                <div
                  key={s.label}
                  className="flex items-center justify-between gap-4 bg-ds-surface border border-ds-border rounded-xl px-4 py-3"
                >
                  <span className="text-sm text-gray-300">{s.label}</span>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-emerald-400">~{premium} €/j</span>
                    <span className="text-xs text-emerald-500/70 ml-1.5">+{s.premium} %</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Erreurs de tarification */}
        <section className="bg-ds-surface border border-ds-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-5">
            Erreurs de tarification a eviter
          </h2>
          <ul className="space-y-4">
            {data.erreurs.map((e) => (
              <li key={e} className="flex gap-3 text-sm text-gray-400">
                <span className="text-red-400 shrink-0 font-bold mt-0.5">x</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Deviso CTA */}
        <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-2">
              Creez vos devis de {data.label} en 30 secondes
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Deviso genere un devis complet par IA a partir d&apos;une description de mission, avec vos
              lignes de prestation, votre TJM et vos conditions de paiement. Le client signe
              electroniquement, la facture Factur-X est emise en 1 clic.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              Essai gratuit 14 jours
            </Link>
            <Link
              href={data.landingHref}
              className="block text-center text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors"
            >
              Voir Deviso pour les {data.label}s
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">
            Questions frequentes sur les tarifs {data.label}
          </h2>
          <div className="space-y-5">
            {data.faq.map(({ q, a }) => (
              <div key={q} className="border-b border-ds-border pb-5 last:border-0">
                <h3 className="text-sm font-semibold text-white mb-2">{q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links metiers */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">TJM d&apos;autres metiers freelance</h2>
          <div className="flex flex-wrap gap-2">
            {otherMetiers.map((m) => (
              <Link
                key={m.slug}
                href={`/combien-facturer/${m.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-gray-400 hover:text-white hover:border-indigo-500/40 transition-all"
              >
                TJM {m.label}
              </Link>
            ))}
            <Link
              href="/combien-facturer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all"
            >
              Tous les metiers
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-ds-border pt-6 pb-2 text-xs text-gray-700 flex flex-wrap gap-4">
          <Link href="/" className="hover:text-gray-500 transition-colors">Accueil</Link>
          <Link href="/combien-facturer" className="hover:text-gray-500 transition-colors">Tarifs freelance</Link>
          <Link href={data.landingHref} className="hover:text-gray-500 transition-colors">
            Devis {data.label}
          </Link>
          <Link href="/blog" className="hover:text-gray-500 transition-colors">Blog</Link>
          <Link href="/login" className="hover:text-gray-500 transition-colors">
            Connexion
          </Link>
          <Link href="/mentions-legales" className="hover:text-gray-500 transition-colors">
            Mentions légales
          </Link>
        </footer>
      </div>
    </div>
  );
}
