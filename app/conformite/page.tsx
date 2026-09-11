import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { SITE } from "@/lib/blog/registre";
import { jsonLdFilDAriane } from "@/lib/blog/meta";
import { CircleCheck, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";

/**
 * Ce que Deviso est, au sens de la réforme, écrit noir sur blanc.
 *
 * Pourquoi cette page existe. Depuis le 1er septembre 2026, la première question
 * que pose un prospect — et le premier critère de tri de tous les comparateurs —
 * est : « êtes-vous une plateforme agréée, ou une solution compatible adossée à
 * qui ? » Le site ne le disait nulle part. L'audit SEO du 11/09/2026 a relevé
 * que le silence, sur ce point précis, se lit comme un aveu : les comparateurs
 * classent « statut flou », et un prospect prudent choisit celui qui l'a écrit.
 *
 * La page sert donc deux publics à la fois, et c'est volontaire : l'utilisateur
 * qui veut savoir s'il sera conforme, et le comparateur qui a besoin d'une
 * information citable. D'où les liens vers la source officielle plutôt qu'une
 * simple affirmation — une page qui dit « vérifiez vous-même » est la seule qui
 * mérite d'être crue.
 */

export const metadata: Metadata = {
  title: "Conformité : plateforme agréée et facturation électronique",
  description:
    "Deviso est une solution compatible adossée à Super PDP, plateforme agréée figurant sur la liste de la DGFiP. Ce que ça veut dire, et comment le vérifier vous-même.",
  alternates: { canonical: `${SITE}/conformite` },
  openGraph: {
    title: "Conformité de Deviso à la réforme de facturation électronique",
    description:
      "Solution compatible adossée à une plateforme agréée : la distinction officielle, ce qu'elle change pour vous, et comment la vérifier.",
    url: `${SITE}/conformite`,
    images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "Conformité Deviso" }],
  },
};

const jsonLd = jsonLdFilDAriane([
  { nom: "Accueil", url: SITE },
  { nom: "Conformité" },
]);

/** Les trois questions à poser à n'importe quel éditeur, nous compris. */
const QUESTIONS = [
  {
    q: "Êtes-vous une plateforme agréée, ou une solution compatible ?",
    r: "Deviso est une solution compatible. La transmission de vos factures passe par Super PDP, qui est la plateforme agréée.",
  },
  {
    q: "Si vous êtes une solution compatible, adossée à quelle plateforme agréée ?",
    r: "Super PDP (superpdp.tech). Nous nous y connectons par OAuth 2.0, avec votre accord explicite, et c'est elle qui dépose vos factures et transmet les données à l'administration.",
  },
  {
    q: "Votre plateforme agréée est-elle sur la liste officielle de la DGFiP ?",
    r: "Oui, Super PDP y figure. Le lien vers la liste officielle est ci-dessous : ne nous croyez pas sur parole, la liste est publique et téléchargeable.",
  },
];

