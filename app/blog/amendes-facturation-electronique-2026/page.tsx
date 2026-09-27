import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { CircleCheck, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";

const SLUG = "amendes-facturation-electronique-2026";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichees sur la page, et balisees en FAQPage a partir de cette
 * meme liste. Apostrophes typographiques directes, jamais d'entite HTML ici.
 */
const FAQ = [
  {
    q: "Quel est le montant de l'amende si je n'émets pas au bon format ?",
    a: "50 € par facture non émise au format électronique requis lorsque l'émission est obligatoire, dans la limite de 15 000 € par an. C'est le montant en vigueur depuis le 1er septembre 2026.",
  },
  {
    q: "Et pour l'e-reporting ?",
    a: "500 € par transmission d'e-reporting manquante ou insuffisante, également plafonnée à 15 000 € par an. L'e-reporting, c'est la transmission à l'administration des données de vos ventes aux particuliers et à l'étranger, distincte de la facture elle-même.",
  },
  {
    q: "Que se passe-t-il si je ne peux pas recevoir une facture électronique ?",
    a: "Le défaut de réception est sanctionné de 500 €, porté à 1 000 € en cas de réitération dans les trois mois. C'est la seule obligation déjà en vigueur pour tout le monde depuis le 1er septembre 2026, et la plus simple à respecter, puisque recevoir est souvent gratuit.",
  },
  {
    q: "Vais-je être sanctionné dès le premier oubli ?",
    a: "Non. Aucune sanction n'est appliquée au premier manquement de l'année civile en cours et des trois précédentes, si vous régularisez spontanément ou dans les trente jours suivant une demande de l'administration. La sanction vise la négligence répétée, pas l'erreur unique corrigée.",
  },
  {
    q: "Pourquoi je vois encore 250 € et 15 € un peu partout ?",
    a: "Ce sont les montants d'avant la loi de finances pour 2026. L'e-reporting était à 250 €, l'émission à 15 €. La loi les a relevés, mais beaucoup de pages n'ont pas été mises à jour. Un site qui affiche encore ces chiffres est un site qui n'a pas suivi.",
  },
];

/** Les trois sanctions, telles qu'elles s'appliquent depuis le 1er septembre 2026. */
const SANCTIONS = [
  {
    manquement: "Défaut d'émission au format électronique requis (obligatoire)",
    montant: "50 € par facture",
    plafond: "15 000 € par an",
  },
  {
    manquement: "Transmission d'e-reporting manquante ou insuffisante",
    montant: "500 € par transmission",
    plafond: "15 000 € par an",
  },
  {
    manquement: "Défaut de réception d'une facture électronique",
    montant: "500 €, puis 1 000 € si réitération sous 3 mois",
    plafond: "au cas par cas",
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
            <span className="text-gray-400">Amendes de la facturation électronique</span>
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
              Vous voulez savoir ce que vous risquez vraiment, pas la version anxiogène ni la version périmée.
              Les montants ont changé au 1<sup>er</sup> septembre 2026, et une grande partie du web affiche
              encore les anciens. Voici les chiffres réels, la tolérance qui compte, et d&apos;où ils sortent.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* La reponse tout de suite */}
            <section className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                La réponse en trois lignes
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Ne pas <strong className="text-white">émettre</strong> au format requis quand
                    c&apos;est obligatoire : <strong className="text-white">50 € par facture</strong>, dans la
                    limite de 15 000 € par an.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Manquer une transmission d&apos;<strong className="text-white">e-reporting</strong> :
                    <strong className="text-white"> 500 € par transmission</strong>, également plafonnée à
                    15 000 € par an.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Ne pas pouvoir <strong className="text-white">recevoir</strong> une facture électronique :
                    <strong className="text-white"> 500 €</strong>, porté à 1 000 € en cas de réitération sous
                    trois mois.
                  </span>
                </li>
              </ul>
            </section>

            {/* Tableau */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Le tableau des montants réels
              </h2>
              <p className="mb-5">
                Trois obligations, trois sanctions distinctes. La seule qui vous concerne déjà tous, quel que soit
                votre régime, est celle de la réception.
              </p>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[34rem]">
                  <thead>
                    <tr className="border-b border-ds-border">
                      <th className="py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Manquement
                      </th>
                      <th className="py-3 px-3 text-xs font-semibold text-amber-300 uppercase tracking-wider whitespace-nowrap">
                        Montant
                      </th>
                      <th className="py-3 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Plafond
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SANCTIONS.map((s) => (
                      <tr key={s.manquement} className="border-b border-ds-border last:border-0 align-top">
                        <td className="py-3 pr-4 text-gray-300">{s.manquement}</td>
                        <td className="py-3 px-3 text-white font-medium">{s.montant}</td>
                        <td className="py-3 pl-3 text-gray-400">{s.plafond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Ce que la LF 2026 a change */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que la loi de finances 2026 a changé
              </h2>
              <p className="mb-4">
                Ces montants ne sont pas ceux du texte d&apos;origine. La{" "}
                <strong className="text-white">loi de finances pour 2026</strong> (loi n° 2026-103 du 19 février
                2026, article 123) a relevé les sanctions de la réforme. L&apos;e-reporting est passé de 250 à
                500 € par manquement, et l&apos;émission de 15 à 50 € par facture.
              </p>
              <p>
                C&apos;est la source de la confusion que vous croisez en ligne : une partie du web a été écrite
                avant ce texte, et affiche encore les anciens chiffres. Sur un sujet où l&apos;exactitude est tout
                l&apos;intérêt, un montant périmé décrédibilise la page entière. Les valeurs de cet article sont
                celles en vigueur, avec leur source en bas de page.
              </p>
            </section>

            {/* La tolerance */}
            <section>
              <div className="flex gap-3 bg-emerald-500/[0.06] border border-emerald-500/25 rounded-xl p-5">
                <ShieldCheck size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white mb-1">
                    La tolérance que presque personne ne cite
                  </p>
                  <p className="text-gray-400">
                    Aucune sanction n&apos;est appliquée au <strong className="text-gray-200">premier
                    manquement</strong> de l&apos;année civile en cours et des trois précédentes, dès lors que
                    l&apos;infraction est réparée spontanément, ou dans les <strong className="text-gray-200">trente
                    jours</strong> suivant une demande de l&apos;administration. Autrement dit, la sanction vise la
                    négligence répétée, pas l&apos;erreur unique que l&apos;on corrige. Ce n&apos;est pas une
                    dispense, c&apos;est une marge, et elle disparaît dès qu&apos;on l&apos;a déjà utilisée.
                  </p>
                </div>
              </div>
            </section>

            {/* Le plafond */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Le plafond, et pourquoi il ne rassure pas les petites activités
              </h2>
              <p className="mb-4">
                Le plafond de 15 000 € par an peut sembler lointain quand on émet quelques factures par mois. Il
                l&apos;est. Le vrai risque, pour une petite activité, n&apos;est pas d&apos;atteindre ce plafond,
                c&apos;est le <strong className="text-white">coût unitaire</strong> : un seul manquement, une fois
                la tolérance consommée, coûte souvent plus cher qu&apos;une année entière d&apos;un outil adapté.
              </p>
              <p>
                Le calcul qui consiste à « ne rien prendre pour économiser » se retourne au premier oubli. C&apos;est
                d&apos;autant plus dommage que la mise en conformité est peu coûteuse, et gratuite pour la seule
                obligation déjà en vigueur, la réception.
              </p>
            </section>

            {/* Et Deviso */}
            <section className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Ce qui rend ces montants théoriques
              </p>
              <p className="mb-4">
                Ces sanctions punissent un défaut de format ou de transmission. Un outil qui produit le bon format
                et transmet ce qu&apos;il faut, quand il faut, les rend sans objet : il n&apos;y a plus de
                manquement à sanctionner. C&apos;est exactement le travail d&apos;un logiciel de facturation
                conforme, et c&apos;est le nôtre.
              </p>
              <Link
                href="/conformite"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <CircleCheck size={16} className="shrink-0" />
                Ce que Deviso fait pour vous, en détail
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
                    href="https://www.legifrance.gouv.fr/eli/loi/2026/2/19/CPPX2524517L/jo/article_123"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    Légifrance, loi n° 2026-103 du 19 février 2026, article 123
                    <ExternalLink size={13} className="shrink-0" />
                  </a>{" "}
                  (montants des sanctions relevés)
                </li>
                <li>
                  <a
                    href="https://entreprendre.service-public.gouv.fr/actualites/A18802?lang=fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Service-Public Entreprendre, Les sanctions évoluent
                  </a>{" "}
                  (synthèse des sanctions et de la tolérance)
                </li>
                <li>
                  <a
                    href="https://kpmg.com/av/fr/avocats/eclairages/2026/03/facturation-electronique-amenagement-des-obligations-et-renforcement-des-sanctions.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    KPMG Avocats, Aménagement des obligations et renforcement des sanctions (mars 2026)
                    <ExternalLink size={13} className="shrink-0" />
                  </a>
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
