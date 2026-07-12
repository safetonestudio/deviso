import type { Metadata } from "next";
import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";

export const metadata: Metadata = {
  title: "Scope creep freelance : comment s'en protéger avec son devis | Deviso",
  description:
    "Le scope creep est la première cause de perte de rentabilité chez les freelances. Découvrez ce que c'est, comment il arrive, et quelles clauses mettre dans votre devis pour vous en protéger.",
  alternates: { canonical: "https://getdeviso.fr/blog/scope-creep-freelance" },
  openGraph: {
    title: "Scope creep freelance : comment s'en protéger avec son devis",
    description: "Qu'est-ce que le scope creep ? Comment l'éviter ? Quelles clauses inclure dans votre devis ? Guide pratique pour freelances.",
    url: "https://getdeviso.fr/blog/scope-creep-freelance",
    images: [{ url: "https://getdeviso.fr/opengraph-image", width: 1200, height: 630, alt: "Deviso, logiciel de devis et facturation" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Scope creep freelance : qu'est-ce que c'est et comment s'en protéger dans son devis",
  datePublished: "2026-06-29",
  dateModified: "2026-06-29",
  author: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  publisher: { "@type": "Organization", name: "Deviso", url: "https://getdeviso.fr" },
  inLanguage: "fr",
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://getdeviso.fr/blog/scope-creep-freelance" },
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que le scope creep en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le scope creep (ou dérive de périmètre) désigne le phénomène par lequel le périmètre d'une mission freelance s'étend progressivement au-delà de ce qui était prévu initialement, sans ajustement du prix ni de la durée. C'est souvent le résultat d'un brief flou, de demandes clients non formalisées, ou d'un devis sans clause de périmètre.",
        },
      },
      {
        "@type": "Question",
        name: "Comment éviter le scope creep dans un devis freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La protection la plus efficace est une clause de périmètre explicite dans le devis : 'La présente mission couvre exclusivement les prestations décrites ci-dessus. Toute demande supplémentaire fera l'objet d'un avenant tarifé.' Complétez avec un brief détaillé signé avant le démarrage et une procédure d'avenant claire.",
        },
      },
    ],
  },
};

