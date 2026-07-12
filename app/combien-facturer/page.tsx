import type { Metadata } from "next";
import Link from "next/link";
import { TjmSimulator } from "@/components/landing/TjmSimulator";
import { TARIFS_DATA } from "@/lib/tarifs-data";

export const metadata: Metadata = {
  title: "Combien facturer en freelance ? TJM par métier 2026",
  description:
    "Découvrez les TJM (tarifs journaliers moyens) par métier en France : graphiste, développeur, consultant, photographe, formateur et plus. Simulateur de revenus inclus.",
  alternates: { canonical: "https://getdeviso.fr/combien-facturer" },
  openGraph: {
    title: "Combien facturer en freelance ? TJM par métier 2026",
    description:
      "TJM junior/confirmé/senior pour 10 métiers freelance. Simulateur de revenus nets inclus.",
    url: "https://getdeviso.fr/combien-facturer",
    images: [{ url: "https://getdeviso.fr/opengraph-image" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel est le TJM moyen d'un freelance en France en 2026 ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le TJM médian d'un freelance en France est d'environ 420 €/jour (Malt Baromètre 2026). Il varie fortement selon le métier : de 150 €/j pour un community manager débutant à plus de 1 400 €/j pour un consultant senior en finance ou pharma.",
      },
    },
    {
      "@type": "Question",
      name: "Comment calculer son revenu net en freelance à partir de son TJM ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En micro-BNC (prestation intellectuelle) : CA mensuel = TJM × jours facturables (≈15/mois). Cotisations URSSAF = CA × 22 %. Revenu net avant IR = CA × 78 %. Exemple : 400 €/j × 15 j = 6 000 € de CA → 4 680 € net avant impôt.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de jours par mois un freelance peut-il réellement facturer ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En moyenne 12 à 17 jours par mois selon le métier, après déduction des congés (5 semaines/an), de la prospection, de l'administration et de la formation. Les consultants en régie ont les taux les plus élevés (16–18 j/mois), les coachs et formateurs les plus bas (10–12 j/mois).",
      },
    },
  ],
};

