import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { CircleCheck, Cpu, ExternalLink, Eye } from "lucide-react";

const SLUG = "factur-x-explique-freelance";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichees sur la page, et balisees en FAQPage a partir de cette
 * meme liste. Apostrophes typographiques directes, jamais d'entite HTML ici.
 */
const FAQ = [
  {
    q: "Factur-X, c'est un PDF ou un fichier de données ?",
    a: "Les deux à la fois, et c'est tout l'intérêt. C'est un PDF que vous ouvrez et lisez normalement, à l'intérieur duquel est rangé un petit fichier de données qui contient les mêmes informations sous une forme que les logiciels lisent sans se tromper.",
  },
  {
    q: "Dois-je créer le fichier de données moi-même ?",
    a: "Non, jamais. C'est votre outil de facturation qui le génère quand vous créez votre facture. Vous ne verrez pas ce fichier et vous n'avez rien à saisir en plus : vous remplissez votre facture comme d'habitude, le format se fabrique tout seul.",
  },
  {
    q: "Un simple PDF envoyé par e-mail suffira-t-il encore ?",
    a: "Non, une fois l'émission électronique obligatoire pour vous. Un PDF classique se lit à l'œil, mais il ne porte pas les données structurées que la réforme exige, et il ne passe pas par une plateforme agréée. Il faudra un vrai format électronique, comme Factur-X.",
  },
  {
    q: "Quelle est la différence entre Factur-X, UBL et CII ?",
    a: "Ce sont les trois formats acceptés par la réforme. Factur-X est le format hybride : un PDF lisible plus les données. UBL et CII sont des formats de données seuls, sans page lisible sans outil. Pour un indépendant, Factur-X est le plus confortable, mais vous n'avez pas à choisir : votre plateforme s'en occupe.",
  },
  {
    q: "Ce format est-il obligatoire pour moi ?",
    a: "La réception de factures électroniques l'est pour tout le monde depuis le 1er septembre 2026. L'émission le deviendra au 1er septembre 2027 pour les TPE, PME et micro-entreprises. Le format requis, dont Factur-X, fait partie de cette obligation d'émission.",
  },
];

