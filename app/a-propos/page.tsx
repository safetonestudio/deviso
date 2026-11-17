import { PageSite, CADRE_LECTURE, SECTION, H1, H2, LEAD, BOUTON_PLEIN, BOUTON_DOUX } from "@/components/site/PageSite";
import { DemoButton } from "@/components/landing/DemoButton";
import type { Metadata } from "next";
import Link from "next/link";
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
  title: "À propos, qui écrit sur ce site",
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
      name: "À propos, qui écrit sur ce site",
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
    <PageSite>
      <DonneesStructurees donnees={jsonLd} />


      <main className={`${CADRE_LECTURE} ${SECTION} pb-24`}>
        <div>

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gray-500 mb-10">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-gray-400">À propos</span>
          </nav>

          <div className="mb-16">
            <h1 className={`${H1} mb-6`}>
              Qui écrit sur ce site
            </h1>
            <p className={LEAD}>
              {AUTEUR.resume}
            </p>
          </div>

          <div className="space-y-16 text-[16px] text-gray-300 leading-relaxed">

            <section className="rounded-xl bg-ds-surface p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-on-accent font-semibold text-lg">SA</span>
                </div>
                <div>
                  <p className="text-ink font-semibold text-base">{AUTEUR.nom}</p>
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
              <h2 className={`${H2} mb-6`}>Pourquoi ce blog existe</h2>
              <p className="mb-4">
                En construisant Deviso, j&apos;ai dû lire les textes de la réforme de facturation électronique
                dans le détail, parce qu&apos;on ne peut pas implémenter un cycle de vie de facture à partir
                d&apos;un résumé de presse. J&apos;y ai découvert deux choses.
              </p>
              <p className="mb-4">
                La première, c&apos;est que <strong className="text-ink">les contenus disponibles pour les
                indépendants sont soit trop vagues, soit écrits pour des directions financières</strong>. Entre
                « la réforme arrive, préparez-vous » et une note de cabinet sur l&apos;interopérabilité des flux,
                il n&apos;y a presque rien pour quelqu&apos;un qui facture seul.
              </p>
              <p className="mb-4">
                La seconde, c&apos;est que <strong className="text-ink">beaucoup de ce qui circule est
                faux</strong>, y compris sur des faits vérifiables : des montants d&apos;amendes périmés, des
                échéances qui n&apos;existent pas, un nombre de plateformes agréées qui varie du simple au
                double selon les sites. J&apos;en ai moi-même publié certains avant de les corriger, {" "}
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
              <h2 className={`${H2} mb-6`}>Comment je travaille</h2>
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
                  <div key={titre} className="rounded-xl bg-ds-surface p-5">
                    <p className="text-ink font-medium mb-1">{titre}</p>
                    <p className="text-gray-400">{texte}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className={`${H2} mb-6`}>Les guides sur la réforme</h2>
              <div className="space-y-2">
                {reforme.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-ds-surface px-5 py-4 hover:bg-ds-elevated transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-ink text-[15px] font-medium group-hover:text-indigo-200 transition-colors">
                        {a.carte.titre}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{a.carte.resume}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0">→</span>
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-gray-400">
                Et si vous voulez savoir ce que Deviso est exactement au sens de la réforme, plateforme agréée
                ou solution compatible, {" "}
                <Link href="/conformite" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  c&apos;est écrit noir sur blanc ici
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className={`${H2} mb-4`}>Une erreur, une question, un désaccord</h2>
              <p className="text-gray-400">
                Écrivez à{" "}
                <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  support@getdeviso.fr
                </a>
                . Si vous repérez une information fausse sur ce site, je corrige et je date la correction. C&apos;est
                le genre de message le plus utile que je puisse recevoir.
              </p>
            </section>

            <section className="rounded-xl bg-ds-surface p-6 sm:p-8">
              <h2 className={`${H2} mb-4`}>Essayer Deviso</h2>
              <p className="text-gray-400 mb-6">Essai gratuit de 14 jours, sans carte bancaire.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className={`w-full sm:w-auto ${BOUTON_PLEIN}`}>Essayer 14 jours gratuitement</Link>
                <DemoButton className={`w-full sm:w-auto ${BOUTON_DOUX}`} />
              </div>
            </section>
          </div>
        </div>
      </main>

          </PageSite>
  );
}