export default function CombienFacturerPage() {
  return (
    <div className="min-h-screen bg-ds-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-ds-bg/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">D</span>
            </div>
            <span className="font-semibold text-base text-white">Deviso</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors hidden sm:block">Blog</Link>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── Hero ── */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
            Baromètre Malt 2026 · Données URSSAF
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Combien facturer en freelance ?
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            TJM par métier, calcul de revenu net et simulateur interactif. Des données de marché réelles
            pour fixer votre tarif journalier avec confiance.
          </p>
        </div>

        {/* ── Grille TJM par métier ── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-2">TJM par métier en 2026</h2>
          <p className="text-sm text-gray-500 mb-6">
            Fourchettes junior / confirmé / senior. Cliquez sur un métier pour le détail complet.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ds-border">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4">Métier</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-4">Junior<br /><span className="font-normal normal-case tracking-normal">0–2 ans</span></th>
                  <th className="text-right text-xs font-semibold text-indigo-400 uppercase tracking-wider pb-3 px-4">Confirmé<br /><span className="font-normal normal-case tracking-normal">2–5 ans</span></th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pl-4">Senior<br /><span className="font-normal normal-case tracking-normal">5+ ans</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {TARIFS_DATA.map((m) => (
                  <tr key={m.slug} className="group hover:bg-ds-surface transition-colors">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/combien-facturer/${m.slug}`}
                        className="font-medium text-white group-hover:text-indigo-300 transition-colors"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 tabular-nums">
                      {m.tjm.junior.min}–{m.tjm.junior.max} €
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-300 font-semibold tabular-nums">
                      {m.tjm.confirme.min}–{m.tjm.confirme.max} €
                    </td>
                    <td className="py-3 pl-4 text-right text-gray-400 tabular-nums">
                      {m.tjm.senior.min}–{m.tjm.senior.max} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Sources : Malt Baromètre 2026, URSSAF. Tarifs hors TVA, en €/jour.
          </p>
        </section>

        {/* ── Simulateur général ── */}
        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">
              De votre TJM à votre revenu net
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              En <strong className="text-white">micro-BNC</strong> (régime le plus courant pour les
              prestations intellectuelles), vous versez{" "}
              <strong className="text-white">22 % de cotisations URSSAF</strong> sur votre chiffre
              d'affaires. Le reste est votre revenu net avant impôt sur le revenu.
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-mono font-bold mt-0.5">1</span>
                <p><strong className="text-white">TJM × jours facturables</strong> = CA mensuel (comptez ~15 j/mois en moyenne)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-mono font-bold mt-0.5">2</span>
                <p><strong className="text-white">CA × 22 %</strong> = cotisations URSSAF à payer chaque trimestre</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-mono font-bold mt-0.5">3</span>
                <p><strong className="text-white">CA − cotisations</strong> = revenu net avant IR (entre 15 et 30 % selon votre tranche)</p>
              </div>
            </div>
          </div>
          <TjmSimulator defaultTjm={420} defaultJours={15} />
        </section>

        {/* ── Pages par métier ── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-2">Données détaillées par métier</h2>
          <p className="text-sm text-gray-500 mb-6">
            TJM par spécialité, erreurs de pricing à éviter, FAQ et simulateur spécifique à chaque profession.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TARIFS_DATA.map((m) => {
              const mediane = Math.round((m.tjm.confirme.min + m.tjm.confirme.max) / 2);
              return (
                <Link
                  key={m.slug}
                  href={`/combien-facturer/${m.slug}`}
                  className="group flex items-center justify-between gap-3 bg-ds-surface hover:bg-ds-elevated border border-ds-border rounded-xl px-4 py-3.5 transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {m.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.tjm.junior.min}–{m.tjm.senior.max} €/j
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-400 tabular-nums">~{mediane} €</p>
                    <p className="text-[10px] text-gray-600">médiane</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Erreurs communes ── */}
        <section className="bg-ds-surface border border-ds-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Les erreurs universelles de pricing en freelance
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-400">
            {[
              {
                t: "Facturer son temps, pas sa valeur",
                d: "Un développeur qui économise 50 k€ de coût de recrutement crée plus de valeur qu'une journée de travail. Apprenez à quantifier l'impact de vos livrables.",
              },
              {
                t: "S'aligner sur le moins-disant",
                d: "Se positionner au TJM le plus bas du marché pour décrocher une mission est une spirale. Les clients qui achètent uniquement sur le prix sont les moins fidèles.",
              },
              {
                t: "Ignorer les jours non facturables",
                d: "Prospection, admin, congés, formation : sur 220 jours ouvrables/an, vous n'en facturez que 150–180. Votre TJM doit couvrir ces jours 'gratuits'.",
              },
              {
                t: "Ne pas distinguer TJM et tarif horaire",
                d: "Un TJM de 500 € représente ~62 €/h. Un tarif horaire de 50 €/h n'est pas équivalent : il nie l'aspect projet et la préparation en amont.",
              },
            ].map(({ t, d }) => (
              <div key={t} className="flex gap-3">
                <span className="text-red-400 shrink-0 mt-0.5">×</span>
                <div>
                  <p className="font-medium text-white mb-1">{t}</p>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-4">
          <h2 className="text-2xl font-bold text-white mb-3">
            Vos devis et factures en 30 secondes
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto text-sm leading-relaxed">
            Une fois votre TJM défini, Deviso génère vos devis par IA, les envoie avec e-signature et
            transforme les devis signés en factures Factur-X en 1 clic.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Essayer Deviso gratuitement 14 jours →
          </Link>
        </section>

        {/* ── Footer métiers ── */}
        <footer className="border-t border-ds-border pt-8 pb-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            {TARIFS_DATA.map((m) => (
              <Link
                key={m.slug}
                href={`/combien-facturer/${m.slug}`}
                className="hover:text-gray-300 transition-colors"
              >
                TJM {m.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-700 mt-4">
            © {new Date().getFullYear()} Deviso ·{" "}
            <Link href="/" className="hover:text-gray-500 transition-colors">Accueil</Link>
            {" · "}
            <Link href="/blog" className="hover:text-gray-500 transition-colors">Blog</Link>
            {" · "}
            <Link href="/login" className="hover:text-gray-500 transition-colors">Connexion</Link>
            {" · "}
            <Link href="/mentions-legales" className="hover:text-gray-500 transition-colors">Mentions légales</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