export default function Page() {
  const a = article(SLUG);
  const lectures = suggestionsDeLecture(SLUG);

  return (
    <div className="min-h-screen bg-site">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
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

      <article className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-gray-400">Factur-X expliqué simplement</span>
          </nav>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Réforme 2026
              </span>
              <span className="text-xs text-gray-400">
                {new Date(a.misAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">{a.h1}</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Depuis la réforme, le mot « Factur-X » est partout, et presque personne ne prend le temps de dire ce
              que c&apos;est. La plupart des explications sont écrites pour des comptables. En voici une pour tout
              le monde, sans jargon, et rassurante sur un point : vous n&apos;aurez rien à faire à la main.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* La reponse tout de suite */}
            <section className="bg-[#191830] border border-indigo-500/30 rounded-2xl p-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                La réponse en trois lignes
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Un fichier Factur-X est un <strong className="text-white">PDF de facture tout à fait
                    normal</strong>, que vous ouvrez et lisez comme d&apos;habitude.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    À l&apos;intérieur de ce PDF est rangé un <strong className="text-white">petit fichier de
                    données</strong> qui répète les mêmes informations, sous une forme que les logiciels lisent
                    sans se tromper.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Vous n&apos;avez <strong className="text-white">rien à faire</strong> : votre outil le génère,
                    et vous ne verrez jamais le fichier de données.
                  </span>
                </li>
              </ul>
            </section>

            {/* Pourquoi ce format existe */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Le problème que ce format résout
              </h2>
              <p className="mb-4">
                Prenez une facture PDF classique, celle que vous envoyez par e-mail depuis des années. Un humain la
                lit sans effort. Un logiciel, lui, en est incapable : pour retrouver le montant, la date ou le
                numéro de TVA, il devrait les <em>deviner</em> à partir de l&apos;image de la page, et il se trompe.
                D&apos;où la ressaisie à la main, côté client comme côté administration, et les erreurs qui vont
                avec.
              </p>
              <p className="mb-6">
                Factur-X supprime ce problème en mettant les deux lectures dans un seul fichier : la page pour
                l&apos;humain, les données pour la machine. Personne ne ressaisit rien, et les deux camps lisent
                exactement la même facture.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <Eye size={18} className="text-indigo-400 mb-3" />
                  <p className="text-white font-medium mb-1">Ce que vous voyez</p>
                  <p className="text-gray-400">
                    Une facture PDF ordinaire : votre logo, vos lignes, votre total. Rien ne trahit qu&apos;elle est
                    « spéciale ».
                  </p>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <Cpu size={18} className="text-indigo-400 mb-3" />
                  <p className="text-white font-medium mb-1">Ce que la machine lit</p>
                  <p className="text-gray-400">
                    Le fichier de données caché dedans : les mêmes montants, mais rangés dans des cases nommées, que
                    n&apos;importe quel logiciel comprend.
                  </p>
                </div>
              </div>
            </section>

            {/* Ce qu'il y a dedans */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce qu&apos;il y a vraiment dans un fichier Factur-X
              </h2>
              <p className="mb-4">
                Techniquement, et vous pouvez oublier cette phrase juste après l&apos;avoir lue : un Factur-X est un
                PDF d&apos;un type conçu pour l&apos;archivage (appelé PDF/A-3), dans lequel est incorporé un fichier
                de données au format XML. Ce fichier de données suit une <strong className="text-white">norme
                européenne commune</strong>, la EN 16931, ce qui garantit qu&apos;un outil français et un outil
                allemand y rangent l&apos;information de la même façon.
              </p>
              <p>
                La seule règle qui compte pour vous : la partie visible et la partie données doivent
                <strong className="text-white"> dire la même chose</strong>. Un total affiché à 1 200 € et un total
                caché à 1 000 € produirait une facture incohérente. Un bon outil s&apos;assure que les deux
                coïncident toujours, parce qu&apos;il fabrique les deux à partir de la même saisie.
              </p>
            </section>

            {/* Faut-il choisir */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Factur-X, UBL, CII : faut-il choisir ?
              </h2>
              <p className="mb-4">
                Vous croiserez trois noms, parce que la réforme accepte trois formats. La différence tient en une
                image :
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-white">Factur-X</strong> est le format <em>hybride</em> : une page
                    lisible plus les données. C&apos;est le plus confortable, parce qu&apos;il reste un PDF que
                    n&apos;importe qui peut ouvrir.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500 shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-white">UBL</strong> et <strong className="text-white">CII</strong> sont
                    des formats de <em>données seules</em> : parfaits pour les logiciels, mais illisibles pour un
                    humain sans outil dédié.
                  </span>
                </li>
              </ul>
              <p className="mt-4">
                La bonne nouvelle : vous n&apos;avez pas à trancher. Le choix du format se fait entre votre outil et
                la plateforme agréée, en arrière-plan. Votre travail s&apos;arrête à la saisie de la facture.
              </p>
            </section>

            {/* Ce que ca change */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que ça change pour vous, concrètement
              </h2>
              <p className="mb-4">
                Presque rien de visible, et c&apos;est voulu. Vous créez votre facture comme avant ; votre outil
                produit un Factur-X ; votre client la reçoit lisible ; les données partent correctement vers la
                plateforme et l&apos;administration. La seule différence de fond avec le PDF que vous envoyiez par
                e-mail, c&apos;est qu&apos;un simple PDF ne suffira plus une fois l&apos;émission obligatoire pour
                vous, parce qu&apos;il ne porte pas les données.
              </p>
              <p>
                Visuellement, un Factur-X et un PDF ordinaire sont impossibles à distinguer à l&apos;œil : la
                différence est cachée. Vous ne pouvez donc pas vérifier vous-même « à la main » qu&apos;une facture
                est bien au format. C&apos;est le rôle de l&apos;outil, et c&apos;est une raison de plus de le
                choisir conforme plutôt que de bricoler.
              </p>
            </section>

            {/* Et Deviso */}
            <section className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Comment Deviso le gère
              </p>
              <p className="mb-4">
                Chaque facture générée par Deviso est un Factur-X conforme : la page que voit votre client, et le
                fichier de données caché à l&apos;intérieur, construits ensemble à partir de votre saisie, pour
                qu&apos;ils disent toujours la même chose. Vous ne voyez que votre facture ; le reste se fait tout
                seul.
              </p>
              <Link
                href="/conformite"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <CircleCheck size={16} className="shrink-0" />
                Notre conformité, en détail
              </Link>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Questions fréquentes</h2>
              <div className="space-y-4">
                {FAQ.map(({ q, a: reponse }) => (
                  <div key={q} className="bg-ds-surface rounded-xl border border-ds-border p-6">
                    <h3 className="text-white font-medium mb-3">{q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{reponse}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Sources */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Sources</h2>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    impots.gouv.fr, Facturation électronique et plateformes agréées
                  </a>{" "}
                  (formats acceptés et fonctionnement)
                </li>
                <li>
                  <a
                    href="https://www.economie.gouv.fr/actualites/facturation-electronique-entre-entreprises-coup-denvoi-de-la-reforme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    economie.gouv.fr, Coup d&apos;envoi de la réforme
                    <ExternalLink size={13} className="shrink-0" />
                  </a>{" "}
                  (calendrier et obligations)
                </li>
              </ul>
            </section>

            {/* A lire ensuite */}
            {lectures.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-6">À lire ensuite</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {lectures.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group bg-ds-surface border border-ds-border rounded-xl p-5 hover:border-indigo-500/40 transition-all"
                    >
                      <p className="text-white font-medium text-sm leading-snug mb-2 group-hover:text-indigo-200 transition-colors">
                        {l.titre}
                      </p>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{l.resume}</p>
                      <p className="text-gray-600 text-xs">{l.dureeLecture} min de lecture</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <Signature />
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