const metierLinks = [
  { label: "Graphiste freelance", href: "/freelance-graphiste" },
  { label: "Développeur web", href: "/freelance-developpeur" },
  { label: "Consultant indépendant", href: "/freelance-consultant" },
  { label: "Photographe freelance", href: "/freelance-photographe" },
  { label: "Rédacteur & copywriter", href: "/freelance-redacteur" },
  { label: "Formateur indépendant", href: "/freelance-formateur" },
  { label: "Artisan BTP", href: "/freelance-artisan" },
  { label: "Community manager", href: "/freelance-community-manager" },
  { label: "Coach freelance", href: "/freelance-coach" },
  { label: "Traducteur freelance", href: "/freelance-traducteur" },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-ds-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Bandeau */}
      <div className="fixed top-0 left-0 right-0 bg-indigo-950/95 backdrop-blur-sm border-b border-indigo-500/20 py-2 px-4 text-center text-sm" style={{ zIndex: 60 }}>
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">La facturation électronique B2B devient obligatoire en France.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso est déjà conforme Factur-X.</span>
      </div>

      {/* Navbar */}
      <nav className="fixed top-9 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
            <Link href="/#fonctionnalites" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton plan="free" label="Essayer gratuitement" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors" />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <article className="pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav className="flex items-center gap-2 text-xs text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-400">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-400">Blog</Link>
            <span>/</span>
            <span className="text-gray-400">Scope creep freelance</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">Problèmes freelance</span>
              <span className="text-xs text-gray-600">29 juin 2026 · 6 min</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Scope creep freelance : qu&apos;est-ce que c&apos;est et comment s&apos;en protéger dans son devis
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Vous avez accepté de créer un site de 5 pages. Vous en livrez 8. Vous avez proposé 2 logos, vous en avez fait 12. Bienvenue dans le scope creep, la première cause de perte de rentabilité chez les freelances.
            </p>
          </div>

          {/* Contenu */}
          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Qu&apos;est-ce que le scope creep ?</h2>
              <p className="mb-4">
                Le <strong className="text-white">scope creep</strong> (ou &quot;dérive de périmètre&quot; en français) désigne le phénomène par lequel une mission s&apos;étend progressivement au-delà de ce qui était prévu, sans ajustement du prix ni de la durée. Ce n&apos;est généralement pas une tentative délibérée d&apos;en avoir plus pour le même prix. C&apos;est souvent la conséquence d&apos;un brief flou, d&apos;un devis vague, et d&apos;une relation client où vous avez du mal à dire non.
              </p>
              <p>
                L&apos;ironie du scope creep : plus vous êtes compétent et impliqué, plus vous y êtes exposé. Le client voit que vous faites du bon travail, que vous connaissez son projet mieux que lui, alors il continue à solliciter. &quot;Puisque t&apos;es là, tu peux juste...&quot;
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Comment le scope creep arrive-t-il concrètement ?</h2>
              <div className="space-y-4">
                {[
                  { title: "Le brief qui évolue en cours de route", desc: "Le client change d'avis sur la direction créative, le positionnement, la cible. Ce qui était prévu ne colle plus, et il faut refaire. Sans clause de révision, vous absorbez ce coût." },
                  { title: "Les \"petites\" demandes qui s'accumulent", desc: "\"Tu peux juste ajouter...\" est la phrase la plus dangereuse en freelance. Chaque demande prise individuellement semble mineure. Ensemble, elles représentent des heures non facturées." },
                  { title: "L'absence de livrable défini", desc: "\"Refonte du site\" sans préciser le nombre de pages, les fonctionnalités, les intégrations. Le client a imaginé quelque chose, vous avez imaginé autre chose, et c'est vous qui vous alignez." },
                  { title: "La pression relationnelle", desc: "Vous ne voulez pas décevoir. Vous voulez que le client soit content. Alors vous faites ce qu'il demande, même si c'est hors périmètre. Et le prix reste le même." },
                ].map((item) => (
                  <div key={item.title} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                    <p className="font-semibold text-white mb-1 text-sm">⚠ {item.title}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Les clauses qui vous protègent dans votre devis</h2>
              <p className="mb-5">
                La protection contre le scope creep commence dans le devis, avant même que la mission démarre. Deux clauses sont essentielles :
              </p>

              <div className="space-y-5">
                <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-5">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Clause de périmètre</p>
                  <p className="text-sm text-gray-200 italic leading-relaxed mb-3">
                    &ldquo;La présente mission couvre exclusivement les prestations décrites ci-dessus. Toute demande supplémentaire non prévue dans ce devis fera l&apos;objet d&apos;un avenant tarifé, établi et accepté par les deux parties avant toute exécution.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500">Cette clause transforme chaque demande supplémentaire en conversation commerciale normale, plutôt qu&apos;en pression relationnelle.</p>
                </div>

                <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-5">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Clause de révisions</p>
                  <p className="text-sm text-gray-200 italic leading-relaxed mb-3">
                    &ldquo;Le présent devis inclut 2 cycles de révisions mineures dans le cadre du brief initial. Au-delà, toute modification est facturée à [X€/heure]. Toute modification substantielle du brief initial constitue une nouvelle prestation.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500">Définissez aussi ce que vous entendez par &quot;révision mineure&quot; vs &quot;modification substantielle&quot; dans les échanges préalables au devis.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">La procédure d&apos;avenant : comment facturer les demandes supplémentaires sans froisser le client</h2>
              <p className="mb-4">
                Avoir la clause dans le devis ne suffit pas, vous devez aussi savoir comment l&apos;activer dans la vraie vie, avec un client qui vous dit &quot;c&apos;est juste deux minutes&quot;.
              </p>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Accusez réception de la demande sans refuser : \"Bien reçu, c'est une bonne idée. Je regarde comment on peut intégrer ça.\"" },
                  { step: "2", text: "Estimez l'impact : temps supplémentaire, coût, impact sur le délai de livraison." },
                  { step: "3", text: "Envoyez un avenant formel : document simple qui décrit la demande, le prix et le délai ajouté." },
                  { step: "4", text: "Attendez la signature avant de commencer. Sans validation, vous travaillez gratuitement." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 bg-ds-elevated rounded-xl p-4 border border-ds-border">
                    <span className="text-indigo-400 font-bold font-mono text-sm flex-shrink-0 mt-0.5">{item.step}.</span>
                    <p className="text-gray-400 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Prévenir le scope creep dès le brief</h2>
              <p className="mb-4">
                La meilleure clause de périmètre est celle que vous n&apos;avez jamais besoin d&apos;activer, parce que le brief initial était suffisamment précis. Avant de rédiger le devis :
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span> Listez les livrables de manière exhaustive (pas &quot;un site web&quot; mais &quot;un site de 5 pages : accueil, services, à propos, contact, mentions légales&quot;)</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span> Précisez ce qui est exclu (pas &quot;le SEO n&apos;est pas inclus&quot; mais &quot;l&apos;optimisation SEO on-page et les campagnes SEA ne font pas partie de cette mission&quot;)</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span> Faites signer le brief avant de signer le devis, ou intégrez-le en annexe du devis</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">✓</span> Définissez les jalons et les points de validation pour les projets longs</li>
              </ul>
            </section>

            {/* Lien hub clauses */}
            <div className="bg-ds-surface border border-ds-border rounded-xl p-5 flex gap-4 items-start">
              <span className="text-indigo-400 text-xl flex-shrink-0">📋</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Toutes les clauses à mettre dans votre devis</p>
                <p className="text-xs text-gray-500 mb-3">Périmètre, acompte, révisions, propriété intellectuelle, résiliation, le guide complet avec formulations prêtes à l&apos;emploi.</p>
                <Link href="/blog/clauses-devis-freelance" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  Lire le guide des clauses →
                </Link>
              </div>
            </div>

          </div>

          {/* CTA */}
          <div className="mt-14 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Un devis avec les bonnes clauses, en 30 secondes</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              Deviso génère votre devis avec une clause de périmètre et de révisions adaptées à votre mission. Votre client signe électroniquement, vous êtes couvert.
            </p>
            <WaitlistButton plan="free" label="Générer mon devis, gratuit" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all" />
          </div>

          {/* Métiers */}
          <div className="mt-14 pt-8 border-t border-ds-border">
            <p className="text-xs text-gray-600 mb-4">Guides par métier</p>
            <div className="flex flex-wrap gap-2">
              {metierLinks.map((m) => (
                <Link key={m.href} href={m.href} className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-gray-500 hover:text-gray-300 hover:border-indigo-500/30 transition-all">{m.label}</Link>
              ))}
              <Link href="/blog" className="text-xs px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-indigo-400 hover:text-indigo-300 transition-all">← Tous les articles</Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-ds-border py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <p>© 2026 Deviso · SafeTone Studio · SIREN 103 340 857</p>
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">getdeviso.fr</Link>
        </div>
      </footer>
    </div>
  );
}
