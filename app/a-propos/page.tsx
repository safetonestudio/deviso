import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { SITE, articlesDe } from "@/lib/blog/registre";
import { AUTEUR, AUTEUR_JSONLD } from "@/lib/blog/auteur";
import { CircleCheck } from "lucide-react";

/**
 * La page auteur.
 *
 * Pourquoi elle existe. Les articles du blog étaient signés « Deviso », une
 * marque que personne ne connaît. Google attend un auteur identifiable sur des
 * sujets fiscaux, et le lecteur aussi : l'autorité est ce qui manque le plus à
 * un domaine neuf, et elle ne s'achète pas.
 *
 * Le `Person` du JSON-LD des articles pointe ici (`@id` commun), ce qui relie
 * les dix-neuf articles à une même identité plutôt qu'à dix-neuf auteurs
 * anonymes.
 *
 * Ce qui est écrit ici est vérifiable, et c'est la seule règle qui compte sur une
 * page de ce type.
 */

export const metadata: Metadata = {
  title: "À propos — qui écrit sur ce site",
  description:
    "Deviso est construit par un développeur indépendant en Gironde, lui-même micro-entrepreneur. Qui écrit les guides de ce site, et pourquoi les faire relire.",
  alternates: { canonical: `${SITE}/a-propos` },
  openGraph: {
    title: "À propos de Deviso et de son auteur",
    description:
      "Qui construit Deviso, qui écrit les guides sur la réforme de facturation électronique, et d'où vient cette expertise.",
    url: `${SITE}/a-propos`,
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "À propos de Deviso" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${SITE}/a-propos`,
      url: `${SITE}/a-propos`,
      name: "À propos — qui écrit sur ce site",
      inLanguage: "fr",
      mainEntity: AUTEUR_JSONLD,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
        { "@type": "ListItem", position: 2, name: "À propos" },
      ],
    },
  ],
};

export default function AProposPage() {
  const reforme = articlesDe("reforme");

  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLd} />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            <Link href="/conformite" className="text-gray-400 hover:text-white transition-colors">Conformité</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton
              plan="free"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-gray-400">À propos</span>
          </nav>

          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Qui écrit sur ce site
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              {AUTEUR.resume}
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            <section className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-lg">SA</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-base">{AUTEUR.nom}</p>
                  <p className="text-gray-500 text-sm">{AUTEUR.role}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {AUTEUR.legitimite.map((ligne) => (
                  <li key={ligne} className="flex gap-3">
                    <CircleCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span className="text-gray-300">{ligne}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Pourquoi ce blog existe</h2>
              <p className="mb-4">
                En construisant Deviso, j&apos;ai dû lire les textes de la réforme de facturation électronique
                dans le détail, parce qu&apos;on ne peut pas implémenter un cycle de vie de facture à partir
                d&apos;un résumé de presse. J&apos;y ai découvert deux choses.
              </p>
              <p className="mb-4">
                La première, c&apos;est que <strong className="text-white">les contenus disponibles pour les
                indépendants sont soit trop vagues, soit écrits pour des directions financières</strong>. Entre
                « la réforme arrive, préparez-vous » et une note de cabinet sur l&apos;interopérabilité des flux,
                il n&apos;y a presque rien pour quelqu&apos;un qui facture seul.
              </p>
              <p className="mb-4">
                La seconde, c&apos;est que <strong className="text-white">beaucoup de ce qui circule est
                faux</strong>, y compris sur des faits vérifiables : des montants d&apos;amendes périmés, des
                échéances qui n&apos;existent pas, un nombre de plateformes agréées qui varie du simple au
                double selon les sites. J&apos;en ai moi-même publié certains avant de les corriger —{" "}
                <Link href="/blog/facturation-electronique-2026" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  le guide de la réforme
                </Link>{" "}
                porte encore la trace de ces corrections dans sa date de mise à jour.
              </p>
              <p>
                Donc ce blog fait une chose simple : il dit ce que les textes disent, avec la source, la date, et
                la mention explicite de ce qui reste incertain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Comment je travaille</h2>
              <div className="space-y-4">
                {[
                  {
                    titre: "Chaque affirmation réglementaire est sourcée",
                    texte:
                      "Légifrance, impots.gouv.fr, economie.gouv.fr, Service-Public. Quand je n'ai qu'une source secondaire, je le dis.",
                  },
                  {
                    titre: "Les pages portent leur date de mise à jour",
                    texte:
                      "Une vraie date, qui ne bouge que quand le contenu change. Sur un sujet qui évolue, une page sans date est une page qu'on ne peut pas croire.",
                  },
                  {
                    titre: "Les erreurs sont corrigées, pas effacées",
                    texte:
                      "Quand une page était fausse, elle est corrigée et la correction est datée. C'est le minimum pour qu'on puisse me faire confiance la fois suivante.",
                  },
                  {
                    titre: "Je ne vends pas la peur",
                    texte:
                      "Une partie de l'écosystème autour de cette réforme vit de l'angoisse qu'elle provoque. Les délais réels sont souvent plus confortables qu'on ne le dit, et je préfère l'écrire.",
                  },
                ].map(({ titre, texte }) => (
                  <div key={titre} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                    <p className="text-white font-medium mb-1">{titre}</p>
                    <p className="text-gray-400">{texte}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Les guides sur la réforme</h2>
              <div className="space-y-2">
                {reforme.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    className="flex items-center justify-between gap-4 bg-ds-surface border border-ds-border rounded-xl px-5 py-4 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium group-hover:text-indigo-200 transition-colors">
                        {a.carte.titre}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{a.carte.resume}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0">→</span>
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-gray-400">
                Et si vous voulez savoir ce que Deviso est exactement au sens de la réforme — plateforme agréée
                ou solution compatible —{" "}
                <Link href="/conformite" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  c&apos;est écrit noir sur blanc ici
                </Link>
                .
              </p>
            </section>

            <section className="border-t border-ds-border pt-8">
              <h2 className="text-xl font-semibold text-white mb-3">Une erreur, une question, un désaccord</h2>
              <p className="text-gray-400">
                Écrivez à{" "}
                <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  support@getdeviso.fr
                </a>
                . Si vous repérez une information fausse sur ce site, je corrige et je date la correction. C&apos;est
                le genre de message le plus utile que je puisse recevoir.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