export default function ConformitePage() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLd} />

      {/* ── Navbar ── */}
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
            <Link href="/#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</Link>
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
            <span className="text-gray-400">Conformité</span>
          </nav>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-4">
              <ShieldCheck size={13} className="shrink-0" />
              Réforme de facturation électronique
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Ce que Deviso est, au sens de la réforme
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              La réponse en une phrase : Deviso est une <strong className="text-white">solution compatible</strong>,
              adossée à <strong className="text-white">Super PDP</strong>, qui est la plateforme agréée. Le reste
              de cette page explique pourquoi cette distinction compte, et comment la vérifier sans nous faire
              confiance.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* ── 1. La distinction ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Plateforme agréée, solution compatible : ce n&apos;est pas du vocabulaire marketing
              </h2>
              <p className="mb-4">
                La DGFiP définit deux catégories, et elles n&apos;ont pas les mêmes droits. Une{" "}
                <strong className="text-white">plateforme agréée</strong> est immatriculée par
                l&apos;administration et peut transmettre et recevoir des factures électroniques pour le compte
                d&apos;une entreprise, et transmettre les données de transaction à l&apos;administration. Une{" "}
                <strong className="text-white">solution compatible</strong> ne peut faire ni l&apos;un ni
                l&apos;autre : elle doit s&apos;adosser à une plateforme agréée.
              </p>
              <p className="mb-4">
                Autrement dit, la question utile à poser à un éditeur de logiciel n&apos;est pas « êtes-vous
                conforme ? » — tout le monde répond oui. C&apos;est : <strong className="text-white">« êtes-vous
                agréé, ou adossé à qui ? »</strong>
              </p>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                  Ce que ça change pour vous, concrètement
                </p>
                <p className="text-gray-400">
                  Rien dans votre usage quotidien : vous créez vos devis et vos factures dans Deviso comme
                  d&apos;habitude, et la transmission se fait en arrière-plan. La distinction compte ailleurs —
                  dans la chaîne de responsabilité, et dans votre capacité à vérifier que le maillon agréé
                  existe vraiment. C&apos;est pour ça que nous nommons le nôtre.
                </p>
              </div>
            </section>

            {/* ── 2. Les trois questions ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les trois questions, et nos réponses
              </h2>
              <div className="space-y-4">
                {QUESTIONS.map(({ q, r }) => (
                  <div key={q} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                    <p className="font-semibold text-white mb-2 flex items-start gap-2">
                      <CircleCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                      {q}
                    </p>
                    <p className="text-gray-400 pl-6">{r}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. Vérifier soi-même ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Vérifiez-le vous-même</h2>
              <p className="mb-4">
                La liste des plateformes agréées est publiée par la DGFiP et téléchargeable. Elle comporte{" "}
                <strong className="text-white">deux niveaux</strong>, et la nuance a son importance :
                l&apos;immatriculation <em>définitive</em> suppose un dossier complet <em>et</em> des tests
                d&apos;interopérabilité réussis ; l&apos;immatriculation <em>sous réserve</em> correspond à un
                dossier complet en attente de ces tests.
              </p>
              <div className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-xl p-5 mb-4">
                <a
                  href="https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
                >
                  La liste officielle des plateformes agréées, sur impots.gouv.fr
                  <ExternalLink size={14} className="shrink-0" />
                </a>
                <p className="text-gray-400 text-xs mt-2">
                  Cherchez « Super PDP ». Nous ne reproduisons pas son statut ici : il peut évoluer, et une
                  information recopiée est une information qui se périme. Plusieurs comparateurs en ligne
                  publient d&apos;ailleurs des statuts contradictoires — la source officielle est la seule qui
                  compte.
                </p>
              </div>
              <div className="flex gap-3 bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-white mb-1">Méfiez-vous des comparateurs</p>
                  <p className="text-gray-400">
                    Une partie des sites qui comparent les solutions de facturation électronique vivent de
                    l&apos;affiliation, et leurs chiffres se contredisent — le nombre de plateformes agréées y
                    est annoncé entre 137 et 166 selon les pages. Ils ne peuvent pas tous avoir raison. Pour
                    une question de conformité, allez à la source.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 4. Ce que Deviso fait déjà, et ce qu'il ne fait pas ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que Deviso fait déjà, et ce qu&apos;il ne fait pas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
                    Fait
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex gap-2"><span className="text-emerald-400 shrink-0">→</span> Génère vos factures au format <strong className="text-white">Factur-X</strong> conforme à la norme européenne EN 16931</li>
                    <li className="flex gap-2"><span className="text-emerald-400 shrink-0">→</span> Se connecte à Super PDP pour <strong className="text-white">déposer</strong> vos factures et <strong className="text-white">recevoir</strong> celles de vos fournisseurs</li>
                    <li className="flex gap-2"><span className="text-emerald-400 shrink-0">→</span> Suit le <strong className="text-white">cycle de vie</strong> de chaque facture déposée, y compris les refus et les rejets, et vous dit quoi faire</li>
                    <li className="flex gap-2"><span className="text-emerald-400 shrink-0">→</span> Gère la mention d&apos;exonération correcte si vous êtes en franchise de TVA (art. 293 B du CGI)</li>
                    <li className="flex gap-2"><span className="text-emerald-400 shrink-0">→</span> Numérote vos factures de façon continue, comme l&apos;exige l&apos;article 242 nonies A du CGI</li>
                  </ul>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Ne fait pas
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex gap-2"><span className="text-gray-500 shrink-0">→</span> Deviso n&apos;est <strong className="text-white">pas</strong> une plateforme agréée et ne transmet rien directement à l&apos;administration</li>
                    <li className="flex gap-2"><span className="text-gray-500 shrink-0">→</span> Deviso ne remplace pas votre expert-comptable, et ne donne pas de conseil fiscal</li>
                    <li className="flex gap-2"><span className="text-gray-500 shrink-0">→</span> Deviso ne déclare pas vos achats B2B à votre place (art. 290-II du CGI) : cette obligation reste la vôtre</li>
                    <li className="flex gap-2"><span className="text-gray-500 shrink-0">→</span> Deviso ne voit pas les paiements encaissés hors de l&apos;outil : c&apos;est vous qui marquez une facture payée</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ── 5. Où vous en êtes, vous ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Et vous, où en êtes-vous ?</h2>
              <p className="mb-4">
                Deux obligations, deux dates, et les confondre est la source de presque toute la confusion sur
                le sujet.
              </p>
              <div className="space-y-3">
                <div className="bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-amber-300">Recevoir</span>
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">
                      Déjà obligatoire
                    </span>
                  </div>
                  <p className="text-gray-300">
                    Depuis le 1<sup>er</sup> septembre 2026, toute entreprise assujettie à la TVA doit pouvoir
                    recevoir une facture électronique via une plateforme agréée. Sans exception de taille ni de
                    régime — micro-entrepreneurs et franchise en base comprises.
                  </p>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-300">Émettre</span>
                    <span className="text-[10px] font-semibold bg-white/[0.06] text-gray-400 rounded-full px-2 py-0.5">
                      1<sup>er</sup> septembre 2027
                    </span>
                  </div>
                  <p className="text-gray-400">
                    Pour les TPE, PME et micro-entrepreneurs, avec l&apos;e-reporting des opérations B2C en plus.
                    Les grandes entreprises et les ETI y sont soumises depuis le 1<sup>er</sup> septembre 2026.
                  </p>
                </div>
              </div>
              <p className="mt-4">
                Le détail est dans{" "}
                <Link href="/blog/facturation-electronique-2026" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  notre guide de la réforme
                </Link>
                , et le cas du micro-entrepreneur dans{" "}
                <Link href="/blog/reforme-facturation-micro-entrepreneur" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  celui qui lui est consacré
                </Link>
                .
              </p>
            </section>

            {/* ── 6. Une question ── */}
            <section className="border-t border-ds-border pt-8">
              <h2 className="text-xl font-semibold text-white mb-3">Une question sur tout ça ?</h2>
              <p className="text-gray-400">
                Écrivez à{" "}
                <a href="mailto:support@getdeviso.fr" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  support@getdeviso.fr
                </a>
                . Si vous êtes journaliste ou si vous tenez un comparatif, dites-le : nous préférons répondre
                précisément plutôt que d&apos;être classés « statut non communiqué ».
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
